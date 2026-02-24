import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/homepage.css';
import '../styles/manage-stories.css';

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ongoing', label: 'Đang tiến hành' },
  { value: 'completed', label: 'Hoàn thành' },
];

const COMPLETION_LABELS = {
  ongoing: 'Đang tiến hành',
  completed: 'Hoàn thành',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatRelativeTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
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

const getCategoryTag = (story) => {
  const tags = Array.isArray(story?.tags) ? story.tags : [];
  return tags[0] || null;
};

const getCompletionLabel = (story) => {
  const status = String(story?.status || '').toLowerCase();
  const completion = String(story?.completionStatus || '').toLowerCase();
  return COMPLETION_LABELS[completion] || 'Đang tiến hành';
};

const getSummaryText = (story) => {
  const summary = htmlToText(story?.summaryHtml || story?.summary || '');
  return summary.length > 120 ? `${summary.slice(0, 120)}...` : summary;
};

const matchesFilter = (story, filter) => {
  if (filter === 'all') return true;
  const status = String(story?.status || '').toLowerCase();
  const completion = String(story?.completionStatus || '').toLowerCase();
  if (filter === 'archived') return status === 'archived';
  return status !== 'archived' && completion === filter;
};

const LibraryStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const { notify } = useNotify();

  useEffect(() => {
    const fetchLibraryStories = async () => {
      try {
        setLoading(true);
        const response = await storyService.getLibraryStories();
        setStories(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('getLibraryStories error', error);
        notify('Không tải được tủ truyện của bạn', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchLibraryStories();
  }, [notify]);

  const filteredStories = useMemo(
    () => stories.filter((story) => matchesFilter(story, activeFilter)),
    [stories, activeFilter],
  );

  return (
    <section className='story-hub'>
      <header className='story-hub__header'>
        <h1>Tủ Truyện</h1>
        <p>Các truyện bạn đã thêm vào thư viện cá nhân.</p>
      </header>

      <div className='story-hub__filters'>
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type='button'
            className={`story-hub__filter ${activeFilter === item.value ? 'active' : ''}`}
            onClick={() => setActiveFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && <p className='story-hub__muted'>Đang tải tủ truyện...</p>}

      {!loading && filteredStories.length === 0 && (
        <div className='story-hub__empty'>
          Tủ truyện của bạn đang trống hoặc không có truyện phù hợp bộ lọc.
        </div>
      )}

      {!loading && filteredStories.length > 0 && (
        <div className='stories-grid'>
          {filteredStories.map((story) => {
            const categoryTag = getCategoryTag(story);
            const completionLabel = getCompletionLabel(story);
            const storyStatusClass =
              String(story?.status || '').toLowerCase() === 'archived'
                ? 'archived'
                : String(story?.completionStatus || '').toLowerCase();

            return (
              <article key={story.id} className='story-card story-hub__card'>
                <Link
                  to={`/stories/${story.id}/metadata`}
                  className='story-card__link'
                >
                  <div className='story-card__cover'>
                    {story.coverUrl ? (
                      <img src={story.coverUrl} alt={story.title} />
                    ) : (
                      <div className='story-card__cover-placeholder'>
                        Chưa có ảnh bìa
                      </div>
                    )}
                  </div>

                  <div className='story-card__content'>
                    <h3 className='story-card__title'>{story.title}</h3>

                    <div className='story-card__meta'>
                      <span className='story-card__author'>
                        {story.authorPenName || 'Chưa có bút danh'}
                      </span>
                      {categoryTag && (
                        <span className='story-card__category'>
                          {categoryTag.name}
                        </span>
                      )}
                    </div>

                    <p className='story-card__summary'>
                      {getSummaryText(story) || 'Chưa có tóm tắt.'}
                    </p>

                    <div className='story-card__stats'>
                      <div className='story-card__stat'>
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                          <path d='M12 5c5.5 0 9.8 4.6 10 6.8-.2 2.2-4.5 6.8-10 6.8S2.2 14 2 11.8C2.2 9.6 6.5 5 12 5zm0 2C8.6 7 5.7 9.5 4.4 11.8 5.7 14.1 8.6 16.6 12 16.6s6.3-2.5 7.6-4.8C18.3 9.5 15.4 7 12 7zm0 2.2a2.6 2.6 0 1 1 0 5.2 2.6 2.6 0 0 1 0-5.2z' />
                        </svg>
                        <span>{formatNumber(story.readerCount || 0)}</span>
                      </div>

                      <div className='story-card__stat'>
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                          <path d='m12 17.3-6.16 3.24 1.18-6.88L2 8.76l6.92-1L12 1.5l3.08 6.26 6.92 1-5.02 4.9 1.18 6.88z' />
                        </svg>
                        <span>
                          {story.ratingAvg
                            ? `${Number(story.ratingAvg).toFixed(1)}`
                            : '0.0'}
                        </span>
                      </div>

                      <div className='story-card__stat'>
                        <svg viewBox='0 0 24 24' aria-hidden='true'>
                          <path d='M12 1.8a10.2 10.2 0 1 0 10.2 10.2A10.2 10.2 0 0 0 12 1.8zm0 2a8.2 8.2 0 1 1-8.2 8.2A8.2 8.2 0 0 1 12 3.8zm-.1 2.7a1 1 0 0 0-1 1v5.2c0 .27.11.52.3.7l3.5 3.5a1 1 0 1 0 1.4-1.4l-3.2-3.2V7.5a1 1 0 0 0-1-1z' />
                        </svg>
                        <span>{formatRelativeTime(story.createdAt)}</span>
                      </div>
                    </div>

                    <div className='story-card__footer'>
                      <span
                        className={`story-card__status ${storyStatusClass}`}
                      >
                        {completionLabel}
                      </span>
                      <span className='story-card__word-count'>
                        {formatNumber(story.wordCount || 0)} từ
                      </span>
                    </div>
                  </div>
                </Link>

                <div className='story-hub__actions'>
                  <Link
                    className='story-hub__action-btn'
                    to={`/stories/${story.id}/metadata`}
                  >
                    Mở chi tiết
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default LibraryStories;
