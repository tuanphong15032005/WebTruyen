import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/TopBar.css';

/**
 * TopBar component
 * Header bar for author dashboard with title, actions, and user profile
 * Contains page title, create story button, and user profile section
 */
const TopBar = () => {
  const navigate = useNavigate();

  const handleCreateStory = () => {
    navigate('/author/create-story');
  };

  const handleViewPerformance = () => {
    navigate('/author/performance-analytics');
  };

  return (
    <div className='topbar'>
      <div className='topbar-left'></div>

      <div className='topbar-center'>
        <div className='topbar-actions'>
          <button className='performance-report-btn' onClick={handleViewPerformance}>
            Báo cáo hiệu suất
          </button>
          <button className='create-story-btn' onClick={handleCreateStory}>
            + Tạo truyện mới
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
