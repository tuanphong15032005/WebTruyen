import api from './api';

const simpleDailyTaskService = {
  // Get all daily tasks for user
  getDailyTasks: async () => {
    try {
      const response = await api.get('/daily-tasks');
      return response;
    } catch (error) {
      console.error('Error fetching daily tasks:', error);
      throw error;
    }
  },

  // Track user login
  trackLogin: async () => {
    try {
      const response = await api.post('/daily-tasks/track-login', {});
      return response;
    } catch (error) {
      console.error('Error tracking login:', error);
      throw error;
    }
  },


  // Claim reward for a specific task
  claimTaskReward: async (missionId) => {
    try {
      const response = await api.post(`/daily-tasks/claim/${missionId}`, {});
      return response;
    } catch (error) {
      console.error('Error claiming task reward:', error);
      throw error;
    }
  },

  // Claim all available rewards
  claimAllRewards: async () => {
    try {
      const response = await api.post('/daily-tasks/claim-all', {});
      return response;
    } catch (error) {
      console.error('Error claiming all rewards:', error);
      throw error;
    }
  },

  // Force refresh to clear cache
  forceRefresh: async () => {
    try {
      const response = await api.post('/daily-tasks/force-refresh', {});
      return response;
    } catch (error) {
      console.error('Error force refreshing daily tasks:', error);
      throw error;
    }
  },
};

export default simpleDailyTaskService;
