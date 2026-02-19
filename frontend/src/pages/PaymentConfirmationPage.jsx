import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getPaymentDetail } from '../api/paymentApi'
import { WalletContext } from '../context/WalletContext'

export default function PaymentConfirmationPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { wallet, refreshWallet } = useContext(WalletContext)

  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      const token = raw ? JSON.parse(raw)?.token : null
      if (!token) {
        navigate('/login')
        return
      }
    } catch {
      navigate('/login')
      return
    }

    let mounted = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await getPaymentDetail(id)
        if (!mounted) return
        setPayment(data)

        if (data?.status === 'PAID') {
          await refreshWallet()
        }
      } catch (e) {
        const msg = e?.response?.data || e?.message || 'Failed to load payment'
        if (!mounted) return
        setError(String(msg))
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [id, refreshWallet])

  const status = payment?.status
  const isPaid = status === 'PAID'

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-10">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">Xác nhận thanh toán</h1>
            <div className="mt-1 text-sm opacity-80">Mã đơn: {id}</div>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 opacity-80">Loading...</div>
        ) : null}

        {error ? (
          <div className="mt-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="mt-8">
            {isPaid ? (
              <>
                <div className="text-green-300 font-semibold">Thanh toán thành công</div>

                <div className="mt-6 flex items-center gap-4">
                  <div className="text-6xl">💎</div>
                  <div>
                    <div className="text-sm opacity-80">Số dư Coin B hiện tại</div>
                    <div className="text-3xl font-bold">{Number(wallet.coinB).toLocaleString('vi-VN')}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="text-sm opacity-80">Coin B nạp</div>
                    <div className="text-lg font-semibold">{Number(payment?.coinBAmount ?? 0).toLocaleString('vi-VN')}</div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="text-sm opacity-80">Số tiền</div>
                    <div className="text-lg font-semibold">{Number(payment?.amountVnd ?? 0).toLocaleString('vi-VN')}₫</div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold"
                    onClick={() => navigate('/wallet/topup')}
                  >
                    Nạp tiếp
                  </button>
                  <button
                    type="button"
                    className="w-full sm:w-auto px-5 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] font-semibold"
                    onClick={() => navigate('/')}
                  >
                    Về trang chủ
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-red-300 font-semibold">Thanh toán thất bại</div>
                <div className="mt-2 text-sm opacity-80">Trạng thái: {status}</div>
              </>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
