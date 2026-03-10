import { axiosClient } from './axiosClient'

export async function dailyCheckIn() {
  // Backend API đã có sẵn: POST /api/wallet/checkin
  const res = await axiosClient.post('/api/wallet/checkin')
  return res.data
}

export async function getUserProfile() {
  const res = await axiosClient.get('/api/user/profile')
  return res.data
}

export async function getUserProfileById(userId) {
  const res = await axiosClient.get(`/api/users/profile/${userId}`)
  return res.data
}
//create an avatar upload API function
export async function uploadAvatar(userId, formData) {
  const res = await axiosClient.post(`/api/users/profile/${userId}/avatar`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data
}

export async function getFollowersList(userId) {
  const res = await axiosClient.get(`/api/users/${userId}/followers`)
  return res.data
}
