// frontend/src/services/api.js
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE ||
  'http://localhost:8081/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    let token = null;

    token = localStorage.getItem('accessToken');

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
  (error) => Promise.reject(error),
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
//tác dụng của hàm này 
// - Tự động trích xuất dữ liệu từ phản hồi thành công, giúp các phần khác của ứng dụng dễ dàng sử dụng dữ liệu mà không cần phải truy cập vào thuộc tính `data` của phản hồi.
// - Xử lý lỗi một cách nhất quán, đặc biệt là khi token hết hạn (401 Unauthorized), bằng cách xóa dữ liệu xác thực và chuyển hướng người dùng đến trang đăng nhập.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    //<<<<<<< HEAD:frontend/src/services/api.js
    const responseData = error?.response?.data;
    let message = '';

    // Handle token expiration (401 Unauthorized)
    if (error?.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');

      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }

      return Promise.reject(
        new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'),
      );
    }

    if (typeof responseData === 'string' && responseData.trim()) {
      message = responseData.trim();
    } else if (responseData && typeof responseData === 'object') {
      const nestedMessage =
        responseData.message || responseData.error || responseData.detail;

      if (typeof nestedMessage === 'string' && nestedMessage.trim()) {
        message = nestedMessage.trim();
      } else {
        try {
          message = JSON.stringify(responseData);
        } catch {
          message = '';
        }
      }
    }

    if (!message) {
      message = error?.message || 'Đã xảy ra lỗi, vui lòng thử lại';
    }
    //Phong them phan cua a Minh 2 dong duoi day
    const err = new Error(message);
    err.response = error.response;

    return Promise.reject(new Error(message));
  },
  //=======
  //    const message =
  //      error.response?.data?.message ||
  //      (typeof error.response?.data === 'string' ? error.response.data : null) ||
  //      error.message ||
  //      'Đã xảy ra lỗi, vui lòng thử lại';
  //
  //    const err = new Error(message);
  //    err.response = error.response;
  //    return Promise.reject(err);
  //  }
  //>>>>>>> origin/minhfinal1:frontend/src/services/Api.js
);

export default api;
