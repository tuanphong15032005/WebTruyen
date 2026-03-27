import React from 'react';
import '../../styles/HistoryToolbar.css';

const HistoryToolbar = ({ 
  searchTerm, 
  onSearchChange, 
  onClearAll, 
  hasHistory 
}) => {
  return (
    <div className="history-toolbar">
      <div className="toolbar-left">
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm trong lịch sử..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>
      </div>

      <div className="toolbar-right">
        {/* Clear All Button */}
        {hasHistory && (
          <button 
            className="clear-all-btn"
            onClick={onClearAll}
          >
            Xóa tất cả
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryToolbar;
