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

  getNotifyStatus: (storyId) => api.get(`/api/stories/${storyId}/notify-status`),

  toggleNotifyStatus: (storyId) =>
    api.post(`/api/stories/${storyId}/notify-status/toggle`),

  createChapter: (storyId, volumeId, payload) =>
    api.post(`/api/stories/${storyId}/volumes/${volumeId}/chapters`, payload),

  updateChapter: (storyId, volumeId, chapterId, payload) =>
    api.put(`/api/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, payload),

  getChapterContent: (storyId, chapterId) =>
    api.get(`/api/stories/${storyId}/chapters/${chapterId}/content`),

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
