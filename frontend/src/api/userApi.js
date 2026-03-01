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
