import api from '../services/api'

export async function dailyCheckIn() {
  // Backend API đã có sẵn: POST /api/wallet/checkin
  return await api.post('/wallet/checkin')
}

export async function getUserProfile() {
  return await api.get('/user/profile')
}

export async function getUserProfileById(userId) {
  return await api.get(`/users/profile/${userId}`)
}
