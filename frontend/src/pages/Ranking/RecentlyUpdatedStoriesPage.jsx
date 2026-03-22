import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Clock, Eye, Star } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import storyService from '../../services/storyService';
import '../../styles/ranking-pages.css';
import '../../styles/home-dashboard.css';

const formatNumber = (value) => Number(value ?? 0).toLocaleString('vi-VN');

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getSummary = (story, max = 90) => {
  const raw = htmlToText(story?.summaryHtml || story?.summary || '');
  if (!raw) return 'Truyện hiện chưa có tóm tắt.';
  if (!Number.isFinite(max) || max <= 0) return raw;
  return raw.length > max ? `${raw.slice(0, max).trim()}...` : raw;
};

const getStoryCategory = (story) => {
  const tags = Array.isArray(story?.tags) ? story.tags : [];
  return tags[0] || null;
};

const formatRating = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return '0.0';
  return numericValue.toFixed(1);
};

const getStoryStatusInfo = (story) => {
  const status = String(story?.completionStatus || '').toLowerCase();
  if (status === 'completed') {
    return { label: 'Đã hoàn thành', className: 'completed' };
  }
  if (status === 'cancelled') {
    return { label: 'Tạm ngưng', className: 'cancelled' };
  }
  return { label: 'Đang tiến hành', className: 'ongoing' };
};

function RecentlyUpdatedStoriesPage() {
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    storyService
      .getPublicStories({
        page: 0,
        size: 60,
        sort: 'lastUpdatedAt,desc',
      })
      .then((data) => {
        if (cancelled) return;
        const items = Array.isArray(data) ? data : [];
        items.sort((left, right) => {
          const leftTime = new Date(
            left?.lastUpdatedAt || left?.createdAt || 0,
          ).getTime();
          const rightTime = new Date(
            right?.lastUpdatedAt || right?.createdAt || 0,
          ).getTime();
          return rightTime - leftTime;
        });
        setStories(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Không tải được danh sách truyện');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className='ranking-page ranking-page--recent'>
        <div className='ranking-page__loading'>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='ranking-page ranking-page--recent'>
        <div className='ranking-page__error'>{error}</div>
      </div>
    );
  }

  return (
    <div className='ranking-page ranking-page--recent home-dashboard'>
      <header className='ranking-page__hero'>
        <h1 className='ranking-page__title'>
          <Clock className='ranking-page__title-icon' size={28} />
          Truyện cập nhật gần đây
        </h1>
        <p className='ranking-page__subtitle'>
          Tất cả truyện được sắp xếp theo thời gian cập nhật mới nhất. Bấm vào
          thẻ truyện để xem chi tiết.
        </p>
      </header>

      <section className='ranking-page__content'>
        {stories.length === 0 ? (
          <p className='ranking-page__empty'>Chưa có truyện nào.</p>
        ) : (
          <>
            <p className='ranking-page__section-label'>
              Danh sách theo ngày cập nhật
            </p>
            <div className='home-story-grid recent-stories-grid'>
              {stories.map((story) => {
                const statusInfo = getStoryStatusInfo(story);
                const categoryTag = getStoryCategory(story);
                const authorName =
                  story.authorPenName || story.authorName || 'Ẩn danh';
                const updatedAt = story.lastUpdatedAt || story.createdAt;

                return (
                  <article
                    key={story.id}
                    className='home-story-card home-story-card--recent'
                  >
                    <Link
                      to={`/stories/${story.id}/metadata`}
                      className='home-story-card__link'
                    >
                      <div className='home-story-card__cover'>
                        {story.coverUrl ? (
                          <img src={story.coverUrl} alt={story.title || ''} />
                        ) : (
                          <div className='home-story-card__cover-empty'>
                            No cover
                          </div>
                        )}
                        <div className='home-story-card__overlay'>
                          <p className='home-story-card__chapter'>
                            Cập nhật gần đây
                          </p>
                          <p className='home-story-card__volume'>
                            {formatDate(updatedAt)}
                          </p>
                        </div>
                      </div>

                      <div className='home-story-card__content'>
                        <h3 className='home-story-card__title'>
                          {story.title || 'Không có tên'}
                        </h3>

                        <div className='home-story-card__meta'>
                          <span className='home-story-card__author'>
                            {authorName}
                          </span>
                          {categoryTag && (
                            <span className='home-story-card__category'>
                              {categoryTag.name}
                            </span>
                          )}
                        </div>

                        <p className='home-story-card__summary'>
                          {getSummary(story, 90)}
                        </p>

                        <div className='home-story-card__stats'>
                          <span className='home-story-card__stat home-story-card__stat--rating'>
                            <Star size={14} fill='currentColor' />
                            {formatRating(story.ratingAvg)}
                          </span>
                          <span className='home-story-card__stat'>
                            <Eye size={14} />
                            {formatNumber(story.readerCount || 0)}
                          </span>
                          <span className='home-story-card__stat'>
                            <Bookmark size={14} />
                            {formatNumber(story.savedCount || 0)}
                          </span>
                        </div>

                        <div className='home-story-card__footer'>
                          <span
                            className={`home-story-card__status ${statusInfo.className}`}
                          >
                            <span className='home-story-card__status-dot' />
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default RecentlyUpdatedStoriesPage;
