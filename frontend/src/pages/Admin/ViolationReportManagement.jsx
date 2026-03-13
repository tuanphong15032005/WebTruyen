import { useEffect, useMemo, useState } from 'react';
import reportService from '../../services/reportService';
import '../../styles/admin-violation-report-management.css';

const REVIEWABLE_STATUSES = ['OPEN', 'IN_REVIEW'];

const violationTypeLabel = { COPYRIGHT: 'Bản quyền', SEXUAL: 'Nội dung không phù hợp', HATE: 'Thù ghét', SPAM: 'Thư rác', OTHER: 'Khác' };
const targetKindLabel = { STORY: 'Truyện', CHAPTER: 'Chương', COMMENT: 'Bình luận' };
const statusLabel = { OPEN: 'Mở', IN_REVIEW: 'Đang xem xét', RESOLVED: 'Đã xử lý', REJECTED: 'Đã bác bỏ' };
const actionResultLabel = {
  UNPROCESSED: 'Chưa xử lý',
  DISMISSED: 'Đã bác bỏ',
  HIDDEN_CONTENT: 'Đã ẩn',
  REMOVED_CONTENT: 'Đã gỡ',
  WARNED_USER: 'Đã cảnh cáo',
  BANNED_USER: 'Đã khóa',
  RESTORED: 'Đã hiển thị lại',
};

function ViolationReportManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
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
            setError(err.message || 'Không thể tải danh sách báo cáo');
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
    let list = items;
    if (typeFilter !== 'ALL') {
      list = list.filter((item) => item.reportedContent === typeFilter);
    }
    if (statusFilter === 'REVIEWABLE') {
      return list.filter((item) => REVIEWABLE_STATUSES.includes(item.reportStatus));
    }
    return list.filter((item) => item.reportStatus === statusFilter);
  }, [items, statusFilter, typeFilter]);

  const canRestoreStory = (item) =>
    item.reportedContent === 'STORY' &&
    item.reportStatus === 'RESOLVED' &&
    item.actionRaw &&
    (item.actionRaw.includes('HIDE_STORY') || item.actionRaw.includes('REMOVE_STORY')) &&
    !item.actionRaw.includes('RESTORED');

  const showRestoreColumn = statusFilter === 'RESOLVED';

  const targetLabel = (item) => {
    if (!item) return '—';
    const targetId = item.targetId != null ? item.targetId : '—';
    const storyTitle = item.storyTitle || null;
    const chapterTitle = item.chapterTitle || null;

    if (item.reportedContent === 'STORY') {
      return storyTitle ? `Truyện: ${storyTitle}` : `Truyện #${targetId}`;
    }
    if (item.reportedContent === 'CHAPTER') {
      const chapterPart = chapterTitle ? `Chương: ${chapterTitle}` : `Chương #${targetId}`;
      if (storyTitle) {
        return `${chapterPart} (Truyện: ${storyTitle})`;
      }
      return chapterPart;
    }
    if (item.reportedContent === 'COMMENT') {
      const commentPart = `Bình luận #${targetId}`;
      if (chapterTitle && storyTitle) {
        return `${commentPart} (Chương: ${chapterTitle} - Truyện: ${storyTitle})`;
      }
      if (storyTitle) {
        return `${commentPart} (Truyện: ${storyTitle})`;
      }
      if (chapterTitle) {
        return `${commentPart} (Chương: ${chapterTitle})`;
      }
      return commentPart;
    }
    if (storyTitle) {
      return `Nội dung #${targetId} (Truyện: ${storyTitle})`;
    }
    return `Nội dung #${targetId}`;
  };

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
      if (action === 'restore') await reportService.restoreReportedStory(reportId);
      await loadReports();
    } catch (err) {
      setError(err.message || 'Thao tác thất bại');
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
        <h1>Quản lý Báo cáo Vi phạm</h1>
        <p>Xử lý các báo cáo về thư rác, vi phạm bản quyền và nội dung không phù hợp do người dùng gửi.</p>
      </header>

      <div className='admin-reports__card'>
        <div className='admin-reports__toolbar'>
          <div className='admin-reports__stats'>
            <span className='admin-reports__badge admin-reports__badge--awaiting'>
              Chờ xử lý: {awaitingCount}
            </span>
            <span className='admin-reports__badge admin-reports__badge--resolved'>
              Đã xử lý: {resolvedCount}
            </span>
            <span className='admin-reports__badge admin-reports__badge--dismissed'>
              Đã bác bỏ: {dismissedCount}
            </span>
          </div>
          <button type='button' className='admin-reports__refresh' onClick={loadReports} disabled={loading}>
            Tải lại
          </button>
        </div>

        <div className='admin-reports__type-tabs'>
          <button type='button' className={typeFilter === 'ALL' ? 'active' : ''} onClick={() => setTypeFilter('ALL')}>
            Tất cả
          </button>
          <button type='button' className={typeFilter === 'STORY' ? 'active' : ''} onClick={() => setTypeFilter('STORY')}>
            Báo cáo Truyện
          </button>
          <button type='button' className={typeFilter === 'CHAPTER' ? 'active' : ''} onClick={() => setTypeFilter('CHAPTER')}>
            Báo cáo Chương
          </button>
          <button type='button' className={typeFilter === 'COMMENT' ? 'active' : ''} onClick={() => setTypeFilter('COMMENT')}>
            Báo cáo Bình luận
          </button>
        </div>

        <div className='admin-reports__filters'>
          <button type='button' className={statusFilter === 'REVIEWABLE' ? 'active' : ''} onClick={() => setStatusFilter('REVIEWABLE')}>
            Chờ xem xét
          </button>
          <button type='button' className={statusFilter === 'RESOLVED' ? 'active' : ''} onClick={() => setStatusFilter('RESOLVED')}>
            Đã xử lý
          </button>
          <button type='button' className={statusFilter === 'REJECTED' ? 'active' : ''} onClick={() => setStatusFilter('REJECTED')}>
            Đã bác bỏ
          </button>
        </div>
      </div>

      {error && <div className='admin-reports__error'>{error}</div>}

      <div className='admin-reports__card admin-reports__card--table'>
        <div className='admin-reports__grid'>
        <table>
          <thead>
          <tr>
              <th>Loại vi phạm</th>
              <th>Loại nội dung</th>
              <th>Đối tượng</th>
              <th>Người báo cáo</th>
              <th>Chi tiết</th>
              <th>Trạng thái</th>
              <th>Kết quả xử lý</th>
              <th>Ngày báo cáo</th>
              {showActions && <th>Thao tác</th>}
              {showRestoreColumn && <th>Hiển thị lại</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions || showRestoreColumn ? 9 : 7} className='admin-reports__empty'>Đang tải báo cáo...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions || showRestoreColumn ? 9 : 7} className='admin-reports__empty'>Không có báo cáo trong danh sách này</td>
              </tr>
            ) : (
              filteredItems.map((item) => {
                const disabled = busyId === item.reportId || !canTakeAction(item);
                return (
                  <tr key={item.reportId}>
                    <td>{item.violationType}</td>
                    <td>{targetKindLabel[item.reportedContent] || item.reportedContent}</td>
                    <td>{targetLabel(item)}</td>
                    <td>{item.reportedBy}</td>
                    <td>{item.reportDetails || '—'}</td>
                    <td>
                      <span className={`admin-reports__status admin-reports__status--${item.reportStatus?.toLowerCase()}`}>
                        {statusLabel[item.reportStatus] || item.reportStatus}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-reports__action-result admin-reports__action-result--${(item.actionResult || 'UNPROCESSED').toLowerCase()}`}>
                        {actionResultLabel[item.actionResult] || item.actionResult || 'Chưa xử lý'}
                      </span>
                    </td>
                    <td>{item.reportedAt ? new Date(item.reportedAt).toLocaleString('vi-VN') : '—'}</td>
                    {showActions && (
                      <td className='admin-reports__actions'>
                        <button type='button' className='dismiss' disabled={disabled} onClick={() => runAction(item.reportId, 'dismiss')}>
                          Bác bỏ báo cáo
                        </button>
                        <button type='button' className='hide' disabled={disabled} onClick={() => runAction(item.reportId, 'hide')}>
                          Ẩn nội dung
                        </button>
                        <button type='button' className='remove' disabled={disabled} onClick={() => runAction(item.reportId, 'remove')}>
                          Gỡ nội dung
                        </button>
                        <button type='button' className='warn-ban' disabled={disabled} onClick={() => handleWarnBan(item)}>
                          Cảnh cáo / Khóa
                        </button>
                      </td>
                    )}
                    {showRestoreColumn && (
                      <td>
                        {canRestoreStory(item) ? (
                          <button
                            type='button'
                            className='restore'
                            disabled={busyId === item.reportId}
                            onClick={() => runAction(item.reportId, 'restore')}
                          >
                            Hiển thị lại
                          </button>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        </div>
      </div>
      {warnBanModal.open && (
        <div className='admin-reports__warn-ban-backdrop' onClick={closeWarnBanModal}>
          <div
            className='admin-reports__warn-ban-modal'
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Cảnh cáo / Khóa người dùng</h3>
            <p className='admin-reports__warn-ban-help'>
              Chọn hành động cho người dùng bị báo cáo.
            </p>

            <div className='admin-reports__warn-ban-mode'>
              <label>
                <input
                  type='radio'
                  name='warn-ban-mode'
                  checked={warnBanModal.mode === 'warn'}
                  onChange={() => setWarnBanModal((prev) => ({ ...prev, mode: 'warn' }))}
                />
                Cảnh cáo
              </label>
              <label>
                <input
                  type='radio'
                  name='warn-ban-mode'
                  checked={warnBanModal.mode === 'ban'}
                  onChange={() => setWarnBanModal((prev) => ({ ...prev, mode: 'ban' }))}
                />
                Khóa tài khoản
              </label>
            </div>

            {warnBanModal.mode === 'ban' && (
              <div className='admin-reports__warn-ban-hours'>
                <label htmlFor='ban-hours'>Thời gian khóa (giờ)</label>
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
                Hủy
              </button>
              <button type='button' className='confirm' onClick={submitWarnBan}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ViolationReportManagement;
