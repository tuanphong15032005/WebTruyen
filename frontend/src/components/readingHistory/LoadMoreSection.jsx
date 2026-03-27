import React from 'react';
import '../../styles/LoadMoreSection.css';

const LoadMoreSection = ({ onLoadMore, loading, currentCount, totalCount }) => {
  return (
    <div className="load-more-section">
      <p className="showing-text">
        Hiển thị {currentCount} của {totalCount} truyện trong lịch sử
      </p>
      <button 
        className="load-more-btn"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? 'Đang tải...' : 'Tải thêm lịch sử'}
      </button>
    </div>
  );
};

export default LoadMoreSection;
