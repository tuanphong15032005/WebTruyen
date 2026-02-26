import { useEffect, useMemo, useState } from 'react';
import reportService from '../../services/reportService';
import '../../styles/admin-violation-report-management.css';

const REVIEWABLE_STATUSES = ['OPEN', 'IN_REVIEW'];
// Minhdq - 25/02/2026
// [Fix pagination/violation-report/id - V2 - branch: minhfinal2]
const PAGE_SIZE = 10;

function ViolationReportManagement() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('REVIEWABLE');
  // Minhdq - 25/02/2026
  // [Fix pagination/violation-report/id - V2 - branch: minhfinal2]
  const [currentPage, setCurrentPage] = useState(1);
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

  useEffect(() => {
    // Minhdq - 25/02/2026
    // [Fix pagination/violation-report/id - V2 - branch: minhfinal2]
    setCurrentPage(1);
  }, [statusFilter]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'REVIEWABLE') {
      return items.filter((item) => REVIEWABLE_STATUSES.includes(item.reportStatus));
    }
    return items.filter((item) => item.reportStatus === statusFilter);
  }, [items, statusFilter]);
  // Minhdq - 25/02/2026
  // [Fix pagination/violation-report/id - V2 - branch: minhfinal2]
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  useEffect(() => {
    // Minhdq - 25/02/2026
    // [Fix pagination/violation-report/id - V2 - branch: minhfinal2]
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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

      <div className='admin-reports__toolbar'>
        <div className='admin-reports__stats'>
          <span className='admin-reports__badge admin-reports__badge--awaiting'>
            Chờ xử lý: {awaitingCount}
          </span>
          <span className='admin-reports__badge admin-reports__badge--resolved'>
            Đã xử lý: {resolvedCount}
          </span>
          <span className='admin-reports__badge admin-reports__badge--dismissed'>
            Đã bỏ qua: {dismissedCount}
          </span>
        </div>
        <button type='button' className='admin-reports__refresh' onClick={loadReports} disabled={loading}>
          Làm mới
        </button>
      </div>

      <div className='admin-reports__filters'>
          <button type='button' className={statusFilter === 'REVIEWABLE' ? 'active' : ''} onClick={() => setStatusFilter('REVIEWABLE')}>
            Chờ duyệt
          </button>
          <button type='button' className={statusFilter === 'RESOLVED' ? 'active' : ''} onClick={() => setStatusFilter('RESOLVED')}>
            Đã xử lý
          </button>
          <button type='button' className={statusFilter === 'REJECTED' ? 'active' : ''} onClick={() => setStatusFilter('REJECTED')}>
            Đã bỏ qua
          </button>
      </div>

      {error && <div className='admin-reports__error'>{error}</div>}

      <div className='admin-reports__grid'>
        <table>
          <thead>
            <tr>
              <th>Loại vi phạm</th>
              <th>Nội dung bị báo cáo</th>
              <th>Người báo cáo</th>
              <th>Chi tiết báo cáo</th>
              <th>Trạng thái</th>
              <th>Kết quả xử lý</th>
              <th>Thời gian báo cáo</th>
              {showActions && <th>Thao tác</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-reports__empty'>Đang tải báo cáo...</td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan={showActions ? 8 : 7} className='admin-reports__empty'>Không có báo cáo trong bộ lọc này</td>
              </tr>
            ) : (
              paginatedItems.map((item) => {
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
                        {item.actionResult || 'CHƯA XỬ LÝ'}
                      </span>
                    </td>
                    <td>{item.reportedAt ? new Date(item.reportedAt).toLocaleString() : '-'}</td>
                    {showActions && (
                      <td className='admin-reports__actions'>
                        <button type='button' className='dismiss' disabled={disabled} onClick={() => runAction(item.reportId, 'dismiss')}>
                          Bỏ qua báo cáo
                        </button>
                        <button type='button' className='hide' disabled={disabled} onClick={() => runAction(item.reportId, 'hide')}>
                          Ẩn nội dung
                        </button>
                        <button type='button' className='remove' disabled={disabled} onClick={() => runAction(item.reportId, 'remove')}>
                          Gỡ nội dung
                        </button>
                        <button type='button' className='warn-ban' disabled={disabled} onClick={() => handleWarnBan(item)}>
                          Cảnh cáo / Khóa user
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
      {/* Minhdq - 25/02/2026 */}
      {/* [Fix pagination/violation-report/id - V2 - branch: minhfinal2] */}
      {!loading && filteredItems.length > 0 && (
        <div className='admin-reports__pagination'>
          <span className='admin-reports__pagination-summary'>
            Hiển thị {(currentPage - 1) * PAGE_SIZE + 1}-
            {Math.min(currentPage * PAGE_SIZE, filteredItems.length)} / {filteredItems.length}
          </span>
          <div className='admin-reports__pagination-controls'>
            <button
              type='button'
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Trước
            </button>
            <span>Trang {currentPage}/{totalPages}</span>
            <button
              type='button'
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Sau
            </button>
          </div>
        </div>
      )}
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
                Cảnh cáo người dùng
              </label>
              <label>
                <input
                  type='radio'
                  name='warn-ban-mode'
                  checked={warnBanModal.mode === 'ban'}
                  onChange={() => setWarnBanModal((prev) => ({ ...prev, mode: 'ban' }))}
                />
                Khóa người dùng
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
