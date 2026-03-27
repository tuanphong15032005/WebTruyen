import api from './api';
import {
  getNotificationSeenAt,
  markNotificationListAsSeen,
  markNotificationsSeenThrough,
  resolveNotificationTarget,
} from '../utils/notificationUtils';

const appendSeenAtParam = (params, userId) => {
  const seenAt = getNotificationSeenAt(userId);
  if (seenAt) {
    params.append('seenAt', seenAt);
  }
};

export const notificationService = {
  // Get notifications with optional category filter
  getNotifications: async (category = null, page = 0, size = 20, userId = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (page !== null && page !== undefined) params.append('page', page.toString());
    if (size !== null && size !== undefined) params.append('size', size.toString());
    appendSeenAtParam(params, userId);

    const queryString = params.toString();
    const response = await api.get(queryString ? `/notifications?${queryString}` : '/notifications');
    return response;
  },

  // Get unread notification count
  getUnreadCount: async (userId = null) => {
    const params = new URLSearchParams();
    appendSeenAtParam(params, userId);

    const queryString = params.toString();
    const response = await api.get(
      queryString ? `/notifications/unread-count?${queryString}` : '/notifications/unread-count',
    );
    return response;
  },

  markSeenThrough: (userId, createdAt) => markNotificationsSeenThrough(userId, createdAt),

  markVisibleAsSeen: (userId, notifications = []) => markNotificationListAsSeen(userId, notifications),

  resolveTarget: (notification) => resolveNotificationTarget(notification)
};

export default notificationService;
