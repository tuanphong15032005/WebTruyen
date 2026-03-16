import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HistoryItemCard.css';

const HistoryItemCard = ({ history, onContinueReading, onReread }) => {
  const navigate = useNavigate();

  const getProgressInfo = (history) => {
    // Sử dụng data thực tế từ API response
    const current = history.chaptersRead || 0;
    const total = history.totalChapters || 1;
    const progress = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    
    return {
      current: current,
      total: total,
      progress: Math.round(progress)
    };
  };

  const progressInfo = getProgressInfo(history);

  return (
    <div className="history-item-card">
      <div className="card-layout">
        {/* Cover Image */}
        <div className="cover-section">
          {history.storyCoverUrl ? (
            <img 
              src={history.storyCoverUrl} 
              alt={history.storyTitle}
              className="story-cover-small"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {(!history.storyCoverUrl || history.storyCoverUrl.includes('no-cover-placeholder')) && (
            <div className="cover-placeholder">
              <div className="no-cover-text">NO COVER</div>
            </div>
          )}
        </div>

        {/* Story Info */}
        <div className="story-info">
          <h3 className="story-title">{history.storyTitle}</h3>
          <div className="progress-info">
            <p className="chapter-progress">
              Chapter {progressInfo.current} / {progressInfo.total}
            </p>
            <div className="mini-progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progressInfo.progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Time and Actions */}
        <div className="time-actions">
          <div className="action-buttons">
            <button 
              className="action-btn continue-btn"
              onClick={onContinueReading}
              title="Continue reading"
            >
              Continue
            </button>
            <button 
              className="action-btn reread-btn"
              onClick={onReread}
              title="View story details"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryItemCard;
