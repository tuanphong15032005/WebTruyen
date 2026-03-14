import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../services/dashboardService';
import './MyStories.css';

/**
 * MyStories component
 * Panel displaying author's latest stories with management actions
 * Shows story cover, title, status, chapter count, and action buttons
 */
const MyStories = ({ stories }) => {
  const navigate = useNavigate();

  const handleEditStory = (storyId) => {
    navigate(`/author/edit-story/${storyId}`);
  };

  const handleAddChapter = (storyId) => {
    navigate(`/author/story/${storyId}/add-chapter`);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'draft': 'Bản nháp',
      'published': 'Đã xuất bản',
      'completed': 'Hoàn thành',
      'paused': 'Tạm dừng'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    return `status-${status}`;
  };

  if (!stories || stories.length === 0) {
    return (
      <div className="dashboard-my-stories">
        <div className="dashboard-panel-header">
          <h3>Truyện của tôi</h3>
          <button 
            className="view-all-btn"
            onClick={() => navigate('/author/my-stories')}
          >
            Xem tất cả
          </button>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>Bạn chưa có truyện nào</p>
          <button 
            className="create-first-story-btn"
            onClick={() => navigate('/author/create-story')}
          >
            Tạo truyện đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-my-stories">
      <div className="dashboard-panel-header">
        <h3>Truyện của tôi</h3>
        <button 
          className="view-all-btn"
          onClick={() => navigate('/author/my-stories')}
        >
          Xem tất cả
        </button>
      </div>
      
      <div className="stories-list">
        {stories.map((story) => (
          <div key={story.storyId} className="story-item">
            <div className="story-cover">
              <img 
                src={story.coverUrl || 'https://via.placeholder.com/80x120'} 
                alt={story.title}
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/80x120';
                }}
              />
            </div>
            
            <div className="story-info">
              <h4 className="dashboard-story-title">{story.title}</h4>
              <div className="story-meta">
                <span className={`story-status ${getStatusClass(story.status)}`}>
                  {getStatusText(story.status)}
                </span>
                <span className="chapter-count">
                  {story.chapterCount} chương
                </span>
              </div>
              <div className="story-updated">
                Cập nhật: {formatRelativeTime(story.updatedAt)}
              </div>
            </div>
            
            <div className="story-actions">
              <button 
                className="dashboard-action-btn edit-btn"
                onClick={() => handleEditStory(story.storyId)}
              >
                Chỉnh sửa
              </button>
              <button 
                className="dashboard-action-btn add-chapter-btn"
                onClick={() => handleAddChapter(story.storyId)}
              >
                Thêm chương
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyStories;
