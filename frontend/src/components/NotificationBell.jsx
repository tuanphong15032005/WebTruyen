import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, BookOpen, MessageCircle, Trophy, Coins, X } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';

function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const user = getStoredUser();

  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        setUnreadCount(count.totalCount || 0);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [user]);

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
  }, [isOpen]);

  const handleToggleDropdown = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const notifications = await notificationService.getNotifications(null, 0, 5);
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

  const getNotificationIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'new_chapter':
      case 'report':
        return <BookOpen size={16} />;
      case 'system':
        return <Trophy size={16} />;
      case 'topup':
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

  if (!user) return null;

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
                  <div
                    key={notification.id}
                    className={`notification-bell__item ${notification.isRead ? 'read' : 'unread'}`}
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="notification-bell__footer">
            <Link
              to="/notifications"
              className="notification-bell__view-all"
              onClick={() => setIsOpen(false)}
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
