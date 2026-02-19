import { axiosClient } from './axiosClient'

export async function getWallet() {
  const res = await axiosClient.get('/api/wallet')
  return res.data
}
