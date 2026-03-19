import api from './api';

const dailyMissionAdminApi = {
  // Get all missions with optional date filter
  getAllMissions: async (date = null) => {
    try {
      const params = date ? { date } : {};
      const response = await api.get(`/admin/daily-missions`, {
        params,
      });
      return response;
    } catch (error) {
      console.error('Error fetching daily missions:', error);
      throw error;
    }
  },

  // Get missions by specific date
  getMissionsByDate: async (date) => {
    try {
      const response = await api.get(`/admin/daily-missions/date/${date}`);
      return response;
    } catch (error) {
      console.error('Error fetching missions by date:', error);
      throw error;
    }
  },

  // Get missions by specific date with completion statistics
  getMissionsByDateWithStats: async (date) => {
    try {
      const response = await api.get(`/admin/daily-missions/date/${date}/with-stats`);
      return response;
    } catch (error) {
      console.error('Error fetching missions with stats by date:', error);
      throw error;
    }
  },

  // Get distinct dates that have missions
  getAvailableDates: async () => {
    try {
      const response = await api.get(`/admin/daily-missions/dates`);
      return response;
    } catch (error) {
      console.error('Error fetching available dates:', error);
      throw error;
    }
  },

  // Create new mission
  createMission: async (missionData) => {
    try {
      const response = await api.post(`/admin/daily-missions`, missionData);
      return response.data;
    } catch (error) {
      console.error('Error creating mission:', error);
      // Extract error message from response if available
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create mission';
      throw new Error(errorMessage);
    }
  },

  // Update existing mission
  updateMission: async (id, missionData) => {
    try {
      const response = await api.put(`/admin/daily-missions/${id}`, missionData);
      return response.data;
    } catch (error) {
      console.error('Error updating mission:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update mission';
      throw new Error(errorMessage);
    }
  },

  // Delete mission
  deleteMission: async (id) => {
    try {
      await api.delete(`/admin/daily-missions/${id}`);
    } catch (error) {
      console.error('Error deleting mission:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete mission';
      throw new Error(errorMessage);
    }
  },

  // Generate missions for a specific date
  generateMissionsForDate: async (date) => {
    try {
      const response = await api.post(`/admin/daily-missions/generate/${date}`, {});
      return response.data;
    } catch (error) {
      console.error('Error generating missions for date:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to generate missions';
      throw new Error(errorMessage);
    }
  },

  // Regenerate missions from templates (only update missions without user progress)
  regenerateMissionsFromTemplates: async (date) => {
    try {
      const response = await api.post(`/admin/daily-missions/regenerate/${date}`, {});
      return response.data;
    } catch (error) {
      console.error('Error regenerating missions for date:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to regenerate missions';
      throw new Error(errorMessage);
    }
  },

  // Get mission statistics
  getMissionStats: async () => {
    try {
      const response = await api.get(`/admin/daily-missions/stats`);
      return response;
    } catch (error) {
      console.error('Error fetching mission stats:', error);
      throw error;
    }
  },

  // Copy missions from one date to another
  copyMissionsToDate: async (fromDate, toDate) => {
    try {
      const response = await api.post(`/admin/daily-missions/copy/${fromDate}/${toDate}`, {});
      return response.data;
    } catch (error) {
      console.error('Error copying missions:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to copy missions';
      throw new Error(errorMessage);
    }
  },

  // ============================================================
  // Template Management Methods
  // ============================================================

  // Get all templates
  getAllTemplates: async () => {
    try {
      const response = await api.get(`/admin/daily-missions/templates`);
      return response;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Get template by mission code
  getTemplateByCode: async (missionCode) => {
    try {
      const response = await api.get(`/admin/daily-missions/templates/${missionCode}`);
      return response;
    } catch (error) {
      console.error('Error fetching template by code:', error);
      throw error;
    }
  },

  // Update template
  updateTemplate: async (templateId, templateData) => {
    try {
      const response = await api.put(`/admin/daily-missions/templates/${templateId}`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error updating template:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update template';
      throw new Error(errorMessage);
    }
  },

  // Create new template
  createTemplate: async (templateData) => {
    try {
      const response = await api.post(`/admin/daily-missions/templates`, templateData);
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create template';
      throw new Error(errorMessage);
    }
  },

  // Delete template
  deleteTemplate: async (templateId) => {
    try {
      await api.delete(`/admin/daily-missions/templates/${templateId}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to delete template';
      throw new Error(errorMessage);
    }
  },

  // Batch delete missions without user progress
  batchDeleteMissionsWithoutProgress: async (date) => {
    try {
      console.log('Making API call to: `/admin/daily-missions/batch-delete/${date}`');
      const response = await api.delete(`/admin/daily-missions/batch-delete/${date}`);
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error batch deleting missions:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to batch delete missions';
      throw new Error(errorMessage);
    }
  },
};

export default dailyMissionAdminApi;
