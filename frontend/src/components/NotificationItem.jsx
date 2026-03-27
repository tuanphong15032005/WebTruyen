import React from 'react';
import { BookOpen, Clock, Coins, MessageCircle, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useNotify from '../hooks/useNotify';
import { notificationService } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';
import { navigateToStoryTarget } from '../utils/storyAccess';

const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  const { notify } = useNotify();
  const user = getStoredUser();
  const userId = user?.id ?? user?.userId ?? null;

  const normalizedType = notification.type?.toLowerCase();

  const getNotificationIcon = () => {
    switch (normalizedType) {
      case 'new_chapter':
      case 'new_story':
      case 'chapter_schedule':
      case 'report':
      case 'story_moderation':
        return <BookOpen size={20} />;
      case 'comment':
        return <MessageCircle size={20} />;
      case 'system':
        return <Trophy size={20} />;
      case 'topup':
      case 'transaction':
        return <Coins size={20} />;
      default:
        return <MessageCircle size={20} />;
    }
  };

  const getNotificationColor = () => {
    switch (normalizedType) {
      case 'new_chapter':
      case 'new_story':
      case 'chapter_schedule':
      case 'report':
      case 'story_moderation':
        return 'story';
      case 'comment':
        return 'interaction';
      case 'system':
        return 'achievement';
      case 'topup':
      case 'transaction':
        return 'transaction';
      default:
        return 'neutral';
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

  const handleClick = async () => {
    notificationService.markSeenThrough(userId, notification.createdAt);

    const storyId = notification?.storyId;
    const chapterId = notification?.chapterId;

    if (normalizedType === 'comment' && storyId) {
      await navigateToStoryTarget({
        navigate,
        notify,
        storyId,
        chapterId,
        hash: chapterId ? '' : 'comments',
        fallbackPath: '/notifications',
      });
      return;
    }

    if (
      ['new_chapter', 'new_story', 'chapter_schedule'].includes(normalizedType) &&
      storyId
    ) {
      await navigateToStoryTarget({
        navigate,
        notify,
        storyId,
        chapterId: normalizedType === 'new_chapter' ? chapterId : null,
        fallbackPath: '/notifications',
      });
      return;
    }

    navigate(notificationService.resolveTarget(notification));
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  const tone = getNotificationColor();

  return (
    <div
      className={`notification-item notification-item--${tone} ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className={`notification-item__icon notification-item__icon--${tone}`}>
        {getNotificationIcon()}
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
      </div>

      {!notification.isRead && (
        <div className="notification-item__unread-indicator" />
      )}
    </div>
  );
};

export default NotificationItem;
