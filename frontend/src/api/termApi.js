import api from '../services/api';

export async function getAllTerms() {
  return await api.get('/admin/terms');
}

export async function getTermDetail(code) {
  return await api.get(`/admin/terms/${code}`);
}

export async function createTerm(data) {
  return await api.post('/admin/terms', data);
}

export async function updateTerm(code, data) {
  return await api.put(`/admin/terms/${code}`, data);
}

export async function deleteTerm(code) {
  return await api.delete(`/admin/terms/${code}`);
}
