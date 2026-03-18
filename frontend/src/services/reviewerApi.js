import { getStoredUser } from '../utils/helpers';

const BASE_URL = 'http://localhost:8081';

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

const getUserIdFromToken = () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('🔍 Token payload in API:', payload);
    return payload.userId || payload.sub || payload.id;
  } catch (err) {
    console.error('Error parsing token:', err);
    return null;
  }
};

const reviewerApi = {
  // Check eligibility for reviewer application
  checkEligibility: async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Bạn cần đăng nhập để đăng ký reviewer');
    }

    console.log('🔍 Checking eligibility for userId:', userId);

    try {
      const response = await fetch(`${BASE_URL}/api/reviewer/check-eligibility/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể kiểm tra điều kiện đăng ký');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking eligibility:', error);
      throw error;
    }
  },

  // Submit reviewer application
  submitApplication: async (applicationData) => {
    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Bạn cần đăng nhập để gửi đơn đăng ký');
    }

    console.log('🔍 Submitting application for userId:', userId);

    try {
      const response = await fetch(`${BASE_URL}/api/reviewer/apply`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(applicationData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gửi đơn đăng ký thất bại');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting application:', error);
      throw error;
    }
  },

  // Get reviewer application status
  getApplicationStatus: async () => {
    const userId = getUserIdFromToken();
    if (!userId) {
      throw new Error('Bạn cần đăng nhập để xem trạng thái đơn');
    }

    console.log('🔍 Getting application status for userId:', userId);

    try {
      const response = await fetch(`${BASE_URL}/api/reviewer/application-status/${userId}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Không thể lấy trạng thái đơn');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting application status:', error);
      throw error;
    }
  }
};

export default reviewerApi;
