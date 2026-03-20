import React from 'react';
import { BookOpen, MessageCircle, Trophy, Coins, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'new_chapter':
      case 'report':
        return <BookOpen size={20} />;
      case 'comment':
        return <MessageCircle size={20} />;
      case 'system':
        return <Trophy size={20} />;
      case 'topup':
        return <Coins size={20} />;
      default:
        return <MessageCircle size={20} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'new_chapter':
      case 'report':
        return 'text-blue-600 bg-blue-100';
      case 'comment':
        return 'text-purple-600 bg-purple-100';
      case 'system':
        return 'text-yellow-600 bg-yellow-100';
      case 'topup':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (createdAt) => {
    if (!createdAt) return '';
    
    const now = new Date();
    const created = new Date(createdAt);
    const diffInMinutes = Math.floor((now - created) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return created.toLocaleDateString('vi-VN');
  };

  const handleClick = () => {
    // Navigate to comment location if it's a comment notification
    if (notification.type?.toLowerCase() === 'comment') {
      if (notification.chapterId && notification.storyId) {
        // Navigate to chapter page with comment section
        navigate(`/stories/${notification.storyId}/chapters/${notification.chapterId}#comments`);
      } else if (notification.storyId) {
        // Navigate to story metadata page with comment section
        navigate(`/stories/${notification.storyId}/metadata#comments`);
      }
    }
  };

  return (
    <div
      className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className={`notification-item__icon ${getNotificationColor(notification.type)}`}>
        {getNotificationIcon(notification.type)}
      </div>
      
      <div className="notification-item__content">
        <div className="notification-item__header">
          <h4 className="notification-item__title">
            {notification.title || 'Thông báo'}
          </h4>
          <div className="notification-item__time">
            <Clock size={14} />
            {formatTimeAgo(notification.createdAt)}
          </div>
        </div>
        
        <p className="notification-item__message">
          {notification.message}
        </p>
        
        {(notification.storyId || notification.chapterId) && (
          <div className="notification-item__reference">
            {notification.storyId && (
              <span className="notification-item__ref-tag">
                Story ID: {notification.storyId}
              </span>
            )}
            {notification.chapterId && (
              <span className="notification-item__ref-tag">
                Chapter ID: {notification.chapterId}
              </span>
            )}
          </div>
        )}
      </div>
      
      {!notification.isRead && (
        <div className="notification-item__unread-indicator" />
      )}
    </div>
  );
};

export default NotificationItem;
