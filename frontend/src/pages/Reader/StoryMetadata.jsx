import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SkeletonBlock from '../../components/SkeletonBlock';
import StoryLibraryModal from '../../components/StoryLibraryModal';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/story-metadata.css';

const COMPLETION_LABELS = {
  ongoing: 'Đang tiến hành',
  completed: 'Hoàn thành',
  cancelled: 'Tạm ngưng',
};

const KIND_LABELS = {
  original: 'Truyện sáng tác',
  translated: 'Truyện dịch',
  ai: 'Truyện AI',
};

const STAR_VALUES = [1, 2, 3, 4, 5];
const COMMENTS_PAGE_SIZE = 8;
const REVIEW_PREVIEW_LENGTH = 150;

// Hieuson - thêm log ở console side, ngày 3/1/2026.
const logFlowStart = (flowName, payload) => {
  console.group(`[${flowName}]`);
  console.log('Step 1 - log entry');
  console.log(`${flowName} triggered`);
  console.log('Step 2 - log payload');
  console.log('payload', payload);
};

// Hieuson - thêm log ở console side, ngày 3/1/2026.
const logFlowSuccess = (response) => {
  console.log('Step 3 - log API response');
  console.log('response', response);
  console.groupEnd();
};

// Hieuson - thêm log ở console side, ngày 3/1/2026.
const logFlowError = (error) => {
  console.log('Step 3 - log API response');
  console.log('response', {
    error: error?.message || 'Unknown error',
    status: error?.response?.status || null,
    data: error?.response?.data || null,
  });
  console.groupEnd();
};

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

const getRankMedal = (rank) => {
  if (rank === 1) {
    return {
      icon: '🥇',
      label: 'Huy chương vàng',
      className: 'story-metadata__rank-medal--gold',
    };
  }
  if (rank === 2) {
    return {
      icon: '🥈',
      label: 'Huy chương bạc',
      className: 'story-metadata__rank-medal--silver',
    };
  }
  if (rank === 3) {
    return {
      icon: '🥉',
      label: 'Huy chương đồng',
      className: 'story-metadata__rank-medal--bronze',
    };
  }
  return null;
};

const toEpoch = (value) => {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
};

const toSafeNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
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

const MetaLine = ({
  icon,
  label,
  value,
  iconClass = '',
  valueClass = '',
  onValueClick,
}) => (
  <p className='story-metadata__meta-line'>
    <span className={`story-metadata__icon ${iconClass}`} aria-hidden='true'>
      {icon}
    </span>
    <span className='story-metadata__meta-label'>{label}</span>
    {typeof onValueClick === 'function' ? (
      <button
        type='button'
        className={`story-metadata__meta-value story-metadata__meta-value--button ${valueClass}`.trim()}
        onClick={onValueClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          textAlign: 'left',
          cursor: 'pointer',
        }}
      >
        {value}
      </button>
    ) : (
      <strong className={`story-metadata__meta-value ${valueClass}`.trim()}>
        {value}
      </strong>
    )}
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

  const [loadingStory, setLoadingStory] = useState(true);
  const [loadingVolumes, setLoadingVolumes] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingResumePoint, setLoadingResumePoint] = useState(false);

  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [librarySaved, setLibrarySaved] = useState(false);
  const [showLibraryModal, setShowLibraryModal] = useState(false);
  const [favoriteSaved, setFavoriteSaved] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [resumePoint, setResumePoint] = useState(null);

  const [commentContent, setCommentContent] = useState('');
  const [commentHasSpoiler, setCommentHasSpoiler] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyForId, setReplyForId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyHasSpoiler, setReplyHasSpoiler] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingHasSpoiler, setEditingHasSpoiler] = useState(false);
  const [submittingReportForId, setSubmittingReportForId] = useState(null);
  const [visibleRepliesByRoot, setVisibleRepliesByRoot] = useState({});
  const [revealedSpoilerComments, setRevealedSpoilerComments] = useState({});
  const [latestReviewRevealed, setLatestReviewRevealed] = useState(false);

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
      logFlowStart('METADATA_FETCH_STORY_FLOW', {
        endpoint: `/public/stories/${storyId}`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getPublicStory(storyId);
      logFlowSuccess(response);
      setStory(response || null);
    } catch (error) {
      logFlowError(error);
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
      logFlowStart('METADATA_FETCH_VOLUMES_FLOW', {
        endpoint: `/public/stories/${storyId}/volumes`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getPublicVolumes(storyId);
      logFlowSuccess(response);
      const list = Array.isArray(response) ? response : [];
      setVolumes(list);

      if (list.length > 0) {
        const firstVolumeId = String(list[0].id || list[0].volumeId || '');
        if (firstVolumeId) {
          setExpandedVolumes(new Set([firstVolumeId]));
        }
      }
    } catch (error) {
      logFlowError(error);
      console.error('getVolumes metadata error', error);
      notify('Không tải được danh sách tập', 'error');
    } finally {
      setLoadingVolumes(false);
    }
  }, [notify, storyId]);

  const fetchLatestReview = useCallback(async () => {
    try {
      setLoadingReviews(true);
      logFlowStart('METADATA_FETCH_LATEST_REVIEW_FLOW', {
        endpoint: `/public/stories/${storyId}/reviews`,
        method: 'GET',
        payload: { page: 0, size: 1 },
      });
      const response = await storyService.getStoryReviews(storyId, {
        page: 0,
        size: 1,
      });
      logFlowSuccess(response);
      const items = Array.isArray(response?.items) ? response.items : [];
      setLatestReview(items[0] || null);
    } catch (error) {
      logFlowError(error);
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
      logFlowStart('METADATA_FETCH_SIDEBAR_FLOW', {
        endpoint: `/public/stories/${storyId}/sidebar`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getPublicStorySidebar(storyId);
      logFlowSuccess(response);
      setSidebar(response || null);
    } catch (error) {
      logFlowError(error);
      console.error('getPublicStorySidebar error', error);
      setSidebar(null);
    } finally {
      setLoadingSidebar(false);
    }
  }, [storyId]);

  const fetchNotifyStatus = useCallback(async () => {
    try {
      logFlowStart('METADATA_FETCH_NOTIFY_STATUS_FLOW', {
        endpoint: `/stories/${storyId}/notify-status`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getNotifyStatus(storyId);
      logFlowSuccess(response);
      setNotifyEnabled(Boolean(response?.enabled));
    } catch (error) {
      logFlowError(error);
      setNotifyEnabled(false);
    }
  }, [storyId]);

  const fetchLibraryStatus = useCallback(async () => {
    try {
      logFlowStart('METADATA_FETCH_LIBRARY_STATUS_FLOW', {
        endpoint: `/stories/${storyId}/library-status`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getLibraryStatus(storyId);
      logFlowSuccess(response);
      setLibrarySaved(Boolean(response?.saved));
      setFavoriteSaved(Boolean(response?.favorite));
    } catch (error) {
      logFlowError(error);
      setLibrarySaved(false);
      setFavoriteSaved(false);
    }
  }, [storyId]);

  const fetchResumePoint = useCallback(async () => {
    if (!currentUser) {
      setResumePoint(null);
      return;
    }

    try {
      setLoadingResumePoint(true);
      logFlowStart('METADATA_FETCH_RESUME_POINT_FLOW', {
        endpoint: `/stories/${storyId}/resume-point`,
        method: 'GET',
        payload: { storyId },
      });
      const response = await storyService.getStoryResumePoint(storyId);
      logFlowSuccess(response);
      setResumePoint(response || null);
    } catch (error) {
      logFlowError(error);
      setResumePoint(null);
    } finally {
      setLoadingResumePoint(false);
    }
  }, [currentUser, storyId]);

  useEffect(() => {
    fetchStory();
    fetchVolumes();
    fetchLatestReview();
    fetchSidebar();
    fetchNotifyStatus();
    fetchLibraryStatus();
    fetchResumePoint();
  }, [
    fetchResumePoint,
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
        logFlowStart('METADATA_FETCH_COMMENTS_FLOW', {
          endpoint: `/public/stories/${storyId}/comments`,
          method: 'GET',
          payload: { page: pageIndex, size: COMMENTS_PAGE_SIZE, append },
        });
        const response = await storyService.getStoryComments(storyId, {
          page: pageIndex,
          size: COMMENTS_PAGE_SIZE,
        });
        logFlowSuccess(response);
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
        logFlowError(error);
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

  const chapterText = useMemo(() => {
    const totalChapters = (Array.isArray(volumes) ? volumes : []).reduce(
      (sum, volume) => {
        const chapters = Array.isArray(volume?.chapters) ? volume.chapters : null;
        if (chapters) {
          return sum + chapters.length;
        }
        return sum + Number(volume?.chapterCount || 0);
      },
      0,
    );
    return formatNumber(totalChapters);
  }, [volumes]);

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

  const allTimeRank = useMemo(
    () => Number(sidebar?.weeklyRank || 0),
    [sidebar],
  );

  const allTimeRankText = useMemo(() => {
    const rank = allTimeRank;
    if (!rank) return 'Chưa xếp hạng';
    return `#${rank}`;
  }, [allTimeRank]);

  const allTimeRankMedal = useMemo(() => getRankMedal(allTimeRank), [allTimeRank]);

  const similarStories = useMemo(
    () =>
      Array.isArray(sidebar?.similarStories) ? sidebar.similarStories : [],
    [sidebar],
  );

  const sameAuthorStories = useMemo(
    () =>
      Array.isArray(sidebar?.sameAuthorStories)
        ? sidebar.sameAuthorStories
        : [],
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

  const latestReviewContent = latestReview ? latestReview.content || '' : '';
  const latestReviewShort = truncateText(
    latestReviewContent,
    REVIEW_PREVIEW_LENGTH,
  );
  const latestReviewIsLong = latestReviewContent.length > REVIEW_PREVIEW_LENGTH;
  const latestReviewIsSpoiler = Boolean(latestReview?.spoiler);
  const latestReviewVisible =
    Boolean(latestReview) && (!latestReviewIsSpoiler || latestReviewRevealed);

  const readableChapterCandidates = useMemo(() => {
    const volumeList = Array.isArray(volumes) ? volumes : [];

    const sortedVolumes = [...volumeList].sort((a, b) => {
      const volumeSeqDiff =
        toSafeNumber(a?.sequenceIndex, Number.MAX_SAFE_INTEGER) -
        toSafeNumber(b?.sequenceIndex, Number.MAX_SAFE_INTEGER);
      if (volumeSeqDiff !== 0) return volumeSeqDiff;

      const createdDiff =
        toEpoch(a?.createdAt || a?.lastUpdateAt) -
        toEpoch(b?.createdAt || b?.lastUpdateAt);
      if (createdDiff !== 0) return createdDiff;

      return (
        toSafeNumber(a?.id ?? a?.volumeId, Number.MAX_SAFE_INTEGER) -
        toSafeNumber(b?.id ?? b?.volumeId, Number.MAX_SAFE_INTEGER)
      );
    });

    return sortedVolumes.flatMap((volume, volumeOrder) => {
      const chapterList = Array.isArray(volume?.chapters)
        ? volume.chapters
        : [];
      const sortedChapters = [...chapterList].sort((a, b) => {
        const chapterSeqDiff =
          toSafeNumber(a?.sequenceIndex, Number.MAX_SAFE_INTEGER) -
          toSafeNumber(b?.sequenceIndex, Number.MAX_SAFE_INTEGER);
        if (chapterSeqDiff !== 0) return chapterSeqDiff;

        const createdDiff =
          toEpoch(a?.createdAt || a?.lastUpdateAt) -
          toEpoch(b?.createdAt || b?.lastUpdateAt);
        if (createdDiff !== 0) return createdDiff;

        return (
          toSafeNumber(a?.id ?? a?.chapterId, Number.MAX_SAFE_INTEGER) -
          toSafeNumber(b?.id ?? b?.chapterId, Number.MAX_SAFE_INTEGER)
        );
      });

      return sortedChapters
        .map((chapter, chapterOrder) => ({
          chapterId: chapter?.id ?? chapter?.chapterId ?? null,
          chapterSeq: toSafeNumber(chapter?.sequenceIndex, chapterOrder),
          volumeSeq: toSafeNumber(volume?.sequenceIndex, volumeOrder),
          volumeOrder,
          chapterOrder,
          updatedAt: toEpoch(
            chapter?.lastUpdateAt ||
              chapter?.updatedAt ||
              chapter?.createdAt ||
              volume?.lastUpdateAt ||
              volume?.createdAt,
          ),
        }))
        .filter((item) => item.chapterId != null);
    });
  }, [volumes]);

  const firstReadableChapterId = useMemo(() => {
    if (readableChapterCandidates.length === 0) return null;
    const firstChapter = [...readableChapterCandidates].sort((a, b) => {
      if (a.volumeSeq !== b.volumeSeq) return a.volumeSeq - b.volumeSeq;
      if (a.volumeOrder !== b.volumeOrder) return a.volumeOrder - b.volumeOrder;
      if (a.chapterSeq !== b.chapterSeq) return a.chapterSeq - b.chapterSeq;
      return a.chapterOrder - b.chapterOrder;
    })[0];
    return firstChapter?.chapterId ?? null;
  }, [readableChapterCandidates]);

  const latestReadableChapterId = useMemo(() => {
    if (readableChapterCandidates.length === 0) return null;
    const latestChapter = [...readableChapterCandidates].sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
      if (a.volumeSeq !== b.volumeSeq) return b.volumeSeq - a.volumeSeq;
      if (a.volumeOrder !== b.volumeOrder) return b.volumeOrder - a.volumeOrder;
      if (a.chapterSeq !== b.chapterSeq) return b.chapterSeq - a.chapterSeq;
      return b.chapterOrder - a.chapterOrder;
    })[0];
    return latestChapter?.chapterId ?? firstReadableChapterId ?? null;
  }, [firstReadableChapterId, readableChapterCandidates]);

  // Muc dich: Render dung dang rating + sao cho cac card sidebar. Hieuson + 10h30
  const renderSidebarItemRating = (item) => {
    const ratingCount = Number(item?.ratingCount || 0);
    const ratingValue = Number(item?.ratingAvg || 0);
    if (!ratingCount || ratingValue <= 0) {
      return (
        <span className='story-metadata__sidebar-item-empty'>
          Chưa có đánh giá
        </span>
      );
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
      logFlowStart('METADATA_TOGGLE_NOTIFY_FLOW', {
        endpoint: `/stories/${storyId}/notify-status/toggle`,
        method: 'POST',
        payload: { storyId },
      });
      const response = await storyService.toggleNotifyStatus(storyId);
      logFlowSuccess(response);
      const enabled = Boolean(response?.enabled);
      setNotifyEnabled(enabled);
      notify(
        enabled
          ? 'Đã bật thông báo chapter mới'
          : 'Đã tắt thông báo chapter mới',
        'success',
      );
    } catch (error) {
      logFlowError(error);
      console.error('toggle notify error', error);
      notify('Không thể cập nhật thông báo', 'error');
    } finally {
      setNotifyLoading(false);
    }
  };

  const goToReaderChapter = useCallback(
    (targetChapterId, targetSegmentId = null) => {
      // Hieuson - thêm log ở console side, ngày 3/1/2026.
      console.group('[METADATA_GO_TO_READER_CHAPTER_FLOW]');
      console.log('Step 1 - log entry');
      console.log('METADATA_GO_TO_READER_CHAPTER_FLOW triggered');
      console.log('Step 2 - log payload');
      console.log('payload', {
        storyId,
        targetChapterId,
        endpoint: `/stories/${storyId}/chapters/${targetChapterId || ''}`,
        method: 'NAVIGATE',
      });
      if (!targetChapterId) {
        console.log('Step 3 - log API response');
        console.log('response', {
          success: false,
          reason: 'No readable chapter',
        });
        console.groupEnd();
        notify('Truyện chưa có chương để đọc', 'info');
        return;
      }
      console.log('Step 3 - log API response');
      console.log('response', {
        success: true,
        navigateTo: `/stories/${storyId}/chapters/${targetChapterId}${targetSegmentId ? `?segmentId=${targetSegmentId}` : ''}`,
      });
      console.groupEnd();
      navigate(
        `/stories/${storyId}/chapters/${targetChapterId}${targetSegmentId ? `?segmentId=${targetSegmentId}` : ''}`,
      );
    },
    [navigate, notify, storyId],
  );

  const handleReadFromStart = useCallback(() => {
    // Hieuson - thêm log ở console side, ngày 3/1/2026.
    console.group('[METADATA_READ_FROM_START_FLOW]');
    console.log('Step 1 - log entry');
    console.log('METADATA_READ_FROM_START_FLOW triggered');
    console.log('Step 2 - log payload');
    console.log('payload', { firstReadableChapterId });
    console.log('Step 3 - log API response');
    console.log('response', {
      targetChapterId: firstReadableChapterId || null,
    });
    console.groupEnd();
    goToReaderChapter(firstReadableChapterId);
  }, [firstReadableChapterId, goToReaderChapter]);

  const handleReadLatest = useCallback(() => {
    // Hieuson - thêm log ở console side, ngày 3/1/2026.
    console.group('[METADATA_READ_LATEST_FLOW]');
    console.log('Step 1 - log entry');
    console.log('METADATA_READ_LATEST_FLOW triggered');
    console.log('Step 2 - log payload');
    console.log('payload', { latestReadableChapterId });
    console.log('Step 3 - log API response');
    console.log('response', {
      targetChapterId: latestReadableChapterId || null,
    });
    console.groupEnd();
    goToReaderChapter(latestReadableChapterId);
  }, [goToReaderChapter, latestReadableChapterId]);

  const handleContinueReading = useCallback(() => {
    const chapterId = Number(resumePoint?.chapterId || 0);
    const segmentId = Number(resumePoint?.segmentId || 0);
    if (!chapterId || !segmentId) {
      notify('Chưa có vị trí đọc gần nhất để tiếp tục', 'info');
      return;
    }

    console.group('[METADATA_CONTINUE_READING_FLOW]');
    console.log('Step 1 - log entry');
    console.log('METADATA_CONTINUE_READING_FLOW triggered');
    console.log('Step 2 - log payload');
    console.log('payload', { chapterId, segmentId, storyId });
    console.log('Step 3 - log API response');
    console.log('response', {
      targetChapterId: chapterId,
      targetSegmentId: segmentId,
    });
    console.groupEnd();

    goToReaderChapter(chapterId, segmentId);
  }, [goToReaderChapter, notify, resumePoint, storyId]);

  const handleShareToFacebook = useCallback(() => {
    const shareUrl = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    const shareWindow = window.open('', '_blank');

    if (shareWindow) {
      shareWindow.opener = null;
      shareWindow.location.href = facebookShareUrl;
      return;
    }

    notify('Trình duyệt đang chặn tab mới. Hãy cho phép popup để chia sẻ.', 'info');
  }, [notify]);

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
        spoiler: commentHasSpoiler,
      });
      setCommentContent('');
      setCommentHasSpoiler(false);
      notify('Đã đăng bình luận', 'success');
      await fetchCommentsPage(0, false);
    } catch (error) {
      console.error('createStoryComment error', error);
      notify('Không thể đăng bình luận', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLibraryDialogSaved = useCallback(
    (response) => {
      const saved = Boolean(response?.saved);
      const favorite = Boolean(response?.favorite);
      const followerDelta = Number(saved) - Number(librarySaved);
      setLibrarySaved(saved);
      setFavoriteSaved(favorite);
      setSidebar((prev) => {
        if (!prev || followerDelta === 0) return prev;
        const currentFollowers = Number(prev.followerCount || 0);
        const nextFollowers = Math.max(0, currentFollowers + followerDelta);
        return {
          ...prev,
          followerCount: nextFollowers,
        };
      });
    },
    [librarySaved],
  );

  const handleToggleLibrary = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để lưu truyện vào thư viện', 'info');
      navigate('/login');
      return;
    }
    setShowLibraryModal(true);
  };

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để thêm truyện vào yêu thích', 'info');
      navigate('/login');
      return;
    }

    try {
      setFavoriteLoading(true);
      logFlowStart('METADATA_TOGGLE_FAVORITE_FLOW', {
        endpoint: `/stories/${storyId}/favorite/toggle`,
        method: 'POST',
        payload: { storyId },
      });
      const response = await storyService.toggleFavoriteStatus(storyId);
      logFlowSuccess(response);
      const saved = Boolean(response?.saved);
      const favorite = Boolean(response?.favorite);
      const followerDelta = Number(saved) - Number(librarySaved);

      setLibrarySaved(saved);
      setFavoriteSaved(favorite);
      setSidebar((prev) => {
        if (!prev || followerDelta === 0) return prev;
        const currentFollowers = Number(prev.followerCount || 0);
        return {
          ...prev,
          followerCount: Math.max(0, currentFollowers + followerDelta),
        };
      });

      notify(favorite ? 'Đã thêm vào yêu thích' : 'Đã bỏ khỏi yêu thích', 'success');
    } catch (error) {
      logFlowError(error);
      console.error('toggle favorite error', error);
      notify('Không thể cập nhật trạng thái yêu thích', 'error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleLoadMoreComments = async () => {
    if (!commentsHasMore || loadingComments) return;
    await fetchCommentsPage(commentsPage + 1, true);
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
    setReplyHasSpoiler(false);
  };

  const closeReplyForm = () => {
    setReplyForId(null);
    setReplyTarget(null);
    setReplyContent('');
    setReplyHasSpoiler(false);
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
        spoiler: replyHasSpoiler,
      });

      const createdReply = response;
      if (createdReply?.id) {
        const normalizedReply = normalizeCommentNode({
          ...createdReply,
          parentUserId:
            createdReply?.parentUserId ?? replyTarget?.parentUserId ?? null,
          parentUsername:
            createdReply?.parentUsername ?? replyTarget?.mentionUsername ?? null,
        });
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
    setEditingHasSpoiler(Boolean(comment?.spoiler));
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingContent('');
    setEditingHasSpoiler(false);
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
        spoiler: editingHasSpoiler,
      });
      setComments((prev) =>
        updateCommentInTree(prev, commentId, (node) => ({
          ...node,
          content: editingContent.trim(),
          spoiler: editingHasSpoiler,
        })),
      );
      notify('Đã cập nhật bình luận', 'success');
      handleCancelEdit();
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
    } catch (error) {
      console.error('delete comment error', error);
      notify('Không thể xóa bình luận', 'error');
    }
  };

  const handleReportComment = async (commentId, commentContent, commentUsername) => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để báo cáo bình luận', 'info');
      navigate('/login');
      return;
    }

    // Navigate to comment report page with comment details
    const encodedContent = encodeURIComponent(commentContent || '');
    const encodedUsername = encodeURIComponent(commentUsername || '');
    navigate(`/report-comment?commentId=${commentId}&storyId=${storyId}&content=${encodedContent}&username=${encodedUsername}`);
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
        <label className='story-metadata__spoiler-toggle'>
          <input
            type='checkbox'
            checked={replyHasSpoiler}
            onChange={(event) => setReplyHasSpoiler(event.target.checked)}
          />
          <span>Chứa spoil</span>
        </label>
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
    const mention = isReply && comment.parentUsername ? `@${comment.parentUsername} ` : '';
    const isHidden = Boolean(comment?.hidden);
    const isSpoiler = Boolean(comment?.spoiler);
    const spoilerRevealed = Boolean(
      revealedSpoilerComments[String(comment.id)],
    );

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
            {/*               //link đến portfolio */}
            <strong
              className='cursor-pointer hover:text-blue-600 transition-colors'
              onClick={() => navigate(`/portfolio/${comment.userId}`)}
            >
              {comment.username}
            </strong>
            <small>{formatRelativeTime(comment.createdAt)}</small>
          </div>

          {isEditing ? (
            <div className='story-metadata__edit-form'>
              <textarea
                value={editingContent}
                onChange={(event) => setEditingContent(event.target.value)}
                maxLength={4000}
              />
              <label className='story-metadata__spoiler-toggle'>
                <input
                  type='checkbox'
                  checked={editingHasSpoiler}
                  onChange={(event) =>
                    setEditingHasSpoiler(event.target.checked)
                  }
                />
                <span>Chứa spoil</span>
              </label>
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
            <>
              {isHidden ? (
                <p className='story-metadata__content-mask story-metadata__content-mask--hidden'>
                  Bình luận đã bị ẩn do vi phạm tiêu chuẩn cộng đồng.
                </p>
              ) : isSpoiler && !spoilerRevealed ? (
                <div className='story-metadata__content-mask-wrap'>
                  <p className='story-metadata__content-mask'>
                    Bình luận này có chứa spoiler.
                  </p>
                  <button
                    type='button'
                    className='story-metadata__reveal-btn'
                    onClick={() =>
                      setRevealedSpoilerComments((prev) => ({
                        ...prev,
                        [String(comment.id)]: true,
                      }))
                    }
                  >
                    Hiện bình luận
                  </button>
                </div>
              ) : (
                <p>
                  {mention && (
                    <span className='story-metadata__mention'>{mention}</span>
                  )}
                  {comment.content}
                </p>
              )}
            </>
          )}

          {!isEditing && !isHidden && (
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
              <button
                type='button'
                className='story-metadata__inline-action'
                onClick={() => handleReportComment(comment.id, comment.content, comment.username)}
              >
                Báo cáo
              </button>
            </div>
          )}

          {renderReplyForm(comment.id)}
        </div>
      </article>
    );
  };

  const renderSidebarSkeletonItems = (count = 3) =>
    Array.from({ length: count }, (_, index) => (
      <div
        key={`sidebar-skeleton-${index}`}
        className='story-metadata__sidebar-item story-metadata__sidebar-item--skeleton'
        aria-hidden='true'
      >
        <SkeletonBlock className='story-metadata__sidebar-item-cover-skeleton' />
        <div className='story-metadata__sidebar-item-body story-metadata__sidebar-item-body--skeleton'>
          <SkeletonBlock className='story-metadata__sidebar-line-skeleton story-metadata__sidebar-line-skeleton--title' />
          <SkeletonBlock className='story-metadata__sidebar-line-skeleton' />
          <SkeletonBlock className='story-metadata__sidebar-line-skeleton story-metadata__sidebar-line-skeleton--short' />
        </div>
      </div>
    ));

  const renderCommentSkeletons = (count = 3) =>
    Array.from({ length: count }, (_, index) => (
      <article
        key={`comment-skeleton-${index}`}
        className='story-metadata__comment story-metadata__comment--skeleton'
        aria-hidden='true'
      >
        <SkeletonBlock className='story-metadata__comment-avatar-skeleton' />
        <div className='story-metadata__comment-body'>
          <div className='story-metadata__comment-head story-metadata__comment-head--skeleton'>
            <SkeletonBlock className='story-metadata__comment-line-skeleton story-metadata__comment-line-skeleton--name' />
            <SkeletonBlock className='story-metadata__comment-line-skeleton story-metadata__comment-line-skeleton--time' />
          </div>
          <SkeletonBlock className='story-metadata__comment-line-skeleton story-metadata__comment-line-skeleton--content' />
          <SkeletonBlock className='story-metadata__comment-line-skeleton story-metadata__comment-line-skeleton--content short' />
        </div>
      </article>
    ));

  const renderVolumeSkeletons = (count = 3) =>
    Array.from({ length: count }, (_, index) => (
      <div
        key={`volume-skeleton-${index}`}
        className='story-metadata__volume story-metadata__volume--skeleton'
        aria-hidden='true'
      >
        <div className='story-metadata__volume-head'>
          <span className='story-metadata__volume-head-main'>
            <SkeletonBlock className='story-metadata__volume-cover-skeleton' />
            <span className='story-metadata__volume-head-text story-metadata__volume-head-text--skeleton'>
              <SkeletonBlock className='story-metadata__volume-line-skeleton story-metadata__volume-line-skeleton--title' />
              <SkeletonBlock className='story-metadata__volume-line-skeleton story-metadata__volume-line-skeleton--meta' />
            </span>
          </span>
          <SkeletonBlock className='story-metadata__volume-toggle-skeleton' />
        </div>
      </div>
    ));

  return (
    <div className='story-metadata'>
      <div className='story-metadata__layout'>
        <div className='story-metadata__main'>
          <section className='story-metadata__frame'>
            {loadingStory && !story && (
              <div className='story-metadata__card story-metadata__card--skeleton' aria-hidden='true'>
                <aside className='story-metadata__cover-col'>
                  <SkeletonBlock className='story-metadata__cover-skeleton' />
                  <SkeletonBlock className='story-metadata__side-btn-skeleton' />
                  <SkeletonBlock className='story-metadata__side-btn-skeleton' />
                  <SkeletonBlock className='story-metadata__side-btn-skeleton story-metadata__side-btn-skeleton--ghost' />
                </aside>

                <article className='story-metadata__content'>
                  <SkeletonBlock className='story-metadata__title-skeleton' />
                  <div className='story-metadata__meta story-metadata__meta--skeleton'>
                    {Array.from({ length: 4 }, (_, index) => (
                      <div
                        key={`meta-skeleton-${index}`}
                        className='story-metadata__meta-line story-metadata__meta-line--skeleton'
                      >
                        <SkeletonBlock className='story-metadata__meta-icon-skeleton' />
                        <SkeletonBlock className='story-metadata__meta-label-skeleton' />
                        <SkeletonBlock className='story-metadata__meta-value-skeleton' />
                      </div>
                    ))}
                  </div>
                  <div className='story-metadata__tags story-metadata__tags--skeleton'>
                    <SkeletonBlock className='story-metadata__tag-skeleton' />
                    <SkeletonBlock className='story-metadata__tag-skeleton' />
                    <SkeletonBlock className='story-metadata__tag-skeleton story-metadata__tag-skeleton--wide' />
                  </div>
                  <div className='story-metadata__rows'>
                    {Array.from({ length: 3 }, (_, index) => (
                      <div
                        key={`row-skeleton-${index}`}
                        className='story-metadata__meta-line story-metadata__meta-line--skeleton'
                      >
                        <SkeletonBlock className='story-metadata__meta-icon-skeleton' />
                        <SkeletonBlock className='story-metadata__meta-label-skeleton' />
                        <SkeletonBlock className='story-metadata__meta-value-skeleton story-metadata__meta-value-skeleton--short' />
                      </div>
                    ))}
                  </div>
                  <div className='story-metadata__summary-header'>
                    <span>Nội dung</span>
                  </div>
                  <div className='story-metadata__summary'>
                    <div className='story-metadata__summary-text story-metadata__summary-text--skeleton'>
                      <SkeletonBlock className='story-metadata__summary-line-skeleton' />
                      <SkeletonBlock className='story-metadata__summary-line-skeleton' />
                      <SkeletonBlock className='story-metadata__summary-line-skeleton story-metadata__summary-line-skeleton--short' />
                    </div>
                  </div>
                  <div className='story-metadata__actions-row story-metadata__actions-row--skeleton'>
                    <div className='story-metadata__actions'>
                      <SkeletonBlock className='story-metadata__action-btn-skeleton' />
                      <SkeletonBlock className='story-metadata__action-btn-skeleton' />
                      <SkeletonBlock className='story-metadata__action-btn-skeleton story-metadata__action-btn-skeleton--ghost' />
                    </div>
                    <SkeletonBlock className='story-metadata__notify-skeleton' />
                  </div>
                </article>
              </div>
            )}

            {story && (
              <>
                <button
                  type='button'
                  className={`story-metadata__favorite-toggle ${favoriteSaved ? 'is-active' : ''}`}
                  onClick={handleToggleFavorite}
                  disabled={favoriteLoading}
                  aria-label={favoriteSaved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                  title={favoriteSaved ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
                >
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M12 21.35 10.55 20C5.4 15.24 2 12.09 2 8.25 2 5.1 4.42 2.75 7.5 2.75c1.74 0 3.41.81 4.5 2.09a5.9 5.9 0 0 1 4.5-2.09C19.58 2.75 22 5.1 22 8.25c0 3.84-3.4 6.99-8.55 11.76L12 21.35z' />
                  </svg>
                </button>
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
                  >
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M6 3h12a2 2 0 0 1 2 2v16l-8-3.8L4 21V5a2 2 0 0 1 2-2z' />
                    </svg>
                    <span>
                      {librarySaved ? 'Đã lưu' : 'Lưu vào thư viện'}
                    </span>
                  </button>
                  <button
                    type='button'
                    className='story-metadata__side-btn share'
                    onClick={handleShareToFacebook}
                  >
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M14 9h3V5h-3c-2.76 0-5 2.24-5 5v2H6v4h3v5h4v-5h3.11l.89-4H13v-2c0-.55.45-1 1-1z' />
                    </svg>
                    <span>Chia sẻ</span>
                  </button>
                  <button
                    type='button'
                    className='story-metadata__side-btn ghost'
                    onClick={() => navigate(`/report-story?storyId=${storyId}`)}
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
                        onValueClick={
                          story?.authorId
                            ? () => navigate(`/portfolio/${story.authorId}`)
                            : undefined
                        }
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
                        onValueClick={
                          story?.authorId
                            ? () => navigate(`/portfolio/${story.authorId}`)
                            : undefined
                        }
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
                    <MetaLine
                      icon={
                        <svg viewBox='0 0 24 24'>
                          <path d='M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5a2.5 2.5 0 0 0-2.5-2.5h-11A2.5 2.5 0 0 0 4 18.5zm2.5-.5a1 1 0 0 0-1 1v10.2c.32-.14.66-.2 1-.2h10V5zM18 17.2V19a.5.5 0 0 0 1 0v-3.26a2.48 2.48 0 0 0-1 .46z' />
                        </svg>
                      }
                      iconClass='story-metadata__icon--chapters'
                      label='Số chương:'
                      value={chapterText}
                    />
                  </div>

                  <div className='story-metadata__summary-header'>
                    <span>Nội dung</span>
                  </div>

                  <div className='story-metadata__summary'>
                    <p className='story-metadata__summary-text'>
                      {summaryText || 'Chưa có tóm tắt.'}
                    </p>
                  </div>

                  <div className='story-metadata__actions-row'>
                    <div className='story-metadata__actions'>
                      {resumePoint?.chapterId && resumePoint?.segmentId && (
                        <button
                          type='button'
                          className='story-metadata__action-btn continue'
                          onClick={handleContinueReading}
                          disabled={loadingResumePoint}
                        >
                          Đọc tiếp
                        </button>
                      )}
                      <button
                        type='button'
                        className='story-metadata__action-btn'
                        onClick={handleReadFromStart}
                        disabled={loadingVolumes || !firstReadableChapterId}
                      >
                        Đọc từ đầu
                      </button>
                      <button
                        type='button'
                        className='story-metadata__action-btn ghost'
                        onClick={handleReadLatest}
                        disabled={loadingVolumes || !latestReadableChapterId}
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
                        <span className='story-metadata__notify-switch-knob' />
                      </button>
                    </div>
                  </div>
                </article>
                </div>
              </>
            )}
          </section>

          <section className='story-metadata__review-preview'>
            <div className='story-metadata__review-preview-head'>
              <h3>Reviews mới</h3>
              <Link to={`/stories/${storyId}/reviews`}>Xem trang đánh giá</Link>
            </div>

            {loadingReviews && !latestReview && (
              <article
                className='story-metadata__latest-review-card story-metadata__latest-review-card--skeleton'
                aria-hidden='true'
              >
                <div className='story-metadata__latest-review-head'>
                  <SkeletonBlock className='story-metadata__review-name-skeleton' />
                  <SkeletonBlock className='story-metadata__review-stars-skeleton' />
                </div>
                <SkeletonBlock className='story-metadata__review-line-skeleton' />
                <SkeletonBlock className='story-metadata__review-line-skeleton' />
                <SkeletonBlock className='story-metadata__review-line-skeleton story-metadata__review-line-skeleton--short' />
                <div className='story-metadata__latest-review-footer'>
                  <SkeletonBlock className='story-metadata__review-footer-skeleton' />
                  <SkeletonBlock className='story-metadata__review-footer-skeleton story-metadata__review-footer-skeleton--link' />
                </div>
              </article>
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
                  <strong
                    className='cursor-pointer hover:text-blue-600 transition-colors'
                    onClick={() => navigate(`/portfolio/${latestReview.userId}`)}
                  >
                    {latestReview.username || 'Ẩn danh'}
                  </strong>
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
                {latestReviewVisible ? (
                  <p>{latestReviewShort}</p>
                ) : (
                  <div className='story-metadata__content-mask-wrap'>
                    <p className='story-metadata__content-mask'>
                      Đánh giá này có chứa spoiler.
                    </p>
                    <button
                      type='button'
                      className='story-metadata__reveal-btn'
                      onClick={() => setLatestReviewRevealed(true)}
                    >
                      Hiện đánh giá
                    </button>
                  </div>
                )}
                <div className='story-metadata__latest-review-footer'>
                  <span>
                    {formatRelativeTime(
                      latestReview.updatedAt || latestReview.createdAt,
                    )}
                  </span>
                  <Link to={`/stories/${storyId}/reviews`}>
                    {latestReviewVisible && latestReviewIsLong
                      ? 'Xem thêm'
                      : 'Xem tất cả'}
                  </Link>
                </div>
              </article>
            )}
          </section>

          <section className='story-metadata__volume-section'>
            <h2>Danh sách Tập & Chương</h2>
            {loadingVolumes && volumes.length === 0 && renderVolumeSkeletons()}
            {!loadingVolumes && volumes.length === 0 && (
              <div className='story-metadata__empty'>Chưa có volume nào.</div>
            )}

            {volumes.map((volume) => {
              const id = String(volume.id || volume.volumeId);
              const isOpen = expandedVolumes.has(id);
              const volumeCoverUrl = String(volume?.coverUrl || '').trim();
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
                    <span className='story-metadata__volume-head-main'>
                      {volumeCoverUrl ? (
                        <img
                          className='story-metadata__volume-cover'
                          src={volumeCoverUrl}
                          alt={
                            volume.title || `Tap ${volume.sequenceIndex || ''}`
                          }
                        />
                      ) : (
                        <span className='story-metadata__volume-cover-empty'>
                          No cover
                        </span>
                      )}
                      <span className='story-metadata__volume-head-text'>
                        {volume.title || `Tập ${volume.sequenceIndex || ''}`}
                        <small>
                          {volume.chapterCount ?? chapters.length} chương
                        </small>
                      </span>
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
                              ? new Date(
                                  chapter.lastUpdateAt,
                                ).toLocaleDateString('vi-VN')
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
            <label className='story-metadata__spoiler-toggle'>
              <input
                type='checkbox'
                checked={commentHasSpoiler}
                onChange={(event) => setCommentHasSpoiler(event.target.checked)}
              />
              <span>Chứa spoil</span>
            </label>

              <div className='story-metadata__comment-form-footer'>
                <span>{commentContent.trim().length} ký tự</span>
                <button type='submit' disabled={submittingComment}>
                  {submittingComment ? 'Đang đăng...' : 'Đăng bình luận'}
                </button>
              </div>
            </form>

            {loadingComments && comments.length === 0 && (
              <div className='story-metadata__comment-list'>
                {renderCommentSkeletons()}
              </div>
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
                            Xem{' '}
                            {Math.min(2, replies.length - visibleReplyCount)}{' '}
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
            {loadingSidebar && !sidebar ? (
              <div className='story-metadata__sidebar-info story-metadata__sidebar-info--skeleton' aria-hidden='true'>
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={`sidebar-info-skeleton-${index}`}
                    className='story-metadata__sidebar-info-row'
                  >
                    <SkeletonBlock className='story-metadata__sidebar-line-skeleton story-metadata__sidebar-line-skeleton--label' />
                    <SkeletonBlock className='story-metadata__sidebar-line-skeleton story-metadata__sidebar-line-skeleton--value' />
                  </div>
                ))}
                <SkeletonBlock className='story-metadata__sidebar-rating-skeleton' />
              </div>
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
                    <span>Xếp hạng toàn thời gian</span>
                    <strong className='story-metadata__rank-value'>
                      {allTimeRankMedal && (
                        <span
                          className={`story-metadata__rank-medal ${allTimeRankMedal.className}`}
                          aria-label={allTimeRankMedal.label}
                          title={allTimeRankMedal.label}
                        >
                          {allTimeRankMedal.icon}
                        </span>
                      )}
                      <span>{allTimeRankText}</span>
                    </strong>
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
            {loadingSidebar && !sidebar && (
              <div className='story-metadata__sidebar-list'>
                {renderSidebarSkeletonItems()}
              </div>
            )}
            {!loadingSidebar && similarStories.length === 0 && (
              <p className='story-metadata__muted'>Chưa có truyện tương tự.</p>
            )}
            <div className='story-metadata__sidebar-list'>
              {!loadingSidebar &&
                similarStories.map((item) => (
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
            {loadingSidebar && !sidebar && (
              <div className='story-metadata__sidebar-list'>
                {renderSidebarSkeletonItems()}
              </div>
            )}
            {!loadingSidebar && sameAuthorStories.length === 0 && (
              <p className='story-metadata__muted'>
                Chưa có truyện cùng tác giả.
              </p>
            )}
            <div className='story-metadata__sidebar-list'>
              {!loadingSidebar &&
                sameAuthorStories.map((item) => (
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
      <StoryLibraryModal
        isOpen={showLibraryModal}
        story={story}
        onClose={() => setShowLibraryModal(false)}
        onSaved={handleLibraryDialogSaved}
        notify={notify}
      />
    </div>
  );
};

export default StoryMetadata;
