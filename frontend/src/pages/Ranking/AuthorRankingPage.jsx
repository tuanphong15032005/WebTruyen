import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Users } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner';
import rankingService from '../../services/rankingService';
import '../../styles/ranking-pages.css';

const formatNumber = (n) => Number(n ?? 0).toLocaleString('vi-VN');

function AuthorRankingPage() {
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    rankingService
      .getAuthorRanking({ limit: 100 })
      .then((data) => {
        if (!cancelled) setList(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Không tải được dữ liệu');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="ranking-page ranking-page--authors">
        <div className="ranking-page__loading">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-page ranking-page--authors">
        <div className="ranking-page__error">{error}</div>
      </div>
    );
  }

  return (
    <div className="ranking-page ranking-page--authors">
      <header className="ranking-page__hero">
        <h1 className="ranking-page__title">
          <Award className="ranking-page__title-icon" size={28} />
          Xếp hạng tác giả theo lượt theo dõi
        </h1>
        <p className="ranking-page__subtitle">
          Các tác giả được sắp xếp theo số người theo dõi (follow) tài khoản. Bấm vào tên để xem trang cá nhân.
        </p>
      </header>

      <section className="ranking-page__content">
        {list.length === 0 ? (
          <p className="ranking-page__empty">Chưa có dữ liệu xếp hạng.</p>
        ) : (
          <>
            <p className="ranking-page__section-label">Bảng xếp hạng</p>
            <ol className="author-ranking-list">
              {list.map((item) => {
                const rank = item.rank ?? 0;
                const rankClass = rank === 1 ? 'author-ranking-item--rank-1' : rank === 2 ? 'author-ranking-item--rank-2' : rank === 3 ? 'author-ranking-item--rank-3' : '';
                return (
              <li key={item.userId} className={`author-ranking-item ${rankClass}`}>
                <span className="author-ranking-item__rank">#{rank || '-'}</span>
                <Link
                  to={`/portfolio/${item.userId}`}
                  className="author-ranking-item__avatar-wrap"
                >
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt=""
                      className="author-ranking-item__avatar"
                    />
                  ) : (
                    <span className="author-ranking-item__avatar-placeholder">
                      <Users size={24} />
                    </span>
                  )}
                </Link>
                <div className="author-ranking-item__info">
                  <Link to={`/portfolio/${item.userId}`} className="author-ranking-item__name">
                    {item.authorPenName || item.displayName || `User #${item.userId}`}
                  </Link>
                  <span className="author-ranking-item__followers">
                    {formatNumber(item.followersCount)} theo dõi
                  </span>
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

export default AuthorRankingPage;
