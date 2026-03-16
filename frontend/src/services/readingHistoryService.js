import api from './api';

const readingHistoryService = {
  // Get reading history with pagination
  getReadingHistory: async (page = 0, size = 10) => {
    const response = await api.get('/reading-history', {
      params: { page, size }
    });
    return response;
  },

  // Continue reading a specific story
  continueReading: async (storyId) => {
    const response = await api.get(`/reading-history/continue/${storyId}`);
    return response;
  },

  // Update reading progress
  updateReadingProgress: async (storyId, chapterId, segmentId) => {
    const response = await api.post('/reading-history/update', {
      storyId,
      chapterId,
      segmentId
    });
    return response;
  },

  // Delete single history
  deleteHistory: async (storyId) => {
    const response = await api.delete(`/reading-history/${storyId}`);
    return response;
  },

  // Clear all history
  clearHistory: async () => {
    const response = await api.delete('/reading-history');
    return response;
  }
};

export default readingHistoryService;
