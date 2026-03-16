import api from './api';

const authorApplicationAdminApi = {
    // Get all applications
    getAllApplications: () => {
        return api.get('/admin/author-applications');
    },

    // Get applications by status
    getApplicationsByStatus: (status) => {
        return api.get(`/admin/author-applications/status/${status}`);
    },

    // Get application by ID
    getApplicationById: (id) => {
        return api.get(`/admin/author-applications/${id}`);
    },

    // Get user details for application
    getUserDetails: (applicationId) => {
        return api.get(`/admin/author-applications/${applicationId}/user-details`);
    },

    // Approve application
    approveApplication: (applicationId) => {
        return api.post(`/admin/author-applications/${applicationId}/approve`);
    },

    // Reject application
    rejectApplication: (applicationId, rejectionReason) => {
        return api.post(`/admin/author-applications/${applicationId}/reject`, {
            rejectionReason
        });
    },

    // Get application statistics
    getApplicationStats: () => {
        return api.get('/admin/author-applications/stats');
    },

    // Get applications by date range
    getApplicationsByDateRange: (startDate, endDate) => {
        return api.get('/admin/author-applications/date-range', {
            params: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            }
        });
    },

    // Search applications
    searchApplications: (query) => {
        return api.get('/admin/author-applications/search', {
            params: { query }
        });
    }
};

export default authorApplicationAdminApi;
