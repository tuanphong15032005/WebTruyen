import { useEffect, useMemo, useState } from 'react';
import adminFinanceService from '../../services/adminFinanceService';
import '../../styles/admin-finance-management.css';

function FinanceManagementPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [requestTypeFilter, setRequestTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionModal, setActionModal] = useState({
    open: false,
    request: null,
    action: '',
    note: '',
  });

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (requestTypeFilter !== 'ALL') {
        params.requestType = requestTypeFilter;
      }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      const data = await adminFinanceService.getRequests(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách yêu cầu tài chính');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [requestTypeFilter, statusFilter]);

  const pendingRequests = useMemo(
    () =>
      requests.filter(
        (item) => item.status === 'REQUESTED' || item.status === 'APPROVED',
      ),
    [requests],
  );

  const processedRequests = useMemo(
    () =>
      requests.filter(
        (item) => item.status !== 'REQUESTED' && item.status !== 'APPROVED',
      ),
    [requests],
  );

  const statusLabel = (status, requestType) => {
    if (status === 'REQUESTED') return 'Chờ duyệt';
    if (status === 'APPROVED') return 'Đã duyệt';
    if (status === 'REJECTED') return 'Từ chối';
    if (status === 'PAID') {
      return requestType === 'REFUND' ? 'Đã hoàn tiền' : 'Đã thanh toán';
    }
    if (status === 'CANCELLED') return 'Đã hủy';
    return status || 'Không xác định';
  };

  const requestTypeLabel = (requestType) => {
    if (requestType === 'REFUND') return 'Hoàn tiền';
    return 'Rút tiền';
  };

  const statusClassName = (status) => {
    if (status === 'REQUESTED') return 'pending';
    if (status === 'APPROVED') return 'approved';
    if (status === 'REJECTED') return 'rejected';
    if (status === 'PAID') return 'paid';
    return 'cancelled';
  };

  const runAction = async (request, action, note = '') => {
    const actionKey = `${request.id}-${action}`;
    setBusyKey(actionKey);
    setError('');
    try {
      if (action === 'approve') {
        await adminFinanceService.approveRequest(request.id, note);
      } else if (action === 'reject') {
        await adminFinanceService.rejectRequest(request.id, note);
      } else {
        await adminFinanceService.completeRequest(request.id, note);
      }
      await loadRequests();
    } catch (err) {
      setError(err.message || 'Thao tác xử lý thất bại');
    } finally {
      setBusyKey('');
    }
  };

  const openActionModal = (request, action) => {
    setActionModal({
      open: true,
      request,
      action,
      note: '',
    });
  };

  const closeActionModal = () => {
    setActionModal({
      open: false,
      request: null,
      action: '',
      note: '',
    });
  };

  const submitActionModal = async () => {
    if (!actionModal.request || !actionModal.action) return;
    await runAction(
      actionModal.request,
      actionModal.action,
      actionModal.note.trim(),
    );
    closeActionModal();
  };

  const renderActions = (request) => {
    const canApprove = request.status === 'REQUESTED';
    const canReject =
      request.status === 'REQUESTED' || request.status === 'APPROVED';
    const canComplete = request.status === 'APPROVED';

    return (
      <div className='admin-finance__actions'>
        <button
          type='button'
          className='approve'
          disabled={!canApprove || busyKey === `${request.id}-approve`}
          onClick={() => openActionModal(request, 'approve')}
        >
          Chấp nhận
        </button>
        <button
          type='button'
          className='reject'
          disabled={!canReject || busyKey === `${request.id}-reject`}
          onClick={() => openActionModal(request, 'reject')}
        >
          Từ chối
        </button>
        <button
          type='button'
          className='complete'
          disabled={!canComplete || busyKey === `${request.id}-complete`}
          onClick={() => openActionModal(request, 'complete')}
        >
          {request.requestType === 'REFUND'
            ? 'Đánh dấu đã hoàn tiền'
            : 'Đánh dấu đã thanh toán'}
        </button>
      </div>
    );
  };

  const renderRows = (rows, emptyText) => {
    if (loading) {
      return (
        <tr>
          <td colSpan={10} className='admin-finance__empty'>
            Đang tải dữ liệu yêu cầu tài chính...
          </td>
        </tr>
      );
    }
    if (rows.length === 0) {
      return (
        <tr>
          <td colSpan={10} className='admin-finance__empty'>
            {emptyText}
          </td>
        </tr>
      );
    }
    return rows.map((request) => (
      <tr key={request.id}>
        <td>{request.id}</td>
        <td>{requestTypeLabel(request.requestType)}</td>
        <td>{request.senderName || 'Không rõ'}</td>
        <td>{(request.amountCoinB || 0).toLocaleString('vi-VN')} VNĐ</td>
        <td>{request.relatedReference || '—'}</td>
        <td>
          <div className='admin-finance__bank'>
            <span>{request.bankName || '—'}</span>
            <small>{request.bankAccountNumber || '—'}</small>
            <small>{request.accountHolderName || '—'}</small>
          </div>
        </td>
        <td>{request.requestReason || '—'}</td>
        <td>
          {request.requestedAt
            ? new Date(request.requestedAt).toLocaleString('vi-VN')
            : '—'}
        </td>
        <td>
          <span
            className={`admin-finance__status ${statusClassName(request.status)}`}
          >
            {statusLabel(request.status, request.requestType)}
          </span>
        </td>
        <td>{renderActions(request)}</td>
      </tr>
    ));
  };

  return (
    <section className='admin-finance'>
      <header className='admin-finance__header'>
        <h1>Quản lý chi trả và hoàn tiền</h1>
        <p>
          Xử lý tập trung yêu cầu rút tiền của tác giả và yêu cầu hoàn tiền của
          người đọc. Admin có thể duyệt, từ chối hoặc đánh dấu hoàn tất sau khi
          chuyển khoản thủ công.
        </p>
      </header>

      <div className='admin-finance__controls'>
        <label>
          Trạng thái
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value='ALL'>Tất cả</option>
            <option value='REQUESTED'>Chờ duyệt</option>
            <option value='APPROVED'>Đã duyệt</option>
            <option value='REJECTED'>Từ chối</option>
            <option value='PAID'>Đã thanh toán/hoàn tiền</option>
            <option value='CANCELLED'>Đã hủy</option>
          </select>
        </label>
        <button type='button' onClick={loadRequests} disabled={loading}>
          Tải lại
        </button>
      </div>

      {error && <div className='admin-finance__error'>{error}</div>}

      <div className='admin-finance__card'>
        <h2>Danh sách yêu cầu đang xử lý</h2>
        <div className='admin-finance__table-wrap'>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Người gửi</th>
                <th>Số tiền</th>
                <th>Giao dịch/Nguồn</th>
                <th>Thông tin ngân hàng</th>
                <th>Lý do/Ghi chú</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(pendingRequests, 'Không có yêu cầu đang xử lý')}
            </tbody>
          </table>
        </div>
      </div>

      <div className='admin-finance__card'>
        <h2>Lịch sử xử lý</h2>
        <div className='admin-finance__table-wrap'>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Loại</th>
                <th>Người gửi</th>
                <th>Số tiền</th>
                <th>Giao dịch/Nguồn</th>
                <th>Thông tin ngân hàng</th>
                <th>Lý do/Ghi chú</th>
                <th>Thời gian gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {renderRows(processedRequests, 'Chưa có lịch sử xử lý')}
            </tbody>
          </table>
        </div>
      </div>

      {actionModal.open && (
        <div
          className='admin-finance__modal-backdrop'
          onClick={closeActionModal}
        >
          <div
            className='admin-finance__modal'
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Ghi chú xử lý (tùy chọn)</h3>
            <p>
              {actionModal.action === 'approve' &&
                'Nhập ghi chú cho thao tác chấp nhận.'}
              {actionModal.action === 'reject' &&
                'Nhập lý do từ chối để lưu vết xử lý.'}
              {actionModal.action === 'complete' &&
                'Nhập ghi chú xác nhận đã thanh toán/hoàn tiền thủ công.'}
            </p>
            <textarea
              rows={4}
              value={actionModal.note}
              onChange={(event) =>
                setActionModal((prev) => ({
                  ...prev,
                  note: event.target.value,
                }))
              }
              placeholder='Nhập ghi chú...'
            />
            <div className='admin-finance__modal-actions'>
              <button
                type='button'
                className='cancel'
                onClick={closeActionModal}
              >
                Hủy
              </button>
              <button
                type='button'
                className='confirm'
                onClick={submitActionModal}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FinanceManagementPage;
