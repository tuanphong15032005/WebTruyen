import api from './api';

const API_BASE = '/admin/achievements';

class AdminAchievementApi {
  // Achievement CRUD
  async getAllAchievements() {
    return api.get(API_BASE);
  }

  async getAchievementById(id) {
    return api.get(`${API_BASE}/${id}`);
  }

  async createAchievement(achievementData) {
    return api.post(API_BASE, achievementData);
  }

  async updateAchievement(id, achievementData) {
    return api.put(`${API_BASE}/${id}`, achievementData);
  }

  async deleteAchievement(id) {
    return api.delete(`${API_BASE}/${id}`);
  }

  // Achievement Tier CRUD
  async getTiersByAchievement(achievementId) {
    return api.get(`${API_BASE}/${achievementId}/tiers`);
  }

  async createTier(achievementId, tierData) {
    return api.post(`${API_BASE}/${achievementId}/tiers`, tierData);
  }

  async updateTier(tierId, tierData) {
    return api.put(`${API_BASE}/tiers/${tierId}`, tierData);
  }

  async deleteTier(tierId) {
    return api.delete(`${API_BASE}/tiers/${tierId}`);
  }

  async createTiersBatch(achievementId, tiersData) {
    return api.post(`${API_BASE}/${achievementId}/tiers/batch`, tiersData);
  }

  // Statistics
  async getAchievementStats() {
    return api.get(`${API_BASE}/stats`);
  }

  // Categories
  async getAchievementCategories() {
    return api.get(`${API_BASE}/categories`);
  }

  // Tier restrictions
  async getTierRestrictions(tierId) {
    return api.get(`${API_BASE}/tiers/${tierId}/restrictions`);
  }

  // Achievement restrictions
  async getAchievementRestrictions(achievementId) {
    return api.get(`${API_BASE}/${achievementId}/restrictions`);
  }
}

export default new AdminAchievementApi();
