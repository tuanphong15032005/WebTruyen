import api from './api';

const getAuthToken = () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) return accessToken;

  const rawUser = localStorage.getItem('user');
  if (!rawUser) return '';

  try {
    const parsed = JSON.parse(rawUser);
    return parsed?.token || parsed?.accessToken || '';
  } catch {
    return '';
  }
};

/**
 * Lấy chi tiết chương (bao gồm segments, next/prev chapter id).
 * @param {number|string} chapterId
 * @returns {Promise<ChapterDetailResponse>}
 */
//export const getChapterDetail = (chapterId) =>
//  api.get(`/chapters/${chapterId}/detail`);
export const getChapterDetail = (chapterId) =>
    api.get(`/chapters/${chapterId}`);

/**
 * Lấy danh sách chương của một truyện (dùng cho side panel).
 * @param {number|string} storyId
 * @returns {Promise<ChapterResponse[]>}
 */
export const getChaptersByStory = (storyId) =>
  api.get(`/chapters/story/${storyId}`);

/**
 * Ghi nhận lượt xem chương sau khi reader ở lại đủ thời gian.
 * @param {number|string} chapterId
 * @param {number|string|null} segmentId
 * @returns {Promise<void>}
 */
export const recordChapterView = (chapterId, segmentId = null) =>
  api.post(`/chapters/${chapterId}/view`, { segmentId });

/**
 * Cập nhật savepoint đọc gần nhất sau khi session đã đủ điều kiện ghi nhận.
 * @param {number|string} chapterId
 * @param {number|string|null} segmentId
 * @returns {Promise<void>}
 */
export const updateReadingProgress = (chapterId, segmentId = null) =>
  api.post(`/chapters/${chapterId}/progress`, { segmentId });

/**
 * Gửi savepoint bằng fetch keepalive để tăng tỉ lệ hoàn tất khi page đang đóng.
 * @param {number|string} chapterId
 * @param {number|string|null} segmentId
 */
export const sendReadingProgressKeepalive = (chapterId, segmentId = null) => {
  const token = getAuthToken();
  if (!chapterId || !token) return;

  const baseUrl =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    'http://localhost:8081/api';

  const endpointBase = String(baseUrl).replace(/\/$/, '');
  const url = `${endpointBase}/chapters/${chapterId}/progress`;

  fetch(url, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ segmentId }),
  }).catch(() => {});
};

