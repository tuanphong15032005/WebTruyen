import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { createPaymentOrder, confirmPayment, createVNPayUrl } from '../../api/paymentApi'
import { WalletContext } from '../../context/WalletContext'

const PACKAGES = [
  { vnd: 10000, coin: 10000 },
  { vnd: 20000, coin: 20000 },
  { vnd: 50000, coin: 50000 },
  { vnd: 100000, coin: 100000 },
  { vnd: 200000, coin: 200000 },
  { vnd: 500000, coin: 500000 },
]

function formatVnd(value) {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫'
}

export default function WalletTopupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshWallet } = useContext(WalletContext)
  const [loadingId, setLoadingId] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      const token = raw ? JSON.parse(raw)?.token : null
      if (!token) {
        navigate('/login')
        return
      }

      // Show message from location state (from VNPay return)
      if (location.state?.message) {
        if (location.state.type === 'warning') {
          setError(location.state.message)
        } else if (location.state.type === 'error') {
          setError(location.state.message)
        }
        // Clear the state after showing message
        navigate(location.pathname, { replace: true, state: null })
      }
    } catch {
      navigate('/login')
    }
  }, [navigate, location])

  const handlePayNow = async (pkg) => {
    setError('')
    setLoadingId(pkg.vnd)

    try {
      console.log('Creating payment order for:', pkg)
      const order = await createPaymentOrder({
        amountVnd: pkg.vnd,
        coinBAmount: pkg.coin,
      })
      
      console.log('Payment order created:', order)

      // Redirect to VNPay
      console.log('Creating VNPay URL for order ID:', order.orderId)
      const responseData = await createVNPayUrl(order.orderId)
      console.log('VNPay response data (after interceptor):', responseData)
      
      // axios interceptor returns response.data directly
      if (!responseData) {
        throw new Error('Empty response from server')
      }
      
      if (responseData.error) {
        throw new Error('Server error: ' + responseData.error)
      }
      
      if (!responseData.paymentUrl) {
        throw new Error('Invalid VNPay response: missing paymentUrl. Full response: ' + JSON.stringify(responseData))
      }
      
      window.location.href = responseData.paymentUrl
    } catch (e) {
      console.error('Payment error:', e)
      const msg = e?.response?.data || e?.message || 'Payment failed'
      setError(String(msg))
      setLoadingId(null)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Nạp 💎 (Coin B)</h1>
        <button
          type="button"
          className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
          onClick={() => navigate('/')}
        >
          Quay lại
        </button>
      </div>

      {error ? (
        <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.vnd}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{formatVnd(pkg.vnd)}</div>
              <div className="text-sm px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)]">
                Gói
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="text-4xl">💎</div>
              <div>
                <div className="text-sm opacity-80">Nhận</div>
                <div className="text-2xl font-bold">{pkg.coin.toLocaleString('vi-VN')}</div>
              </div>
            </div>

            <button
              type="button"
              className="mt-6 w-full px-4 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold disabled:opacity-60"
              onClick={() => handlePayNow(pkg)}
              disabled={loadingId === pkg.vnd}
            >
              {loadingId === pkg.vnd ? 'Đang xử lý...' : 'Thanh toán VNPay'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
