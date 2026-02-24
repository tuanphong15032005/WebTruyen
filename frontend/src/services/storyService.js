// frontend/src/services/storyService.js
import api from './api';
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8081/api';

const storyService = {
  createStory: (formData) => {
    return api.post('/stories', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  getStory: (storyId) => api.get(`/stories/${storyId}`),
  getPublicStory: (storyId) => api.get(`/public/stories/${storyId}`),
  // Mục đích: Lấy dữ liệu sidebar metadata (thông tin thêm/truyện tương tự/cùng tác giả). Hieuson + 10h30
  getPublicStorySidebar: (storyId) =>
    api.get(`/public/stories/${storyId}/sidebar`),

  updateStory: (storyId, formData) => {
    return api.put(`/stories/${storyId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  createVolume: (storyId, payload) =>
    api.post(`/stories/${storyId}/volumes`, payload),

  getVolumes: (storyId) => api.get(`/stories/${storyId}/volumes`),
  getPublicVolumes: (storyId) => api.get(`/public/stories/${storyId}/volumes`),

  getStoryReviews: (storyId, params = {}) =>
    api.get(`/public/stories/${storyId}/reviews`, { params }),
  upsertStoryReview: (storyId, payload) =>
    api.post(`/stories/${storyId}/reviews`, payload),

  getStoryComments: (storyId, params = {}) =>
    api.get(`/public/stories/${storyId}/comments`, { params }),
  // Hieuson - 24/2 + Lấy 3 phản hồi cộng đồng mới nhất để hiển thị trên HomePage.
  getLatestCommunityComments: (params = {}) =>
    api.get(`/public/comments/latest`, { params }),
  createStoryComment: (storyId, payload) =>
    api.post(`/stories/${storyId}/comments`, payload),
  updateStoryComment: (storyId, commentId, payload) =>
    api.put(`/stories/${storyId}/comments/${commentId}`, payload),
  deleteStoryComment: (storyId, commentId) =>
    api.delete(`/stories/${storyId}/comments/${commentId}`),
  reportStoryComment: (storyId, commentId, payload) =>
    api.post(`/stories/${storyId}/comments/${commentId}/report`, payload),

  getChapterComments: (storyId, chapterId, params = {}) =>
    api.get(`/public/stories/${storyId}/chapters/${chapterId}/comments`, {
      params,
    }),
  createChapterComment: (storyId, chapterId, payload) =>
    api.post(`/stories/${storyId}/chapters/${chapterId}/comments`, payload),
  updateChapterComment: (storyId, chapterId, commentId, payload) =>
    api.put(
      `/stories/${storyId}/chapters/${chapterId}/comments/${commentId}`,
      payload,
    ),
  deleteChapterComment: (storyId, chapterId, commentId) =>
    api.delete(`/stories/${storyId}/chapters/${chapterId}/comments/${commentId}`),
  reportChapterComment: (storyId, chapterId, commentId, payload) =>
    api.post(
      `/stories/${storyId}/chapters/${chapterId}/comments/${commentId}/report`,
      payload,
    ),

  getNotifyStatus: (storyId) => api.get(`/stories/${storyId}/notify-status`),

  toggleNotifyStatus: (storyId) =>
    api.post(`/stories/${storyId}/notify-status/toggle`),

  getLibraryStatus: (storyId) => api.get(`/stories/${storyId}/library-status`),

  toggleLibraryStatus: (storyId) =>
    api.post(`/stories/${storyId}/library/toggle`),

  createChapter: (storyId, volumeId, payload) =>
    api.post(`/stories/${storyId}/volumes/${volumeId}/chapters`, payload),

  updateChapter: (storyId, volumeId, chapterId, payload) =>
    api.put(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, payload),

  getChapterContent: (storyId, chapterId) =>
    api.get(`/stories/${storyId}/chapters/${chapterId}/content`),

  getChapterDraft: (storyId, volumeId, chapterId) =>
    api.get(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`),

  saveChapterDraft: (storyId, volumeId, chapterId, payload) =>
    api.put(
      `/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`,
      payload,
    ),

  deleteChapterDraft: (storyId, volumeId, chapterId) =>
    api.delete(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`),

  getTags: async () => {
    try {
      const response = await api.get('/tags');
      console.log('Raw tags response:', response);
      return response;
    } catch {
      // Fallback for legacy tag endpoint.
      const fallbackResponse = await api.get('/v1/tags');
      console.log('Fallback tags response:', fallbackResponse);
      return fallbackResponse;
    }
  },
  getPublicStories: (params = {}) =>
      api.get(`/public/stories`, { params }),

    getMyStories: () => api.get(`/stories/my`),
    getLibraryStories: () => api.get(`/stories/library`),
};

export default storyService;
