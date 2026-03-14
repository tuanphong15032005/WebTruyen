import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import readingHistoryService from '../services/readingHistoryService';
import MostRecentStoryCard from '../components/readingHistory/MostRecentStoryCard';
import HistoryToolbar from '../components/readingHistory/HistoryToolbar';
import HistoryItemCard from '../components/readingHistory/HistoryItemCard';
import LoadMoreSection from '../components/readingHistory/LoadMoreSection';
import './ReadingHistoryPage.css';

const ReadingHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadReadingHistory();
  }, [currentPage]);

  const loadReadingHistory = async () => {
    try {
      setLoading(true);
      const response = await readingHistoryService.getReadingHistory(currentPage, 10);
      
      if (currentPage === 0) {
        setHistoryData(response);
      } else {
        setHistoryData(prev => ({
          ...prev,
          histories: [...prev.histories, ...response.histories]
        }));
      }
      
      setHasMore(response.currentPage < response.totalPages - 1);
    } catch (error) {
      console.error('Error loading reading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueReading = async (storyId) => {
    try {
      const response = await readingHistoryService.continueReading(storyId);
      if (response.chapterId) {
        // Sử dụng format giống màn bookmark: /reader?storyId=...&chapterId=...&segmentId=...
        const segmentParam = response.segmentId ? `&segmentId=${response.segmentId}` : '';
        navigate(`/reader?storyId=${storyId}&chapterId=${response.chapterId}${segmentParam}`);
      } else {
        navigate(`/story/${storyId}`);
      }
    } catch (error) {
      console.error('Error continuing reading:', error);
      // Fallback to story page
      navigate(`/story/${storyId}`);
    }
  };

  const handleClearAllHistory = async () => {
    if (window.confirm('Are you sure you want to clear all reading history? This action cannot be undone.')) {
      try {
        await readingHistoryService.clearHistory();
        setHistoryData(null);
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const filteredHistories = historyData?.histories?.filter(history => 
    history.storyTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading && currentPage === 0) {
    return (
      <div className="reading-history-page">
        <div className="loading-spinner">Loading reading history...</div>
      </div>
    );
  }

  return (
    <div className="reading-history-page">
      <div className="reading-history-container">
        {/* Most Recent Story */}
        {historyData?.mostRecent && (
          <MostRecentStoryCard 
            story={historyData.mostRecent}
            onContinueReading={() => handleContinueReading(historyData.mostRecent.storyId)}
          />
        )}

        {/* Toolbar */}
        <HistoryToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filter={filter}
          onFilterChange={setFilter}
          onClearAll={handleClearAllHistory}
          hasHistory={historyData?.histories?.length > 0}
        />

        {/* History List */}
        <div className="history-list">
          {filteredHistories.length > 0 ? (
            filteredHistories.map((history, index) => (
              <HistoryItemCard
                key={`${history.storyId}-${index}`}
                history={history}
                onContinueReading={() => handleContinueReading(history.storyId)}
                onReread={() => navigate(`/story/${history.storyId}`)}
              />
            ))
          ) : (
            <div className="empty-history">
              <p>No reading history found</p>
              <button 
                className="browse-stories-btn"
                onClick={() => navigate('/')}
              >
                Browse Stories
              </button>
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && filteredHistories.length > 0 && (
          <LoadMoreSection
            onLoadMore={handleLoadMore}
            loading={loading}
            currentCount={filteredHistories.length}
            totalCount={historyData?.totalElements || 0}
          />
        )}
      </div>
    </div>
  );
};

export default ReadingHistoryPage;
