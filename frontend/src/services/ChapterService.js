import api from './api';

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

