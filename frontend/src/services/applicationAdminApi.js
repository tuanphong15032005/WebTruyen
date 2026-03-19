import api from './api';

const applicationAdminApi = {
  // Get all author applications
  getAuthorApplications: async (status = null) => {
    try {
      const url = status 
        ? `/admin/author-applications/status/${status}`
        : `/admin/author-applications`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tải đơn đăng ký tác giả');
      }

      return response;
    } catch (error) {
      console.error('Error fetching author applications:', error);
      throw error;
    }
  },

  // Get all reviewer applications
  getReviewerApplications: async (status = null) => {
    try {
      const url = status 
        ? `/admin/reviewer-applications/status/${status}`
        : `/admin/reviewer-applications`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tải đơn đăng ký reviewer');
      }

      return response;
    } catch (error) {
      console.error('Error fetching reviewer applications:', error);
      throw error;
    }
  },

  // Approve author application
  approveAuthorApplication: async (userId) => {
    try {
      const response = await api.post(`/admin/author-applications/${userId}/approve`);

      if (!response) {
        throw new Error('Duyệt đơn tác giả thất bại');
      }

      return response;
    } catch (error) {
      console.error('Error approving author application:', error);
      throw error;
    }
  },

  // Reject author application
  rejectAuthorApplication: async (userId, rejectionReason) => {
    try {
      const response = await api.post(`/admin/author-applications/${userId}/reject`, { rejectionReason });

      if (!response) {
        throw new Error('Từ chối đơn tác giả thất bại');
      }

      return response;
    } catch (error) {
      console.error('Error rejecting author application:', error);
      throw error;
    }
  },

  // Approve reviewer application
  approveReviewerApplication: async (userId) => {
    try {
      const response = await api.post(`/admin/reviewer-applications/${userId}/approve`);

      if (!response) {
        throw new Error('Duyệt đơn reviewer thất bại');
      }

      return response;
    } catch (error) {
      console.error('Error approving reviewer application:', error);
      throw error;
    }
  },

  // Reject reviewer application
  rejectReviewerApplication: async (userId, rejectionReason) => {
    try {
      const response = await api.post(`/admin/reviewer-applications/${userId}/reject`, { rejectionReason });

      if (!response) {
        throw new Error('Từ chối đơn reviewer thất bại');
      }

      return response;
    } catch (error) {
      console.error('Error rejecting reviewer application:', error);
      throw error;
    }
  },

  // Get application statistics
  getApplicationStats: async () => {
    try {
      const response = await api.get(`/admin/author-applications/stats`);

      if (!response) {
        throw new Error('Không thể tải thống kê đơn');
      }

      return response;
    } catch (error) {
      console.error('Error fetching application stats:', error);
      throw error;
    }
  },

  // Get application by ID
  getApplicationById: async (applicationId, type) => {
    try {
      const url = type === 'author' 
        ? `/admin/author-applications/${applicationId}`
        : `/admin/reviewer-applications/${applicationId}`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tải thông tin đơn');
      }

      return response;
    } catch (error) {
      console.error('Error fetching application details:', error);
      throw error;
    }
  },

  // Get user details for application
  getUserDetails: async (applicationId, type) => {
    try {
      const url = type === 'author' 
        ? `/admin/author-applications/${applicationId}/user-details`
        : `/admin/reviewer-applications/${applicationId}/user-details`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tải thông tin người dùng');
      }

      return response;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Get applications by date range
  getApplicationsByDateRange: async (startDate, endDate, type) => {
    try {
      const url = type === 'author'
        ? `/admin/author-applications/date-range`
        : `/admin/reviewer-applications/date-range`;
      
      const response = await api.post(url, {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      if (!response) {
        throw new Error('Không thể tải đơn theo khoảng thời gian');
      }

      return response;
    } catch (error) {
      console.error('Error fetching applications by date range:', error);
      throw error;
    }
  },

  // Get raw application data for debugging
  getRawApplicationData: async (applicationId) => {
    try {
      const response = await api.get(`/admin/author-applications/${applicationId}/raw-data`);

      if (!response) {
        throw new Error('Không thể tải dữ liệu thô');
      }

      return response;
    } catch (error) {
      console.error('Error fetching raw application data:', error);
      throw error;
    }
  },

  // Get all user data for debugging
  getAllUserData: async (userId, type = 'author') => {
    try {
      const url = type === 'author'
        ? `/admin/author-applications/user/${userId}/all-data`
        : `/admin/reviewer-applications/user/${userId}/all-data`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tải toàn bộ dữ liệu user');
      }

      return response;
    } catch (error) {
      console.error('Error fetching all user data:', error);
      // For reviewer applications, if the endpoint doesn't exist, return empty data
      if (type === 'reviewer' && error.response?.status === 404) {
        return { reviewerApplicationData: null };
      }
      throw error;
    }
  },

  // Search applications
  searchApplications: async (query, type) => {
    try {
      const url = type === 'author'
        ? `/admin/author-applications/search?query=${encodeURIComponent(query)}`
        : `/admin/reviewer-applications/search?query=${encodeURIComponent(query)}`;
      
      const response = await api.get(url);

      if (!response) {
        throw new Error('Không thể tìm kiếm đơn');
      }

      return response;
    } catch (error) {
      console.error('Error searching applications:', error);
      throw error;
    }
  }
};

export default applicationAdminApi;
