import { useEffect, useMemo, useState } from 'react';
import reportService from '../../services/reportService';
import '../../styles/admin-violation-report-management.css';

const REVIEWABLE_STATUSES = ['OPEN', 'IN_REVIEW'];

function ViolationReportManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('REVIEWABLE');
  const [warnBanModal, setWarnBanModal] = useState({
    open: false,
    reportId: null,
    mode: 'warn',
    banHours: '72',
  });

  const loadReports = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await reportService.getViolationReports();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    if (!warnBanModal.open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setWarnBanModal({
          open: false,
          reportId: null,
          mode: 'warn',
          banHours: '72',
        });
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [warnBanModal.open]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'REVIEWABLE') {
      return items.filter((item) => REVIEWABLE_STATUSES.includes(item.reportStatus));
    }
    return items.filter((item) => item.reportStatus === statusFilter);
  }, [items, statusFilter]);

  const awaitingCount = useMemo(
    () => items.filter((item) => REVIEWABLE_STATUSES.includes(item.reportStatus)).length,
    [items]
  );
  const resolvedCount = useMemo(
    () => items.filter((item) => item.reportStatus === 'RESOLVED').length,
    [items]
  );
  const dismissedCount = useMemo(
    () => items.filter((item) => item.reportStatus === 'REJECTED').length,
    [items]
  );

  const canTakeAction = (item) => REVIEWABLE_STATUSES.includes(item.reportStatus);
  const showActions = statusFilter === 'REVIEWABLE';

  const runAction = async (reportId, action, payload) => {
    setBusyId(reportId);
    setError('');
    try {
      if (action === 'dismiss') await reportService.dismissReport(reportId);
      if (action === 'hide') await reportService.hideReportedContent(reportId);
      if (action === 'remove') await reportService.removeReportedContent(reportId);
      if (action === 'warn') await reportService.warnOrBanUser(reportId, { banUser: false });
      if (action === 'ban') await reportService.warnOrBanUser(reportId, payload || { banUser: true, banHours: 72 });
      await loadReports();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const handleWarnBan = (item) => {
    setWarnBanModal({
      open: true,
      reportId: item.reportId,
      mode: 'warn',
      banHours: '72',
    });
  };

  const closeWarnBanModal = () => {
    setWarnBanModal({
      open: false,
      reportId: null,
      mode: 'warn',
      banHours: '72',
    });
  };

  const submitWarnBan = async () => {
    if (!warnBanModal.reportId) return;

    if (warnBanModal.mode === 'warn') {
      await runAction(warnBanModal.reportId, 'warn');
      closeWarnBanModal();
      return;
    }

    const parsedHours = Number(warnBanModal.banHours);
    const safeHours = Number.isFinite(parsedHours) && parsedHours > 0
      ? Math.floor(parsedHours)
      : 72;

    await runAction(warnBanModal.reportId, 'ban', {
      banUser: true,
      banHours: safeHours,
    });
    closeWarnBanModal();
  };

  return (
    <section className='admin-reports'>
      <header className='admin-reports__header'>
        <h1>Violation Report Management</h1>
        <p>Handle spam, copyright, and inappropriate content reports submitted by users.</p>
      </header>

      <div className='admin-reports__toolbar'>
        <div className='admin-reports__stats'>
          <span className='admin-reports__badge admin-reports__badge--awaiting'>
            Awaiting: {awaitingCount}
          </span>
          <span className='admin-reports__badge admin-reports__badge--resolved'>
            Resolved: {resolvedCount}
          </span>
          <span className='admin-reports__badge admin-reports__badge--dismissed'>
            Dismissed: {dismissedCount}
          </span>
        </div>
        <button type='button' className='admin-reports__refresh' onClick={loadReports} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className='admin-reports__filters'>
          <button type='button' className={statusFilter === 'REVIEWABLE' ? 'active' : ''} onClick={() => setStatusFilter('REVIEWABLE')}>
            Awaiting Review
          </button>
          <button type='button' className={statusFilter === 'RESOLVED' ? 'active' : ''} onClick={() => setStatusFilter('RESOLVED')}>
            Resolved
          </button>
          <button type='button' className={statusFilter === 'REJECTED' ? 'active' : ''} onClick={() => setStatusFilter('REJECTED')}>
            Dismissed
          </button>
      </div>

      {error && <div className='admin-reports__error'>{error}</div>}

      <div className='admin-reports__grid'>
        <table>
          <thead>
            <tr>
              <th>Violation Type</th>
              <th>Reported Content</th>
              <th>Reported By</th>
              <th>Report Details</th>
              <th>Status</th>
              <th>Action Result</th>
              <th>Reported At</th>
              {showActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-reports__empty'>Loading reports...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-reports__empty'>No reports in this view</td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const disabled = busyId === item.reportId || !canTakeAction(item);
                return (
                  <tr key={item.reportId}>
                    <td>{item.violationType}</td>
                    <td>{item.reportedContent}</td>
                    <td>{item.reportedBy}</td>
                    <td>{item.reportDetails || '-'}</td>
                    <td>
                      <span className={`admin-reports__status admin-reports__status--${item.reportStatus?.toLowerCase()}`}>
                        {item.reportStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-reports__action-result admin-reports__action-result--${(item.actionResult || 'UNPROCESSED').toLowerCase()}`}>
                        {item.actionResult || 'UNPROCESSED'}
                      </span>
                    </td>
                    <td>{item.reportedAt ? new Date(item.reportedAt).toLocaleString() : '-'}</td>
                    {showActions && (
                      <td className='admin-reports__actions'>
                        <button type='button' className='dismiss' disabled={disabled} onClick={() => runAction(item.reportId, 'dismiss')}>
                          Dismiss Report
                        </button>
                        <button type='button' className='hide' disabled={disabled} onClick={() => runAction(item.reportId, 'hide')}>
                          Hide Content
                        </button>
                        <button type='button' className='remove' disabled={disabled} onClick={() => runAction(item.reportId, 'remove')}>
                          Remove Content
                        </button>
                        <button type='button' className='warn-ban' disabled={disabled} onClick={() => handleWarnBan(item)}>
                          Warn / Ban User
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {warnBanModal.open && (
        <div className='admin-reports__warn-ban-backdrop' onClick={closeWarnBanModal}>
          <div
            className='admin-reports__warn-ban-modal'
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Warn / Ban User</h3>
            <p className='admin-reports__warn-ban-help'>
              Choose action for reported user.
            </p>

            <div className='admin-reports__warn-ban-mode'>
              <label>
                <input
                  type='radio'
                  name='warn-ban-mode'
                  checked={warnBanModal.mode === 'warn'}
                  onChange={() => setWarnBanModal((prev) => ({ ...prev, mode: 'warn' }))}
                />
                Warn user
              </label>
              <label>
                <input
                  type='radio'
                  name='warn-ban-mode'
                  checked={warnBanModal.mode === 'ban'}
                  onChange={() => setWarnBanModal((prev) => ({ ...prev, mode: 'ban' }))}
                />
                Ban user
              </label>
            </div>

            {warnBanModal.mode === 'ban' && (
              <div className='admin-reports__warn-ban-hours'>
                <label htmlFor='ban-hours'>Ban duration (hours)</label>
                <input
                  id='ban-hours'
                  type='number'
                  min='1'
                  value={warnBanModal.banHours}
                  onChange={(event) =>
                    setWarnBanModal((prev) => ({ ...prev, banHours: event.target.value }))
                  }
                />
              </div>
            )}

            <div className='admin-reports__warn-ban-actions'>
              <button type='button' className='cancel' onClick={closeWarnBanModal}>
                Cancel
              </button>
              <button type='button' className='confirm' onClick={submitWarnBan}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ViolationReportManagement;
