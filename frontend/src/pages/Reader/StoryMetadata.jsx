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

const formatRatingValue = (value) => {
  const raw = Number(value);
  if (!Number.isFinite(raw) || raw <= 0) return null;
  return raw.toFixed(2).replace('.', ',');
};

// Muc dich: Hien thi sao rating theo ti le day cua gia tri trung binh. Hieuson + 10h30
const RatingStars = ({ rating = 0, className = '' }) => {
  const safeRating = Number.isFinite(Number(rating))
    ? Math.max(0, Math.min(5, Number(rating)))
    : 0;

  return (
    <div className={`story-metadata__stars ${className}`.trim()}>
      {STAR_VALUES.map((star) => {
        const fill = Math.max(0, Math.min(1, safeRating - (star - 1)));
        return (
          <span key={star} className='story-metadata__star'>
            <span className='story-metadata__star-base'>★</span>
            <span
              className='story-metadata__star-fill'
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
    </div>
  );
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
  const [sidebar, setSidebar] = useState(null);

  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingSidebar, setLoadingSidebar] = useState(false);

  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [librarySaved, setLibrarySaved] = useState(false);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyForId, setReplyForId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [submittingReportForId, setSubmittingReportForId] = useState(null);
  const [visibleRepliesByRoot, setVisibleRepliesByRoot] = useState({});
  const [commentsPage, setCommentsPage] = useState(0);
  const [commentsHasMore, setCommentsHasMore] = useState(false);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const commentsAnchorRef = React.useRef(null);

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const currentUserId = Number(currentUser?.id ?? currentUser?.userId ?? 0);

  const fetchStory = useCallback(async () => {
    try {
      setLoadingStory(true);
      const response = await storyService.getPublicStory(storyId);
      setStory(response || null);
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
      const list = Array.isArray(response) ? response : [];
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
      const items = Array.isArray(response?.items) ? response.items : [];
      setLatestReview(items[0] || null);
    } catch (error) {
      console.error('getStoryReviews error', error);
      notify('Không tải được đánh giá', 'error');
    } finally {
      setLoadingReviews(false);
    }
  }, [notify, storyId]);

  // Muc dich: Goi endpoint sidebar de lay thong tin them + goi y truyen. Hieuson + 10h30
  const fetchSidebar = useCallback(async () => {
    try {
      setLoadingSidebar(true);
      const response = await storyService.getPublicStorySidebar(storyId);
      setSidebar(response || null);
    } catch (error) {
      console.error('getPublicStorySidebar error', error);
      setSidebar(null);
    } finally {
      setLoadingSidebar(false);
    }
  }, [storyId]);

  const fetchNotifyStatus = useCallback(async () => {
    try {
      const response = await storyService.getNotifyStatus(storyId);
      setNotifyEnabled(Boolean(response?.enabled));
    } catch {
      setNotifyEnabled(false);
    }
  }, [storyId]);

  const fetchLibraryStatus = useCallback(async () => {
    try {
      const response = await storyService.getLibraryStatus(storyId);
      setLibrarySaved(Boolean(response?.saved));
    } catch {
      setLibrarySaved(false);
    }
  }, [storyId]);

  useEffect(() => {
    fetchStory();
    fetchVolumes();
    fetchLatestReview();
    fetchSidebar();
    fetchNotifyStatus();
    fetchLibraryStatus();
  }, [
    fetchSidebar,
    fetchLibraryStatus,
    fetchNotifyStatus,
    fetchLatestReview,
    fetchStory,
    fetchVolumes,
  ]);

  const fetchCommentsPage = useCallback(
    async (pageIndex, append) => {
      try {
        setLoadingComments(true);
        const response = await storyService.getStoryComments(storyId, {
          page: pageIndex,
          size: COMMENTS_PAGE_SIZE,
        });
        const items = Array.isArray(response?.items) ? response.items : [];
        setComments((prev) => (append ? [...prev, ...items] : items));
        setCommentsPage(Number(response?.page || pageIndex));
        setCommentsHasMore(Boolean(response?.hasMore));
        setCommentsTotal(Number(response?.totalElements || 0));
        setVisibleRepliesByRoot((prev) => {
          const base = append ? { ...prev } : {};
          items.forEach((rootComment) => {
            const rootId = String(rootComment.id);
            const replyLength = Array.isArray(rootComment.replies)
              ? rootComment.replies.length
              : 0;
            if (base[rootId] == null) {
              base[rootId] = Math.min(2, replyLength);
            }
          });
          return base;
        });
        if (!append) {
          setReplyForId(null);
          setReplyTarget(null);
          setReplyContent('');
          setEditingCommentId(null);
          setEditingContent('');
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

  const isTranslated = useMemo(
    () => String(story?.kind || '').toLowerCase() === 'translated',
    [story],
  );

  const readerText = useMemo(() => {
    const readers = Number(story?.readerCount || 0);
    if (!readers) return 'Chưa có người đọc';
    return formatNumber(readers);
  }, [story]);

  const wordText = useMemo(
    () => formatNumber(Number(story?.wordCount || 0)),
    [story],
  );

  const sidebarRatingText = useMemo(() => {
    const ratingCount = Number(sidebar?.ratingCount || 0);
    if (!ratingCount) return 'Chưa có đánh giá';
    const ratingAvgText = formatRatingValue(sidebar?.ratingAvg);
    return ratingAvgText ? `${ratingAvgText} / 5` : 'Chưa có đánh giá';
  }, [sidebar]);

  const followerText = useMemo(
    () => formatNumber(Number(sidebar?.followerCount || 0)),
    [sidebar],
  );

  const weeklyRankText = useMemo(() => {
    const rank = Number(sidebar?.weeklyRank || 0);
    if (!rank) return 'Chưa xếp hạng';
    return `#${rank}`;
  }, [sidebar]);

  const similarStories = useMemo(
    () => (Array.isArray(sidebar?.similarStories) ? sidebar.similarStories : []),
    [sidebar],
  );

  const sameAuthorStories = useMemo(
    () =>
      Array.isArray(sidebar?.sameAuthorStories) ? sidebar.sameAuthorStories : [],
    [sidebar],
  );

  const translatorName = useMemo(
    () =>
      story?.translatorPenName || story?.authorPenName || 'Chưa có bút danh',
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
  const latestReviewIsLong = latestReviewContent.length > REVIEW_PREVIEW_LENGTH;

  // Muc dich: Render dung dang rating + sao cho cac card sidebar. Hieuson + 10h30
  const renderSidebarItemRating = (item) => {
    const ratingCount = Number(item?.ratingCount || 0);
    const ratingValue = Number(item?.ratingAvg || 0);
    if (!ratingCount || ratingValue <= 0) {
      return <span className='story-metadata__sidebar-item-empty'>Chưa có đánh giá</span>;
    }

    const ratingText = formatRatingValue(ratingValue) || '0,00';
    return (
      <div className='story-metadata__sidebar-item-rating'>
        <span>{ratingText} / 5</span>
        <RatingStars rating={ratingValue} className='compact' />
      </div>
    );
  };

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
      const enabled = Boolean(response?.enabled);
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

  const scrollToComments = useCallback(() => {
    commentsAnchorRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, []);

  const normalizeCommentNode = useCallback(
    (comment) => ({
      ...comment,
      replies: Array.isArray(comment?.replies) ? comment.replies : [],
    }),
    [],
  );

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
      scrollToComments();
    } catch (error) {
      console.error('createStoryComment error', error);
      notify('Không thể đăng bình luận', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleLibrary = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để lưu truyện vào thư viện', 'info');
      navigate('/login');
      return;
    }
    try {
      setLibraryLoading(true);
      const response = await storyService.toggleLibraryStatus(storyId);
      const saved = Boolean(response?.saved);
      setLibrarySaved(saved);
      setSidebar((prev) => {
        if (!prev) return prev;
        const currentFollowers = Number(prev.followerCount || 0);
        const nextFollowers = Math.max(
          0,
          currentFollowers + (saved ? 1 : -1),
        );
        return {
          ...prev,
          followerCount: nextFollowers,
        };
      });
      notify(
        saved ? 'Đã lưu vào thư viện' : 'Đã bỏ lưu khỏi thư viện',
        'success',
      );
    } catch (error) {
      console.error('toggle library error', error);
      notify('Không thể cập nhật thư viện', 'error');
    } finally {
      setLibraryLoading(false);
    }
  };

  const handleLoadMoreComments = async () => {
    if (!commentsHasMore || loadingComments) return;
    await fetchCommentsPage(commentsPage + 1, true);
  };

  const openReplyForm = (comment, rootId) => {
    const mentionUsername =
      Number(comment?.userId) !== currentUserId ? comment?.username : null;
    setEditingCommentId(null);
    setEditingContent('');
    setReplyForId(comment.id);
    setReplyTarget({
      rootId: String(rootId || comment.id),
      parentCommentId: comment.id,
      mentionUsername,
    });
    setReplyContent('');
  };

  const closeReplyForm = () => {
    setReplyForId(null);
    setReplyTarget(null);
    setReplyContent('');
  };

  const updateCommentInTree = useCallback((nodes, targetId, updater) => {
    return nodes.map((node) => {
      if (String(node.id) === String(targetId)) {
        return updater(node);
      }
      const replies = Array.isArray(node.replies) ? node.replies : [];
      if (!replies.length) {
        return node;
      }
      return {
        ...node,
        replies: updateCommentInTree(replies, targetId, updater),
      };
    });
  }, []);

  const removeCommentInTree = useCallback((nodes, targetId) => {
    let removedCount = 0;
    const nextNodes = [];

    const countNode = (node) => {
      const replies = Array.isArray(node.replies) ? node.replies : [];
      return 1 + replies.reduce((sum, item) => sum + countNode(item), 0);
    };

    for (const node of nodes) {
      if (String(node.id) === String(targetId)) {
        removedCount += countNode(node);
        continue;
      }
      const replies = Array.isArray(node.replies) ? node.replies : [];
      if (!replies.length) {
        nextNodes.push(node);
        continue;
      }
      const nested = removeCommentInTree(replies, targetId);
      removedCount += nested.removedCount;
      nextNodes.push({
        ...node,
        replies: nested.nodes,
      });
    }

    return { nodes: nextNodes, removedCount };
  }, []);

  const handleSubmitReply = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để trả lời bình luận', 'info');
      navigate('/login');
      return;
    }
    if (!replyTarget?.parentCommentId) {
      notify('Không xác định được bình luận để trả lời', 'error');
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
        parentCommentId: replyTarget.parentCommentId,
      });

      const createdReply = response;
      if (createdReply?.id) {
        const normalizedReply = normalizeCommentNode(createdReply);
        const targetRootId = String(replyTarget.rootId);
        setComments((prev) =>
          prev.map((root) =>
            String(root.id) === targetRootId
              ? {
                  ...root,
                  replies: [
                    ...(Array.isArray(root.replies) ? root.replies : []),
                    normalizedReply,
                  ],
                }
              : root,
          ),
        );
        setCommentsTotal((prev) => prev + 1);
        setVisibleRepliesByRoot((prev) => ({
          ...prev,
          [targetRootId]: (prev[targetRootId] ?? 0) + 1,
        }));
      } else {
        await fetchCommentsPage(0, false);
      }

      closeReplyForm();
      notify('Đã đăng trả lời', 'success');
      scrollToComments();
    } catch (error) {
      console.error('create reply error', error);
      notify('Không thể đăng trả lời', 'error');
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
      await storyService.updateStoryComment(storyId, commentId, {
        content: editingContent.trim(),
      });
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (node) => ({
          ...node,
          content: editingContent.trim(),
        })),
      );
      notify('Đã cập nhật bình luận', 'success');
      handleCancelEdit();
      scrollToComments();
    } catch (error) {
      console.error('update comment error', error);
      notify('Không thể cập nhật bình luận', 'error');
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) {
      return;
    }

    try {
      await storyService.deleteStoryComment(storyId, commentId);
      let removedCount = 0;
      setComments((prev) => {
        const next = removeCommentInTree(prev, commentId);
        removedCount = next.removedCount;
        return next.nodes;
      });
      if (removedCount > 0) {
        setCommentsTotal((prev) => Math.max(0, prev - removedCount));
      } else {
        await fetchCommentsPage(0, false);
      }
      setVisibleRepliesByRoot((prev) => {
        const next = { ...prev };
        delete next[String(commentId)];
        return next;
      });
      notify('Đã xóa bình luận', 'success');
      scrollToComments();
    } catch (error) {
      console.error('delete comment error', error);
      notify('Không thể xóa bình luận', 'error');
    }
  };

  const handleReportComment = async (commentId) => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để báo cáo bình luận', 'info');
      navigate('/login');
      return;
    }

    const reason = window.prompt('Nhập lý do báo cáo bình luận:');
    if (!reason || !reason.trim()) {
      return;
    }

    try {
      setSubmittingReportForId(commentId);
      await storyService.reportStoryComment(storyId, commentId, {
        reason: reason.trim(),
      });
      notify('Đã gửi báo cáo bình luận', 'success');
    } catch (error) {
      console.error('report comment error', error);
      notify('Không thể báo cáo bình luận', 'error');
    } finally {
      setSubmittingReportForId(null);
    }
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
          <span>{replyContent.trim().length} ký tự</span>
          <div className='story-metadata__reply-form-buttons'>
            <button type='button' className='ghost' onClick={closeReplyForm}>
              Hủy
            </button>
            <button
              type='button'
              disabled={submittingReply}
              onClick={handleSubmitReply}
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
    const mention =
      isReply &&
      comment.parentUsername &&
      Number(comment.parentUserId) !== Number(comment.userId)
        ? `@${comment.parentUsername} `
        : '';

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
                  {savingComment ? 'Đang lưu...' : 'Lưu'}
                </button>
                <button
                  type='button'
                  className='ghost'
                  onClick={handleCancelEdit}
                >
                  Hủy
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
                  onClick={() => handleReportComment(comment.id)}
                  disabled={submittingReportForId === comment.id}
                >
                  {submittingReportForId === comment.id
                    ? 'Đang gửi...'
                    : 'Báo cáo'}
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
    <div className='story-metadata'>
      <div className='story-metadata__layout'>
        <div className='story-metadata__main'>
          <section className='story-metadata__frame'>
          {loadingStory && (
            <p className='story-metadata__muted'>
              Đang tải thông tin truyện...
            </p>
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

                <button
                  type='button'
                  className={`story-metadata__side-btn ${librarySaved ? 'saved' : ''}`}
                  onClick={handleToggleLibrary}
                  disabled={libraryLoading}
                >
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M6 3h12a2 2 0 0 1 2 2v16l-8-3.8L4 21V5a2 2 0 0 1 2-2z' />
                  </svg>
                  <span>
                    {libraryLoading
                      ? 'Đang xử lý...'
                      : librarySaved
                        ? 'Đã lưu'
                        : 'Lưu vào thư viện'}
                  </span>
                </button>
                <button
                  type='button'
                  className='story-metadata__side-btn ghost'
                >
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
                      iconClass='story-metadata__icon--author'
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
                      iconClass='story-metadata__icon--author'
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
                      iconClass='story-metadata__icon--translator'
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
                    iconClass='story-metadata__icon--kind'
                    label='Loại truyện:'
                    value={kindLabel}
                  />

                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--category'
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
                    iconClass='story-metadata__icon--views'
                    label='Lượt xem:'
                    value={readerText}
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm4.3 6.7-5.1 5.1-2.5-2.5-1.4 1.4 3.9 3.9 6.5-6.5-1.4-1.4z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--status'
                    label='Trạng thái:'
                    value={completionLabel}
                    valueClass='story-metadata__status'
                  />
                  <MetaLine
                    icon={
                      <svg viewBox='0 0 24 24'>
                        <path d='M7 3h8a2 2 0 0 1 2 2v14H7a3 3 0 0 0-3 3V5a2 2 0 0 1 2-2zm10 16V5a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a1 1 0 0 1 1-1h9z' />
                      </svg>
                    }
                    iconClass='story-metadata__icon--words'
                    label='Số từ:'
                    value={wordText}
                  />
                </div>

                <div className='story-metadata__summary-header'>
                  <span>Nội dung</span>
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

                <div className='story-metadata__actions-row'>
                  <div className='story-metadata__actions'>
                    <button
                      type='button'
                      className='story-metadata__action-btn'
                    >
                      Đọc từ đầu
                    </button>
                    <button
                      type='button'
                      className='story-metadata__action-btn ghost'
                    >
                      Đọc mới nhất
                    </button>
                  </div>
                  <div className='story-metadata__notify-wrap'>
                    <span className='story-metadata__notify-text'>
                      Bật thông báo:
                    </span>
                    <button
                      type='button'
                      className={`story-metadata__notify-switch ${notifyEnabled ? 'is-enabled' : ''}`}
                      onClick={handleToggleNotify}
                      disabled={notifyLoading}
                      aria-label='Bật/tắt thông báo'
                    >
                      <span className='story-metadata__notify-switch-knob'>
                        {notifyEnabled ? 'V' : 'X'}
                      </span>
                    </button>
                  </div>
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
                    <small>
                      {volume.chapterCount ?? chapters.length} chương
                    </small>
                  </span>
                  <span>{isOpen ? '▾' : '▸'}</span>
                </button>

                {isOpen && (
                  <div className='story-metadata__chapter-list'>
                    {chapters.length === 0 && (
                      <p className='story-metadata__muted'>
                        Chưa có chương nào.
                      </p>
                    )}
                    {chapters.map((chapter) => (
                      <Link
                        key={chapter.id || chapter.chapterId}
                        className='story-metadata__chapter-row'
                        to={`/stories/${storyId}/chapters/${chapter.id || chapter.chapterId}`}
                      >
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
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>

          <section
            className='story-metadata__comments-section'
            ref={commentsAnchorRef}
          >
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
            <div className='story-metadata__empty-review'>
              Chưa có bình luận nào.
            </div>
          )}

          <div className='story-metadata__comment-list'>
            {comments.map((comment) => {
              const rootId = String(comment.id);
              const replies = Array.isArray(comment.replies)
                ? comment.replies
                : [];
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
                          Xem {Math.min(2, replies.length - visibleReplyCount)}{' '}
                          trả lời
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

        {/* Muc dich: Cot phai hien thi thong tin bo sung va goi y truyen. Hieuson + 10h30 */}
        <aside className='story-metadata__sidebar'>
          <section className='story-metadata__sidebar-card'>
            <h3>Thông tin thêm</h3>
            {loadingSidebar ? (
              <p className='story-metadata__muted'>Đang tải thông tin...</p>
            ) : (
              <>
                <div className='story-metadata__sidebar-info'>
                  <div className='story-metadata__sidebar-info-row'>
                    <span>Chương mới nhất</span>
                    <strong>
                      {sidebar?.latestChapterTitle
                        ? `${sidebar.latestChapterTitle}`
                        : 'Chưa có chương'}
                    </strong>
                  </div>
                  <div className='story-metadata__sidebar-info-row'>
                    <span>Người theo dõi</span>
                    <strong>{followerText}</strong>
                  </div>
                  <div className='story-metadata__sidebar-info-row'>
                    <span>Xếp hạng tuần</span>
                    <strong>{weeklyRankText}</strong>
                  </div>
                  <div className='story-metadata__sidebar-info-row'>
                    <span>Đánh giá</span>
                    <strong>{sidebarRatingText}</strong>
                  </div>
                </div>
                <RatingStars rating={sidebar?.ratingAvg || 0} />
              </>
            )}
          </section>

          <section className='story-metadata__sidebar-card'>
            <h3>Truyện tương tự</h3>
            {similarStories.length === 0 && (
              <p className='story-metadata__muted'>Chưa có truyện tương tự.</p>
            )}
            <div className='story-metadata__sidebar-list'>
              {similarStories.map((item) => (
                <Link
                  key={`similar-${item.storyId}`}
                  className='story-metadata__sidebar-item'
                  to={`/stories/${item.storyId}/metadata`}
                >
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} />
                  ) : (
                    <div className='story-metadata__sidebar-item-cover-empty'>
                      No cover
                    </div>
                  )}
                  <div className='story-metadata__sidebar-item-body'>
                    <strong>{item.title}</strong>
                    <span>{item.authorPenName || 'Chưa có bút danh'}</span>
                    {renderSidebarItemRating(item)}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className='story-metadata__sidebar-card'>
            <h3>Cùng tác giả</h3>
            {sameAuthorStories.length === 0 && (
              <p className='story-metadata__muted'>Chưa có truyện cùng tác giả.</p>
            )}
            <div className='story-metadata__sidebar-list'>
              {sameAuthorStories.map((item) => (
                <Link
                  key={`author-${item.storyId}`}
                  className='story-metadata__sidebar-item'
                  to={`/stories/${item.storyId}/metadata`}
                >
                  {item.coverUrl ? (
                    <img src={item.coverUrl} alt={item.title} />
                  ) : (
                    <div className='story-metadata__sidebar-item-cover-empty'>
                      No cover
                    </div>
                  )}
                  <div className='story-metadata__sidebar-item-body'>
                    <strong>{item.title}</strong>
                    <span>{item.authorPenName || 'Chưa có bút danh'}</span>
                    <span>
                      {Number(item.chapterCount || 0).toLocaleString('vi-VN')}{' '}
                      chương
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default StoryMetadata;
