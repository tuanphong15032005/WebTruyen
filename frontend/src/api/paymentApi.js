import { axiosClient } from './axiosClient'

export async function createPaymentOrder(payload) {
  const res = await axiosClient.post('/api/payments', payload)
  return res.data
}

export async function confirmPayment(orderId) {
  const res = await axiosClient.post('/api/payments/${orderId}/confirm')
  return res.data
}

export async function getPaymentDetail(orderId) {
  const res = await axiosClient.get('/api/payments/${orderId}')
  return res.data
}

export async function getTransactionHistory() {
  const res = await axiosClient.get('/api/payments/history')
  return res.data
}
