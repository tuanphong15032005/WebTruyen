import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, BookOpen, Coins, MessageCircle, Trophy, X } from 'lucide-react';
import useNotify from '../hooks/useNotify';
import { notificationService } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';
import {
  NOTIFICATIONS_SEEN_UPDATED_EVENT,
  getNotificationSeenAt,
  getNotificationSeenStorageKey,
  isNotificationRead,
} from '../utils/notificationUtils';
import { navigateToStoryTarget } from '../utils/storyAccess';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { notify } = useNotify();
  const user = getStoredUser();
  const userId = user?.id ?? user?.userId ?? null;

  const fetchUnreadCountAPI = async (targetUserId) => {
    const requestedSeenAt = getNotificationSeenAt(targetUserId);

    try {
      const count = await notificationService.getUnreadCount(targetUserId);
      if (requestedSeenAt !== getNotificationSeenAt(targetUserId)) {
        return;
      }

      setUnreadCount(count.totalCount || 0);
    } catch (error) {
      if (requestedSeenAt !== getNotificationSeenAt(targetUserId)) {
        return;
      }

      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!userId) return undefined;

    fetchUnreadCountAPI(userId);
    const interval = setInterval(() => fetchUnreadCountAPI(userId), 30000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const handleSeenUpdated = (event) => {
      if (event.detail?.userId !== userId) {
        return;
      }

      const seenAt = event.detail?.seenAt;
      fetchUnreadCountAPI(userId);
      if (!seenAt) {
        return;
      }

      setRecentNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: isNotificationRead(notification, seenAt),
        })),
      );
    };

    const storageKey = getNotificationSeenStorageKey(userId);
    const handleStorage = (event) => {
      if (event.key && event.key !== storageKey) {
        return;
      }

      const seenAt = getNotificationSeenAt(userId);
      fetchUnreadCountAPI(userId);
      setRecentNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: isNotificationRead(notification, seenAt),
        })),
      );
    };

    window.addEventListener(NOTIFICATIONS_SEEN_UPDATED_EVENT, handleSeenUpdated);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(NOTIFICATIONS_SEEN_UPDATED_EVENT, handleSeenUpdated);
      window.removeEventListener('storage', handleStorage);
    };
  }, [userId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return undefined;
  }, [isOpen]);

  const handleToggleDropdown = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const notifications = await notificationService.getNotifications(null, 0, 5, userId);
        setRecentNotifications(notifications.notifications || []);
      } catch (error) {
        console.error('Failed to fetch recent notifications:', error);
        setRecentNotifications([]);
      } finally {
        setLoading(false);
      }
    }

    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notification) => {
    const seenAt = notificationService.markSeenThrough(userId, notification.createdAt);

    if (seenAt) {
      setRecentNotifications((currentNotifications) =>
        currentNotifications.map((currentNotification) => ({
          ...currentNotification,
          isRead: isNotificationRead(currentNotification, seenAt),
        })),
      );
    }

    setIsOpen(false);
    const normalizedType = String(notification?.type || '').toLowerCase();
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

  const handleViewAllClick = () => {
    const seenAt = notificationService.markVisibleAsSeen(userId, recentNotifications);

    if (seenAt) {
      setRecentNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(0);
    }

    setIsOpen(false);
  };

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'new_chapter':
      case 'new_story':
      case 'story_moderation':
      case 'chapter_schedule':
      case 'report':
        return <BookOpen size={16} />;
      case 'comment':
        return <MessageCircle size={16} />;
      case 'system':
        return <Trophy size={16} />;
      case 'topup':
      case 'transaction':
        return <Coins size={16} />;
      default:
        return <Bell size={16} />;
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

  if (!userId) return null;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        onClick={handleToggleDropdown}
        aria-label="Thông báo"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__header">
            <h3>Thông báo</h3>
            <button
              type="button"
              className="notification-bell__close"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
            >
              <X size={16} />
            </button>
          </div>

          <div className="notification-bell__content">
            {loading ? (
              <div className="notification-bell__loading">
                Đang tải...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="notification-bell__empty">
                Không có thông báo mới
              </div>
            ) : (
              <div className="notification-bell__list">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    className={`notification-bell__item ${notification.isRead ? 'read' : 'unread'}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-bell__item-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-bell__item-content">
                      <div className="notification-bell__item-message">
                        {notification.message}
                      </div>
                      <div className="notification-bell__item-time">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="notification-bell__footer">
            <Link
              to="/notifications"
              className="notification-bell__view-all"
              onClick={handleViewAllClick}
            >
              Xem tất cả thông báo
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
