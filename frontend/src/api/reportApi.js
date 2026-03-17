import api from '../services/api';

export const submitReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    return response;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const reportApi = {
  submitReport,
};
