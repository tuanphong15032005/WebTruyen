import api from './api';

export const achievementApi = {
  // Get all achievements
  getAllAchievements: () => api.get('/achievements'),
  
  // Get current user's achievements
  getMyAchievements: () => api.get('/achievements/my'),
  
  // Get achievements that user hasn't unlocked yet
  getUnlockedAchievements: () => api.get('/achievements/unlocked'),
  
  // Get unclaimed achievements (ready to claim rewards)
  getUnclaimedAchievements: () => api.get('/achievements/unclaimed'),
  
  // Claim an achievement reward
  claimAchievement: (achievementId) => api.post(`/achievements/claim/${achievementId}`),
  
  // Get achievements for a specific user (public profile)
  getUserAchievements: (userId) => api.get(`/achievements/user/${userId}`),
};
