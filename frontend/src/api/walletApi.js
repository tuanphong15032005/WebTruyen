import { axiosClient } from './axiosClient'

export async function getWallet() {
  const res = await axiosClient.get('/api/wallet')
  return res.data
}

export async function purchaseChapter(chapterPrice, chapterId) {
  const res = await axiosClient.post('/api/wallet/purchase-chapter', { chapterPrice, chapterId })
  return res.data
}
