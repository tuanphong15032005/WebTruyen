import api from '../services/api'

export async function createPaymentOrder(payload) {
  return await api.post(`/payments`, payload)
}

export async function confirmPayment(orderId) {
  return await api.post(`/payments/${orderId}/confirm`)
}

export async function getPaymentDetail(orderId) {
  return await api.get(`/payments/${orderId}`)
}

export async function getTransactionHistory() {
  return await api.get(`/payments/history`)
}

export async function createVNPayUrl(orderId) {
  return await api.post(`/payments/${orderId}/vnpay-url`)
}

export async function processVNPayReturn(params) {
  const queryString = new URLSearchParams(params).toString()
  try {
    const response = await api.get(`/payments/vnpay-return?${queryString}`)
    console.log('processVNPayReturn - raw response:', response)
    return response
  } catch (error) {
    console.error('processVNPayReturn - error:', error)
    throw error
  }
}
