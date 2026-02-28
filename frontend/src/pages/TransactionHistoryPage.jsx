import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactionHistory } from '../api/paymentApi'
import '../App.css'

export default function CoinTransactionHistoryPage() {
    const [transactions, setTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const fetchTransactionHistory = async () => {
            try {
                const storedUser = localStorage.getItem('user')
                if (!storedUser) {
                    navigate('/login')
                    return
                }

                const data = await getTransactionHistory()
                
                // Map backend data to frontend format
                const mappedTransactions = data.map(transaction => {
                    let type = 'purchase' // default
                    let paymentMethod = null
                    
                    // Determine transaction type based on reason
                    if (transaction.reason === 'TOPUP') {
                        type = 'deposit'
                        paymentMethod = 'VNPAY'
                    } else if (transaction.reason === 'SPEND_CHAPTER') {
                        type = 'purchase'
                    } else if (transaction.reason === 'DONATE') {
                        type = 'purchase'
                    } else if (transaction.reason === 'WITHDRAW') {
                        type = 'purchase'
                    } else if (transaction.reason === 'EARN' || transaction.reason === 'REVIEW_REWARD') {
                        type = 'deposit'
                    }

                    // Calculate VND amount (1 coin = 1 VND for display, but only for deposits)
                    let vndAmount = 0
                    if (transaction.reason === 'TOPUP') {
                        vndAmount = Math.abs(transaction.delta) // 50,000 coin = 50,000 VND
                    }

                    return {
                        id: transaction.id,
                        type: type,
                        amount: vndAmount, // Only for deposits, 0 for purchases
                        coin: transaction.delta,
                        coinType: transaction.coinType === 'A' ? 'coinA' : 'coinB',
                        date: transaction.createdAt,
                        status: 'completed', // All ledger entries are completed
                        description: transaction.description,
                        paymentMethod: paymentMethod,
                        reason: transaction.reason // Keep original reason for debugging
                    }
                })

                setTransactions(mappedTransactions)
            } catch (error) {
                console.error('Error loading transaction history:', error)
                setError('Không thể tải lịch sử giao dịch')
            } finally {
                setLoading(false)
            }
        }

        fetchTransactionHistory()
    }, [navigate])

    const formatVnd = (value) => {
        return new Intl.NumberFormat('vi-VN').format(value) + '₫'
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN')
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'completed':
                return 'Hoàn thành'
            case 'pending':
                return 'Đang xử lý'
            case 'failed':
                return 'Thất bại'
            default:
                return status
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'text-green-500'
            case 'pending':
                return 'text-yellow-500'
            case 'failed':
                return 'text-red-500'
            default:
                return 'text-gray-500'
        }
    }

    const getTransactionTypeText = (type) => {
        switch (type) {
            case 'deposit':
                return 'Nạp coin'
            case 'purchase':
                return 'Mua hàng/Donate'
            case 'refund':
                return 'Hoàn tiền'
            default:
                return type
        }
    }

    const getCoinIcon = (coinType) => {
        return coinType === 'coinA' ? '🪙' : '💎'
    }

    const getCoinColor = (type) => {
        return type === 'deposit' ? 'text-green-500' : 'text-red-500'
    }

    if (loading) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Lịch sử giao dịch Coin</h1>
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

            {transactions.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <div className="text-4xl mb-4">💰</div>
                    <h3 className="text-lg font-semibold mb-2">Chưa có lịch sử giao dịch</h3>
                    <p className="opacity-80 mb-4">Bạn chưa thực hiện giao dịch coin nào.</p>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold"
                        onClick={() => navigate('/wallet/topup')}
                    >
                        Nạp coin ngay
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                        <span className="text-2xl">{getCoinIcon(transaction.coinType)}</span>
                                    </div>
                                    <div>
                                        <div className="font-semibold text-lg">
                                            <span className={getCoinColor(transaction.type)}>
                                                {transaction.coin > 0 ? '+' : ''}{transaction.coin.toLocaleString('vi-VN')} {getCoinIcon(transaction.coinType)}
                                            </span>
                                        </div>
                                        <div className="text-sm opacity-80">
                                            {formatDate(transaction.date)}
                                        </div>
                                        <div className="text-xs opacity-60">
                                            {transaction.description}
                                            {transaction.paymentMethod && ` • ${transaction.paymentMethod}`}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {transaction.amount > 0 ? (
                                        <div className="font-semibold text-lg">
                                            {formatVnd(transaction.amount)}
                                        </div>
                                    ) : null}
                                    <div className="text-xs opacity-60">
                                        {getTransactionTypeText(transaction.type)}
                                    </div>
                                    <div className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                                        {getStatusText(transaction.status)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]">
                <h3 className="font-semibold mb-2">💡 Mẹo nhỏ</h3>
                <ul className="text-sm opacity-80 space-y-1">
                    <li>• 💎 Kim cương là đơn vị tiền tệ được nạp bằng tiền VND, dùng để mua các chương VIP</li>
                    <li>• 🪙 Xu là đơn vị tiền tệ miễn phí, nhận được từ nhiệm vụ và thành tích, dùng để mua chương</li>
                    <li>• Dấu <span className="text-green-500">+</span> là khoản cộng vào tài khoản</li>
                    <li>• Dấu <span className="text-red-500">-</span> là khoản trừ khỏi tài khoản</li>
                    <li>• Các giao dịch được xử lý tự động và an toàn</li>
                </ul>
            </div>
        </div>
    )
}
