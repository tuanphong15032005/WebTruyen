import api from '../services/api';

export async function dailyCheckIn() {
  // Backend API đã có sẵn: POST /api/wallet/checkin
  return await api.post('/wallet/checkin');
}

export async function getUserProfile() {
  return await api.get('/user/profile');
}

export async function getUserProfileById(userId) {
  return await api.get(`/users/profile/${userId}`);
}
//create an avatar upload API function
export async function uploadAvatar(userId, formData) {
  return await api.post(`/users/profile/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}


export async function getFollowersList(userId) {
  const res = await api.get(`/users/${userId}/followers`);
  return Array.isArray(res) ? res : [];
}

//create a cover upload API function
export async function uploadCover(userId, formData) {
  return await api.post(`/users/profile/${userId}/upload-cover`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
