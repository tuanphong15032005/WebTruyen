import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import Button from '../../components/Button';
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
  original: 'Truyện gốc',
  translated: 'Truyện dịch',
  ai: 'Truyện AI',
};

const STORY_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  archived: 'Lưu trữ',
};

const CHAPTER_STATUS_LABELS = {
  draft: 'Nháp',
  published: 'Công khai',
  archived: 'Lưu trữ',
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

const countWordsFromHtml = (html) => {
  const text = htmlToText(html);
  if (!text) return 0;
  return text.split(' ').length;
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
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get('tab') === 'volumes' ? 'volumes' : 'info',
  );
  const tabsRef = React.useRef(null);
  const infoTabRef = React.useRef(null);
  const volumesTabRef = React.useRef(null);
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  const fetchStory = useCallback(async () => {
    try {
      setLoadingStory(true);
      const response = await storyService.getStory(storyId);
      setStory(response?.data || null);
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
      const list = Array.isArray(response?.data) ? response.data : [];
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
    return KIND_LABELS[key] || 'Truyện gốc';
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
    return `${avg} / ${formatNumber(count)}`;
  }, [story]);

  const readerText = useMemo(() => {
    const readers = Number(story?.readerCount || 0);
    if (!readers) return 'Chưa có người đọc';
    return formatNumber(readers);
  }, [story]);

  const wordText = useMemo(() => {
    const apiWordCount = Number(story?.wordCount || 0);
    const fallback = countWordsFromHtml(story?.summaryHtml || '');
    const value = apiWordCount > 0 ? apiWordCount : fallback;
    return formatNumber(value);
  }, [story]);

  const summaryText = useMemo(
    () => htmlToText(story?.summaryHtml || story?.summary || ''),
    [story],
  );

  const canExpandSummary = summaryText.length > 260;

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

  const handleViewMetadata = () => {
    const isPublished = String(story?.status || '').toLowerCase() === 'published';
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
            <p className='story-detail__muted'>Đang tải dữ liệu...</p>
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
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Lượt xem:</span>
                    <strong>{readerText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 6a1 1 0 0 1 1 1v5h4a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0-4a10 10 0 1 1 0 20 10 10 0 0 1 0-20z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>
                      Trạng thái truyện:
                    </span>
                    <strong>{storyStatusLabel}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 6a1 1 0 0 1 1 1v5h4a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0-4a10 10 0 1 1 0 20 10 10 0 0 1 0-20z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Trạng thái:</span>
                    <strong className='story-detail__status'>
                      {completionLabel}
                    </strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='m12 17.3-6.16 3.24 1.18-6.88L2 8.76l6.92-1L12 1.5l3.08 6.26 6.92 1-5.02 4.9 1.18 6.88z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Đánh giá:</span>
                    <strong>{ratingText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V5zm3 0v13a1 1 0 0 0 1 1h10V6a1 1 0 0 0-1-1H7z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Số từ:</span>
                    <strong>{wordText}</strong>
                  </div>
                  <div className='story-detail__row'>
                    <span className='story-detail__row-icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 6a1 1 0 0 1 1 1v5h4a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20z' />
                      </svg>
                    </span>
                    <span className='story-detail__row-label'>Lần cuối:</span>
                    <strong>{formatRelativeTime(story.lastUpdatedAt)}</strong>
                  </div>
                </div>

                <div className='story-detail__summary-header'>
                  <span className='story-detail__label'>Nội dung</span>
                  <span className='story-detail__muted'>
                    ( Cập nhật: {formatDateTime(story.lastUpdatedAt)} )
                  </span>
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
            <p className='story-detail__muted'>Đang tải danh sách volume...</p>
          )}

          {!loadingVolumes && volumes.length === 0 && (
            <div className='story-detail__empty'>Chưa có volume nào.</div>
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
              <div key={id} className='story-detail__volume'>
                <div className='story-detail__volume-header'>
                  <button
                    type='button'
                    className='story-detail__volume-toggle'
                    onClick={() => toggleVolume(id)}
                  >
                    <span>
                      {volume.title || `Tập ${volume.sequenceIndex || ''}`}
                    </span>
                    <span className='story-detail__muted'>
                      {volume.chapterCount ?? chapters.length} chương
                    </span>
                  </button>
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
                    {chapters.map((chapter) => (
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
                              String(chapter.status || '').toLowerCase()
                            ] || 'Nháp'}
                          </div>
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
                          <Link
                            className='story-detail__chapter-edit'
                            to={`/author/stories/${storyId}/volumes/${id}/create-chapter?tab=volumes&volumeId=${id}&chapterId=${chapter.id}`}
                          >
                            Sửa chương
                          </Link>
                        </div>
                      </div>
                    ))}
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
