import api from '../services/api';

/**
 * dashboardApi.js
 * API functions for author dashboard endpoints
 * Provides direct axios calls to dashboard backend APIs
 */

/**
 * Get dashboard summary statistics
 * Fetches total views, followers, revenue, and comments metrics
 * @returns {Promise} Promise that resolves to dashboard summary data
 */
export async function getDashboardSummary() {
  try {
    const response = await api.get('/author/dashboard/summary');
    return response;
  } catch (error) {
    console.error('getDashboardSummary error:', error);
    throw error;
  }
}

/**
 * Get latest stories for the author
 * Fetches the 3 most recently updated stories
 * @returns {Promise} Promise that resolves to list of stories
 */
export async function getDashboardStories() {
  try {
    const response = await api.get('/author/dashboard/stories');
    return response;
  } catch (error) {
    console.error('getDashboardStories error:', error);
    throw error;
  }
}

/**
 * Get latest comments on author's stories
 * Fetches the 3 most recent comments across all author's stories
 * @returns {Promise} Promise that resolves to list of comments
 */
export async function getDashboardComments() {
  try {
    const response = await api.get('/author/dashboard/comments');
    return response;
  } catch (error) {
    console.error('getDashboardComments error:', error);
    throw error;
  }
}
