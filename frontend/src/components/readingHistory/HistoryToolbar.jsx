import React, { useState } from 'react';
import './HistoryToolbar.css';

const HistoryToolbar = ({ 
  searchTerm, 
  onSearchChange, 
  filter, 
  onFilterChange, 
  onClearAll, 
  hasHistory 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const filterOptions = [
    { value: 'all', label: 'All History' },
    { value: 'today', label: 'Today' }
  ];

  const handleFilterSelect = (value) => {
    onFilterChange(value);
    setShowDropdown(false);
  };

  return (
    <div className="history-toolbar">
      <div className="toolbar-left">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search in history..."
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
        {/* Filter Dropdown */}
        <div className="filter-dropdown">
          <button 
            className="dropdown-trigger"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            {filterOptions.find(f => f.value === filter)?.label || 'All History'}
            <svg className="dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          
          {showDropdown && (
            <div className="dropdown-menu">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`dropdown-item ${filter === option.value ? 'active' : ''}`}
                  onClick={() => handleFilterSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Clear All Button */}
        {hasHistory && (
          <button 
            className="clear-all-btn"
            onClick={onClearAll}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showDropdown && (
        <div 
          className="dropdown-overlay"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default HistoryToolbar;
