// frontend/src/services/storyService.js
import api from './api';

const storyService = {
  createStory: (formData) => api.post('/stories', formData),

  getStory: (storyId) => api.get(`/stories/${storyId}`),
  getPublicStory: (storyId) => api.get(`/public/stories/${storyId}`),

  updateStory: (storyId, formData) => api.put(`/stories/${storyId}`, formData),

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
  createStoryComment: (storyId, payload) =>
    api.post(`/stories/${storyId}/comments`, payload),

  getChapterComments: (storyId, chapterId, params = {}) =>
    api.get(`/public/stories/${storyId}/chapters/${chapterId}/comments`, {
      params,
    }),
  createChapterComment: (storyId, chapterId, payload) =>
    api.post(`/stories/${storyId}/chapters/${chapterId}/comments`, payload),

  getAuthorCommentStories: () => api.get('/author/comments/stories'),
  getAuthorCommentChapters: (storyId) =>
    api.get(`/author/comments/stories/${storyId}/chapters`),
  getAuthorComments: (params) => api.get('/author/comments', { params }),
  replyAuthorComment: (commentId, payload) =>
    api.post(`/author/comments/${commentId}/reply`, payload),
  hideAuthorComment: (commentId) => api.post(`/author/comments/${commentId}/hide`),
  unhideAuthorComment: (commentId) => api.post(`/author/comments/${commentId}/unhide`),
  deleteAuthorComment: (commentId) => api.delete(`/author/comments/${commentId}`),

  getNotifyStatus: (storyId) => api.get(`/stories/${storyId}/notify-status`),

  toggleNotifyStatus: (storyId) =>
    api.post(`/stories/${storyId}/notify-status/toggle`),

  createChapter: (storyId, volumeId, payload) =>
    api.post(`/stories/${storyId}/volumes/${volumeId}/chapters`, payload),

  updateChapter: (storyId, volumeId, chapterId, payload) =>
    api.put(`/stories/${storyId}/volumes/${volumeId}/chapters/${chapterId}`, payload),

  getChapterContent: (storyId, chapterId) =>
    api.get(`/stories/${storyId}/chapters/${chapterId}/content`),

  getTags: async () => {
    try {
      return await api.get('/tags');
    } catch {
      return api.get('/v1/tags');
    }
  },

  getPublicStories: (params = {}) => 
    api.get('/public/stories', { params }),

  getPendingModerationContent: () =>
    api.get('/admin/moderation/pending-content'),
  approveModerationStory: (storyId) =>
    api.post(`/admin/moderation/stories/${storyId}/approve`),
  rejectModerationStory: (storyId, note) =>
    api.post(`/admin/moderation/stories/${storyId}/reject`, { note }),
  requestEditModerationStory: (storyId, note) =>
    api.post(`/admin/moderation/stories/${storyId}/request-edit`, { note }),

  approveModerationChapter: (chapterId) =>
    api.post(`/admin/moderation/chapters/${chapterId}/approve`),
  rejectModerationChapter: (chapterId, note) =>
    api.post(`/admin/moderation/chapters/${chapterId}/reject`, { note }),
  requestEditModerationChapter: (chapterId, note) =>
    api.post(`/admin/moderation/chapters/${chapterId}/request-edit`, { note }),
};

export default storyService;