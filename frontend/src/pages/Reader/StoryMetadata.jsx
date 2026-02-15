import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  if (diffMin < 60) return `${diffMin} phút`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ`;
  return `${Math.floor(diffHour / 24)} ngày`;
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
  const plain = htmlToText(html);
  if (!plain) return 0;
  return plain.split(' ').length;
};

const StoryMetadata = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [story, setStory] = useState(null);
  const [volumes, setVolumes] = useState([]);
  const [loadingStory, setLoadingStory] = useState(false);
  const [loadingVolumes, setLoadingVolumes] = useState(false);
  const [expandedSummary, setExpandedSummary] = useState(false);
  const [expandedVolumes, setExpandedVolumes] = useState(() => new Set());
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [notifyLoading, setNotifyLoading] = useState(false);

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
        const first = String(list[0].id || list[0].volumeId || '');
        if (first) {
          setExpandedVolumes(new Set([first]));
        }
      }
    } catch (error) {
      console.error('getVolumes metadata error', error);
      notify('Không tải được danh sách tập', 'error');
    } finally {
      setLoadingVolumes(false);
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
    fetchNotifyStatus();
  }, [fetchStory, fetchVolumes, fetchNotifyStatus]);

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
  const isOriginalOrAi = useMemo(
    () => !isTranslated,
    [isTranslated],
  );

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const translatorName = useMemo(() => {
    return (
      currentUser?.authorPenName ||
      currentUser?.penName ||
      story?.translatorPenName ||
      story?.authorPenName ||
      currentUser?.username ||
      'Chưa có bút danh'
    );
  }, [currentUser, story]);

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
    const fallback = countWordsFromHtml(story?.summaryHtml || story?.summary || '');
    const value = apiWordCount > 0 ? apiWordCount : fallback;
    return formatNumber(value);
  }, [story]);

  const summaryText = useMemo(
    () => htmlToText(story?.summaryHtml || story?.summary || ''),
    [story],
  );

  const canExpandSummary = summaryText.length > 300;

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
    const currentUser = localStorage.getItem('user');
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

  return (
    <div className='story-metadata'>
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
                Lưu vào thư viện
              </button>
              <button type='button' className='story-metadata__side-btn ghost'>
                Báo cáo
              </button>
            </aside>

            <article className='story-metadata__content'>
              <h1>{story.title}</h1>

              <div className='story-metadata__meta'>
                {isTranslated && (
                  <p className='story-metadata__meta-line'>
                    <span className='story-metadata__icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
                      </svg>
                    </span>
                    <span>Tác giả gốc:</span>{' '}
                    <strong>{story.originalAuthorName || 'Chưa rõ'}</strong>
                  </p>
                )}
                {isOriginalOrAi && (
                  <p className='story-metadata__meta-line'>
                    <span className='story-metadata__icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5z' />
                      </svg>
                    </span>
                    <span>Tác giả:</span>{' '}
                    <strong>{story.authorPenName || 'Chưa có bút danh'}</strong>
                  </p>
                )}
                {isTranslated && (
                  <p className='story-metadata__meta-line'>
                    <span className='story-metadata__icon'>
                      <svg viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M5 4h7v2H9.92a9.94 9.94 0 0 1-1.58 3c.76.9 1.67 1.69 2.66 2.3l-1 1.73a12.2 12.2 0 0 1-2.73-2.32A11.8 11.8 0 0 1 4.5 13L3 11.5A9.8 9.8 0 0 0 6.1 9 8.09 8.09 0 0 0 7.6 6H5zm10 2h2l4 14h-2l-1-3h-4l-1 3h-2zm.5 3.5-1.5 4.5h3z' />
                      </svg>
                    </span>
                    <span>Người dịch:</span>{' '}
                    <strong>{translatorName}</strong>
                  </p>
                )}
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M4 4h7v7H4zm9 0h7v7h-7zM4 13h7v7H4zm9 3h7v4h-7z' />
                    </svg>
                  </span>
                  <span>Loại truyện:</span> <strong>{kindLabel}</strong>
                </p>
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M4 7a2 2 0 0 1 2-2h5l2 2h5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z' />
                    </svg>
                  </span>
                  <span>Danh mục:</span>{' '}
                  <strong className='story-metadata__category-chip'>
                    {categoryTag?.name || 'Chưa chọn'}
                  </strong>
                </p>
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
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon story-metadata__icon--pink'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                    </svg>
                  </span>
                  <span>Lượt xem:</span> <strong>{readerText}</strong>
                </p>
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon story-metadata__icon--pink'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M12 6a1 1 0 0 1 1 1v5h4a1 1 0 1 1 0 2h-5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm0-4a10 10 0 1 1 0 20 10 10 0 0 1 0-20z' />
                    </svg>
                  </span>
                  <span>Trạng thái:</span>{' '}
                  <strong className='story-metadata__status'>
                    {completionLabel}
                  </strong>
                </p>
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon story-metadata__icon--pink'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='m12 17.3-6.16 3.24 1.18-6.88L2 8.76l6.92-1L12 1.5l3.08 6.26 6.92 1-5.02 4.9 1.18 6.88z' />
                    </svg>
                  </span>
                  <span>Đánh giá:</span> <strong>{ratingText}</strong>
                </p>
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon story-metadata__icon--pink'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M4 5a2 2 0 0 1 2-2h11a3 3 0 0 1 3 3v13a2 2 0 0 1-2 2H7a3 3 0 0 1-3-3V5zm3 0v13a1 1 0 0 0 1 1h10V6a1 1 0 0 0-1-1H7z' />
                    </svg>
                  </span>
                  <span>Số từ:</span> <strong>{wordText}</strong>
                </p>
                <p className='story-metadata__meta-line'>
                  <span className='story-metadata__icon story-metadata__icon--pink'>
                    <svg viewBox='0 0 24 24' aria-hidden='true'>
                      <path d='M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2.2a.9.9 0 0 0-.9.9v6.1c0 .24.1.47.27.64l3.7 3.7a.9.9 0 1 0 1.27-1.27l-3.44-3.44V5.1a.9.9 0 0 0-.9-.9z' />
                    </svg>
                  </span>
                  <span>Cập nhật lần cuối:</span>{' '}
                  <strong>{formatRelativeTime(story.lastUpdatedAt)}</strong>
                </p>
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
    </div>
  );
};

export default StoryMetadata;
