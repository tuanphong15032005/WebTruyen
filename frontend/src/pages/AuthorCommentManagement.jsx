import { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/AuthorCommentManagement.css';

const API_BASE = 'http://localhost:8081/api/author';

const getAuthHeaders = () => {
    const stored = localStorage.getItem('user');
    if (!stored) return {};
    try {
        const parsed = JSON.parse(stored);
        const token = parsed?.token || '';
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
};

const formatDateTime = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleString('vi-VN');
    } catch {
        return value;
    }
};

const STATUS_LABEL = { Normal: 'Bình thường', Reported: 'Bị báo cáo', Hidden: 'Đã ẩn' };

function CommentThread({ comment, onReply, onHide, loadingId }) {
    const [replyText, setReplyText] = useState('');
    const [showReplyInput, setShowReplyInput] = useState(false);
    const isHidden = comment.status === 'Hidden';

    const handleReply = async () => {
        const content = (replyText || '').trim();
        if (!content) return;
        await onReply(comment.id, content);
        setReplyText('');
        setShowReplyInput(false);
    };

    return (
        <div className={`comment-block ${isHidden ? 'comment-hidden' : ''}`}>
            <div className="comment-header">
                <div className="comment-avatar">
                    {comment.readerAvatarUrl ? (
                        <img src={comment.readerAvatarUrl} alt="" />
                    ) : (
                        <span className="avatar-placeholder">
                            {(comment.readerDisplayName || '?').charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                <div className="comment-meta">
                    <span className="comment-author">{comment.readerDisplayName || '—'}</span>
                    <span className="comment-time">{formatDateTime(comment.createdAt)}</span>
                    {comment.chapterTitle && (
                        <span className="comment-chapter">Chương: {comment.chapterTitle}</span>
                    )}
                    <span className={`comment-status status-${(comment.status || 'Normal').toLowerCase()}`}>
                        {STATUS_LABEL[comment.status] || comment.status}
                    </span>
                </div>
            </div>
            <div className="comment-content">{comment.content || '—'}</div>
            {!isHidden && (
                <div className="comment-actions">
                    {!showReplyInput ? (
                        <button
                            type="button"
                            className="btn-reply"
                            onClick={() => setShowReplyInput(true)}
                        >
                            Trả lời
                        </button>
                    ) : (
                        <div className="reply-inline">
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Nhập nội dung trả lời..."
                                rows={2}
                            />
                            <div className="reply-actions">
                                <button type="button" className="btn-cancel" onClick={() => { setShowReplyInput(false); setReplyText(''); }}>
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    className="btn-send"
                                    onClick={handleReply}
                                    disabled={loadingId === comment.id || !replyText.trim()}
                                >
                                    {loadingId === comment.id ? 'Đang gửi...' : 'Gửi trả lời'}
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        type="button"
                        className="btn-hide"
                        onClick={() => onHide(comment.id)}
                        disabled={loadingId === comment.id}
                    >
                        {loadingId === comment.id ? '...' : 'Ẩn'}
                    </button>
                </div>
            )}
            {comment.replies && comment.replies.length > 0 && (
                <div className="comment-replies">
                    {comment.replies.map((reply) => (
                        <CommentThread
                            key={reply.id}
                            comment={reply}
                            onReply={onReply}
                            onHide={onHide}
                            loadingId={loadingId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AuthorCommentManagement() {
    const [stories, setStories] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [comments, setComments] = useState([]);
    const [selectedStoryId, setSelectedStoryId] = useState('');
    const [selectedChapterId, setSelectedChapterId] = useState('');
    const [loadingStories, setLoadingStories] = useState(true);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    const headers = useMemo(() => ({
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
    }), []);

    const fetchStories = useCallback(async () => {
        setLoadingStories(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/stories`, { headers: getAuthHeaders() });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(JSON.parse(text)?.error || text || 'Không thể tải danh sách truyện.');
            }
            const data = await res.json();
            setStories(Array.isArray(data) ? data : []);
            if (!selectedStoryId && data?.length) setSelectedStoryId(String(data[0].id));
        } catch (err) {
            setError(err?.message || 'Lỗi tải truyện.');
        } finally {
            setLoadingStories(false);
        }
    }, []);

    const fetchChapters = useCallback(async (storyId) => {
        if (!storyId) {
            setChapters([]);
            return;
        }
        setLoadingChapters(true);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/stories/${storyId}/chapters`, { headers: getAuthHeaders() });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(JSON.parse(text)?.error || text || 'Không thể tải danh sách chương.');
            }
            const data = await res.json();
            setChapters(Array.isArray(data) ? data : []);
            setSelectedChapterId('');
        } catch (err) {
            setError(err?.message || 'Lỗi tải chương.');
        } finally {
            setLoadingChapters(false);
        }
    }, []);

    const fetchComments = useCallback(async () => {
        if (!selectedStoryId) {
            setComments([]);
            return;
        }
        setLoadingComments(true);
        setError('');
        try {
            const url = new URL(`${API_BASE}/comments`);
            url.searchParams.set('storyId', selectedStoryId);
            if (selectedChapterId) url.searchParams.set('chapterId', selectedChapterId);
            const res = await fetch(url, { headers: getAuthHeaders() });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(JSON.parse(text)?.error || text || 'Không thể tải bình luận.');
            }
            const data = await res.json();
            setComments(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err?.message || 'Lỗi tải bình luận.');
        } finally {
            setLoadingComments(false);
        }
    }, [selectedStoryId, selectedChapterId]);

    useEffect(() => {
        fetchStories();
    }, [fetchStories]);

    useEffect(() => {
        if (selectedStoryId) {
            fetchChapters(selectedStoryId);
        } else {
            setChapters([]);
        }
        setComments([]);
    }, [selectedStoryId, fetchChapters]);

    const onStoryChange = (e) => {
        setSelectedStoryId(e.target.value || '');
    };

    const onChapterChange = (e) => {
        setSelectedChapterId(e.target.value || '');
    };

    const loadComments = () => {
        if (selectedStoryId) fetchComments();
    };

    const handleReply = async (commentId, content) => {
        setActionLoadingId(commentId);
        setMessage('');
        setError('');
        try {
            const res = await fetch(`${API_BASE}/comments/${commentId}/reply`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Gửi trả lời thất bại.');
            }
            setMessage('Đã gửi trả lời.');
            fetchComments();
        } catch (err) {
            setError(err?.message || 'Lỗi khi trả lời.');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleHide = async (commentId) => {
        setActionLoadingId(commentId);
        setMessage('');
        setError('');
        try {
            const res = await fetch(`${API_BASE}/comments/${commentId}/hide`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data?.error || 'Ẩn bình luận thất bại.');
            }
            setMessage('Đã ẩn bình luận.');
            fetchComments();
        } catch (err) {
            setError(err?.message || 'Lỗi khi ẩn.');
        } finally {
            setActionLoadingId(null);
        }
    };

    return (
        <div className="author-comments-page">
            <header className="author-comments-header">
                <h1>Quản lý bình luận</h1>
                <p>Xem, trả lời và ẩn bình luận của độc giả theo truyện/chương.</p>
            </header>

            {message && <div className="author-comments-message success">{message}</div>}
            {error && <div className="author-comments-message error">{error}</div>}

            <div className="author-comments-filters">
                <div className="filter-group">
                    <label>Truyện</label>
                    <select
                        value={selectedStoryId}
                        onChange={onStoryChange}
                        disabled={loadingStories}
                    >
                        <option value="">-- Chọn truyện --</option>
                        {stories.map((s) => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Chương</label>
                    <select
                        value={selectedChapterId}
                        onChange={onChapterChange}
                        disabled={loadingChapters || !selectedStoryId}
                    >
                        <option value="">Tất cả chương</option>
                        {chapters.map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.volumeTitle ? `${c.volumeTitle} - ` : ''}{c.title}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="button"
                    className="btn-load-comments"
                    onClick={loadComments}
                    disabled={!selectedStoryId || loadingComments}
                >
                    {loadingComments ? 'Đang tải...' : 'Xem bình luận'}
                </button>
            </div>

            <div className="author-comments-list">
                {loadingComments && <div className="comments-loading">Đang tải bình luận...</div>}
                {!loadingComments && comments.length === 0 && selectedStoryId && (
                    <div className="comments-empty">Chưa có bình luận nào.</div>
                )}
                {!loadingComments && comments.length > 0 && (
                    <div className="comments-thread">
                        {comments.map((c) => (
                            <CommentThread
                                key={c.id}
                                comment={c}
                                onReply={handleReply}
                                onHide={handleHide}
                                loadingId={actionLoadingId}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
