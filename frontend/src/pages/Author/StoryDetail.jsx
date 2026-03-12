import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import Button from '../../components/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import CreateVolume from './CreateVolume';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/story-detail.css';

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

const STORY_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
};

const STORY_APPROVAL_LABELS = {
  pending: 'Đang chờ duyệt',
  approved: 'duyệt thành công, giờ có thể đăng công khai',
  rejected: 'Bị từ chối duyệt',
};

const CHAPTER_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  archived: 'Lưu trữ',
};

const CHAPTER_APPROVAL_LABELS = {
  pending: 'Đang chờ duyệt',
  approved: 'duyệt thành công, giờ có thể đăng công khai',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatRelativeTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} ngày`;
};

const formatDateTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  return date.toLocaleString('vi-VN');
};

const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const StoryDetail = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useNotify();
  const [story, setStory] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [showCreateVolume, setShowCreateVolume] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [editingVolumeId, setEditingVolumeId] = useState(null);
  const [editingVolumeTitle, setEditingVolumeTitle] = useState('');
  const [savingVolumeId, setSavingVolumeId] = useState(null);
  const [uploadingVolumeCoverId, setUploadingVolumeCoverId] = useState(null);
  const [submittingApprovalStory, setSubmittingApprovalStory] = useState(false);
  const [submittingApprovalChapterId, setSubmittingApprovalChapterId] =
    useState(null);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'volumes' ? 'volumes' : 'info',
  );
  const tabsRef = React.useRef(null);
  const infoTabRef = React.useRef(null);
  const volumesTabRef = React.useRef(null);
  const volumeCoverInputRefs = React.useRef({});
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const fetchStory = useCallback(async () => {
    try {
      setLoadingStory(true);
      const response = await storyService.getStory(storyId);
      setStory(response || null);
    } catch (error) {
      console.error('getStory error', error);
      notify('Không tải được thông tin truyện', 'error');
    } finally {
      setLoadingStory(false);
    }
  }, [notify, storyId]);

  const fetchVolumes = useCallback(async () => {
    try {
      setLoadingVolumes(true);
      const response = await storyService.getVolumes(storyId);
      const list = Array.isArray(response) ? response : [];
      setVolumes(list);
    } catch (error) {
      console.error('getVolumes error', error);
      notify('Không tải được danh sách volume', 'error');
    } finally {
      setLoadingVolumes(false);
    }
  }, [notify, storyId]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'volumes') {
      setActiveTab('volumes');
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'volumes') {
      fetchVolumes();
    }
  }, [activeTab, fetchVolumes]);

  useEffect(() => {
    const volumeId = searchParams.get('volumeId');
    if (!volumeId) return;
    setExpandedVolumes((prev) => {
      const next = new Set(prev);
      next.add(String(volumeId));
      return next;
    });
  }, [searchParams]);

  const categoryTag = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags[0] || null;
  }, [story]);

  const extraTags = useMemo(() => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    return tags.slice(1);
  }, [story]);

  const completionLabel = useMemo(() => {
    const key = (story?.completionStatus || '').toLowerCase();
    return COMPLETION_LABELS[key] || 'Đang tiến hành';
  }, [story]);

  const storyStatusLabel = useMemo(() => {
    const key = (story?.status || '').toLowerCase();
    return STORY_STATUS_LABELS[key] || 'Nháp';
  }, [story]);

  const kindLabel = useMemo(() => {
    const key = (story?.kind || '').toLowerCase();
    return KIND_LABELS[key] || 'Truyện sáng tác';
  }, [story]);

  const isTranslated = useMemo(
    () => String(story?.kind || '').toLowerCase() === 'translated',
    [story],
  );

  const authorLabel = isTranslated ? 'Tác giả gốc' : 'Tác giả';
  const authorValue = isTranslated
    ? story?.originalAuthorName || 'Chưa rõ'
    : story?.authorPenName || 'Chưa có bút danh';

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

  const savedText = useMemo(() => {
    const saved = Number(story?.savedCount || 0);
    if (!saved) return 'Chưa có lượt lưu';
    return formatNumber(saved);
  }, [story]);

  const wordText = useMemo(() => {
    return formatNumber(Number(story?.wordCount || 0));
  }, [story]);

  const summaryText = useMemo(
    () => htmlToText(story?.summaryHtml || story?.summary || ''),
    [story],
  );

  const canExpandSummary = summaryText.length > 260;
  const storyApprovalStatusKey = String(story?.approvalStatus || '').toLowerCase();
  const hasStoryApprovalStatusValue =
    story?.approvalStatus != null && String(story.approvalStatus).trim() !== '';
  const storyApprovalStatusLabel =
    STORY_APPROVAL_LABELS[storyApprovalStatusKey] ||
    (hasStoryApprovalStatusValue ? String(story.approvalStatus) : '');
  const storyApprovalBadgeClass = STORY_APPROVAL_LABELS[storyApprovalStatusKey]
    ? `story-detail__approval-badge--${storyApprovalStatusKey}`
    : 'story-detail__approval-badge--pending';
  const showStoryApprovalStatus =
    Boolean(storyApprovalStatusLabel) &&
    !(
      storyApprovalStatusKey === 'approved' &&
      String(story?.status || '').toLowerCase() === 'published'
    );
  const canSubmitStoryApproval =
    !hasStoryApprovalStatusValue &&
    String(story?.status || '').toLowerCase() === 'draft';

  const toggleVolume = (volumeId) => {
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

  const startEditVolume = (volume) => {
    const id = String(volume.id || volume.volumeId);
    setEditingVolumeId(id);
    setEditingVolumeTitle(volume.title || '');
  };

  const cancelEditVolume = () => {
    setEditingVolumeId(null);
    setEditingVolumeTitle('');
  };

  const saveEditVolume = async (volumeId) => {
    const nextTitle = editingVolumeTitle.trim();
    if (!nextTitle) {
      notify('Tên tập không được để trống', 'error');
      return;
    }

    try {
      setSavingVolumeId(String(volumeId));
      const response = await storyService.updateVolume(storyId, volumeId, {
        title: nextTitle,
      });

      const normalizedId = String(volumeId);
      const returnedTitle = response?.title || nextTitle;
      setVolumes((prev) =>
        prev.map((item) => {
          const itemId = String(item.id || item.volumeId);
          if (itemId !== normalizedId) return item;
          return { ...item, title: returnedTitle };
        }),
      );
      cancelEditVolume();
      notify('Đã cập nhật tên tập', 'success');
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Không thể cập nhật tên tập';
      notify(message, 'error');
    } finally {
      setSavingVolumeId(null);
    }
  };

  const openVolumeCoverPicker = (volumeId) => {
    const input = volumeCoverInputRefs.current[String(volumeId)];
    input?.click();
  };

  const handleVolumeCoverFileChange = async (volumeId, event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!String(file.type || '').startsWith('image/')) {
      notify('Vui lòng chọn file ảnh hợp lệ', 'error');
      event.target.value = '';
      return;
    }

    try {
      setUploadingVolumeCoverId(String(volumeId));
      const formData = new FormData();
      formData.append('cover', file);

      const response = await storyService.updateVolumeCover(
        storyId,
        volumeId,
        formData,
      );

      const normalizedId = String(volumeId);
      const returnedCoverUrl = String(response?.coverUrl || '').trim();
      setVolumes((prev) =>
        prev.map((item) => {
          const itemId = String(item.id || item.volumeId);
          if (itemId !== normalizedId) return item;
          return { ...item, coverUrl: returnedCoverUrl || item.coverUrl || '' };
        }),
      );

      notify('Đã cập nhật cover tập', 'success');
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Không thể cập nhật cover tập';
      notify(message, 'error');
    } finally {
      setUploadingVolumeCoverId(null);
      event.target.value = '';
    }
  };

  const handleSubmitChapterApproval = async (volumeId, chapterId) => {
    try {
      setSubmittingApprovalChapterId(String(chapterId));
      const response = await storyService.submitChapterApproval(chapterId);
      const nextApprovalStatus = String(
        response?.approvalStatus || 'pending',
      ).toLowerCase();

      setVolumes((prev) =>
        prev.map((volume) => {
          const currentVolumeId = String(volume.id || volume.volumeId);
          if (currentVolumeId !== String(volumeId)) {
            return volume;
          }
          const chapterList = Array.isArray(volume.chapters)
            ? volume.chapters
            : [];
          return {
            ...volume,
            chapters: chapterList.map((chapter) =>
              String(chapter.id) === String(chapterId)
                ? { ...chapter, approvalStatus: nextApprovalStatus }
                : chapter,
            ),
          };
        }),
      );

      notify('chương của bạn đã được gửi đi duyệt', 'success');
    } catch (error) {
      console.error('submitChapterApproval error', error);
      const message =
        typeof error?.message === 'string' && error.message.trim()
          ? error.message.trim()
          : 'gửi duyệt thất bại';
      notify(message, 'error');
    } finally {
      setSubmittingApprovalChapterId(null);
    }
  };

  const handleSubmitStoryApproval = async () => {
    try {
      setSubmittingApprovalStory(true);
      const response = await storyService.submitStoryApproval(storyId);
      const nextApprovalStatus = String(
        response?.approvalStatus || 'pending',
      ).toLowerCase();

      setStory((prev) =>
        prev ? { ...prev, approvalStatus: nextApprovalStatus } : prev,
      );
      notify('Gửi duyệt truyện thành công', 'success');
    } catch (error) {
      console.error('submitStoryApproval error', error);
      const message =
        error?.response?.data?.message ||
        (typeof error?.message === 'string' && error.message.trim()
          ? error.message.trim()
          : 'gửi duyệt truyện thất bại');
      notify(message, 'error');
    } finally {
      setSubmittingApprovalStory(false);
    }
  };

  const handleViewMetadata = () => {
    const isPublished =
      String(story?.status || '').toLowerCase() === 'published';
    if (!isPublished) {
      notify('Truyện chưa publish', 'info');
      return;
    }
    navigate(`/stories/${storyId}/metadata`);
  };

  const updateTabIndicator = useCallback(() => {
    const activeButton =
      activeTab === 'volumes' ? volumesTabRef.current : infoTabRef.current;
    if (!tabsRef.current || !activeButton) return;
    setTabIndicator({
      left: activeButton.offsetLeft,
      width: activeButton.offsetWidth,
    });
  }, [activeTab]);

  React.useLayoutEffect(() => {
    updateTabIndicator();
  }, [updateTabIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateTabIndicator);
    return () => {
      window.removeEventListener('resize', updateTabIndicator);
    };
  }, [updateTabIndicator]);

  return (
    <div className='story-detail'>
      <div className='story-detail__top'>
        <h2>Chi tiết truyện</h2>
        {activeTab === 'volumes' && (
          <Button type='button' onClick={() => setShowCreateVolume((s) => !s)}>
            {showCreateVolume ? 'Đóng' : 'Tạo tập mới'}
          </Button>
        )}
      </div>

      <div className='story-detail__tabs' ref={tabsRef}>
        <button
          ref={infoTabRef}
          type='button'
          className={`story-detail__tab ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Thông tin
        </button>
        <button
          ref={volumesTabRef}
          type='button'
          className={`story-detail__tab ${activeTab === 'volumes' ? 'active' : ''}`}
          onClick={() => setActiveTab('volumes')}
        >
          Danh sách Tập & Chương
        </button>
        <span
          className='story-detail__tab-indicator'
          style={{
            transform: `translateX(${tabIndicator.left}px)`,
            width: `${tabIndicator.width}px`,
          }}
        />
      </div>
      {activeTab === 'info' && (
        <div className='story-detail__info'>
          {loadingStory && (
            <div className='story-detail__loading'>
              <LoadingSpinner size={74} label='Đang tải dữ liệu...' />
            </div>
          )}
          {story && (
            <div className='story-detail__card story-detail__frame'>
              <div className='story-detail__cover'>
                {story.coverUrl ? (
                  <img src={story.coverUrl} alt={story.title} />
                ) : (
                  <div className='story-detail__cover-placeholder'>
                    Chưa có ảnh bìa
                  </div>
                )}
                <Button
                  type='button'
                  className='story-detail__edit'
                  onClick={() => navigate(`/author/stories/${storyId}/edit`)}
                >
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M4 17.25V20h2.75l8.1-8.1-2.75-2.75-8.1 8.1zm15.71-9.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.84 1.84 2.75 2.75 1.99-1.67z' />
                  </svg>
                  Sửa truyện
                </Button>
                <Button
                  type='button'
                  className='story-detail__view'
                  onClick={handleViewMetadata}
                >
                  <svg viewBox='0 0 24 24' aria-hidden='true'>
                    <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                  </svg>
                  Xem truyện
                </Button>
              </div>

              <div className='story-detail__content'>
                <h3>{story.title}</h3>

                <div className='story-detail__meta-list'>
                  <div className='story-detail__meta-item'>
                    <span className='story-detail__meta-icon story-detail__meta-icon--author'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
                      </svg>
                    </span>
                    <span className='story-detail__meta-label'>
                      {authorLabel}:
                    </span>
                    <strong>{authorValue}</strong>
                  </div>
                  {isTranslated && (
                    <div className='story-detail__meta-item'>
                      <span className='story-detail__meta-icon story-detail__meta-icon--translator'>
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                          <path d='M5 4h7v2H9.92a9.94 9.94 0 0 1-1.58 3c.76.9 1.67 1.69 2.66 2.3l-1 1.73a12.2 12.2 0 0 1-2.73-2.32A11.8 11.8 0 0 1 4.5 13L3 11.5A9.8 9.8 0 0 0 6.1 9 8.09 8.09 0 0 0 7.6 6H5zm10 2h2l4 14h-2l-1-3h-4l-1 3h-2zm.5 3.5-1.5 4.5h3z' />
                        </svg>
                      </span>
                      <span className='story-detail__meta-label'>
                        Người dịch:
                      </span>
                      <strong>
                        {story.translatorPenName ||
                          story.authorPenName ||
                          'Chưa có bút danh'}
                      </strong>
                    </div>
                  )}
                  <div className='story-detail__meta-item'>
                    <span className='story-detail__meta-icon story-detail__meta-icon--kind'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3h7v4h-7z' />
                      </svg>
                    </span>
                    <span className='story-detail__meta-label'>
                      Loại truyện:
                    </span>
                    <strong>{kindLabel}</strong>
                  </div>
                  <div className='story-detail__meta-item'>
                    <span className='story-detail__meta-icon story-detail__meta-icon--category'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' />
                      </svg>
                    </span>
                    <span className='story-detail__meta-label'>Danh mục:</span>
                    <strong className='story-detail__chip story-detail__chip--category'>
                      {categoryTag ? categoryTag.name : 'Chưa chọn'}
                    </strong>
                  </div>
                </div>

                {extraTags.length > 0 && (
                  <div className='story-detail__tags'>
                    {extraTags.map((tag) => (
                      <span
                        key={tag.id}
                        className='story-detail__tag story-detail__tag--pink'
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className='story-detail__rows'>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--views'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Lượt xem:</span>
                    <strong>{readerText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--visibility'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 4a8 8 0 0 1 7.84 6.4h-2.06A6 6 0 0 0 6.22 10.4h2.06A4 4 0 0 1 12 8c1.34 0 2.52.66 3.25 1.67l1.55-1.2A6 6 0 0 0 12 6a6 6 0 0 0-4.8 2.47l1.55 1.2A4 4 0 0 1 12 8zm-8 8a8 8 0 0 1 .16-1.6h2.06a6 6 0 0 0 11.56 0h2.06A8 8 0 1 1 4 12zm6.2.8a1.8 1.8 0 1 0 3.6 0 1.8 1.8 0 0 0-3.6 0z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Hiển thị:</span>
                    <strong>{storyStatusLabel}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--status'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm4.3 6.7-5.1 5.1-2.5-2.5-1.4 1.4 3.9 3.9 6.5-6.5-1.4-1.4z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Trạng thái:</span>
                    <strong className='story-detail__status'>
                      {completionLabel}
                    </strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--rating'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='m12 17.3-6.16 3.24 1.18-6.88L2 8.76l6.92-1L12 1.5l3.08 6.26 6.92 1-5.02 4.9 1.18 6.88z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Đánh giá:</span>
                    <strong>{ratingText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--words'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M7 3h8a2 2 0 0 1 2 2v14H7a3 3 0 0 0-3 3V5a2 2 0 0 1 2-2zm10 16V5a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H7a1 1 0 0 1 1-1h9z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Số từ:</span>
                    <strong>{wordText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--updated'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 1.8a10.2 10.2 0 1 0 10.2 10.2A10.2 10.2 0 0 0 12 1.8zm0 2a8.2 8.2 0 1 1-8.2 8.2A8.2 8.2 0 0 1 12 3.8zm-.1 2.7a1 1 0 0 0-1 1v5.2c0 .27.11.52.3.7l3.5 3.5a1 1 0 1 0 1.4-1.4l-3.2-3.2V7.5a1 1 0 0 0-1-1z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Lần cuối:</span>
                    <strong>{formatRelativeTime(story.lastUpdatedAt)}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon story-detail__row-icon--saved'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M6 3h12a2 2 0 0 1 2 2v16l-8-3.8L4 21V5a2 2 0 0 1 2-2z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Lượt lưu:</span>
                    <strong>{savedText}</strong>
                  </div>
                </div>

                <div className='story-detail__summary-header'>
                  <div className='story-detail__summary-header-info'>
                    <span className='story-detail__label'>Nội dung</span>
                    <span className='story-detail__muted'>
                      ( Cập nhật: {formatDateTime(story.lastUpdatedAt)} )
                    </span>
                  </div>
                  {(canSubmitStoryApproval || showStoryApprovalStatus) && (
                    <div className='story-detail__summary-approval'>
                      {canSubmitStoryApproval && (
                        <button
                          type='button'
                          className='story-detail__chapter-submit story-detail__story-submit-inline'
                          onClick={handleSubmitStoryApproval}
                          disabled={submittingApprovalStory || !story}
                        >
                          {submittingApprovalStory ? 'Đang gửi...' : 'Gửi duyệt'}
                        </button>
                      )}
                      {showStoryApprovalStatus && (
                        <div className='story-detail__story-approval'>
                          <span
                            className={`story-detail__approval-badge ${storyApprovalBadgeClass}`}
                          >
                            <span className='story-detail__approval-dot' />
                            {storyApprovalStatusLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`story-detail__summary-box ${expandedSummary ? 'expanded' : ''}`}
                >
                  {summaryText || 'Chưa có tóm tắt.'}
                </div>

                {canExpandSummary && (
                  <button
                    type='button'
                    className='story-detail__expand'
                    onClick={() => setExpandedSummary((prev) => !prev)}
                  >
                    {expandedSummary ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'volumes' && (
        <div className='story-detail__volumes'>
          {showCreateVolume && (
            <CreateVolume
              storyId={storyId}
              onCreated={(volumeId) => {
                setShowCreateVolume(false);
                fetchVolumes();
                if (volumeId) {
                  setExpandedVolumes((prev) => {
                    const next = new Set(prev);
                    next.add(String(volumeId));
                    return next;
                  });
                }
              }}
              onCancel={() => setShowCreateVolume(false)}
            />
          )}

          {loadingVolumes && (
            <div className='story-detail__loading'>
              <LoadingSpinner size={74} label='Đang tải danh sách volume...' />
            </div>
          )}

          {!loadingVolumes && volumes.length === 0 && (
            <div className='story-detail__empty'>Chưa có volume nào.</div>
          )}

          {volumes.map((volume) => {
            const id = String(volume.id || volume.volumeId);
            const isOpen = expandedVolumes.has(id);
            const coverUrl = String(volume?.coverUrl || '').trim();
            const chapters = Array.isArray(volume.chapters)
              ? [...volume.chapters].sort(
                  (a, b) => (a.sequenceIndex || 0) - (b.sequenceIndex || 0),
                )
              : [];
            return (
              <div key={id} className='story-detail__volume'>
                <div className='story-detail__volume-header'>
                  <div className='story-detail__volume-cover-wrap'>
                    {coverUrl ? (
                      <img
                        className='story-detail__volume-cover'
                        src={coverUrl}
                        alt={
                          volume.title || `Tập ${volume.sequenceIndex || ''}`
                        }
                      />
                    ) : (
                      <div className='story-detail__volume-cover-placeholder'>
                        No cover
                      </div>
                    )}
                  </div>
                  <div className='story-detail__volume-meta'>
                    {editingVolumeId === id ? (
                      <div className='story-detail__volume-edit-row'>
                        <input
                          type='text'
                          className='story-detail__volume-input'
                          value={editingVolumeTitle}
                          onChange={(event) =>
                            setEditingVolumeTitle(event.target.value)
                          }
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              saveEditVolume(id);
                            }
                            if (event.key === 'Escape') {
                              cancelEditVolume();
                            }
                          }}
                          placeholder='Nhập tên tập'
                          maxLength={300}
                        />
                        <button
                          type='button'
                          className='story-detail__volume-edit-action story-detail__volume-edit-action--save'
                          disabled={savingVolumeId === id}
                          onClick={() => saveEditVolume(id)}
                        >
                          {savingVolumeId === id ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          type='button'
                          className='story-detail__volume-edit-action story-detail__volume-edit-action--cancel'
                          disabled={savingVolumeId === id}
                          onClick={cancelEditVolume}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type='button'
                          className='story-detail__volume-toggle'
                          onClick={() => toggleVolume(id)}
                        >
                          <span>
                            {volume.title ||
                              `Tập ${volume.sequenceIndex || ''}`}
                          </span>
                          <span className='story-detail__muted'>
                            {volume.chapterCount ?? chapters.length} chương
                          </span>
                        </button>
                        <div className='story-detail__volume-actions'>
                          <input
                            ref={(node) => {
                              if (node) {
                                volumeCoverInputRefs.current[id] = node;
                              } else {
                                delete volumeCoverInputRefs.current[id];
                              }
                            }}
                            className='story-detail__volume-cover-input'
                            type='file'
                            accept='image/*'
                            onChange={(event) =>
                              handleVolumeCoverFileChange(id, event)
                            }
                          />
                          <button
                            type='button'
                            className='story-detail__volume-edit-btn'
                            onClick={() => startEditVolume(volume)}
                          >
                            Sửa tên tập
                          </button>
                          <button
                            type='button'
                            className='story-detail__volume-cover-btn'
                            onClick={() => openVolumeCoverPicker(id)}
                            disabled={uploadingVolumeCoverId === id}
                          >
                            {uploadingVolumeCoverId === id
                              ? 'Đang tải cover...'
                              : 'Tạo cover'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <Link
                    className='story-detail__chapter-link'
                    to={`/author/stories/${storyId}/volumes/${id}/create-chapter?tab=volumes&volumeId=${id}`}
                  >
                    + Thêm chương mới
                  </Link>
                </div>

                {isOpen && (
                  <div className='story-detail__chapters'>
                    {chapters.length === 0 && (
                      <p className='story-detail__muted'>Chưa có chương nào.</p>
                    )}
                    {chapters.map((chapter) => {
                      const approvalStatusKey = String(
                        chapter.approvalStatus || '',
                      ).toLowerCase();
                      const hasApprovalStatusValue =
                        chapter.approvalStatus != null &&
                        String(chapter.approvalStatus).trim() !== '';
                      const chapterStatusKey = String(
                        chapter.status || '',
                      ).toLowerCase();
                      const showApprovalStatus =
                        Boolean(CHAPTER_APPROVAL_LABELS[approvalStatusKey]) &&
                        !(
                          approvalStatusKey === 'approved' &&
                          chapterStatusKey === 'published'
                        );
                      const isSubmittingApproval =
                        submittingApprovalChapterId === String(chapter.id);

                      return (
                        <div key={chapter.id} className='story-detail__chapter'>
                          <div>
                            <span>
                              {chapter.sequenceIndex
                                ? `Chương ${chapter.sequenceIndex}: `
                                : ''}
                              {chapter.title}
                            </span>
                            <div className='story-detail__chapter-status'>
                              Trạng thái:{' '}
                              {CHAPTER_STATUS_LABELS[
                                chapterStatusKey
                              ] || 'Nháp'}
                            </div>
                            {showApprovalStatus && (
                              <div className='story-detail__chapter-approval'>
                                <span
                                  className={`story-detail__approval-badge story-detail__approval-badge--${approvalStatusKey}`}
                                >
                                  <span className='story-detail__approval-dot' />
                                  {CHAPTER_APPROVAL_LABELS[approvalStatusKey]}
                                </span>
                              </div>
                            )}
                            {chapter.lastUpdateAt && (
                              <div className='story-detail__muted'>
                                Cập nhật:{' '}
                                {new Date(
                                  chapter.lastUpdateAt,
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className='story-detail__chapter-actions'>
                            {!hasApprovalStatusValue && (
                              <button
                                type='button'
                                className='story-detail__chapter-submit'
                                onClick={() =>
                                  handleSubmitChapterApproval(id, chapter.id)
                                }
                                disabled={isSubmittingApproval}
                              >
                                {isSubmittingApproval
                                  ? 'Đang gửi...'
                                  : 'Gửi duyệt'}
                              </button>
                            )}
                            <Link
                              className='story-detail__chapter-edit'
                              to={`/author/stories/${storyId}/volumes/${id}/create-chapter?tab=volumes&volumeId=${id}&chapterId=${chapter.id}`}
                            >
                              Sửa chương
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoryDetail;
