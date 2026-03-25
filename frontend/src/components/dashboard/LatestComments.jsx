import React from 'react';
import { formatRelativeTime } from '../../services/dashboardService';
import '../../styles/LatestComments.css';

/**
 * LatestComments component
 * Panel displaying latest comments on author's stories
 * Shows user avatar, username, comment content, story name, and time
 */
const LatestComments = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return (
      <div className="latest-comments">
        <div className="dashboard-panel-header">
          <h3>Bình luận mới nhất</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">💬</div>
          <p>Chưa có bình luận nào</p>
        </div>
      </div>
    );
  }

  return (
    <div className="latest-comments">
      <div className="panel-header">
        <h3>Bình luận mới nhất</h3>
      </div>
      
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
      
      <div className="comments-footer">
        <button className="view-all-comments-btn">
          Xem tất cả bình luận
        </button>
      </div>
    </div>
  );
};

export default LatestComments;
