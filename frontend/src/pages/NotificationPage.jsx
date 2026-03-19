import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { BookOpen, MessageCircle, Trophy, Coins, Check, RefreshCw } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { getStoredUser } from '../utils/helpers';
import NotificationItem from '../components/NotificationItem';
import '../styles/notification-page.css';

const NotificationPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const user = getStoredUser();
  const pageSize = 20;
  const debounceTimeoutRef = useRef(null);

  const tabs = [
    { id: 'all', label: 'Tất cả', icon: MessageCircle },
    { id: 'story', label: 'Truyện', icon: BookOpen },
    { id: 'interaction', label: 'Tương tác', icon: MessageCircle },
    { id: 'achievement', label: 'Thành tựu', icon: Trophy },
    { id: 'transaction', label: 'Giao dịch', icon: Coins }
  ];

  useEffect(() => {
    if (!user) return;
    
    fetchUnreadCountAPI(user.id);
    fetchNotificationsAPI(user.id, currentPage, activeTab);
  }, [user?.id, currentPage, activeTab]); // Clear dependencies

  // Remove old useEffect that causes conflicts

  // Fetch functions outside effects to prevent closure issues
  const fetchNotificationsAPI = async (userId, page, tab) => {
    if (tab === 'transaction') {
      try {
        const response = await notificationService.getTransactionHistory(page, pageSize);
        await new Promise(resolve => setTimeout(resolve, 300));
        setTransactions(response.content || []);
        setTotalPages(response.totalPages || 0);
        setTotalElements(response.totalElements || 0);
      } catch (error) {
        setError('Không thể tải lịch sử giao dịch. Vui lòng thử lại.');
        console.error('Failed to fetch transactions:', error);
        setTransactions([]);
        setTotalPages(0);
        setTotalElements(0);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const category = tab === 'all' ? null : tab.toUpperCase();
      const response = await notificationService.getNotifications(category, page, pageSize);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setNotifications(response.notifications || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      console.log('Notifications fetched:', response.notifications?.length || 0);
    } catch (error) {
      setError('Không thể tải thông báo. Vui lòng thử lại.');
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCountAPI = async (userId) => {
    try {
      const count = await notificationService.getUnreadCount(userId);
      setUnreadCount(count.totalCount || 0);
      console.log('Unread count fetched:', count.totalCount);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      setUnreadCount(0);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      fetchUnreadCountAPI(user?.id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const category = activeTab === 'all' ? null : activeTab.toUpperCase();
      await notificationService.markAllAsRead(category);
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      fetchUnreadCountAPI(user?.id);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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

  const formatTransactionAmount = (delta) => {
    const amount = Math.abs(delta);
    const formatted = amount.toLocaleString('vi-VN');
    return delta >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatTransactionType = (reason) => {
    switch (reason?.toLowerCase()) {
      case 'chapter_purchase':
        return 'Mua chương';
      case 'chapter_sale':
        return 'Bán chương';
      case 'topup':
        return 'Nạp tiền';
      case 'withdrawal':
        return 'Rút tiền';
      case 'donation':
        return 'Ủng hộ';
      case 'refund':
        return 'Hoàn tiền';
      default:
        return reason || 'Giao dịch';
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
          
          {activeTab !== 'transaction' && notifications.length > 0 && (
            <button
              className="notification-page__mark-all-read"
              onClick={handleMarkAllAsRead}
            >
              <Check size={16} />
              Đánh dấu đã đọc tất cả
            </button>
          )}
        </div>

        <div className="notification-page__tabs">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const count = tab.id === 'all' ? unreadCount : 
                        tab.id === 'story' ? 0 : // We would need to get category-specific counts
                        tab.id === 'interaction' ? 0 :
                        tab.id === 'achievement' ? 0 :
                        0;
            
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
              <button onClick={() => fetchNotificationsAPI(user?.id, currentPage, activeTab)}>
                Thử lại
              </button>
            </div>
          ) : activeTab === 'transaction' ? (
            <div className="notification-page__transactions">
              {transactions.length === 0 ? (
                <div className="notification-page__empty">
                  <Coins size={48} />
                  <h3>Không có giao dịch nào</h3>
                  <p>Bạn chưa có giao dịch nào gần đây.</p>
                </div>
              ) : (
                <>
                  <div className="notification-page__transaction-list">
                    {transactions.map(transaction => (
                      <div key={transaction.id} className="notification-page__transaction-item">
                        <div className="notification-page__transaction-icon">
                          <Coins size={20} />
                        </div>
                        <div className="notification-page__transaction-content">
                          <div className="notification-page__transaction-header">
                            <h4>{formatTransactionType(transaction.reason)}</h4>
                            <span className={`notification-page__transaction-amount ${transaction.delta >= 0 ? 'positive' : 'negative'}`}>
                              {formatTransactionAmount(transaction.delta)} xu
                            </span>
                          </div>
                          <p className="notification-page__transaction-description">
                            {transaction.description || `${formatTransactionType(transaction.reason)} - ID: ${transaction.refId}`}
                          </p>
                          <p className="notification-page__transaction-time">
                            {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
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
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={handleMarkAsRead}
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
