import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import readingHistoryService from '../services/readingHistoryService';
import MostRecentStoryCard from '../components/readingHistory/MostRecentStoryCard';
import HistoryToolbar from '../components/readingHistory/HistoryToolbar';
import HistoryItemCard from '../components/readingHistory/HistoryItemCard';
import LoadMoreSection from '../components/readingHistory/LoadMoreSection';
import ConfirmDialog from '../components/ConfirmDialog';
import './ReadingHistoryPage.css';

const ReadingHistoryPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
        // Sử dụng format đúng route: /stories/{storyId}/chapters/{chapterId}?segmentId=...
        const segmentParam = response.segmentId ? `?segmentId=${response.segmentId}` : '';
        navigate(`/stories/${storyId}/chapters/${response.chapterId}${segmentParam}`);
      } else {
        navigate(`/stories/${storyId}/metadata`);
      }
    } catch (error) {
      console.error('Error continuing reading:', error);
      // Fallback to story metadata page
      navigate(`/stories/${storyId}/metadata`);
    }
  };

  const handleClearAllHistory = async () => {
    setShowConfirmDialog(true);
  };

  const confirmClearHistory = async () => {
    try {
      await readingHistoryService.clearHistory();
      // Reset và refresh lại dữ liệu
      setHistoryData(null);
      setCurrentPage(0);
      // Load lại dữ liệu từ đầu
      await loadReadingHistory();
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Error clearing history:', error);
      setShowConfirmDialog(false);
    }
  };

  const cancelClearHistory = () => {
    setShowConfirmDialog(false);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const filteredHistories = historyData?.histories?.filter(history => {
    // Filter by search term
    const matchesSearch = history.storyTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filter by date
    let matchesDate = true;
    if (filter === 'today') {
      const today = new Date();
      const historyDate = new Date(history.lastReadAt);
      
      // Check if history is from today (same date)
      matchesDate = today.toDateString() === historyDate.toDateString();
    }
    
    return matchesSearch && matchesDate;
  }) || [];

  // Include featured story in search results if it matches
  const allSearchResults = searchTerm ? [
    ...(historyData?.mostRecent && historyData.mostRecent.storyTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ? [historyData.mostRecent] : []),
    ...filteredHistories
  ] : filteredHistories;

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
        {/* Featured Story */}
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
          {allSearchResults.length > 0 ? (
            allSearchResults.map((history, index) => (
              <HistoryItemCard
                key={`${history.storyId}-${index}`}
                history={history}
                onContinueReading={() => handleContinueReading(history.storyId)}
                onReread={() => navigate(`/stories/${history.storyId}/metadata`)}
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
        {hasMore && allSearchResults.length > 0 && (
          <LoadMoreSection
            onLoadMore={handleLoadMore}
            loading={loading}
            currentCount={allSearchResults.length}
            totalCount={historyData?.totalElements || 0}
          />
        )}
      </div>

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Xóa Lịch Sử Đọc"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử đọc không? Hành động này không thể hoàn tác."
        onConfirm={confirmClearHistory}
        onCancel={cancelClearHistory}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
};

export default ReadingHistoryPage;
