import api from './api';

const authorAnalyticsService = {
  getAuthorStories: () => api.get('/author/analytics/stories'),
  getStoryPerformance: (storyId) => api.get(`/author/analytics/stories/${storyId}`),
  getAuthorFollowers: () => api.get('/author/followers'),
  getAuthorFollowerStats: () => api.get('/author/followers/stats'),
};

export default authorAnalyticsService;
