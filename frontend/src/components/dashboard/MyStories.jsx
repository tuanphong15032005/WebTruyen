import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRelativeTime } from '../../services/dashboardService';
import '../../styles/MyStories.css';

/**
 * MyStories component
 * Panel displaying author's latest stories with modern design
 * Shows story cover (3:4 ratio), title, status badge, and action buttons
 */
const MyStories = ({ stories }) => {
  const navigate = useNavigate();

  const visibleStories = Array.isArray(stories)
    ? stories.filter(
        (story) => String(story?.status || '').toLowerCase() !== 'archived',
      )
    : [];

  const handleViewAnalytics = () => {
    navigate('/author/performance-analytics');
  };

  const handleViewStoryDetail = (storyId) => {
    if (!storyId) return;
    navigate(`/author/stories/${storyId}`);
  };

  const handleManageStories = () => {
    navigate('/author/my-stories');
  };

  const getStatusText = (status) => {
    const normalizedStatus = String(status || '').toLowerCase();
    const statusMap = {
      draft: 'Bản nháp',
      published: 'Đã xuất bản',
      completed: 'Hoàn thành',
      paused: 'Tạm dừng',
    };
    return statusMap[normalizedStatus] || status;
  };

  const getStatusClass = (status) => `status-${String(status || '').toLowerCase()}`;

  if (visibleStories.length === 0) {
    return (
      <div className='dashboard-my-stories'>
        <div className='dashboard-panel-header'>
          <h3>Truyện của tôi</h3>
          <button
            type='button'
            className='view-all-btn'
            onClick={handleManageStories}
          >
            Quản lý truyện
          </button>
        </div>
        <div className='empty-state'>
          <div className='empty-icon'>📚</div>
          <p>Bạn chưa có truyện nào</p>
          <button
            className='create-first-story-btn'
            onClick={() => navigate('/author/create-story')}
          >
            Tạo truyện đầu tiên
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-my-stories'>
      <div className='dashboard-panel-header'>
        <h3>Truyện của tôi</h3>
        <button
          type='button'
          className='view-all-btn'
          onClick={handleManageStories}
        >
          Quản lý truyện
        </button>
      </div>

      <div className='stories-list'>
        {visibleStories.map((story) => {
          const storyId = story?.storyId ?? story?.id;

          return (
            <div key={storyId} className='story-item'>
              <div className='story-cover'>
                <img
                  src={story.coverUrl || 'https://via.placeholder.com/120x160'}
                  alt={story.title}
                  onError={(event) => {
                    event.currentTarget.src = 'https://via.placeholder.com/120x160';
                  }}
                />
              </div>

              <div className='story-info'>
                <h4 className='dashboard-story-title'>{story.title}</h4>
                <div className='story-meta'>
                  <span className={`story-status ${getStatusClass(story.status)}`}>
                    {getStatusText(story.status)}
                  </span>
                  <span className='chapter-count'>{story.chapterCount} chương</span>
                </div>
                <div className='story-updated'>
                  Cập nhật: {formatRelativeTime(story.updatedAt)}
                </div>
              </div>

              <div className='story-actions'>
                <button
                  type='button'
                  className='dashboard-action-btn primary-btn'
                  onClick={() => handleViewAnalytics(storyId)}
                >
                  Xem thống kê
                </button>
                <button
                  type='button'
                  className='dashboard-action-btn secondary-btn'
                  onClick={() => handleViewStoryDetail(storyId)}
                >
                  Chi tiết
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyStories;
