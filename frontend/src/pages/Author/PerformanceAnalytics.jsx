import { useEffect, useMemo, useState } from 'react';
import authorAnalyticsService from '../../services/authorAnalyticsService';
import '../../styles/author-performance-analytics.css';

function SimpleBarChart({ title, data, colorClass }) {
  const max = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return 1;
    return Math.max(...data.map((item) => Number(item.value) || 0), 1);
  }, [data]);

  return (
    <article className='author-analytics__chart-card'>
      <h3>{title}</h3>
      <div className='author-analytics__chart'>
        {!data || data.length === 0 ? (
          <div className='author-analytics__chart-empty'>No data</div>
        ) : (
          data.map((item, index) => {
            const value = Number(item.value) || 0;
            const heightPercent = Math.max(6, Math.round((value / max) * 100));
            return (
              <div className='author-analytics__bar-item' key={`${item.period}-${index}`}>
                <div
                  className={`author-analytics__bar ${colorClass}`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${item.period}: ${value}`}
                />
                <span className='author-analytics__bar-label'>{item.period}</span>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function PerformanceAnalytics() {
  const [storyOptions, setStoryOptions] = useState([]);
  const [selectedStoryId, setSelectedStoryId] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState('');

  const loadStoryOptions = async () => {
    setLoading(true);
    setError('');
    try {
      const stories = await authorAnalyticsService.getAuthorStories();
      const list = Array.isArray(stories) ? stories : [];
      setStoryOptions(list);
      if (list.length > 0) {
        const firstId = String(list[0].id);
        setSelectedStoryId(firstId);
        await loadStoryPerformance(firstId);
      } else {
        setAnalytics(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load story options');
    } finally {
      setLoading(false);
    }
  };

  const loadStoryPerformance = async (storyId) => {
    if (!storyId) {
      setAnalytics(null);
      return;
    }
    setLoadingDetail(true);
    setError('');
    try {
      const data = await authorAnalyticsService.getStoryPerformance(storyId);
      setAnalytics(data);
    } catch (err) {
      setError(err.message || 'Failed to load analytics');
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadStoryOptions();
  }, []);

  const handleChangeStory = async (event) => {
    const storyId = event.target.value;
    setSelectedStoryId(storyId);
    await loadStoryPerformance(storyId);
  };

  return (
    <section className='author-analytics'>
      <header className='author-analytics__header'>
        <h1>Performance Analytics</h1>
        <p>Track views, followers, and Coin revenue to evaluate your story performance.</p>
      </header>

      <div className='author-analytics__toolbar'>
        <label htmlFor='storySelector'>Story selector</label>
        <select
          id='storySelector'
          value={selectedStoryId}
          onChange={handleChangeStory}
          disabled={loading || storyOptions.length === 0}
        >
          {storyOptions.length === 0 ? (
            <option value=''>No stories available</option>
          ) : (
            storyOptions.map((story) => (
              <option key={story.id} value={story.id}>
                {story.title}
              </option>
            ))
          )}
        </select>
      </div>

      {error && <div className='author-analytics__error'>{error}</div>}

      {!analytics || loadingDetail ? (
        <div className='author-analytics__placeholder'>Loading analytics...</div>
      ) : (
        <>
          <div className='author-analytics__kpi-grid'>
            <article className='author-analytics__kpi'>
              <span>Total views</span>
              <strong>{analytics.totalViews ?? 0}</strong>
            </article>
            <article className='author-analytics__kpi'>
              <span>Total Coin earned</span>
              <strong>{analytics.totalCoinEarned ?? 0}</strong>
            </article>
            <article className='author-analytics__kpi'>
              <span>Total followers</span>
              <strong>{analytics.totalFollowers ?? 0}</strong>
            </article>
          </div>

          <div className='author-analytics__charts-grid'>
            <SimpleBarChart
              title='Views over time'
              data={analytics.viewsOverTime}
              colorClass='views'
            />
            <SimpleBarChart
              title='Coin revenue chart'
              data={analytics.coinRevenueOverTime}
              colorClass='coin'
            />
            <SimpleBarChart
              title='Follower growth chart'
              data={analytics.followerGrowthOverTime}
              colorClass='followers'
            />
          </div>

          <section className='author-analytics__table-wrap'>
            <h3>Chapter performance table</h3>
            <table>
              <thead>
                <tr>
                  <th>Chapter</th>
                  <th>Status</th>
                  <th>Estimated Views</th>
                  <th>Coin Earned</th>
                  <th>Unlock Count</th>
                </tr>
              </thead>
              <tbody>
                {analytics.chapterPerformance?.length ? (
                  analytics.chapterPerformance.map((chapter) => (
                    <tr key={chapter.chapterId}>
                      <td>{chapter.chapterTitle}</td>
                      <td>{chapter.status}</td>
                      <td>{chapter.estimatedViews ?? 0}</td>
                      <td>{chapter.coinEarned ?? 0}</td>
                      <td>{chapter.unlockCount ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className='author-analytics__empty'>
                      No chapter statistics
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </>
      )}
    </section>
  );
}

export default PerformanceAnalytics;
