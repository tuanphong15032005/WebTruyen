import api from './api';

export const notificationService = {
  // Get notifications with optional category filter
  getNotifications: async (category = null, page = 0, size = 20) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (page !== null && page !== undefined) params.append('page', page.toString());
    if (size !== null && size !== undefined) params.append('size', size.toString());

    const response = await api.get(`/notifications?${params.toString()}`);
    return response;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response;
  },

  // Mark all notifications as read (optional category filter)
  markAllAsRead: async (category = null) => {
    const params = category ? `?category=${category}` : '';
    const response = await api.put(`/notifications/read-all${params}`);
    return response;
  },

  // Get transaction history for transaction tab
  getTransactionHistory: async (page = 0, size = 20) => {
    const params = `?page=${page}&size=${size}`;
    const response = await api.get(`/wallet/ledger-entries${params}`);
    return response;
  }
};

export default notificationService;
