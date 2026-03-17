import React from 'react';
import { formatRelativeTime } from '../../services/dashboardService';
import './LatestCommentsSidebar.css';

/**
 * LatestCommentsSidebar component
 * Sidebar displaying latest comments and author tips
 * Shows user avatars, usernames, comment content, story names, and timing
 */
const LatestCommentsSidebar = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="latest-comments-sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-title">Bình luận mới nhất</h3>
          <div className="empty-comments">
            <div className="empty-icon">💬</div>
            <p>Chưa có bình luận nào</p>
          </div>
        </div>
        
        <div className="sidebar-section">
          <div className="author-tips-card">
            <div className="tips-header">
              <span className="tips-icon">⚡</span>
              <h4 className="tips-title">Mẹo Tác Giả</h4>
            </div>
            <p className="tips-content">
              Cập nhật truyện vào khung giờ 19:00 - 21:00 giúp dễ dàng tăng lượt xem hơn
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-comments-sidebar">
      <div className="sidebar-section">
        <h3 className="sidebar-title">Bình luận mới nhất</h3>
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.commentId} className="comment-item">
              <div className="comment-avatar">
                <img 
                  src={comment.avatar || 'https://via.placeholder.com/40x40'} 
                  alt={comment.username}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40x40';
                  }}
                />
              </div>
              
              <div className="comment-content">
                <div className="comment-header">
                  <span className="comment-username">{comment.username}</span>
                  <span className="comment-time">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                
                <div className="comment-text">
                  {comment.content.length > 100 
                    ? `${comment.content.substring(0, 100)}...` 
                    : comment.content
                  }
                </div>
                
                <div className="comment-story">
                  <span className="story-label">Truyện:</span>
                  <span className="story-name">{comment.storyTitle}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="sidebar-section">
        <div className="author-tips-card">
          <div className="tips-header">
            <span className="tips-icon">⚡</span>
            <h4 className="tips-title">Mẹo Tác Giả</h4>
          </div>
          <p className="tips-content">
            Cập nhật truyện vào khung giờ 19:00 - 21:00 giúp dễ dàng tăng lượt xem hơn
          </p>
        </div>
      </div>
    </div>
  );
};

export default LatestCommentsSidebar;
