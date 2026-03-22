import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  Heart,
  Home,
  Lock,
  Send,
  Type,
  X,
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import useNotify from '../hooks/useNotify';
import useChapter from '../hooks/useChapter';
import useBookmarks from '../hooks/useBookmarks';
import useComments from '../hooks/useComments';
import { purchaseChapter } from '../api/walletApi';
import {
  recordChapterView,
  sendReadingProgressKeepalive,
  updateReadingProgress,
} from '../services/ChapterService';
import { WalletContext } from '../context/WalletContext';
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal';
import PurchaseSuccessModal from '../components/PurchaseSuccessModal';
import PurchaseErrorModal from '../components/PurchaseErrorModal';
import ScrollTopButton from '../components/ScrollTopButton';
import '../styles/chapter-page.css';
import '../styles/story-metadata.css';

const INITIAL_CHAPTER_ID = 1;
const QUALIFIED_READ_MS = 3_000;

const htmlToText = (html) => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

const previewSegment = (html) => {
  const text = htmlToText(html);
  if (text) return text.length > 120 ? `${text.slice(0, 120).trim()}...` : text;
  return /<img\b/i.test(html || '') ? '[Hình ảnh]' : '[Segment]';
};

const buildSegmentImageAlt = (chapterTitle, imageIndex) => {
  const safeTitle = String(chapterTitle || '').trim();
  if (safeTitle) {
    return `Ảnh minh họa trong ${safeTitle} (${imageIndex})`;
  }
  return `Ảnh minh họa chương (${imageIndex})`;
};

const enhanceSegmentHtml = (html, chapterTitle) => {
  const rawHtml = String(html || '');
  if (!rawHtml || !/<img\b/i.test(rawHtml)) {
    return rawHtml;
  }

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  let imageIndex = 0;

  doc.body.querySelectorAll('img').forEach((img) => {
    imageIndex += 1;
    const currentAlt = String(img.getAttribute('alt') || '').trim();
    if (!currentAlt) {
      img.setAttribute('alt', buildSegmentImageAlt(chapterTitle, imageIndex));
    }
    if (!img.getAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }
    if (!img.getAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }
  });

  return doc.body.innerHTML;
};

const formatTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  const diff = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diff < 1) return 'Vừa xong';
  if (diff < 60) return `${diff} phút trước`;
  if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
  return date.toLocaleDateString('vi-VN');
};

const isDarkColor = (hex) => {
  if (!hex?.startsWith('#') || hex.length !== 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  if ([r, g, b].some(Number.isNaN)) return false;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.45;
};

const getInitial = (name) => {
  const raw = String(name || '').trim();
  return raw ? raw[0].toUpperCase() : '?';
};

const toBoolean = (value) =>
  value === true || value === 'true' || value === 1 || value === '1';

const hasAuthSession = () => {
  try {
    if (localStorage.getItem('accessToken')) return true;
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser);
    return Boolean(parsed?.token || parsed?.accessToken);
  } catch {
    return false;
  }
};

const sanitizeErrorMessage = (message, fallbackMessage) => {
  if (typeof message !== 'string') {
    return fallbackMessage;
  }

  const normalized = message.trim();
  if (!normalized || normalized === '[object Object]') {
    return fallbackMessage;
  }

  if (
    /could not execute statement/i.test(normalized) ||
    /data truncated for column/i.test(normalized) ||
    /insert into\s+[a-z_]+/i.test(normalized) ||
    /hibernate/i.test(normalized) ||
    /jdbc/i.test(normalized)
  ) {
    return fallbackMessage;
  }

  return normalized;
};

const getErrorMessage = (error, fallbackMessage) => {
  const direct = error?.message;
  const sanitizedDirect = sanitizeErrorMessage(direct, fallbackMessage);
  if (sanitizedDirect !== fallbackMessage) {
    return sanitizedDirect;
  }

  const responseData = error?.response?.data;
  if (typeof responseData === 'string' && responseData.trim()) {
    return sanitizeErrorMessage(responseData, fallbackMessage);
  }
  if (responseData && typeof responseData === 'object') {
    const nestedMessage =
      responseData.message || responseData.error || responseData.detail;
    if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
      return sanitizeErrorMessage(nestedMessage, fallbackMessage);
    }
  }

  return fallbackMessage;
};

const SettingsPopup = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const backgrounds = [
    { label: 'Trang', bg: '#FFFFFF', text: '#1a1a1a' },
    { label: 'Xanh nhạt', bg: '#E8F5E9', text: '#1b5e20' },
    { label: 'Xanh dương', bg: '#E3F2FD', text: '#0d47a1' },
    { label: 'Kem', bg: '#FFF8DC', text: '#3e2723' },
    { label: 'Hồng nhạt', bg: '#FCE4EC', text: '#880e4f' },
    { label: 'Xám', bg: '#ECEFF1', text: '#263238' },
    { label: 'Đen', bg: '#0B0B0B', text: '#F4F4F5' },
  ];

  const fonts = [
    { name: 'Crimson Text', value: "'Crimson Text', serif" },
    { name: 'Merriweather', value: "'Merriweather', serif" },
    { name: 'Lora', value: "'Lora', serif" },
    { name: 'Spectral', value: "'Spectral', serif" },
  ];

  const aligns = [
    { value: 'left', icon: 'L', label: 'Trái' },
    { value: 'center', icon: 'C', label: 'Giữa' },
    { value: 'right', icon: 'R', label: 'Phải' },
    { value: 'justify', icon: 'J', label: 'Đều' },
  ];

  return (
    <div className='settings-overlay' onClick={onClose}>
      <div
        className='settings-popup'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='settings-header'>
          <h3>Tùy chỉnh giao diện</h3>
          <button className='close-btn' onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className='settings-section'>
          <label>Màu nền</label>
          <div className='color-grid'>
            {backgrounds.map((color) => (
              <button
                key={color.bg}
                className={`color-option ${settings.bgColor === color.bg ? 'active' : ''}`}
                style={{ backgroundColor: color.bg, color: color.text }}
                onClick={() =>
                  onSettingsChange({
                    ...settings,
                    bgColor: color.bg,
                    textColor: color.text,
                  })
                }
                title={color.label}
              >
                {settings.bgColor === color.bg && <Check size={14} />}
              </button>
            ))}
          </div>
        </div>

        <div className='settings-section'>
          <label>Font chữ</label>
          <select
            className='font-select'
            value={settings.fontFamily}
            onChange={(event) =>
              onSettingsChange({ ...settings, fontFamily: event.target.value })
            }
          >
            {fonts.map((font) => (
              <option
                key={font.value}
                value={font.value}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className='settings-section'>
          <label>Kích cỡ chữ</label>
          <div className='size-controls'>
            <button
              className='size-btn'
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  fontSize: Math.max(14, settings.fontSize - 2),
                })
              }
            >
              A-
            </button>
            <span className='size-display'>{settings.fontSize}px</span>
            <button
              className='size-btn'
              onClick={() =>
                onSettingsChange({
                  ...settings,
                  fontSize: Math.min(30, settings.fontSize + 2),
                })
              }
            >
              A+
            </button>
          </div>
        </div>

        <div className='settings-section'>
          <label>Căn chỉnh</label>
          <div className='align-controls'>
            {aligns.map((align) => (
              <button
                key={align.value}
                className={`align-btn ${settings.textAlign === align.value ? 'active' : ''}`}
                onClick={() =>
                  onSettingsChange({ ...settings, textAlign: align.value })
                }
                title={align.label}
              >
                {align.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const SidePanel = ({ isOpen, onClose, bookmarks, onBookmarkDelete }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className='sidepanel-overlay' onClick={onClose} />
      <aside className={`sidepanel ${isOpen ? 'open' : ''}`}>
        <div className='sidepanel-header'>
          <h3>Bookmark của tôi</h3>
          <button className='close-btn' onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className='sidepanel-content'>
          <div className='bookmarks-list'>
            {bookmarks.length === 0 ? (
              <div className='empty-state'>
                <Bookmark size={42} strokeWidth={1} />
                <p>Chưa có bookmark nào</p>
                <small>Hãy lưu segment để quay lại đọc nhanh.</small>
              </div>
            ) : (
              bookmarks.map((bookmark) => (
                <div key={bookmark.id} className='bookmark-item'>
                  <p className='bookmark-text'>{bookmark.displayText}</p>
                  <button
                    type='button'
                    className='delete-bookmark'
                    onClick={() => onBookmarkDelete(bookmark.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

const VerticalToolbar = ({
  onPrevChapter,
  onNextChapter,
  onHome,
  onBackToMetadata,
  onSettings,
  onBookmarks,
  onReport,
  hasPrev,
  hasNext,
}) => (
  <div className='chapter-vertical-toolbar'>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onPrevChapter}
      disabled={!hasPrev}
      title='Chương trước'
    >
      <ChevronLeft size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onHome}
      title='Trang chủ'
    >
      <Home size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onSettings}
      title='Tùy chỉnh'
    >
      <Type size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onBackToMetadata}
      title='Về trang truyện'
    >
      <ArrowLeft size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onBookmarks}
      title='Bookmarks'
    >
      <Bookmark size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onReport}
      title='Báo lỗi'
    >
      <Flag size={18} />
    </button>
    <button
      type='button'
      className='chapter-toolbar-btn'
      onClick={onNextChapter}
      disabled={!hasNext}
      title='Chương sau'
    >
      <ChevronRight size={18} />
    </button>
  </div>
);

const LockedChapter = ({ chapter, onPurchase }) => (
  <div className='locked-chapter'>
    <div className='lock-icon-large'>
      <Lock size={56} />
    </div>
    <h3>Chương này đã bị khóa</h3>
    <p>Mua chương này để mở khóa và tiếp tục đọc</p>
    <div className='lock-price'>
      <span className='coin-icon'>COIN</span>
      <span className='price'>{chapter.priceCoin ?? 0} Coin</span>
    </div>
    <p className='locked-chapter-note'>
      Ưu tiên trừ Coin A trước, sau đó đến Coin B (kim cương).
    </p>
    <button type='button' className='purchase-btn' onClick={onPurchase}>
      Mua chương này
    </button>
  </div>
);

const CommentsSection = ({ storyId, chapterId, dark }) => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const {
    comments,
    total,
    hasMore,
    loadingComments,
    loadingMoreComments,
    submittingComment,
    createComment,
    updateComment,
    deleteComment,
    reportComment,
    loadMoreComments,
    error,
  } = useComments(storyId, chapterId);

  const [commentContent, setCommentContent] = useState('');
  const [replyForId, setReplyForId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [submittingReportForId, setSubmittingReportForId] = useState(null);
  const [visibleRepliesByRoot, setVisibleRepliesByRoot] = useState({});

  const currentUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  }, []);
  const currentUserId = Number(currentUser?.id ?? currentUser?.userId ?? 0);

  useEffect(() => {
    setVisibleRepliesByRoot((prev) => {
      const next = { ...prev };
      comments.forEach((rootComment) => {
        const rootId = String(rootComment.id);
        const replyLength = Array.isArray(rootComment?.replies)
          ? rootComment.replies.length
          : 0;
        if (next[rootId] == null) {
          next[rootId] = Math.min(2, replyLength);
        }
      });
      return next;
    });
  }, [comments]);

  const requireLogin = () => {
    if (currentUser) return true;
    notify('Bạn cần đăng nhập để bình luận', 'info');
    navigate('/login');
    return false;
  };

  const closeReplyForm = () => {
    setReplyForId(null);
    setReplyTarget(null);
    setReplyContent('');
  };

  const submitRoot = async (event) => {
    event.preventDefault();
    if (!requireLogin()) return;
    if (!commentContent.trim()) {
      notify('Vui lòng nhập bình luận', 'info');
      return;
    }
    try {
      await createComment({ content: commentContent.trim() });
      setCommentContent('');
      notify('Đã đăng bình luận', 'success');
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể gửi bình luận'), 'error');
    }
  };

  const openReplyForm = (comment, rootId) => {
    const mentionUsername = comment?.username || null;
    setEditingCommentId(null);
    setEditingContent('');
    setReplyForId(comment.id);
    setReplyTarget({
      rootId: String(rootId || comment.id),
      parentCommentId: comment.id,
      parentUserId: comment?.userId ?? null,
      mentionUsername,
    });
    setReplyContent('');
  };

  const submitReply = async () => {
    if (!requireLogin()) return;
    if (!replyTarget?.parentCommentId) return;
    if (!replyContent.trim()) {
      notify('Vui lòng nhập nội dung trả lời', 'info');
      return;
    }
    try {
      setSubmittingReply(true);
      await createComment({
        content: replyContent.trim(),
        parentCommentId: replyTarget.parentCommentId,
      });
      closeReplyForm();
      notify('Đã đăng trả lời', 'success');
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể gửi trả lời'), 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleStartEdit = (comment) => {
    closeReplyForm();
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingContent.trim()) {
      notify('Vui lòng nhập nội dung bình luận', 'info');
      return;
    }
    try {
      setSavingComment(true);
      await updateComment(commentId, editingContent.trim());
      notify('Đã cập nhật bình luận', 'success');
      handleCancelEdit();
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể cập nhật bình luận'), 'error');
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await deleteComment(commentId);
      setVisibleRepliesByRoot((prev) => {
        const next = { ...prev };
        delete next[String(commentId)];
        return next;
      });
      notify('Đã xóa bình luận', 'success');
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể xóa bình luận'), 'error');
    }
  };

  const handleReportComment = async (commentId, commentContent, commentUsername) => {
    if (!requireLogin()) return;
    
    // Navigate to comment report page with comment details
    const encodedContent = encodeURIComponent(commentContent || '');
    const encodedUsername = encodeURIComponent(commentUsername || '');
    navigate(`/report-comment?commentId=${commentId}&storyId=${storyId}&chapterId=${chapterId}&content=${encodedContent}&username=${encodedUsername}`);
  };

  const handleLoadMoreReplies = (rootId, totalReplies) => {
    setVisibleRepliesByRoot((prev) => ({
      ...prev,
      [rootId]: Math.min(totalReplies, (prev[rootId] ?? 0) + 2),
    }));
  };

  const handleCollapseReplies = (rootId) => {
    setVisibleRepliesByRoot((prev) => ({
      ...prev,
      [rootId]: Math.min(2, prev[rootId] ?? 2),
    }));
  };

  const renderReplyForm = (targetCommentId) => {
    if (replyForId !== targetCommentId) return null;

    return (
      <div className='story-metadata__reply-form'>
        {replyTarget?.mentionUsername && (
          <div className='story-metadata__reply-target'>
            Đang trả lời <span>@{replyTarget.mentionUsername}</span>
          </div>
        )}
        <textarea
          value={replyContent}
          onChange={(event) => setReplyContent(event.target.value)}
          placeholder='Nhập trả lời...'
          maxLength={4000}
        />
        <div className='story-metadata__reply-form-footer'>
          <span>{replyContent.trim().length} ky tu</span>
          <div className='story-metadata__reply-form-buttons'>
            <button type='button' className='ghost' onClick={closeReplyForm}>
              Huy
            </button>
            <button
              type='button'
              disabled={submittingReply}
              onClick={submitReply}
            >
              {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCommentItem = (comment, isReply = false, rootId = null) => {
    const commentRootId = String(rootId || comment.id);
    const isOwner = currentUserId === Number(comment.userId);
    const mention = isReply && comment.parentUsername ? `@${comment.parentUsername} ` : '';
    const isEditing = editingCommentId === comment.id;

    return (
      <article
        key={comment.id}
        className={
          isReply
            ? 'story-metadata__reply-item'
            : 'story-metadata__comment-item'
        }
      >
        <div className='story-metadata__comment-avatar-wrap'>
          {comment.avatarUrl ? (
            <img src={comment.avatarUrl} alt={comment.username || 'user'} />
          ) : (
            <div className='story-metadata__comment-avatar-fallback'>
              {getInitial(comment.username)}
            </div>
          )}
        </div>
        <div className='story-metadata__comment-body'>
          <div className='story-metadata__comment-head'>
            <strong
              className='cursor-pointer hover:text-blue-600 transition-colors'
              onClick={() => navigate(`/portfolio/${comment.userId}`)}
            >
              {comment.username || 'Unknown'}
            </strong>
            <small>{formatTime(comment.createdAt)}</small>
          </div>

          {isEditing ? (
            <div className='story-metadata__edit-form'>
              <textarea
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                maxLength={4000}
              />
              <div className='story-metadata__edit-actions'>
                <button
                  type='button'
                  disabled={savingComment}
                  onClick={() => handleSaveEdit(comment.id)}
                >
                  {savingComment ? 'Đang lưu...' : 'Luu'}
                </button>
                <button
                  type='button'
                  className='ghost'
                  onClick={handleCancelEdit}
                >
                  Huy
                </button>
              </div>
            </div>
          ) : (
            <p>
              {mention && (
                <span className='story-metadata__mention'>{mention}</span>
              )}
              {comment.content}
            </p>
          )}

          {!isEditing && (
            <div className='story-metadata__comment-actions'>
              <button
                type='button'
                className='story-metadata__reply-btn'
                onClick={() => openReplyForm(comment, commentRootId)}
              >
                Trả lời
              </button>
              {isOwner && (
                <>
                  <button
                    type='button'
                    className='story-metadata__inline-action'
                    onClick={() => handleStartEdit(comment)}
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type='button'
                    className='story-metadata__inline-action danger'
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    Xóa
                  </button>
                </>
              )}
              {!isOwner && (
                <button
                  type='button'
                  className='story-metadata__inline-action'
                  onClick={() => handleReportComment(comment.id, comment.content, comment.username)}
                >
                  Báo cáo
                </button>
              )}
            </div>
          )}

          {renderReplyForm(comment.id)}
        </div>
      </article>
    );
  };

  return (
    <section
      className={`chapter-comments ${dark ? 'chapter-comments--dark' : ''}`}
    >
      <h3>Bình luận ({total})</h3>
      <form className='story-metadata__comment-form' onSubmit={submitRoot}>
        <textarea
          value={commentContent}
          onChange={(event) => setCommentContent(event.target.value)}
          placeholder='Viết bình luận của bạn...'
          maxLength={4000}
        />
        <div className='story-metadata__comment-form-footer'>
          <span>{commentContent.trim().length} ky tu</span>
          <button disabled={submittingComment} type='submit'>
            <Send size={14} />
            {submittingComment ? 'Đang gửi...' : 'Gui'}
          </button>
        </div>
      </form>

      {loadingComments && (
        <p className='chapter-comments__muted'>Đang tải bình luận...</p>
      )}
      {error && <p className='chapter-comments__muted'>{error}</p>}

      <div className='story-metadata__comment-list'>
        {comments.map((comment) => {
          const rootId = String(comment.id);
          const replies = Array.isArray(comment.replies) ? comment.replies : [];
          const visibleReplyCount =
            visibleRepliesByRoot[rootId] ?? Math.min(2, replies.length);
          const displayedReplies = replies.slice(0, visibleReplyCount);
          const hasMoreReplies = replies.length > visibleReplyCount;

          return (
            <div key={comment.id} className='story-metadata__thread'>
              {renderCommentItem(comment, false, rootId)}
              {displayedReplies.length > 0 && (
                <div className='story-metadata__reply-list'>
                  {displayedReplies.map((reply) =>
                    renderCommentItem(reply, true, rootId),
                  )}
                </div>
              )}

              {(hasMoreReplies || visibleReplyCount > 2) && (
                <div className='story-metadata__reply-load-row'>
                  {hasMoreReplies && (
                    <button
                      type='button'
                      className='story-metadata__reply-load-btn'
                      onClick={() =>
                        handleLoadMoreReplies(rootId, replies.length)
                      }
                    >
                      Xem {Math.min(2, replies.length - visibleReplyCount)} trả
                      lời
                    </button>
                  )}
                  {visibleReplyCount > 2 && (
                    <button
                      type='button'
                      className='story-metadata__reply-load-btn ghost'
                      onClick={() => handleCollapseReplies(rootId)}
                    >
                      Thu gọn trả lời
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          type='button'
          className='story-metadata__load-more-comments'
          onClick={loadMoreComments}
          disabled={loadingMoreComments}
        >
          {loadingMoreComments ? 'Đang tải thêm...' : 'Xem thêm bình luận'}
        </button>
      )}

      {!loadingComments && comments.length === 0 && (
        <div className='story-metadata__empty-review'>
          Chưa có bình luận nào.
        </div>
      )}
    </section>
  );
};

const ChapterPage = () => {
  const { storyId, chapterId: chapterIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const initialId = Number(chapterIdParam) || INITIAL_CHAPTER_ID;
  const { chapterId, chapter, allChapters, loading, error, refreshChapter } =
    useChapter(initialId);
  const { bookmarks, toggleBookmark, removeBookmark, getBookmarkSegmentId } =
    useBookmarks(chapterId);
  const { wallet, refreshWallet } = useContext(WalletContext);

  const [settings, setSettings] = useState({
    bgColor: '#FFF8DC',
    textColor: '#3e2723',
    fontFamily: "'Crimson Text', serif",
    fontSize: 18,
    textAlign: 'justify',
  });
  const dark = useMemo(() => isDarkColor(settings.bgColor), [settings.bgColor]);

  const [showSettings, setShowSettings] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedSegmentId, setSelectedSegmentId] = useState(null);
  const [liked, setLiked] = useState(false);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [purchaseResponse, setPurchaseResponse] = useState(null);
  const [purchaseError, setPurchaseError] = useState('');

  const chapterContentRef = useRef(null);
  const antiCopyNotifyRef = useRef(0);
  const chapterViewTimerRef = useRef(null);
  const viewedChapterKeysRef = useRef(new Set());
  const activeReadingSegmentIdRef = useRef(null);
  const chapterQualifiedRef = useRef(false);
  const lastPersistedProgressRef = useRef('');

  const orderedChapters = useMemo(
    () => (Array.isArray(allChapters) ? allChapters : []),
    [allChapters],
  );

  const nextChapterId = useMemo(() => {
    if (chapter?.nextChapterId) return chapter.nextChapterId;
    const idx = orderedChapters.findIndex(
      (c) => Number(c.id) === Number(chapter?.id),
    );
    return idx >= 0 && idx < orderedChapters.length - 1
      ? orderedChapters[idx + 1].id
      : null;
  }, [chapter?.id, chapter?.nextChapterId, orderedChapters]);

  const previousChapterId = useMemo(() => {
    if (chapter?.previousChapterId) return chapter.previousChapterId;
    const idx = orderedChapters.findIndex(
      (c) => Number(c.id) === Number(chapter?.id),
    );
    return idx > 0 ? orderedChapters[idx - 1].id : null;
  }, [chapter?.id, chapter?.previousChapterId, orderedChapters]);

  const segments = useMemo(
    () => (Array.isArray(chapter?.segments) ? chapter.segments : []),
    [chapter?.segments],
  );
  const visibleSegments = useMemo(
    () =>
      segments.map((segment) => ({
        ...segment,
        segmentText: enhanceSegmentHtml(
          segment?.segmentText,
          chapter?.title || '',
        ),
      })),
    [chapter?.title, segments],
  );
  const resumeSegmentId = useMemo(() => {
    const raw = Number(searchParams.get('segmentId') || 0);
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  }, [searchParams]);
  const isChapterFree = toBoolean(chapter?.free ?? chapter?.isFree);
  const isChapterUnlocked = toBoolean(chapter?.unlocked ?? chapter?.isUnlocked);
  const isLocked = Boolean(chapter && !isChapterFree && !isChapterUnlocked);

  const segmentPreviewMap = useMemo(() => {
    const map = new Map();
    segments.forEach((segment) =>
      map.set(Number(segment.id), previewSegment(segment.segmentText)),
    );
    return map;
  }, [segments]);

  const bookmarkItems = useMemo(
    () =>
      bookmarks.map((bookmark) => {
        const segmentId = Number(getBookmarkSegmentId(bookmark));
        return {
          ...bookmark,
          displayText:
            bookmark.text ||
            segmentPreviewMap.get(segmentId) ||
            '[Segment đã lưu]',
        };
      }),
    [bookmarks, getBookmarkSegmentId, segmentPreviewMap],
  );

  useEffect(() => {
    setSelectedSegmentId(null);
  }, [chapter?.id]);

  useEffect(() => {
    const fallbackSegmentId = visibleSegments.some(
      (segment) => Number(segment.id) === Number(resumeSegmentId),
    )
      ? Number(resumeSegmentId)
      : Number(visibleSegments[0]?.id || 0);
    activeReadingSegmentIdRef.current = fallbackSegmentId || null;
    chapterQualifiedRef.current = Boolean(
      chapter?.id &&
      viewedChapterKeysRef.current.has(`${storyId || ''}:${chapter.id}`),
    );
    lastPersistedProgressRef.current = '';
  }, [chapter?.id, resumeSegmentId, storyId, visibleSegments]);

  const resolveSegmentIdFromViewportCenter = useCallback(() => {
    const segmentElements = Array.from(
      chapterContentRef.current?.querySelectorAll('[data-segment-id]') || [],
    );
    if (segmentElements.length === 0) return null;

    const viewportCenterY = window.innerHeight * 0.5;
    let crossingSegmentId = null;
    let nearestAbove = null;
    let nearestBelow = null;

    segmentElements.forEach((element) => {
      const id = Number(element.getAttribute('data-segment-id') || 0);
      if (!id) return;

      const rect = element.getBoundingClientRect();
      if (rect.top <= viewportCenterY && rect.bottom >= viewportCenterY) {
        if (crossingSegmentId == null) {
          crossingSegmentId = id;
        }
        return;
      }

      if (rect.bottom < viewportCenterY) {
        const distance = viewportCenterY - rect.bottom;
        if (!nearestAbove || distance < nearestAbove.distance) {
          nearestAbove = { id, distance };
        }
        return;
      }

      const distance = rect.top - viewportCenterY;
      if (!nearestBelow || distance < nearestBelow.distance) {
        nearestBelow = { id, distance };
      }
    });

    return (
      crossingSegmentId ||
      nearestBelow?.id ||
      nearestAbove?.id ||
      Number(segmentElements[0]?.getAttribute('data-segment-id') || 0) ||
      null
    );
  }, []);

  const getActiveSegmentId = useCallback(() => {
    const viewportSegmentId = Number(resolveSegmentIdFromViewportCenter() || 0);
    if (viewportSegmentId) {
      activeReadingSegmentIdRef.current = viewportSegmentId;
      return viewportSegmentId;
    }

    const currentSegmentId = Number(activeReadingSegmentIdRef.current || 0);
    if (currentSegmentId) return currentSegmentId;

    const selectedId = Number(selectedSegmentId || 0);
    if (selectedId) return selectedId;

    const fallbackId = Number(visibleSegments[0]?.id || 0);
    return fallbackId || null;
  }, [resolveSegmentIdFromViewportCenter, selectedSegmentId, visibleSegments]);

  const persistQualifiedProgress = useCallback(
    ({
      keepalive = false,
      chapterIdOverride = null,
      segmentIdOverride = null,
    } = {}) => {
      if (!chapterQualifiedRef.current || !hasAuthSession()) {
        return Promise.resolve(false);
      }

      const targetChapterId = Number(chapterIdOverride || chapter?.id || 0);
      const targetSegmentId = Number(
        segmentIdOverride || getActiveSegmentId() || 0,
      );
      if (!targetChapterId || !targetSegmentId) {
        return Promise.resolve(false);
      }

      const progressKey = `${targetChapterId}:${targetSegmentId}`;
      if (!keepalive && lastPersistedProgressRef.current === progressKey) {
        return Promise.resolve(false);
      }

      lastPersistedProgressRef.current = progressKey;
      if (keepalive) {
        sendReadingProgressKeepalive(targetChapterId, targetSegmentId);
        return Promise.resolve(true);
      }

      return updateReadingProgress(targetChapterId, targetSegmentId)
        .then(() => true)
        .catch((err) => {
          if (lastPersistedProgressRef.current === progressKey) {
            lastPersistedProgressRef.current = '';
          }
          console.error('updateReadingProgress error', err);
          return false;
        });
    },
    [chapter?.id, getActiveSegmentId],
  );

  useEffect(() => {
    if (!chapter?.id) return;
    if (resumeSegmentId) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [chapter?.id, resumeSegmentId]);

  useEffect(() => {
    if (!chapter?.id || !resumeSegmentId) return;
    if (
      !visibleSegments.some(
        (segment) => Number(segment.id) === Number(resumeSegmentId),
      )
    ) {
      return;
    }

    let cancelled = false;
    let animationFrameId = 0;
    let startTimeoutId = 0;
    let settleTimeoutId = 0;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;

    const getScrollElement = () => {
      const hostMain = document.querySelector('main.main-content');
      const canUseHostMain =
        hostMain &&
        typeof hostMain.scrollTop === 'number' &&
        hostMain.scrollHeight > hostMain.clientHeight;

      return canUseHostMain
        ? hostMain
        : document.scrollingElement || document.documentElement;
    };

    const animateScrollTo = (targetTop, duration = 1800) => {
      const scrollElement = getScrollElement();
      const startTop = scrollElement.scrollTop;
      const distance = targetTop - startTop;
      if (Math.abs(distance) < 2) {
        scrollElement.scrollTop = targetTop;
        return;
      }

      let startTime = null;

      const step = (timestamp) => {
        if (cancelled) return;
        if (startTime == null) {
          startTime = timestamp;
        }

        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);
        scrollElement.scrollTop = startTop + distance * eased;

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        }
      };

      animationFrameId = window.requestAnimationFrame(step);
    };

    const getTargetTop = () => {
      if (cancelled) return;

      const targetElement = chapterContentRef.current?.querySelector(
        `[data-segment-id="${resumeSegmentId}"]`,
      );
      if (!targetElement) return null;

      const hostMain = document.querySelector('main.main-content');
      const canUseHostMain =
        hostMain &&
        typeof hostMain.scrollTop === 'number' &&
        hostMain.scrollHeight > hostMain.clientHeight;
      const scrollElement = getScrollElement();
      const elementRect = targetElement.getBoundingClientRect();
      const hostRect = canUseHostMain ? hostMain.getBoundingClientRect() : { top: 0 };
      return Math.max(
        0,
        scrollElement.scrollTop + elementRect.top - hostRect.top - 24,
      );
    };

    const alignTargetSegment = (behavior = 'auto') => {
      const targetTop = getTargetTop();
      if (targetTop == null) return;

      if (behavior === 'smooth') {
        animateScrollTo(targetTop);
      } else {
        getScrollElement().scrollTop = targetTop;
      }

      activeReadingSegmentIdRef.current = Number(resumeSegmentId);
      setSelectedSegmentId(Number(resumeSegmentId));
    };

    const scrollToTargetSegment = () => {
      const scrollElement = getScrollElement();
      scrollElement.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      startTimeoutId = window.setTimeout(() => {
        if (cancelled) return;
        alignTargetSegment('smooth');
        settleTimeoutId = window.setTimeout(() => {
          if (cancelled) return;
          alignTargetSegment('auto');
        }, 1900);
      }, 80);
    };

    const frame = window.requestAnimationFrame(scrollToTargetSegment);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
      if (startTimeoutId) {
        window.clearTimeout(startTimeoutId);
      }
      if (settleTimeoutId) {
        window.clearTimeout(settleTimeoutId);
      }
    };
  }, [chapter?.id, resumeSegmentId, visibleSegments]);

  useEffect(() => {
    if (!chapter?.id || isLocked || visibleSegments.length === 0)
      return undefined;

    let frameId = 0;

    const updateActiveSegmentFromCenterLine = () => {
      frameId = 0;
      const nextSegmentId = resolveSegmentIdFromViewportCenter();
      if (nextSegmentId) {
        activeReadingSegmentIdRef.current = nextSegmentId;
      }
    };

    const scheduleActiveSegmentUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(updateActiveSegmentFromCenterLine);
    };

    scheduleActiveSegmentUpdate();
    window.addEventListener('scroll', scheduleActiveSegmentUpdate, {
      passive: true,
    });
    window.addEventListener('resize', scheduleActiveSegmentUpdate);

    return () => {
      if (frameId) {
      window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', scheduleActiveSegmentUpdate);
      window.removeEventListener('resize', scheduleActiveSegmentUpdate);
    };
  }, [chapter?.id, isLocked, resolveSegmentIdFromViewportCenter, visibleSegments]);

  useEffect(() => {
    if (!chapter?.id || isLocked) return undefined;

    const chapterViewKey = `${storyId || ''}:${chapter.id}`;
    if (viewedChapterKeysRef.current.has(chapterViewKey)) {
      chapterQualifiedRef.current = true;
      return undefined;
    }

    chapterViewTimerRef.current = window.setTimeout(async () => {
      chapterViewTimerRef.current = null;
      try {
        const currentSegmentId = getActiveSegmentId();
        await recordChapterView(chapter.id, currentSegmentId);
        viewedChapterKeysRef.current.add(chapterViewKey);
        chapterQualifiedRef.current = true;
        lastPersistedProgressRef.current = currentSegmentId
          ? `${chapter.id}:${currentSegmentId}`
          : '';
        console.log(
          'Chapter view recorded for daily task tracking:',
          chapter.id,
        );
      } catch (err) {
        console.error('recordChapterView error', err);
      }
    }, QUALIFIED_READ_MS);

    return () => {
      if (chapterViewTimerRef.current) {
        window.clearTimeout(chapterViewTimerRef.current);
        chapterViewTimerRef.current = null;
      }
    };
  }, [chapter?.id, storyId, isLocked, getActiveSegmentId]);

  useEffect(() => {
    if (!chapter?.id || isLocked) return undefined;

    const currentChapterId = Number(chapter.id);
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return;
      persistQualifiedProgress({
        keepalive: true,
        chapterIdOverride: currentChapterId,
      });
    };
    const handlePageHide = () => {
      persistQualifiedProgress({
        keepalive: true,
        chapterIdOverride: currentChapterId,
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      persistQualifiedProgress({ chapterIdOverride: currentChapterId });
    };
  }, [chapter?.id, isLocked, persistQualifiedProgress]);

  useEffect(() => {
    const hostMain = document.querySelector('main.main-content');
    if (hostMain) {
      hostMain.classList.add('chapter-layout-host');
      hostMain.dataset.prevPadding = hostMain.style.padding || '';
      hostMain.dataset.prevBackground = hostMain.style.background || '';
      hostMain.style.padding = '0';
      hostMain.style.background = 'transparent';
    }
    return () => {
      if (hostMain) {
        hostMain.classList.remove('chapter-layout-host');
        hostMain.style.padding = hostMain.dataset.prevPadding || '';
        hostMain.style.background = hostMain.dataset.prevBackground || '';
        delete hostMain.dataset.prevPadding;
        delete hostMain.dataset.prevBackground;
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('chapter-reading-scroll-enabled');
    document.body.classList.add('chapter-reading-active');
    document.body.classList.add('chapter-reading-scroll-enabled');
    document.body.style.setProperty('--chapter-reader-bg', settings.bgColor);
    document.body.style.backgroundColor = settings.bgColor;
    document.body.style.color = settings.textColor;
    return () => {
      document.documentElement.classList.remove('chapter-reading-scroll-enabled');
      document.body.classList.remove('chapter-reading-active');
      document.body.classList.remove('chapter-reading-scroll-enabled');
      document.body.style.removeProperty('--chapter-reader-bg');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, [settings.bgColor, settings.textColor]);

  const gotoChapter = async (targetId) => {
    if (!storyId || !targetId) return;
    await persistQualifiedProgress({ chapterIdOverride: chapter?.id });
    navigate(`/stories/${storyId}/chapters/${targetId}`);
  };

  const navigateWithQualifiedProgress = useCallback(
    async (targetPath) => {
      if (!targetPath) return;
      await persistQualifiedProgress({ chapterIdOverride: chapter?.id });
      navigate(targetPath);
    },
    [chapter?.id, navigate, persistQualifiedProgress],
  );

  const progressPercent = () => {
    const max =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    if (max <= 0) return 0;
    return Number(((window.scrollY / max) * 100).toFixed(2));
  };

  const notifyCopyBlocked = () => {
    const now = Date.now();
    if (now - antiCopyNotifyRef.current < 1500) return;
    antiCopyNotifyRef.current = now;
    notify('Không thể sao chép nội dung truyện', 'info');
  };

  const blockCopyAction = (event) => {
    event.preventDefault();
    notifyCopyBlocked();
  };

  const bookmarkSegment = async (segment) => {
    if (!hasAuthSession()) {
      notify('Bạn cần đăng nhập để sử dụng bookmark', 'info');
      return;
    }

    try {
      const existed = bookmarks.some(
        (b) => Number(getBookmarkSegmentId(b)) === Number(segment.id),
      );
      await toggleBookmark({
        segmentId: segment.id,
        text: previewSegment(segment.segmentText),
        positionPercent: progressPercent(),
      });
      notify(existed ? 'Đã xóa bookmark' : 'Đã lưu bookmark', 'success');
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể cập nhật bookmark'), 'error');
    }
  };

  const handleBookmarkDelete = async (bookmarkId) => {
    try {
      await removeBookmark(bookmarkId);
      notify('Đã xóa bookmark', 'success');
    } catch (err) {
      notify(getErrorMessage(err, 'Không thể xóa bookmark'), 'error');
    }
  };

  const purchase = () => {
    if (!hasAuthSession()) {
      notify('Bạn cần đăng nhập để mua chương', 'info');
      navigate('/login');
      return;
    }

    if (!chapter?.priceCoin) {
      setPurchaseError('Không xác định được giá chương');
      setShowErrorModal(true);
      return;
    }
    const totalCoins = Number(wallet.coinA || 0) + Number(wallet.coinB || 0);
    if (totalCoins < chapter.priceCoin) {
      setPurchaseError(
        `Không đủ coin để mua chương. Cần ${chapter.priceCoin}, hiện có ${totalCoins}.`,
      );
      setShowErrorModal(true);
      return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    if (!chapter?.priceCoin || !chapterId) return;
    setPurchaseLoading(true);
    try {
      const response = await purchaseChapter(chapter.priceCoin, chapterId);
      if (!response?.success) throw new Error('Mua chương thất bại');
      await refreshWallet();
      setPurchaseResponse(response);
      setShowPurchaseModal(false);
      setShowSuccessModal(true);
      await refreshChapter();
    } catch (err) {
      const message = getErrorMessage(err, 'Không thể mua chương.');
      setPurchaseError(message);
      setShowPurchaseModal(false);
      setShowErrorModal(true);
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`chapter-reader-container ${dark ? 'theme-dark' : 'theme-light'}`}>
        <div
          className='chapter-state'
          style={{ backgroundColor: settings.bgColor, color: settings.textColor }}
        >
          Đang tải chương...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`chapter-reader-container ${dark ? 'theme-dark' : 'theme-light'}`}>
        <div
          className='chapter-state'
          style={{ backgroundColor: settings.bgColor, color: '#e53935' }}
        >
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  if (!chapter) return null;

  return (
    <div
      className={`chapter-reader-container ${dark ? 'theme-dark' : 'theme-light'}`}
    >
      <div
        className={`chapter-reader ${dark ? 'theme-dark' : 'theme-light'}`}
        style={{
          backgroundColor: settings.bgColor,
          color: settings.textColor,
          fontFamily: settings.fontFamily,
        }}
      >
      <VerticalToolbar
        onPrevChapter={() =>
          previousChapterId && gotoChapter(previousChapterId)
        }
        onNextChapter={() => nextChapterId && gotoChapter(nextChapterId)}
        onHome={() => navigateWithQualifiedProgress('/')}
        onBackToMetadata={() =>
          storyId &&
          navigateWithQualifiedProgress(`/stories/${storyId}/metadata`)
        }
        onSettings={() => setShowSettings(true)}
        onBookmarks={() => setShowPanel(true)}
        onReport={() => {
          if (storyId && chapterIdParam) {
            navigate(`/report?storyId=${storyId}&chapterId=${chapterIdParam}`);
          }
        }}
        hasPrev={Boolean(previousChapterId)}
        hasNext={Boolean(nextChapterId)}
      />

      <main className='chapter-main-content'>
        <header className='story-header'>
          <h1 className='story-title'>Chương {chapter.sequenceIndex}</h1>
          <h2 className='chapter-title'>{chapter.title}</h2>
        </header>

        {isLocked ? (
          <LockedChapter chapter={chapter} onPurchase={purchase} />
        ) : (
          <>
            <section
              ref={chapterContentRef}
              className='chapter-content chapter-content--protected'
              style={{
                fontSize: `${settings.fontSize}px`,
                textAlign: settings.textAlign,
              }}
              onCopy={blockCopyAction}
              onCut={blockCopyAction}
              onContextMenu={blockCopyAction}
              onDragStart={blockCopyAction}
            >
              {visibleSegments.map((segment) => {
                const selected =
                  Number(selectedSegmentId) === Number(segment.id);
                const bookmarked = bookmarks.some(
                  (b) => Number(getBookmarkSegmentId(b)) === Number(segment.id),
                );

                return (
                  <article
                    key={segment.id}
                    data-segment-id={segment.id}
                    className={`chapter-segment ${selected ? 'selected' : ''} ${bookmarked ? 'bookmarked' : ''}`}
                    onClick={() =>
                      setSelectedSegmentId((prev) =>
                        Number(prev) === Number(segment.id) ? null : segment.id,
                      )
                    }
                  >
                    <div
                      className='chapter-segment-content'
                      dangerouslySetInnerHTML={{
                        __html: segment.segmentText || '',
                      }}
                    />
                    <button
                      type='button'
                      className={`bookmark-inline-btn ${bookmarked ? 'active' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        bookmarkSegment(segment);
                      }}
                    >
                      {bookmarked ? (
                        <BookmarkCheck size={15} />
                      ) : (
                        <Bookmark size={15} />
                      )}
                    </button>
                  </article>
                );
              })}
            </section>

            <div className='chapter-navigation'>
              <button
                className='nav-btn'
                onClick={() =>
                  previousChapterId && gotoChapter(previousChapterId)
                }
                disabled={!previousChapterId}
              >
                <ChevronLeft size={18} />
                Chương trước
              </button>
              <button
                className='nav-btn'
                onClick={() => nextChapterId && gotoChapter(nextChapterId)}
                disabled={!nextChapterId}
              >
                Chương sau
                <ChevronRight size={18} />
              </button>
            </div>

            <div className='interaction-bar'>
              <button
                className={`interaction-btn ${liked ? 'liked' : ''}`}
                onClick={() => setLiked((prev) => !prev)}
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Đã thích' : 'Thả tim'}
              </button>
              <button 
                className='interaction-btn'
                onClick={() => {
                  if (storyId && chapterIdParam) {
                    navigate(`/report?storyId=${storyId}&chapterId=${chapterIdParam}`);
                  }
                }}
              >
                <Flag size={18} />
                Báo lỗi
              </button>
            </div>

            <CommentsSection
              storyId={storyId}
              chapterId={chapterId}
              dark={dark}
            />
          </>
        )}
      </main>

      {showPanel && (
        <SidePanel
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
          bookmarks={bookmarkItems}
          onBookmarkDelete={handleBookmarkDelete}
        />
      )}

      <SettingsPopup
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      <PurchaseConfirmationModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        chapter={chapter}
        wallet={wallet}
        onConfirm={confirmPurchase}
        loading={purchaseLoading}
      />

      <PurchaseSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        response={purchaseResponse}
        chapterTitle={chapter?.title}
      />

      <PurchaseErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorMessage={purchaseError}
        chapterPrice={chapter?.priceCoin}
        currentBalance={wallet?.coinA + wallet?.coinB || 0}
      />

      <ScrollTopButton />
    </div>
    </div>
  );
};

export default ChapterPage;
