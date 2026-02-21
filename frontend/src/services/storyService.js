// frontend/src/services/storyService.js
import api from './api';

const storyService = {
  createStory: (formData) => api.post('/api/stories', formData),

  getStory: (storyId) => api.get(`/api/stories/${storyId}`),
  getPublicStory: (storyId) => api.get(`/api/public/stories/${storyId}`),

  updateStory: (storyId, formData) => api.put(`/api/stories/${storyId}`, formData),

  createVolume: (storyId, payload) =>
    api.post(`/api/stories/${storyId}/volumes`, payload),

  getVolumes: (storyId) => api.get(`/api/stories/${storyId}/volumes`),
  getPublicVolumes: (storyId) => api.get(`/api/public/stories/${storyId}/volumes`),

  getStoryReviews: (storyId, params = {}) =>
    api.get(`/api/public/stories/${storyId}/reviews`, { params }),
  upsertStoryReview: (storyId, payload) =>
    api.post(`/api/stories/${storyId}/reviews`, payload),

  getStoryComments: (storyId, params = {}) =>
    api.get(`/api/public/stories/${storyId}/comments`, { params }),
  createStoryComment: (storyId, payload) =>
    api.post(`/api/stories/${storyId}/comments`, payload),
  updateStoryComment: (storyId, commentId, payload) =>
    api.put(`/api/stories/${storyId}/comments/${commentId}`, payload),
  deleteStoryComment: (storyId, commentId) =>
    api.delete(`/api/stories/${storyId}/comments/${commentId}`),
  reportStoryComment: (storyId, commentId, payload) =>
    api.post(`/api/stories/${storyId}/comments/${commentId}/report`, payload),

  getChapterComments: (storyId, chapterId, params = {}) =>
    api.get(`/api/public/stories/${storyId}/chapters/${chapterId}/comments`, {
      params,
    }),
  createChapterComment: (storyId, chapterId, payload) =>
    api.post(`/api/stories/${storyId}/chapters/${chapterId}/comments`, payload),

  getNotifyStatus: (storyId) => api.get(`/api/stories/${storyId}/notify-status`),

  toggleNotifyStatus: (storyId) =>
    api.post(`/api/stories/${storyId}/notify-status/toggle`),

  getLibraryStatus: (storyId) => api.get(`/api/stories/${storyId}/library-status`),

  toggleLibraryStatus: (storyId) =>
    api.post(`/api/stories/${storyId}/library/toggle`),

  createChapter: (storyId, volumeId, payload) =>
    api.post(`/api/stories/${storyId}/volumes/${volumeId}/chapters`, payload),

  updateChapter: (storyId, volumeId, chapterId, payload) =>
    api.put(`/api/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, payload),

  getChapterContent: (storyId, chapterId) =>
    api.get(`/api/stories/${storyId}/chapters/${chapterId}/content`),

  getChapterDraft: (storyId, volumeId, chapterId) =>
    api.get(`/api/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`),

  saveChapterDraft: (storyId, volumeId, chapterId, payload) =>
    api.put(
      `/api/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`,
      payload,
    ),

  deleteChapterDraft: (storyId, volumeId, chapterId) =>
    api.delete(`/api/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}/draft`),

  getTags: async () => {
    try {
      return await api.get('/api/tags');
    } catch {
      // Fallback for legacy tag endpoint.
      return api.get('/api/v1/tags');
    }
  },
};

export default storyService;
