import React from 'react';
import './LoadMoreSection.css';

const LoadMoreSection = ({ onLoadMore, loading, currentCount, totalCount }) => {
  return (
    <div className="load-more-section">
      <p className="showing-text">
        Showing {currentCount} of {totalCount} stories in history
      </p>
      <button 
        className="load-more-btn"
        onClick={onLoadMore}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Load more history'}
      </button>
    </div>
  );
};

export default LoadMoreSection;
