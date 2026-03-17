import api from './api';

export const sitePageService = {
  getPageByCode: async (code) => {
    const response = await api.get(`/public/pages/${code}`);
    return response; // response.data đã được interceptor xử lý
  },
  
  getAllPages: async () => {
    try {
      console.log('Making API call to /public/pages...');
      const response = await api.get('/public/pages');
      console.log('API response received:', response);
      console.log('Response type:', typeof response);
      console.log('Is array?', Array.isArray(response));
      return response;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  },
  
  createPage: async (pageData) => {
    const response = await api.post('/admin/pages', pageData);
    return response.data;
  },
  
  updatePage: async (id, pageData) => {
    const response = await api.put(`/admin/pages/${id}`, pageData);
    return response.data;
  },
  
  deletePage: async (id) => {
    await api.delete(`/admin/pages/${id}`);
  }
};
