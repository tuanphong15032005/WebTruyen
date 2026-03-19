import api from './api';

export const tagService = {
  // Get all tags with pagination
  getTags: async (page = 0, size = 10) => {
    return await api.get(`/admin/tags?page=${page}&size=${size}`);
  },

  // Create new tag
  createTag: async (data) => {
    return await api.post('/admin/tags', data);
  },

  // Update tag
  updateTag: async (id, data) => {
    return await api.put(`/admin/tags/${id}`, data);
  },

  // Delete tag
  deleteTag: async (id) => {
    return await api.delete(`/admin/tags/${id}`);
  },

  // Merge tags
  mergeTags: async (data) => {
    return await api.post('/admin/tags/merge', data);
  },

  // Search tags
  searchTags: async (keyword) => {
    return await api.get(`/admin/tags/search?keyword=${encodeURIComponent(keyword)}`);
  },

  // Get unused tags
  getUnusedTags: async () => {
    return await api.get('/admin/tags/unused');
  },

  // Get trending tags
  getTrendingTags: async () => {
    return await api.get('/admin/tags/trending');
  }
};
