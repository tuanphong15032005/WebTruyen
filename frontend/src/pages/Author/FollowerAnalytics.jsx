import { useEffect, useMemo, useState } from 'react';
import authorAnalyticsService from '../../services/authorAnalyticsService';
import '../../styles/author-follower-analytics.css';

// Minhdq - 26/02/2026
// [Add author-follower-list-and-growth-ui - V1 - branch: clone-minhfinal2]
const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('vi-VN');
};

function FollowerGrowthChart({ data }) {
  const max = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 1;
    return Math.max(...data.map((item) => Number(item.value) || 0), 1);
  }, [data]);

  if (!data?.length) {
    return <div className='author-follower__chart-empty'>No growth data</div>;
  }

  return (
    <div className='author-follower__chart'>
      {data.map((item, index) => {
        const value = Number(item.value) || 0;
        const heightPercent = Math.max(10, Math.round((value / max) * 100));
        return (
          <div className='author-follower__bar-item' key={`${item.period}-${index}`}>
            <span className='author-follower__bar-value'>{value}</span>
            <div
              className='author-follower__bar'
              style={{ height: `${heightPercent}%` }}
              title={`${item.period}: ${value}`}
            />
            <span className='author-follower__bar-label'>{item.period}</span>
          </div>
        );
      })}
    </div>
  );
}

function FollowerAnalytics() {
  const [followers, setFollowers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [followerList, followerStats] = await Promise.all([
        authorAnalyticsService.getAuthorFollowers(),
        authorAnalyticsService.getAuthorFollowerStats(),
      ]);
      setFollowers(Array.isArray(followerList) ? followerList : []);
      setStats(followerStats || null);
    } catch (err) {
      setError(err.message || 'Failed to load follower analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className='author-follower'>
      <header className='author-follower__header'>
        <h1>Phân tích người theo dõi</h1>
        <p>Theo dõi ai đang theo dõi bạn và sự tăng trưởng số lượng người theo dõi theo thời gian.</p>
      </header>

      {error && <div className='author-follower__error'>{error}</div>}

      {loading ? (
        <div className='author-follower__placeholder'>Loading follower data...</div>
      ) : (
        <>
          <div className='author-follower__summary-grid'>
            <article>
              <span>Total followers</span>
              <strong>{stats?.totalFollowers ?? 0}</strong>
            </article>
            <article>
              <span>New followers (7 days)</span>
              <strong>{stats?.newFollowersLast7Days ?? 0}</strong>
            </article>
            <article>
              <span>New followers (30 days)</span>
              <strong>{stats?.newFollowersLast30Days ?? 0}</strong>
            </article>
          </div>

          <article className='author-follower__card'>
            <h3>Follower growth statistics</h3>
            <FollowerGrowthChart data={stats?.followerGrowthOverTime || []} />
          </article>

          <section className='author-follower__card'>
            <h3>Follower list</h3>
            <div className='author-follower__table-wrap'>
              <table>
                <thead>
                  <tr>
                    <th>Follower name</th>
                    <th>Followed time</th>
                  </tr>
                </thead>
                <tbody>
                  {followers.length === 0 ? (
                    <tr>
                      <td colSpan={2} className='author-follower__empty'>
                        No followers yet
                      </td>
                    </tr>
                  ) : (
                    followers.map((item) => (
                      <tr key={`${item.followerId}-${item.followedAt}`}>
                        <td>{item.followerName || 'Unknown'}</td>
                        <td>{formatDateTime(item.followedAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default FollowerAnalytics;
