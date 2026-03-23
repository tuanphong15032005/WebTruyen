const NOTIFICATION_SEEN_STORAGE_PREFIX = 'notificationsSeenAt:';

export const NOTIFICATIONS_SEEN_UPDATED_EVENT = 'notifications-seen-updated';

const normalizeTimestamp = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized ? normalized : null;
};

export const getNotificationSeenStorageKey = (userId) => {
  if (userId === null || userId === undefined || userId === '') {
    return null;
  }

  return `${NOTIFICATION_SEEN_STORAGE_PREFIX}${userId}`;
};

export const compareNotificationTimestamps = (left, right) => {
  const normalizedLeft = normalizeTimestamp(left);
  const normalizedRight = normalizeTimestamp(right);

  if (normalizedLeft === normalizedRight) {
    return 0;
  }

  if (!normalizedLeft) {
    return -1;
  }

  if (!normalizedRight) {
    return 1;
  }

  return normalizedLeft.localeCompare(normalizedRight);
};

export const getNotificationSeenAt = (userId) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKey = getNotificationSeenStorageKey(userId);
  if (!storageKey) {
    return null;
  }

  return normalizeTimestamp(window.localStorage.getItem(storageKey));
};

export const isNotificationRead = (notification, seenAt) => {
  const createdAt = normalizeTimestamp(notification?.createdAt);
  const checkpoint = normalizeTimestamp(seenAt);

  if (!createdAt || !checkpoint) {
    return false;
  }

  return compareNotificationTimestamps(createdAt, checkpoint) <= 0;
};

export const markNotificationsSeenThrough = (userId, createdAt) => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKey = getNotificationSeenStorageKey(userId);
  const normalizedCreatedAt = normalizeTimestamp(createdAt);
  if (!storageKey || !normalizedCreatedAt) {
    return null;
  }

  const currentSeenAt = getNotificationSeenAt(userId);
  const nextSeenAt =
    compareNotificationTimestamps(normalizedCreatedAt, currentSeenAt) > 0
      ? normalizedCreatedAt
      : currentSeenAt;

  if (!nextSeenAt || nextSeenAt === currentSeenAt) {
    return nextSeenAt;
  }

  window.localStorage.setItem(storageKey, nextSeenAt);
  window.dispatchEvent(
    new CustomEvent(NOTIFICATIONS_SEEN_UPDATED_EVENT, {
      detail: { userId, seenAt: nextSeenAt },
    }),
  );

  return nextSeenAt;
};

export const markNotificationListAsSeen = (userId, notifications = []) => {
  const newestCreatedAt = notifications.reduce((latestCreatedAt, notification) => {
    if (compareNotificationTimestamps(notification?.createdAt, latestCreatedAt) > 0) {
      return notification.createdAt;
    }

    return latestCreatedAt;
  }, null);

  return markNotificationsSeenThrough(userId, newestCreatedAt);
};

export const resolveNotificationTarget = (notification) => {
  const normalizedType = String(notification?.type || '').toLowerCase();
  const storyId = notification?.storyId;
  const chapterId = notification?.chapterId;

  switch (normalizedType) {
    case 'comment':
      if (storyId && chapterId) {
        return `/stories/${storyId}/chapters/${chapterId}#comments`;
      }
      if (storyId) {
        return `/stories/${storyId}/metadata#comments`;
      }
      return '/notifications';
    case 'story_moderation':
      return storyId ? `/author/stories/${storyId}` : '/notifications';
    case 'new_chapter':
      if (storyId && chapterId) {
        return `/stories/${storyId}/chapters/${chapterId}`;
      }
      return storyId ? `/stories/${storyId}/metadata` : '/notifications';
    case 'new_story':
    case 'chapter_schedule':
      return storyId ? `/stories/${storyId}/metadata` : '/notifications';
    case 'topup':
    case 'transaction':
      return '/donation-history';
    case 'system':
      return '/achievements';
    default:
      return '/notifications';
  }
};
