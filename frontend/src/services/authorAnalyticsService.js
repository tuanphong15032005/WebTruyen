import api from './api';

// Minhdq - 26/02/2026
// [Add author-follower-analytics-api-service - V1 - branch: clone-minhfinal2]
const authorAnalyticsService = {
  getAuthorStories: () => api.get('/author/analytics/stories'),
  getStoryPerformance: (storyId) => api.get(`/author/analytics/stories/${storyId}`),
  getAuthorFollowers: () => api.get('/author/followers'),
  getAuthorFollowerStats: () => api.get('/author/followers/stats'),
};

export default authorAnalyticsService;
