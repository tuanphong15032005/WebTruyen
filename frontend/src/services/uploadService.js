// frontend/src/services/uploadService.js
import api from "./api";

const uploadService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/uploads/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response?.data?.url;
  },
};

export default uploadService;
