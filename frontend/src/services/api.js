// frontend/src/services/api.js
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8081/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    let token = null;

    // 1️⃣ Ưu tiên accessToken nếu có
    token = localStorage.getItem('accessToken');

    // 2️⃣ Nếu không có thì fallback user.token
    if (!token) {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          token = parsed?.token || parsed?.accessToken;
        } catch {
          // ignore corrupted user
        }
      }
    }

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      'Đã xảy ra lỗi, vui lòng thử lại';

    return Promise.reject(new Error(message));
  }
);

export default api;