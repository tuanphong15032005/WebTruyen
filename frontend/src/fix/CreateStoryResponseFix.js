// FIX CHO CreateStory.jsx
// Thay thế đoạn xử lý response (khoảng dòng 215-225)

// CODE HIỆN TẠI:
// const nextStoryId = response?.data?.id || response?.data?.storyId || storyId;

// CODE MỚI ĐÚNG:
const nextStoryId = response?.id || response?.storyId || storyId;

// LÝ DOAN:
// - Backend trả về ID ở response.id trực tiếp
// - Response interceptor trong api.js đã extract data, nên response là object trực tiếp
// - Không cần response.data nữa
