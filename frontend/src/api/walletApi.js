import api from '../services/api'

export async function getWallet() {
  return await api.get('/wallet')
}

export async function purchaseChapter(chapterPrice, chapterId) {
  return await api.post('/wallet/purchase-chapter', { chapterPrice, chapterId })
}

export async function donateToAuthor(authorId, coinBAmount, message) {
  return await api.post('/wallet/donate', {
    authorId,
    coinBAmount,
    message
  })
}
