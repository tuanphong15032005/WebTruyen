import api from './api';

const authorAnalyticsService = {
  getAuthorStories: () => api.get('/author/analytics/stories'),
  getStoryPerformance: (storyId) => api.get(`/author/analytics/stories/${storyId}`),
  getOverallPerformance: () => api.get('/author/analytics/overview'),
};

export default authorAnalyticsService;
