import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthorRankingPage from './AuthorRankingPage';
import RecentlyUpdatedStoriesPage from './RecentlyUpdatedStoriesPage';
import StoryRankingPage from './StoryRankingPage';
import '../../styles/ranking-pages.css';

const VIEWS = [
  { value: 'stories', label: 'Xếp hạng truyện' },
  { value: 'recent', label: 'Cập nhật gần đây' },
  { value: 'authors', label: 'Xếp hạng tác giả' },
];

function RankingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeView = searchParams.get('view') || 'stories';
  const isValidView = VIEWS.some((view) => view.value === activeView);

  useEffect(() => {
    if (!isValidView) {
      setSearchParams({ view: 'stories' }, { replace: true });
    }
  }, [isValidView, setSearchParams]);

  const currentView = isValidView ? activeView : 'stories';

  return (
    <>
      <div className='ranking-hub'>
        <div
          className='ranking-hub__switcher'
          role='tablist'
          aria-label='Chọn màn xếp hạng'
        >
          {VIEWS.map((view) => (
            <button
              key={view.value}
              type='button'
              role='tab'
              aria-selected={currentView === view.value}
              className={`ranking-hub__switcher-item ${
                currentView === view.value ? 'active' : ''
              }`}
              onClick={() => setSearchParams({ view: view.value })}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {currentView === 'stories' && <StoryRankingPage />}
      {currentView === 'recent' && <RecentlyUpdatedStoriesPage />}
      {currentView === 'authors' && <AuthorRankingPage />}
    </>
  );
}

export default RankingPage;
