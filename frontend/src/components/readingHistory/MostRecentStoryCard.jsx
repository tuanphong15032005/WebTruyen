import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/MostRecentStoryCard.css';

const MostRecentStoryCard = ({ story, onContinueReading }) => {
  const navigate = useNavigate();

  const formatDate = (lastReadAt) => {
    if (!lastReadAt) return '';
    const date = new Date(lastReadAt);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
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
                    <h2 className="story-title">{story.storyTitle}</h2>
          <p className="last-read-info">
            Đọc lần cuối: <span className="chapter-highlight">
              Chương {progressInfo.current}
            </span> · {formatDate(story.lastReadAt)}
          </p>
          <div className="progress-section">
            <p className="progress-text">
              Chương {progressInfo.current} / {progressInfo.total}
            </p>
            <p className="progress-percentage">{progressInfo.progress}% Đã đọc</p>
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
              Tiếp tục đọc
            </button>
            <button 
              className="btn-secondary details-btn"
              onClick={() => navigate(`/stories/${story.storyId}/metadata`)}
            >
              Chi tiết
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
              <div className="no-cover-text">KHÔNG CÓ BÌA</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MostRecentStoryCard;
