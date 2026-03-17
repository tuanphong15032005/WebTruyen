import api from './api';

const adminFinanceService = {
  getRequests: (params = {}) => api.get('/admin/finance/requests', { params }),
  approveRequest: (requestId, note = '') =>
    api.post(`/admin/finance/requests/${requestId}/approve`, { note }),
  rejectRequest: (requestId, note = '') =>
    api.post(`/admin/finance/requests/${requestId}/reject`, { note }),
  completeRequest: (requestId, note = '') =>
    api.post(`/admin/finance/requests/${requestId}/complete`, { note }),
};

export default adminFinanceService;

