import api from './api';

export const achievementApi = {
  // Get all tiered achievement progress for current user
  getAchievementProgress: () => api.get('/tiered-achievements/progress'),
  
  // Get specific achievement progress by code
  getAchievementByCode: (achievementCode) => api.get(`/tiered-achievements/progress/${achievementCode}`),
  
  // Claim a tier reward
  claimTier: (tierId) => api.post(`/tiered-achievements/claim/${tierId}`),
  
  // Manual progress update (for testing)
  incrementProgress: (achievementCode, value) => api.post(`/tiered-achievements/progress/${achievementCode}/increment?value=${value}`),
  
  setProgress: (achievementCode, value) => api.post(`/tiered-achievements/progress/${achievementCode}/set?value=${value}`),
};
