import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import storyService from '../../services/storyService';
import '../../styles/ranking-pages.css';
import '../../styles/home-dashboard.css';

const formatNumber = (n) => Number(n ?? 0).toLocaleString('vi-VN');
const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStoryStatusInfo = (story) => {
  const s = String(story?.completionStatus || '').toLowerCase();
  if (s === 'completed') return { label: 'Đã hoàn thành', className: 'completed' };
  if (s === 'cancelled') return { label: 'Tạm ngưng', className: 'cancelled' };
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
        if (!cancelled) {
          const arr = Array.isArray(data) ? data : [];
          arr.sort((a, b) => {
            const ta = new Date(a?.lastUpdatedAt || a?.createdAt || 0).getTime();
            const tb = new Date(b?.lastUpdatedAt || b?.createdAt || 0).getTime();
            return tb - ta;
          });
          setStories(arr);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được danh sách truyện');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="ranking-page ranking-page--recent">
        <div className="ranking-page__loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-page ranking-page--recent">
        <div className="ranking-page__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ranking-page ranking-page--recent home-dashboard">
      <header className="ranking-page__hero">
        <h1 className="ranking-page__title">
          <Clock className="ranking-page__title-icon" size={28} />
          Truyện cập nhật gần đây
        </h1>
        <p className="ranking-page__subtitle">
          Tất cả truyện được sắp xếp theo thời gian cập nhật mới nhất. Bấm vào thẻ truyện để xem chi tiết.
        </p>
      </header>

      <section className="ranking-page__content">
        {stories.length === 0 ? (
          <p className="ranking-page__empty">Chưa có truyện nào.</p>
        ) : (
          <>
            <p className="ranking-page__section-label">Danh sách theo ngày cập nhật</p>
            <div className="recent-stories-grid">
            {stories.map((story) => {
              const statusInfo = getStoryStatusInfo(story);
              return (
                <Link
                  key={story.id}
                  to={`/stories/${story.id}/metadata`}
                  className="recent-story-card"
                >
                  <div className="recent-story-card__cover-wrap">
                    {story.coverUrl ? (
                      <img
                        src={story.coverUrl}
                        alt=""
                        className="recent-story-card__cover"
                      />
                    ) : (
                      <div className="recent-story-card__cover-placeholder">
                        <BookOpen size={32} />
                      </div>
                    )}
                    <span className={`recent-story-card__status recent-story-card__status--${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="recent-story-card__body">
                    <h3 className="recent-story-card__title">{story.title || 'Không có tên'}</h3>
                    <p className="recent-story-card__meta">
                      {story.authorPenName || 'Ẩn danh'} · Cập nhật {formatDate(story.lastUpdatedAt || story.createdAt)}
                    </p>
                    <p className="recent-story-card__stats">
                      {formatNumber(story.readerCount)} lượt xem · {formatNumber(story.savedCount)} theo dõi
                    </p>
                  </div>
                </Link>
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
