import React from 'react';
import { useNavigate } from 'react-router-dom';
import './TopBar.css';

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

  const handleProfileClick = () => {
    navigate('/profile');
  };

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="page-title">Author Dashboard</h1>
      </div>
      
      <div className="topbar-center">
        <button 
          className="create-story-btn"
          onClick={handleCreateStory}
        >
          + Tạo truyện mới
        </button>
      </div>
    </div>
  );
};

export default TopBar;
