import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, BookOpen, Eye, Bookmark } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import storyService from '../../services/storyService';
import rankingService from '../../services/rankingService';
import '../../styles/ranking-pages.css';
import '../../styles/home-dashboard.css';

const PERIODS = [
  { value: 'week', label: 'Theo tuần' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' },
  { value: 'all', label: 'Toàn thời gian' },
];

const METRICS = [
  { value: 'views', label: 'Lượt xem', icon: Eye },
  { value: 'follows', label: 'Lượt theo dõi', icon: Bookmark },
];

const formatNumber = (n) => Number(n ?? 0).toLocaleString('vi-VN');

const getStoryStatusInfo = (story) => {
  const s = String(story?.completionStatus || '').toLowerCase();
  if (s === 'completed') return { label: 'Đã hoàn thành', className: 'completed' };
  if (s === 'cancelled') return { label: 'Tạm ngưng', className: 'cancelled' };
  return { label: 'Đang tiến hành', className: 'ongoing' };
};

function StoryRankingPage() {
  const [period, setPeriod] = useState('all');
  const [metric, setMetric] = useState('views');
  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = () => {
      if (metric === 'views') {
        return storyService.getPublicStories({
          page: 0,
          size: 50,
          sort: 'viewCount,desc',
        });
      }
      return rankingService.getTopStoriesByFollows({ limit: 50 });
    };

    load()
      .then((data) => {
        if (!cancelled) {
          const arr = Array.isArray(data) ? data : [];
          setStories(arr);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được bảng xếp hạng');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [period, metric]);

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? period;
  const metricLabel = METRICS.find((m) => m.value === metric)?.label ?? metric;
  const MetricIcon = METRICS.find((m) => m.value === metric)?.icon ?? Eye;

  return (
    <div className="ranking-page ranking-page--stories home-dashboard">
      <header className="ranking-page__hero">
        <h1 className="ranking-page__title">
          <Award className="ranking-page__title-icon" size={28} />
          Xếp hạng truyện
        </h1>
        <p className="ranking-page__subtitle">
          Chọn khoảng thời gian và tiêu chí (lượt xem hoặc lượt theo dõi) để xem bảng xếp hạng.
        </p>
      </header>

      <div className="ranking-page__tabs">
        <div className="ranking-page__tab-group">
          <span className="ranking-page__tab-label">Thời gian:</span>
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`ranking-page__tab ${period === p.value ? 'ranking-page__tab--active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="ranking-page__tab-group">
          <span className="ranking-page__tab-label">Theo:</span>
          {METRICS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.value}
                type="button"
                className={`ranking-page__tab ${metric === m.value ? 'ranking-page__tab--active' : ''}`}
                onClick={() => setMetric(m.value)}
              >
                <Icon size={16} /> {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className="ranking-page__content">
        {loading ? (
          <div className="ranking-page__loading">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <div className="ranking-page__error">{error}</div>
        ) : stories.length === 0 ? (
          <p className="ranking-page__empty">Chưa có dữ liệu xếp hạng.</p>
        ) : (
          <>
            <p className="ranking-page__section-label">Bảng xếp hạng · {periodLabel} · {metricLabel}</p>
            <ol className="story-ranking-list">
            {stories.map((story, index) => {
              const statusInfo = getStoryStatusInfo(story);
              const rank = index + 1;
              const rankClass = rank === 1 ? 'story-ranking-item--rank-1' : rank === 2 ? 'story-ranking-item--rank-2' : rank === 3 ? 'story-ranking-item--rank-3' : '';
              const value = metric === 'views'
                ? formatNumber(story.readerCount ?? story.viewCount)
                : formatNumber(story.savedCount);
              return (
                <li key={story.id} className={`story-ranking-item ${rankClass}`}>
                  <span className="story-ranking-item__rank">#{rank}</span>
                  <Link
                    to={`/stories/${story.id}/metadata`}
                    className="story-ranking-item__cover-wrap"
                  >
                    {story.coverUrl ? (
                      <img
                        src={story.coverUrl}
                        alt=""
                        className="story-ranking-item__cover"
                      />
                    ) : (
                      <div className="story-ranking-item__cover-placeholder">
                        <BookOpen size={28} />
                      </div>
                    )}
                  </Link>
                  <div className="story-ranking-item__info">
                    <Link
                      to={`/stories/${story.id}/metadata`}
                      className="story-ranking-item__title"
                    >
                      {story.title || 'Không có tên'}
                    </Link>
                    <p className="story-ranking-item__author">
                      {story.authorPenName || 'Ẩn danh'}
                    </p>
                    <span className={`story-ranking-item__status story-ranking-item__status--${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="story-ranking-item__metric">
                    <MetricIcon size={18} />
                    <span>{value}</span>
                  </div>
                </li>
              );
            })}
            </ol>
          </>
        )}
      </section>
    </div>
  );
}

export default StoryRankingPage;
