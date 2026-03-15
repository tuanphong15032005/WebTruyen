import api from './api';

const refundService = {
  getEligibleTransactions: () => api.get('/refunds/eligible-transactions'),
  createRefundRequest: (payload) => api.post('/refunds/requests', payload),
  getMyRefundRequests: () => api.get('/refunds/my-requests'),
};

export default refundService;

