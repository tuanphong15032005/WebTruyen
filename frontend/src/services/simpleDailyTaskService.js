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

  // Track chapter reading
  trackChapterRead: async (progressValue = 1) => {
    try {
      const response = await api.post('/daily-tasks/track-read', 
        { progressValue }
      );
      return response;
    } catch (error) {
      console.error('Error tracking chapter read:', error);
      throw error;
    }
  },

  // Track chapter unlock
  trackChapterUnlock: async () => {
    try {
      const response = await api.post('/daily-tasks/track-unlock', {});
      return response;
    } catch (error) {
      console.error('Error tracking chapter unlock:', error);
      throw error;
    }
  },

  // Track comment
  trackComment: async (progressValue = 1) => {
    try {
      const response = await api.post('/daily-tasks/track-comment', 
        { progressValue }
      );
      return response;
    } catch (error) {
      console.error('Error tracking comment:', error);
      throw error;
    }
  },

  // Track donation
  trackDonation: async () => {
    try {
      const response = await api.post('/daily-tasks/track-donate', {});
      return response;
    } catch (error) {
      console.error('Error tracking donation:', error);
      throw error;
    }
  },

  // Track top-up
  trackTopup: async () => {
    try {
      const response = await api.post('/daily-tasks/track-topup', {});
      return response;
    } catch (error) {
      console.error('Error tracking top-up:', error);
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
};

export default simpleDailyTaskService;
