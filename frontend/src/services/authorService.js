// frontend/src/services/authorService.js
import api from './api';

/**
 * Service for author search functionality
 * Provides API calls for searching and discovering authors
 */

/**
 * Search authors by keyword with pagination and sorting
 * @param {Object} params - Search parameters
 * @param {string} params.keyword - Search keyword for pen name or display name
 * @param {number} params.page - Page number (default: 0)
 * @param {number} params.size - Page size (default: 12)
 * @param {string} params.sort - Sort field (follower_count, stories, views, rating)
 * @returns {Promise<Object>} Paginated search results
 */
export const searchAuthors = async (params = {}) => {
  const { keyword = '', page = 0, size = 12, sort = 'follower_count' } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
  });
  
  if (keyword && keyword.trim()) {
    queryParams.append('keyword', keyword.trim());
  }
  
  try {
    const response = await api.get(`/authors/search?${queryParams}`);
    return response;
  } catch (error) {
    console.error('Error searching authors:', error);
    throw error;
  }
};

/**
 * Get author suggestions for autocomplete dropdown
 * @param {string} keyword - Search keyword
 * @param {number} size - Maximum number of suggestions (default: 5)
 * @returns {Promise<Array>} List of author suggestions
 */
export const getAuthorSuggestions = async (keyword, size = 5) => {
  if (!keyword || !keyword.trim()) {
    return [];
  }
  
  const queryParams = new URLSearchParams({
    q: keyword.trim(),
    size: size.toString(),
  });
  
  try {
    const response = await api.get(`/authors/suggestions?${queryParams}`);
    return response;
  } catch (error) {
    console.error('Error getting author suggestions:', error);
    throw error;
  }
};

/**
 * Get all authors with pagination (browse functionality)
 * @param {Object} params - Pagination parameters
 * @param {number} params.page - Page number (default: 0)
 * @param {number} params.size - Page size (default: 12)
 * @param {string} params.sort - Sort field (follower_count, stories, views, rating)
 * @returns {Promise<Object>} Paginated list of all authors
 */
export const getAllAuthors = async (params = {}) => {
  const { page = 0, size = 12, sort = 'follower_count' } = params;
  
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort: sort,
  });
  
  try {
    const response = await api.get(`/authors?${queryParams}`);
    return response;
  } catch (error) {
    console.error('Error getting all authors:', error);
    throw error;
  }
};

/**
 * Follow an author
 * @param {number} authorId - Author ID to follow
 * @returns {Promise<Object>} Follow response
 */
export const followAuthor = async (authorId) => {
  try {
    const response = await api.post(`/authors/${authorId}/follow`);
    return response;
  } catch (error) {
    console.error('Error following author:', error);
    throw error;
  }
};

/**
 * Unfollow an author
 * @param {number} authorId - Author ID to unfollow
 * @returns {Promise<Object>} Unfollow response
 */
export const unfollowAuthor = async (authorId) => {
  try {
    const response = await api.delete(`/authors/${authorId}/follow`);
    return response;
  } catch (error) {
    console.error('Error unfollowing author:', error);
    throw error;
  }
};

/**
 * Get author profile details
 * @param {number} authorId - Author ID
 * @returns {Promise<Object>} Author profile details
 */
export const getAuthorProfile = async (authorId) => {
  try {
    const response = await api.get(`/authors/${authorId}`);
    return response;
  } catch (error) {
    console.error('Error getting author profile:', error);
    throw error;
  }
};

/**
 * Check if current user is following an author
 * @param {number} authorId - Author ID to check
 * @returns {Promise<Object>} Follow status
 */
export const getFollowStatus = async (authorId) => {
  try {
    const response = await api.get(`/authors/${authorId}/follow-status`);
    return response;
  } catch (error) {
    console.error('Error getting follow status:', error);
    throw error;
  }
};
