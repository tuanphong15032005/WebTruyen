import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import readingHistoryService from '../services/readingHistoryService';
import MostRecentStoryCard from '../components/readingHistory/MostRecentStoryCard';
import HistoryToolbar from '../components/readingHistory/HistoryToolbar';
import HistoryItemCard from '../components/readingHistory/HistoryItemCard';
import LoadMoreSection from '../components/readingHistory/LoadMoreSection';
import ConfirmDialog from '../components/ConfirmDialog';
import useNotify from '../hooks/useNotify';
import { navigateToStoryTarget } from '../utils/storyAccess';
import '../styles/ReadingHistoryPage.css';

const ReadingHistoryPage = () => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
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
        const segmentParam = response.segmentId
          ? `?segmentId=${response.segmentId}`
          : '';
        await navigateToStoryTarget({
          navigate,
          notify,
          storyId,
          chapterId: response.chapterId,
          search: segmentParam,
          fallbackPath: '/reading-history',
        });
      } else {
        await navigateToStoryTarget({
          navigate,
          notify,
          storyId,
          fallbackPath: '/reading-history',
        });
      }
    } catch (error) {
      console.error('Error continuing reading:', error);
      // Fallback to story metadata page
      await navigateToStoryTarget({
        navigate,
        notify,
        storyId,
        fallbackPath: '/reading-history',
      });
    }
  };

  const handleOpenStoryDetails = async (storyId) => {
    await navigateToStoryTarget({
      navigate,
      notify,
      storyId,
      fallbackPath: '/reading-history',
    });
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

  const removeVietnameseDiacritics = (str) => {
    return str.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  const filteredHistories = historyData?.histories?.filter(history => {
    // Filter by search term with diacritic removal (fuzzy search)
    const searchTermNormalized = removeVietnameseDiacritics(searchTerm.toLowerCase());
    const storyTitleNormalized = removeVietnameseDiacritics(history.storyTitle?.toLowerCase() || '');
    
    return storyTitleNormalized.includes(searchTermNormalized);
  }) || [];

  // Include featured story in search results if it matches
  const allSearchResults = searchTerm ? [
    ...(historyData?.mostRecent && removeVietnameseDiacritics(historyData.mostRecent.storyTitle?.toLowerCase() || '').includes(removeVietnameseDiacritics(searchTerm.toLowerCase())) ? [historyData.mostRecent] : []),
    ...filteredHistories
  ] : filteredHistories;

  if (loading && currentPage === 0) {
    return (
      <div className="reading-history-page">
        <div className="loading-spinner">Đang tải lịch sử đọc...</div>
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
            onOpenDetails={() => handleOpenStoryDetails(historyData.mostRecent.storyId)}
          />
        )}

        {/* Toolbar */}
        <HistoryToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
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
                onReread={() => handleOpenStoryDetails(history.storyId)}
              />
            ))
          ) : (
            <div className="empty-history">
              <p>Không tìm thấy lịch sử đọc</p>
              <button 
                className="browse-stories-btn"
                onClick={() => navigate('/')}
              >
                Khám phá truyện
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
