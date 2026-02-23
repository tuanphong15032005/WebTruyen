import api from './api';

/**
 * Lấy danh sách bookmark của user hiện tại theo chương.
 * @param {number|string} chapterId
 * @returns {Promise<BookmarkResponse[]>}
 */
export const getBookmarksByChapter = (chapterId) =>
  api.get('/bookmarks/chapter/${chapterId}');

/**
 * Tạo bookmark mới.
 * @param {{ chapterId: number, segmentId: number, positionPercent?: number, isFavorite?: boolean }} payload
 * @returns {Promise<BookmarkResponse>}
 */
export const createBookmark = (payload) =>
  api.post('/bookmarks', payload);

/**
 * Xóa bookmark theo id.
 * @param {number|string} bookmarkId
 * @returns {Promise<void>}
 */
export const deleteBookmark = (bookmarkId) =>
  api.delete('/bookmarks/${bookmarkId}');