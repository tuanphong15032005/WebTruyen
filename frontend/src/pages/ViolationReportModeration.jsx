import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ViolationReportModeration.css';

const API_BASE = 'http://localhost:8081/api/moderation';
const MODE_CONFIG = {
    pending: {
        title: 'Báo cáo vi phạm chờ xử lý',
        description: 'Xử lý báo cáo do người đọc gửi về nội dung truyện.',
        view: 'pending',
        emptyMessage: 'Không có báo cáo vi phạm đang chờ xử lý.',
        showActions: true,
    },
    resolved: {
        title: 'Báo cáo đã xử lý',
        description: 'Danh sách các báo cáo đã được xử lý bởi quản trị viên.',
        view: 'resolved',
        emptyMessage: 'Chưa có báo cáo nào ở trạng thái đã xử lý.',
        showActions: false,
    },
    rejected: {
        title: 'Báo cáo đã bỏ qua',
        description: 'Danh sách báo cáo đã bị bỏ qua (dismiss).',
        view: 'rejected',
        emptyMessage: 'Chưa có báo cáo nào bị bỏ qua.',
        showActions: false,
    },
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

function ViolationReportModeration({ mode = 'pending' }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [actionKey, setActionKey] = useState('');

    const authToken = useMemo(() => {
        const stored = localStorage.getItem('user');
        if (!stored) return '';
        try {
            const parsed = JSON.parse(stored);
            return parsed?.token || '';
        } catch {
            return '';
        }
    }, []);

    const fetchReports = async () => {
        const viewConfig = MODE_CONFIG[mode] || MODE_CONFIG.pending;
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
            const response = await fetch(`${API_BASE}/reports?view=${viewConfig.view}`, { headers });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Không thể tải danh sách báo cáo.');
            }
            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Đã xảy ra lỗi khi tải danh sách báo cáo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [mode]);

    const runAction = async (reportId, endpoint, body) => {
        const currentKey = `${reportId}-${endpoint}`;
        setActionKey(currentKey);
        setError('');
        setMessage('');
        try {
            const headers = authToken
                ? { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
                : { 'Content-Type': 'application/json' };
            const response = await fetch(`${API_BASE}/reports/${reportId}/${endpoint}`, {
                method: 'POST',
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Không thể xử lý báo cáo.');
            }
            setItems((prev) => prev.filter((item) => item.reportId !== reportId));
            setMessage('Đã xử lý báo cáo thành công.');
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Đã xảy ra lỗi khi xử lý báo cáo.');
        } finally {
            setActionKey('');
        }
    };

    const handleDismiss = async (item) => {
        if (!window.confirm('Bỏ qua báo cáo này và không xử lý nội dung?')) return;
        await runAction(item.reportId, 'dismiss');
    };

    const handleHideContent = async (item) => {
        if (!window.confirm('Ẩn nội dung bị báo cáo khỏi hiển thị công khai?')) return;
        await runAction(item.reportId, 'hide-content');
    };

    const handleSanction = async (item) => {
        const sanctionType = (window.prompt('Nhập hình thức xử lý: "warn" hoặc "ban"', 'warn') || '')
            .trim()
            .toLowerCase();
        if (!sanctionType) return;
        if (sanctionType !== 'warn' && sanctionType !== 'ban') {
            setError('Hình thức xử lý không hợp lệ. Chỉ chấp nhận "warn" hoặc "ban".');
            return;
        }

        let banHours;
        if (sanctionType === 'ban') {
            const rawHours = window.prompt('Nhập số giờ khóa tài khoản (1-8760):', '24');
            if (rawHours === null) return;
            banHours = Number(rawHours);
            if (!Number.isFinite(banHours) || banHours < 1 || banHours > 8760) {
                setError('Thời gian khóa phải nằm trong khoảng 1 đến 8760 giờ.');
                return;
            }
            banHours = Math.trunc(banHours);
        }

        const reason = window.prompt('Nhập lý do xử lý tài khoản (không bắt buộc):', '') || '';
        await runAction(item.reportId, 'sanction', { sanctionType, banHours, reason });
    };

    const isBusy = actionKey !== '';
    const viewConfig = MODE_CONFIG[mode] || MODE_CONFIG.pending;

    return (
        <div className="report-moderation-page">
            <div className="report-moderation-header">
                <div>
                    <h1>{viewConfig.title}</h1>
                    <p>{viewConfig.description}</p>
                </div>
                <div className="report-header-actions">
                    <div className="report-tabs">
                        <Link
                            to="/admin/moderation/reports"
                            className={`report-tab ${mode === 'pending' ? 'active' : ''}`}
                        >
                            Chờ xử lý
                        </Link>
                        <Link
                            to="/admin/moderation/reports/resolved"
                            className={`report-tab ${mode === 'resolved' ? 'active' : ''}`}
                        >
                            Đã xử lý
                        </Link>
                        <Link
                            to="/admin/moderation/reports/rejected"
                            className={`report-tab ${mode === 'rejected' ? 'active' : ''}`}
                        >
                            Đã bỏ qua
                        </Link>
                    </div>
                    <button className="refresh-button" onClick={fetchReports} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            {message && <div className="moderation-message success">{message}</div>}
            {error && <div className="moderation-message error">{error}</div>}

            <div className="report-grid">
                <div className="report-row report-header">
                    <div className="col-index">STT</div>
                    <div>Loại vi phạm</div>
                    <div>Nội dung bị báo cáo</div>
                    <div>Người báo cáo</div>
                    <div>Chi tiết</div>
                    <div>{viewConfig.showActions ? 'Hành động' : 'Kết quả'}</div>
                </div>

                {loading && <div className="report-row report-empty">Đang tải dữ liệu...</div>}

                {!loading && items.length === 0 && (
                    <div className="report-row report-empty">{viewConfig.emptyMessage}</div>
                )}

                {!loading && items.map((item, index) => (
                    <div key={item.reportId} className="report-row">
                        <div className="col-index">{index + 1}</div>
                        <div>
                            <span className={`violation-badge ${item.violationType?.toLowerCase() || 'other'}`}>
                                {item.violationType || 'Khac'}
                            </span>
                        </div>
                        <div>
                            <div className="content-main">{item.reportedContent || '—'}</div>
                            <div className="content-sub">
                                {item.reportedContentType || 'Unknown'} - {formatDateTime(item.reportedAt)}
                            </div>
                        </div>
                        <div>{item.reportedBy || '—'}</div>
                        <div className="details-text">{item.reportDetails || '—'}</div>
                        {viewConfig.showActions ? (
                            <div className="action-group">
                                <button className="action-button dismiss" disabled={isBusy} onClick={() => handleDismiss(item)}>
                                    Bỏ qua
                                </button>
                                <button className="action-button hide" disabled={isBusy} onClick={() => handleHideContent(item)}>
                                    Ẩn nội dung
                                </button>
                                <button className="action-button sanction" disabled={isBusy} onClick={() => handleSanction(item)}>
                                    Cảnh cáo/Cấm
                                </button>
                            </div>
                        ) : (
                            <div className="result-info">
                                <div className="result-status">{item.reportStatus || '—'}</div>
                                <div className="result-action">
                                    {item.handledAction || 'Không có'}{item.handledAt ? ` - ${formatDateTime(item.handledAt)}` : ''}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ViolationReportModeration;
