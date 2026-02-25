import api from './api';

const authorAnalyticsService = {
  getAuthorStories: () => api.get('/author/analytics/stories'),
  getStoryPerformance: (storyId) => api.get(`/author/analytics/stories/${storyId}`),
};

export default authorAnalyticsService;
