import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MostRecentStoryCard.css';

const MostRecentStoryCard = ({ story, onContinueReading }) => {
  const navigate = useNavigate();

  const formatDate = (lastReadAt) => {
    if (!lastReadAt) return '';
    const date = new Date(lastReadAt);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getProgressInfo = (story) => {
    // Sử dụng data thực tế từ API response
    const current = story.chaptersRead || 0;
    const total = story.totalChapters || 1;
    const progress = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    
    return {
      current: current,
      total: total,
      progress: Math.round(progress)
    };
  };

  const progressInfo = getProgressInfo(story);

  return (
    <div className="most-recent-story-card">
      <div className="card-content">
        <div className="left-content">
          <div className="most-recent-badge">MOST RECENT</div>
          <h2 className="story-title">{story.storyTitle}</h2>
          <p className="last-read-info">
            Last read: <span className="chapter-highlight">
              Chapter {progressInfo.current}
            </span> · {formatDate(story.lastReadAt)}
          </p>
          <div className="progress-section">
            <p className="progress-text">
              Chapter {progressInfo.current} / {progressInfo.total}
            </p>
            <p className="progress-percentage">{progressInfo.progress}% Completed</p>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressInfo.progress}%` }}
            ></div>
          </div>
          <div className="action-buttons">
            <button 
              className="btn-primary continue-btn"
              onClick={onContinueReading}
            >
              Continue Reading
            </button>
            <button 
              className="btn-secondary details-btn"
              onClick={() => navigate(`/story/${story.storyId}`)}
            >
              Details
            </button>
          </div>
        </div>
        <div className="right-content">
          {story.storyCoverUrl && !story.storyCoverUrl.includes('no-cover-placeholder') ? (
            <img 
              src={story.storyCoverUrl} 
              alt={story.storyTitle}
              className="story-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          {(!story.storyCoverUrl || story.storyCoverUrl.includes('no-cover-placeholder')) && (
            <div className="cover-placeholder">
              <div className="no-cover-text">NO COVER</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MostRecentStoryCard;
