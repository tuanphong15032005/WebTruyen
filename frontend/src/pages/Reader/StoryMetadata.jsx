import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/story-metadata.css';

const COMPLETION_LABELS = {
  ongoing: 'Đang tiến hành',
  completed: 'Hoàn thành',
  cancelled: 'Tạm ngưng',
};

const KIND_LABELS = {
  original: 'Truyện gốc',
  translated: 'Truyện dịch',
  ai: 'Truyện AI',
};

const STORY_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  archived: 'Lưu trữ',
};

const STAR_VALUES = [1, 2, 3, 4, 5];
const COMMENTS_PAGE_SIZE = 8;
const REVIEW_PREVIEW_LENGTH = 150;

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleString('vi-VN');
};

const formatRelativeTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.floor(diffHour / 24)} ngày trước`;
};

const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getInitial = (name) => {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  return raw.charAt(0).toUpperCase();
};

const truncateText = (text, maxLen) => {
  const value = String(text || '').trim();
  if (value.length <= maxLen) return value;
  return `${value.slice(0, maxLen).trim()}...`;
};

const MetaLine = ({ icon, label, value, iconClass = '', valueClass = '' }) => (
  <p className='story-metadata__meta-line'>
    <span className={`story-metadata__icon ${iconClass}`} aria-hidden='true'>
      {icon}
    </span>
    <span className='story-metadata__meta-label'>{label}</span>
    <strong className={`story-metadata__meta-value ${valueClass}`.trim()}>
      {value}
    </strong>
  </p>
);

const StoryMetadata = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [story, setStory] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [latestReview, setLatestReview] = useState(null);
  const [comments, setComments] = useState([]);

  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyForId, setReplyForId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const fetchStory = useCallback(async () => {
    try {
      setLoadingStory(true);
      const response = await storyService.getPublicStory(storyId);
      setStory(response?.data || null);
    } catch (error) {
      console.error('getStory metadata error', error);
      setStory(null);
      notify('Truyện chưa công khai hoặc không tồn tại', 'error');
    } finally {
      setLoadingStory(false);
    }
  }, [notify, storyId]);

  const fetchVolumes = useCallback(async () => {
    try {
      setLoadingVolumes(true);
      const response = await storyService.getPublicVolumes(storyId);
      const list = Array.isArray(response?.data) ? response.data : [];
      setVolumes(list);

      if (list.length > 0) {
        const firstVolumeId = String(list[0].id || list[0].volumeId || '');
        if (firstVolumeId) {
          setExpandedVolumes(new Set([firstVolumeId]));
        }
      }
    } catch (error) {
      console.error('getVolumes metadata error', error);
      notify('Không tải được danh sách tập', 'error');
    } finally {
      setLoadingVolumes(false);
    }
  }, [notify, storyId]);

  const fetchLatestReview = useCallback(async () => {
    try {
      setLoadingReviews(true);
      const response = await storyService.getStoryReviews(storyId, {
        page: 0,
        size: 1,
      });
      const items = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];
      setLatestReview(items[0] || null);
    } catch (error) {
      console.error('getStoryReviews error', error);
      notify('Không tải được đánh giá', 'error');
    } finally {
      setLoadingReviews(false);
    }
  }, [notify, storyId]);

  const fetchNotifyStatus = useCallback(async () => {
    try {
      const response = await storyService.getNotifyStatus(storyId);
      setNotifyEnabled(Boolean(response?.data?.enabled));
    } catch {
      setNotifyEnabled(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchStory();
    fetchVolumes();
    fetchLatestReview();
    fetchNotifyStatus();
  }, [fetchNotifyStatus, fetchLatestReview, fetchStory, fetchVolumes]);

  const fetchCommentsPage = useCallback(
    async (pageIndex, append) => {
      try {
        setLoadingComments(true);
        const response = await storyService.getStoryComments(storyId, {
          page: pageIndex,
          size: COMMENTS_PAGE_SIZE,
        });
        const items = Array.isArray(response?.data?.items)
          ? response.data.items
          : [];
        setComments((prev) => (append ? [...prev, ...items] : items));
        setCommentsPage(Number(response?.data?.page || pageIndex));
        setCommentsHasMore(Boolean(response?.data?.hasMore));
        setCommentsTotal(Number(response?.data?.totalElements || 0));
        if (!append) {
          setReplyForId(null);
          setReplyContent('');
        }
      } catch (error) {
        console.error('getStoryComments error', error);
        notify('Không tải được bình luận', 'error');
      } finally {
        setLoadingComments(false);
      }
    },
    [notify, storyId],
  );

  useEffect(() => {
    fetchCommentsPage(0, false);
  }, [fetchCommentsPage]);

  const categoryTag = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags[0] || null;
  }, [story]);

  const extraTags = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags.slice(1);
  }, [story]);

  const completionLabel = useMemo(() => {
    const key = String(story?.completionStatus || '').toLowerCase();
    return COMPLETION_LABELS[key] || 'Đang tiến hành';
  }, [story]);

  const kindLabel = useMemo(() => {
    const key = String(story?.kind || '').toLowerCase();
    return KIND_LABELS[key] || 'Truyện gốc';
  }, [story]);

  const visibilityLabel = useMemo(() => {
    const key = String(story?.status || '').toLowerCase();
    return STORY_STATUS_LABELS[key] || 'Nháp';
  }, [story]);

  const isTranslated = useMemo(
    () => String(story?.kind || '').toLowerCase() === 'translated',
    [story],
  );

  const ratingText = useMemo(() => {
    const count = Number(story?.ratingCount || 0);
    if (!count) return 'Chưa có đánh giá';
    const avg = Number(story?.ratingAvg || 0)
      .toFixed(2)
      .replace('.', ',');
    return `${avg} / 5`;
  }, [story]);

  const readerText = useMemo(() => {
    const readers = Number(story?.readerCount || 0);
    if (!readers) return 'Chưa có người đọc';
    return formatNumber(readers);
  }, [story]);

  const wordText = useMemo(
    () => formatNumber(Number(story?.wordCount || 0)),
    [story],
  );

  const translatorName = useMemo(
    () => story?.translatorPenName || story?.authorPenName || 'Chưa có bút danh',
    [story],
  );

  const summaryText = useMemo(
    () => htmlToText(story?.summaryHtml || story?.summary || ''),
    [story],
  );

  const canExpandSummary = summaryText.length > 300;
  const latestReviewContent = latestReview ? latestReview.content || '' : '';
  const latestReviewShort = truncateText(
    latestReviewContent,
    REVIEW_PREVIEW_LENGTH,
  );
  const latestReviewIsLong =
    latestReviewContent.length > REVIEW_PREVIEW_LENGTH;

  const handleToggleVolume = (volumeId) => {
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
      }
      return next;
    });
  };

  const handleToggleNotify = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để bật thông báo truyện', 'info');
      navigate('/login');
      return;
    }
    try {
      setNotifyLoading(true);
      const response = await storyService.toggleNotifyStatus(storyId);
      const enabled = Boolean(response?.data?.enabled);
      setNotifyEnabled(enabled);
      notify(
        enabled
          ? 'Đã bật thông báo chapter mới'
          : 'Đã tắt thông báo chapter mới',
        'success',
      );
    } catch (error) {
      console.error('toggle notify error', error);
      notify('Không thể cập nhật thông báo', 'error');
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleCreateComment = async (event) => {
    event.preventDefault();
    if (!currentUser) {
      notify('Bạn cần đăng nhập để bình luận', 'info');
      navigate('/login');
      return;
    }
    if (!commentContent.trim()) {
      notify('Vui lòng nhập bình luận', 'info');
      return;
    }

    try {
      setSubmittingComment(true);
      await storyService.createStoryComment(storyId, {
        content: commentContent.trim(),
      });
      setCommentContent('');
      notify('Đã đăng bình luận', 'success');
      await fetchCommentsPage(0, false);
    } catch (error) {
      console.error('createStoryComment error', error);
      notify('Không thể đăng bình luận', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLoadMoreComments = async () => {
    if (!commentsHasMore || loadingComments) return;
    await fetchCommentsPage(commentsPage + 1, true);
  };

  const appendReplyToTree = (nodes, reply) => {
    let inserted = false;
    const nextNodes = nodes.map((node) => {
      const childReplies = Array.isArray(node.replies) ? node.replies : [];

      if (String(node.id) === String(reply.parentCommentId)) {
        inserted = true;
        return {
          ...node,
          replies: [...childReplies, reply],
        };
      }

      if (childReplies.length > 0) {
        const nested = appendReplyToTree(childReplies, reply);
        if (nested.inserted) {
          inserted = true;
          return {
            ...node,
            replies: nested.nodes,
          };
        }
      }

      return node;
    });

    return { nodes: nextNodes, inserted };
  };

  const handleSubmitReply = async (parentCommentId) => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để trả lời bình luận', 'info');
      navigate('/login');
      return;
    }
    if (!replyContent.trim()) {
      notify('Vui lòng nhập nội dung trả lời', 'info');
      return;
    }
    try {
      setSubmittingReply(true);
      const response = await storyService.createStoryComment(storyId, {
        content: replyContent.trim(),
        parentCommentId,
      });

      const createdReply = response?.data;
      const normalizedReply = createdReply
        ? {
            ...createdReply,
            replies: Array.isArray(createdReply.replies)
              ? createdReply.replies
              : [],
          }
        : null;

      let appended = false;
      if (normalizedReply?.parentCommentId) {
        setComments((prev) => {
          const result = appendReplyToTree(prev, normalizedReply);
          appended = result.inserted;
          return result.inserted ? result.nodes : prev;
        });
      }

      setReplyForId(null);
      setReplyContent('');
      notify('Đã đăng trả lời', 'success');

      if (appended) {
        setCommentsTotal((prev) => prev + 1);
      } else {
        await fetchCommentsPage(0, false);
      }
    } catch (error) {
      console.error('create reply error', error);
      notify('Không thể đăng trả lời', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderReplyForm = (targetCommentId) => {
    if (replyForId !== targetCommentId) return null;

    return (
      <div className='story-metadata__reply-form'>
        <textarea
          value={replyContent}
          onChange={(event) => setReplyContent(event.target.value)}
          placeholder='Nhập trả lời...'
          maxLength={4000}
        />
        <div className='story-metadata__reply-form-footer'>
          <span>{replyContent.trim().length} k? t?</span>
          <button
            type='button'
            disabled={submittingReply}
            onClick={() => handleSubmitReply(targetCommentId)}
          >
            {submittingReply ? 'Đang gửi...' : 'Gửi trả lời'}
          </button>
        </div>
      </div>
    );
  };

  const renderCommentItem = (comment, isReply = false) => (
    <article
      key={comment.id}
      className={isReply ? 'story-metadata__reply-item' : 'story-metadata__comment-item'}
    >
      <div className='story-metadata__comment-avatar-wrap'>
        {comment.avatarUrl ? (
          <img src={comment.avatarUrl} alt={comment.username} />
        ) : (
          <div className='story-metadata__comment-avatar-fallback'>
            {getInitial(comment.username)}
          </div>
        )}
      </div>
      <div className='story-metadata__comment-body'>
        <div className='story-metadata__comment-head'>
          <strong>{comment.username}</strong>
          <small>{formatRelativeTime(comment.createdAt)}</small>
        </div>
        <p>{comment.content}</p>

        <div className='story-metadata__comment-actions'>
          <button
            type='button'
            className='story-metadata__reply-btn'
            onClick={() =>
              setReplyForId((prev) => (prev === comment.id ? null : comment.id))
            }
          >
            Trả lời
          </button>
        </div>

        {renderReplyForm(comment.id)}

        {Array.isArray(comment.replies) && comment.replies.length > 0 && (
          <div className='story-metadata__reply-list'>
            {comment.replies.map((reply) => renderCommentItem(reply, true))}
          </div>
        )}
      </div>
    </article>
  );

  return (
    <div className='story-metadata'>
      <div className='story-metadata__layout'>
        <section className='story-metadata__frame'>
          {loadingStory && (
            <p className='story-metadata__muted'>Đang tải thông tin truyện...</p>
          )}

          {story && (
            <div className='story-metadata__card'>
              <aside className='story-metadata__cover-col'>
                {story.coverUrl ? (
                  <img
                    className='story-metadata__cover'
                    src={story.coverUrl}
                    alt={story.title}
                  />
                ) : (
                  <div className='story-metadata__cover story-metadata__cover--empty'>
                    Chưa có ảnh bìa
                  </div>
                )}

                <button type='button' className='story-metadata__side-btn'>
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M6 3h12a2 2 0 0 1 2 2v16l-8-3.8L4 21V5a2 2 0 0 1 2-2z' />
                  </svg>
                  <span>Lưu vào thư viện</span>
                </button>
                <button type='button' className='story-metadata__side-btn ghost'>
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M12 2 2 6v6c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V6L12 2zm0 6a1.6 1.6 0 1 1 0 3.2A1.6 1.6 0 0 1 12 8zm1.2 10h-2.4v-1.8h.9v-3.4h-.9V11h2.4v5.2h.9V18z' />
                  </svg>
                  <span>Báo cáo</span>
                </button>
              </aside>

              <article className='story-metadata__content'>
                <h1>{story.title}</h1>

                <div className='story-metadata__meta'>
                  {isTranslated && (
                    <MetaLine
                      icon={
                        <svg viewBox='0 0 24 24'>
                          <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
                        </svg>
                      }
                      label='Tác giả gốc:'
                      value={story.originalAuthorName || 'Chưa rõ'}
                    />
                  )}

                  {!isTranslated && (
                    <MetaLine
                      icon={
                        <svg viewBox='0 0 24 24'>
                          <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
                        </svg>
                      }
                      label='Tác giả:'
                      value={story.authorPenName || 'Chưa có bút danh'}
                    />
                  )}

                  {isTranslated && (
                    <MetaLine
                      icon={
                        <svg viewBox='0 0 24 24'>
                          <path d='M5 4h7v2H9.92a9.94 9.94 0 0 1-1.58 3c.76.9 1.67 1.69 2.66 2.3l-1 1.73a12.2 12.2 0 0 1-2.73-2.32A11.8 11.8 0 0 1 4.5 13L3 11.5A9.8 9.8 0 0 0 6.1 9 8.09 8.09 0 0 0 7.6 6H5zm10 2h2l4 14h-2l-1-3h-4l-1 3h-2zm.5 3.5-1.5 4.5h3z' />
                        </svg>
                      }
                      label='Người dịch:'
                      value={translatorName}
                    />
                  )}

                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3h7v4h-7z' />
                      </svg>
                    }
                    label='Loại truyện:'
                    value={kindLabel}
                  />

                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' />
                      </svg>
                    }
                    label='Danh mục:'
                    value={categoryTag?.name || 'Chưa chọn'}
                    valueClass='story-metadata__category-chip'
                  />
                </div>

                {extraTags.length > 0 && (
                  <div className='story-metadata__tags'>
                    {extraTags.map((tag) => (
                      <span key={tag.id} className='story-metadata__tag'>
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className='story-metadata__rows'>
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Lượt xem:'
                    value={readerText}
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M12 4a8 8 0 0 1 7.84 6.4h-2.06A6 6 0 0 0 6.22 10.4h2.06A4 4 0 0 1 12 8c1.34 0 2.52.66 3.25 1.67l1.55-1.2A6 6 0 0 0 12 6a6 6 0 0 0-4.8 2.47l1.55 1.2A4 4 0 0 1 12 8zm-8 8a8 8 0 0 1 .16-1.6h2.06a6 6 0 0 0 11.56 0h2.06A8 8 0 1 1 4 12zm6.2.8a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 0 0-3.6 0z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Hiển thị:'
                    value={visibilityLabel}
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm4.3 6.7-5.1 5.1-2.5-2.5-1.4 1.4 3.9 3.9 6.5-6.5-1.4-1.4z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Trạng thái:'
                    value={completionLabel}
                    valueClass='story-metadata__status'
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='m12 17.3-6.16 3.24 1.18-6.88L2 8.76l6.92-1L12 1.5l3.08 6.26 6.92 1-5.02 4.9 1.18 6.88z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Đánh giá:'
                    value={ratingText}
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M7 3h8a2 2 0 0 1 2 2v14H7a3 3 0 0 0-3 3V5a2 2 0 0 1 2-2zm10 16V5a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a1 1 0 0 1 1-1h9z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Số từ:'
                    value={wordText}
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M12 1.8a10.2 10.2 0 1 0 10.2 10.2A10.2 10.2 0 0 0 12 1.8zm0 2a8.2 8.2 0 1 1-8.2 8.2A8.2 8.2 0 0 1 12 3.8zm-.1 2.7a1 1 0 0 0-1 1v5.2c0 .27.11.52.3.7l3.5 3.5a1 1 0 1 0 1.4-1.4l-3.2-3.2V7.5a1 1 0 0 0-1-1z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--pink'
                    label='Cập nhật lần cuối:'
                    value={formatRelativeTime(story.lastUpdatedAt)}
                  />
                </div>

                <div className='story-metadata__summary-header'>
                  <span>Nội dung</span>
                  <span>( Cập nhật: {formatDateTime(story.lastUpdatedAt)} )</span>
                </div>

                <div
                  className={`story-metadata__summary ${expandedSummary ? 'expanded' : ''}`}
                >
                  {summaryText || 'Chưa có tóm tắt.'}
                </div>

                {canExpandSummary && (
                  <button
                    type='button'
                    className='story-metadata__summary-toggle'
                    onClick={() => setExpandedSummary((prev) => !prev)}
                  >
                    {expandedSummary ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}

                <div className='story-metadata__actions'>
                  <button type='button' className='story-metadata__action-btn'>
                    Đọc từ đầu
                  </button>
                  <button type='button' className='story-metadata__action-btn ghost'>
                    Đọc mới nhất
                  </button>
                  <button
                    type='button'
                    className={`story-metadata__notify-btn ${notifyEnabled ? 'is-enabled' : ''} ${notifyLoading ? 'is-loading' : ''}`}
                    onClick={handleToggleNotify}
                    disabled={notifyLoading}
                  >
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M12 2a6 6 0 0 0-6 6v3.8l-1.6 2.7A1 1 0 0 0 5.3 16h13.4a1 1 0 0 0 .9-1.5L18 11.8V8a6 6 0 0 0-6-6zm0 20a3 3 0 0 1-2.8-2h5.6A3 3 0 0 1 12 22z' />
                    </svg>
                    <span>Nhận thông báo</span>
                  </button>
                </div>
              </article>
            </div>
          )}
        </section>

        <section className='story-metadata__review-preview'>
          <div className='story-metadata__review-preview-head'>
            <h3>Reviews mới</h3>
            <Link to={`/stories/${storyId}/reviews`}>Xem trang đánh giá</Link>
          </div>

          {loadingReviews && (
            <p className='story-metadata__muted'>Đang tải review...</p>
          )}

          {!loadingReviews && !latestReview && (
            <div className='story-metadata__empty-review'>
              Chưa có review nào.
              <Link to={`/stories/${storyId}/reviews`}> Viết review</Link>
            </div>
          )}

          {latestReview && (
            <article className='story-metadata__latest-review-card'>
              <div className='story-metadata__latest-review-head'>
                <strong>{latestReview.username || 'Ẩn danh'}</strong>
                <div className='story-metadata__latest-review-stars'>
                  {STAR_VALUES.map((star) => (
                    <span
                      key={`${latestReview.id}-${star}`}
                      className={latestReview.rating >= star ? 'active' : ''}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p>{latestReviewShort}</p>
              <div className='story-metadata__latest-review-footer'>
                <span>
                  {formatRelativeTime(
                    latestReview.updatedAt || latestReview.createdAt,
                  )}
                </span>
                <Link to={`/stories/${storyId}/reviews`}>
                  {latestReviewIsLong ? 'Xem thêm' : 'Xem tất cả'}
                </Link>
              </div>
            </article>
          )}
        </section>

        <section className='story-metadata__volume-section'>
          <h2>Danh sách Tập & Chương</h2>
          {loadingVolumes && (
            <p className='story-metadata__muted'>Đang tải danh sách tập...</p>
          )}
          {!loadingVolumes && volumes.length === 0 && (
            <div className='story-metadata__empty'>Chưa có volume nào.</div>
          )}

          {volumes.map((volume) => {
            const id = String(volume.id || volume.volumeId);
            const isOpen = expandedVolumes.has(id);
            const chapters = Array.isArray(volume.chapters)
              ? [...volume.chapters].sort(
                  (a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0),
                )
              : [];

            return (
              <div key={id} className='story-metadata__volume'>
                <button
                  type='button'
                  className='story-metadata__volume-head'
                  onClick={() => handleToggleVolume(id)}
                >
                  <span>
                    {volume.title || `Tập ${volume.sequenceIndex || ''}`}
                    <small>{volume.chapterCount ?? chapters.length} chương</small>
                  </span>
                  <span>{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className='story-metadata__chapter-list'>
                    {chapters.length === 0 && (
                      <p className='story-metadata__muted'>Chưa có chương nào.</p>
                    )}
                    {chapters.map((chapter) => (
                      <div key={chapter.id} className='story-metadata__chapter-row'>
                        <span>
                          {chapter.sequenceIndex
                            ? `Chương ${chapter.sequenceIndex}: `
                            : ''}
                          {chapter.title}
                        </span>
                        <span className='story-metadata__chapter-date'>
                          {chapter.lastUpdateAt
                            ? new Date(chapter.lastUpdateAt).toLocaleDateString(
                                'vi-VN',
                              )
                            : 'Chưa cập nhật'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className='story-metadata__comments-section'>
          <h3>Tổng bình luận ({commentsTotal})</h3>

          <form
            className='story-metadata__comment-form'
            onSubmit={handleCreateComment}
          >
            <textarea
              value={commentContent}
              onChange={(event) => setCommentContent(event.target.value)}
              placeholder='Nhập bình luận của bạn...'
              maxLength={4000}
            />

            <div className='story-metadata__comment-form-footer'>
              <span>{commentContent.trim().length} ký tự</span>
              <button type='submit' disabled={submittingComment}>
                {submittingComment ? 'Đang đăng...' : 'Đăng bình luận'}
              </button>
            </div>
          </form>

          {loadingComments && comments.length === 0 && (
            <p className='story-metadata__muted'>Đang tải bình luận...</p>
          )}

          {!loadingComments && comments.length === 0 && (
            <div className='story-metadata__empty-review'>Chưa có bình luận nào.</div>
          )}

          <div className='story-metadata__comment-list'>
            {comments.map((comment) => renderCommentItem(comment))}
          </div>

          {commentsHasMore && (
            <button
              type='button'
              className='story-metadata__load-more-comments'
              onClick={handleLoadMoreComments}
              disabled={loadingComments}
            >
              {loadingComments ? 'Đang tải...' : 'Xem Thêm Bình Luận →'}
            </button>
          )}
        </section>
      </div>
    </div>
  );
};

export default StoryMetadata;
