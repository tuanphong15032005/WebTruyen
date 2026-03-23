import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Coins, MessageCircle, RefreshCw, Trophy } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';
import { getNotificationSeenAt } from '../utils/notificationUtils';
import NotificationItem from '../components/NotificationItem';
import '../styles/notification-page.css';

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = getStoredUser();
  const userId = user?.id ?? user?.userId ?? null;
  const pageSize = 20;
  const debounceTimeoutRef = useRef(null);

  const tabs = [
    { id: 'all', label: 'Tất cả', icon: MessageCircle },
    { id: 'story', label: 'Truyện', icon: BookOpen },
    { id: 'interaction', label: 'Tương tác', icon: MessageCircle },
    { id: 'achievement', label: 'Thành tựu', icon: Trophy },
    { id: 'transaction', label: 'Giao dịch', icon: Coins },
  ];

  useEffect(() => {
    if (!userId) return;
    fetchUnreadCountAPI(userId);
    fetchNotificationsAPI(currentPage, activeTab, userId);
  }, [userId, currentPage, activeTab]);

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  const fetchNotificationsAPI = async (page, tab, targetUserId = userId) => {
    setLoading(true);
    setError(null);

    try {
      const category = tab === 'all' ? null : tab.toUpperCase();
      const response = await notificationService.getNotifications(
        category,
        page,
        pageSize,
        targetUserId,
      );

      await new Promise((resolve) => setTimeout(resolve, 300));

      const nextNotifications = response.notifications || [];
      const shouldAutoMarkVisible =
        tab === 'all' && page === 0 && nextNotifications.length > 0;

      if (shouldAutoMarkVisible) {
        notificationService.markVisibleAsSeen(targetUserId, nextNotifications);
      }

      setNotifications(
        shouldAutoMarkVisible
          ? nextNotifications.map((notification) => ({
              ...notification,
              isRead: true,
            }))
          : nextNotifications,
      );
      setTotalPages(response.totalPages || 0);

      if (shouldAutoMarkVisible) {
        setUnreadCount(0);
      }
    } catch (fetchError) {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
      console.error('Failed to fetch notifications:', fetchError);
      setNotifications([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCountAPI = async (targetUserId = userId) => {
    const requestedSeenAt = getNotificationSeenAt(targetUserId);

    try {
      const count = await notificationService.getUnreadCount(targetUserId);
      if (requestedSeenAt !== getNotificationSeenAt(targetUserId)) {
        return;
      }

      setUnreadCount(count.totalCount || 0);
    } catch (fetchError) {
      if (requestedSeenAt !== getNotificationSeenAt(targetUserId)) {
        return;
      }

      console.error('Failed to fetch unread count:', fetchError);
      setUnreadCount(0);
    }
  };

  const handleTabChange = (newTab) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      setActiveTab(newTab);
      setCurrentPage(0);
    }, 200);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (!user) {
    return (
      <div className="notification-page">
        <div className="notification-page__container">
          <div className="notification-page__auth-required">
            <h2>Vui lòng đăng nhập</h2>
            <p>Bạn cần đăng nhập để xem thông báo.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="notification-page">
      <div className="notification-page__container">
        <div className="notification-page__header">
          <div className="notification-page__title">
            <h1>Thông báo</h1>
            {unreadCount > 0 && (
              <span className="notification-page__unread-badge">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>
        </div>

        <div className="notification-page__tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? unreadCount : 0;

            return (
              <button
                key={tab.id}
                className={`notification-page__tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <Icon size={18} />
                {tab.label}
                {count > 0 && (
                  <span className="notification-page__tab-badge">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="notification-page__content">
          {loading ? (
            <div className="notification-page__loading">
              <RefreshCw className="animate-spin" size={24} />
              <p>Đang tải...</p>
            </div>
          ) : error ? (
            <div className="notification-page__error">
              <p>{error}</p>
              <button onClick={() => fetchNotificationsAPI(currentPage, activeTab, userId)}>
                Thử lại
              </button>
            </div>
          ) : (
            <div className="notification-page__notifications">
              {notifications.length === 0 ? (
                <div className="notification-page__empty">
                  <MessageCircle size={48} />
                  <h3>Không có thông báo nào</h3>
                  <p>Bạn không có thông báo nào trong danh mục này.</p>
                </div>
              ) : (
                <div className="notification-page__notification-list">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="notification-page__pagination">
            <button
              className="notification-page__pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              Trang trước
            </button>

            <span className="notification-page__pagination-info">
              Trang {currentPage + 1} / {totalPages}
            </span>

            <button
              className="notification-page__pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
