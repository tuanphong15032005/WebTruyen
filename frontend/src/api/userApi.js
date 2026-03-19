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

export async function getUserProfileByUsername(username) {
  return await api.get(`/users/profile/username/${username}`);
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

export async function toggleFollow(authorId, currentUserId) {
  return await api.post(`/users/${authorId}/follow`, null, {
    params: { currentUserId }
  });
}

export async function getFollowStatus(authorId, currentUserId) {
  return await api.get(`/users/${authorId}/follow-status`, {
    params: { currentUserId }
  });
}

//create a cover upload API function
export async function uploadCover(userId, formData) {
  return await api.post(`/users/profile/${userId}/upload-cover`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
