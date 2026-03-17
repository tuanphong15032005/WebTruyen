import { getDashboardSummary, getDashboardStories, getDashboardComments } from '../api/dashboardApi';

/**
 * dashboardService.js
 * Service layer for author dashboard functionality
 * Handles data fetching and business logic for the dashboard
 */

/**
 * Fetch all dashboard data in parallel
 * Combines summary, stories, and comments data for complete dashboard
 * @returns {Promise} Promise that resolves to object containing all dashboard data
 */
export async function fetchDashboardData() {
  try {
    // Fetch all dashboard data in parallel for optimal performance
    const [summaryResponse, storiesResponse, commentsResponse] = await Promise.all([
      getDashboardSummary(),
      getDashboardStories(),
      getDashboardComments()
    ]);

    return {
      summary: summaryResponse,
      stories: storiesResponse,
      comments: commentsResponse
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

/**
 * Fetch dashboard summary statistics only
 * @returns {Promise} Promise that resolves to summary statistics
 */
export async function fetchDashboardSummary() {
  try {
    const response = await getDashboardSummary();
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
}

/**
 * Fetch latest stories only
 * @returns {Promise} Promise that resolves to list of latest stories
 */
export async function fetchLatestStories() {
  try {
    const response = await getDashboardStories();
    return response.data;
  } catch (error) {
    console.error('Error fetching latest stories:', error);
    throw error;
  }
}

/**
 * Fetch latest comments only
 * @returns {Promise} Promise that resolves to list of latest comments
 */
export async function fetchLatestComments() {
  try {
    const response = await getDashboardComments();
    return response.data;
  } catch (error) {
    console.error('Error fetching latest comments:', error);
    throw error;
  }
}

/**
 * Format revenue amount to VND currency format
 * @param {number} amount - Revenue amount in VND
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount) {
  if (!amount || amount === 0) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

/**
 * Format large numbers to readable format
 * @param {number} num - Number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num) {
  if (!num || num === 0) return '0';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
  const now = new Date();
  const commentDate = new Date(date);
  const diffInSeconds = Math.floor((now - commentDate) / 1000);

  if (diffInSeconds < 60) {
    return 'vừa xong';
  }
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} phút trước`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} giờ trước`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  }
  
  return commentDate.toLocaleDateString('vi-VN');
}
