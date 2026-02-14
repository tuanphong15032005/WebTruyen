import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/ContentModeration.css';

const API_BASE = 'http://localhost:8081/api/moderation';

const MODE_CONFIG = {
    pending: {
        title: 'Kiểm duyệt nội dung',
        description: 'Đảm bảo nội dung tuân thủ bản quyền, độ tuổi và tiêu chuẩn cộng đồng.',
        endpoint: 'pending',
        emptyMessage: 'Không có nội dung chờ duyệt.',
        showActions: true,
    },
    approved: {
        title: 'Nội dung đã duyệt',
        description: 'Danh sách truyện và chương đã được duyệt.',
        endpoint: 'approved',
        emptyMessage: 'Chưa có nội dung đã duyệt.',
        showActions: false,
    },
    rejected: {
        title: 'Nội dung bị từ chối',
        description: 'Danh sách truyện và chương bị từ chối.',
        endpoint: 'rejected',
        emptyMessage: 'Chưa có nội dung bị từ chối.',
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

const buildTitle = (item) => {
    if (item.contentType === 'chapter' && item.chapterTitle) {
        return `${item.storyTitle} — ${item.chapterTitle}`;
    }
    return item.storyTitle || '—';
};

function ContentModeration({ mode = 'pending' }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [actionKey, setActionKey] = useState('');
    const [preview, setPreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

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

    const fetchPending = async () => {
        const config = MODE_CONFIG[mode] || MODE_CONFIG.pending;
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
            const response = await fetch(`${API_BASE}/${config.endpoint}`, { headers });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Không thể tải danh sách.');
            }

            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Đã xảy ra lỗi khi tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, [mode]);

    const handleAction = async (item, actionType) => {
        let reason = '';
        if (actionType === 'reject' || actionType === 'request-edit') {
            reason = window.prompt('Nhập lý do để gửi cho tác giả (không bắt buộc):', '') || '';
        }

        const resource = item.contentType === 'story' ? 'stories' : 'chapters';
        const endpoint = actionType === 'request-edit' ? 'request-edit' : actionType;
        const currentKey = `${item.contentType}-${item.id}-${endpoint}`;

        setActionKey(currentKey);
        setMessage('');
        setError('');

        try {
            const headers = authToken
                ? { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }
                : { 'Content-Type': 'application/json' };
            const response = await fetch(`${API_BASE}/${resource}/${item.id}/${endpoint}`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reason }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Không thể xử lý nội dung.');
            }

            setItems((prev) => prev.filter((entry) => !(entry.id === item.id && entry.contentType === item.contentType)));
            setMessage('Đã cập nhật nội dung thành công.');
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Đã xảy ra lỗi khi xử lý nội dung.');
        } finally {
            setActionKey('');
        }
    };

    const handlePreview = async (item) => {
        setPreviewLoading(true);
        setError('');
        setMessage('');

        try {
            const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;
            const response = await fetch(
                `${API_BASE}/preview?type=${item.contentType}&id=${item.id}`,
                { headers }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Không thể tải nội dung xem trước.');
            }

            const data = await response.json();
            setPreview({
                title: data?.title || buildTitle(item),
                content: data?.content || 'Nội dung chưa có.',
            });
        } catch (err) {
            console.error(err);
            setError(err?.message || 'Đã xảy ra lỗi khi tải nội dung xem trước.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const isBusy = actionKey !== '';
    const viewConfig = MODE_CONFIG[mode] || MODE_CONFIG.pending;

    return (
        <div className="moderation-page">
            <div className="moderation-header">
                <div>
                    <h1>{viewConfig.title}</h1>
                    <p>{viewConfig.description}</p>
                </div>
                <div className="moderation-header-actions">
                    <div className="moderation-tabs">
                        <Link
                            to="/admin/moderation"
                            className={`moderation-tab ${mode === 'pending' ? 'active' : ''}`}
                        >
                            Chờ duyệt
                        </Link>
                        <Link
                            to="/admin/moderation/approved"
                            className={`moderation-tab ${mode === 'approved' ? 'active' : ''}`}
                        >
                            Đã duyệt
                        </Link>
                        <Link
                            to="/admin/moderation/rejected"
                            className={`moderation-tab ${mode === 'rejected' ? 'active' : ''}`}
                        >
                            Bị từ chối
                        </Link>
                    </div>
                    <button className="refresh-button" onClick={fetchPending} disabled={loading}>
                        {loading ? 'Đang tải...' : 'Tải lại'}
                    </button>
                </div>
            </div>

            {message && <div className="moderation-message success">{message}</div>}
            {error && <div className="moderation-message error">{error}</div>}

            <div className="moderation-grid">
                <div className="grid-row grid-header">
                    <div className="col-index">STT</div>
                    <div>Tiêu đề</div>
                    <div>Tác giả</div>
                    <div>Thể loại</div>
                    <div>Phân loại độ tuổi</div>
                    <div>Ngày gửi</div>
                    <div>Hành động</div>
                </div>

                {loading && (
                    <div className="grid-row grid-empty">Đang tải dữ liệu...</div>
                )}

                {!loading && items.length === 0 && (
                    <div className="grid-row grid-empty">{viewConfig.emptyMessage}</div>
                )}

                {!loading && items.map((item, index) => {
                    const title = buildTitle(item);
                    return (
                        <div key={`${item.contentType}-${item.id}`} className="grid-row">
                            <div className="col-index">{index + 1}</div>
                            <div>
                                <div className="content-title">{title}</div>
                                <span className={`content-type ${item.contentType}`}>
                                    {item.contentType === 'story' ? 'Truyện' : 'Chương'}
                                </span>
                            </div>
                            <div>{item.authorName || '—'}</div>
                            <div>{item.genre || '—'}</div>
                            <div>{item.ageRating || '—'}</div>
                            <div>{formatDateTime(item.submittedAt)}</div>
                            <div className="action-group">
                                <button
                                    className="action-button preview"
                                    disabled={isBusy}
                                    onClick={() => handlePreview(item)}
                                >
                                    Xem demo
                                </button>
                                {viewConfig.showActions && (
                                    <>
                                        <button
                                            className="action-button approve"
                                            disabled={isBusy}
                                            onClick={() => handleAction(item, 'approve')}
                                        >
                                            Duyệt
                                        </button>
                                        <button
                                            className="action-button request-edit"
                                            disabled={isBusy}
                                            onClick={() => handleAction(item, 'request-edit')}
                                        >
                                            Yêu cầu sửa
                                        </button>
                                        <button
                                            className="action-button reject"
                                            disabled={isBusy}
                                            onClick={() => handleAction(item, 'reject')}
                                        >
                                            Từ chối
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {preview && (
                <div className="preview-overlay" onClick={() => setPreview(null)}>
                    <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="preview-header">
                            <div>
                                <h2>{preview.title}</h2>
                                <p>Xem trước nội dung đăng tải.</p>
                            </div>
                            <button className="preview-close" onClick={() => setPreview(null)}>
                                ✕
                            </button>
                        </div>
                        {previewLoading ? (
                            <div className="preview-body">Đang tải nội dung...</div>
                        ) : (
                            <div className="preview-body">
                                {preview.content}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ContentModeration;
