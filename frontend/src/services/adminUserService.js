import api from './api';

const adminUserService = {
  searchUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUserRoles: (id, roles) => api.put(`/admin/users/${id}/roles`, { roles })
};

export default adminUserService;
