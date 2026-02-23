import api from './api';

const reportService = {
  getViolationReports: () => api.get('/admin/reports'),
  dismissReport: (reportId) => api.post(`/admin/reports/${reportId}/dismiss`),
  hideReportedContent: (reportId) => api.post(`/admin/reports/${reportId}/hide`),
  removeReportedContent: (reportId) => api.post(`/admin/reports/${reportId}/remove`),
  warnOrBanUser: (reportId, payload) => api.post(`/admin/reports/${reportId}/warn-ban`, payload),
};

export default reportService;
