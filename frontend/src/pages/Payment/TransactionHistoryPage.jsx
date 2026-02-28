import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTransactionHistory } from '../../api/paymentApi'
import '../../App.css'

export default function CoinTransactionHistoryPage() {
    const [transactions, setTransactions] = useState([])
    const [filteredTransactions, setFilteredTransactions] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    
    // Filter states
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [category, setCategory] = useState('all')
    const [showFilters, setShowFilters] = useState(false)
    const [dateError, setDateError] = useState('')
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

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
                    let category = 'other' // new category for filtering
                    
                    // Debug: Log the reason to see what backend actually sends
                    console.log('=== TRANSACTION DEBUG ===')
                    console.log('reason:', transaction.reason)
                    console.log('delta:', transaction.delta)
                    console.log('coin:', transaction.coin)
                    console.log('description:', transaction.description)
                    console.log('ref_type:', transaction.ref_type)
                    console.log('ref_id:', transaction.ref_id)
                    console.log('Full transaction:', transaction)
                    console.log('========================')
                    
                    // Determine transaction type and category based on reason and delta
                    if (transaction.reason === 'TOPUP') {
                        type = 'deposit'
                        category = 'topup'
                        paymentMethod = 'VNPAY'
                    } else if (transaction.reason === 'SPEND_CHAPTER') {
                        type = 'purchase'
                        category = 'purchase_chapter'
                    } else if (transaction.reason === 'DONATE') {
                        // Check delta to determine if giving or receiving
                        if (transaction.delta < 0) {
                            // Giving donation (negative delta)
                            type = 'purchase'
                            category = 'donate_given'
                        } else {
                            // Receiving donation (positive delta)
                            type = 'deposit'
                            category = 'donate_received'
                        }
                    } else if (transaction.reason === 'WITHDRAW') {
                        // This can be either a true withdrawal or receiving a donation
                        if (transaction.delta > 0) {
                            // Receiving donation (positive delta)
                            type = 'deposit'
                            category = 'donate_received'
                        } else {
                            // True withdrawal (negative delta)
                            type = 'deposit'
                            category = 'withdraw'
                        }
                    } else if (transaction.reason === 'EARN' || transaction.reason === 'REVIEW_REWARD') {
                        type = 'deposit'
                        category = 'reward'
                    }
                    
                    // Debug: Log the final category assignment
                    console.log('Final category:', category)
                    console.log('=== END DEBUG ===')

                    // Calculate VND amount (1 coin = 1 VND for display, but only for deposits)
                    let vndAmount = 0
                    if (transaction.reason === 'TOPUP') {
                        vndAmount = Math.abs(transaction.delta) // 50,000 coin = 50,000 VND
                    }

                    return {
                        id: transaction.id,
                        type: type,
                        category: category,
                        amount: vndAmount, // Only for deposits, 0 for purchases
                        coin: transaction.delta, // Use delta for correct sign
                        coinType: transaction.coinType === 'A' ? 'coinA' : 'coinB',
                        date: transaction.createdAt,
                        status: 'completed', // All ledger entries are completed
                        description: transaction.description,
                        paymentMethod: paymentMethod,
                        reason: transaction.reason // Keep original reason for debugging
                    }
                })

                setTransactions(mappedTransactions)
                setFilteredTransactions(mappedTransactions)
            } catch (error) {
                console.error('Error loading transaction history:', error)
                setError('Không thể tải lịch sử giao dịch')
            } finally {
                setLoading(false)
            }
        }

        fetchTransactionHistory()
    }, [navigate])
    
    // Apply filters
    useEffect(() => {
        let filtered = [...transactions]
        
        // Validate date range
        if (startDate && endDate) {
            const start = new Date(startDate)
            const end = new Date(endDate)
            if (end < start) {
                setDateError('Đến ngày phải lớn hơn hoặc bằng từ ngày')
                setFilteredTransactions([])
                return
            }
        }
        
        setDateError('') // Clear error if dates are valid
        
        // Apply date filter
        if (startDate) {
            const start = new Date(startDate)
            start.setHours(0, 0, 0, 0)
            filtered = filtered.filter(t => new Date(t.date) >= start)
        }
        
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            filtered = filtered.filter(t => new Date(t.date) <= end)
        }
        
        // Apply category filter
        if (category !== 'all') {
            filtered = filtered.filter(t => t.category === category)
        }
        
        setFilteredTransactions(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }, [transactions, startDate, endDate, category])
    
    // Reset filters
    const resetFilters = () => {
        setStartDate('')
        setEndDate('')
        setCategory('all')
        setDateError('')
        setCurrentPage(1)
    }
    
    // Handle end date change with validation
    const handleEndDateChange = (value) => {
        setEndDate(value)
        if (startDate && value) {
            const start = new Date(startDate)
            const end = new Date(value)
            if (end < start) {
                setDateError('Đến ngày phải lớn hơn hoặc bằng từ ngày')
            } else {
                setDateError('')
            }
        } else {
            setDateError('')
        }
    }
    
    // Handle start date change
    const handleStartDateChange = (value) => {
        setStartDate(value)
        if (endDate && value) {
            const start = new Date(value)
            const end = new Date(endDate)
            if (end < start) {
                setDateError('Đến ngày phải lớn hơn hoặc bằng từ ngày')
            } else {
                setDateError('')
            }
        } else {
            setDateError('')
        }
    }
    
    // Get category display text
    const getCategoryText = (category) => {
        switch (category) {
            case 'topup':
                return 'Nạp tiền'
            case 'purchase_chapter':
                return 'Mua chương VIP'
            case 'donate_given':
                return 'Ủng hộ người khác'
            case 'donate_received':
                return 'Nhận donate'
            case 'withdraw':
                return 'Rút tiền'
            case 'reward':
                return 'Nhận thưởng'
            default:
                return 'Khác'
        }
    }
    
    // Format transaction description to show specific details
    const formatTransactionDescription = (transaction) => {
        if (transaction.category === 'donate_received') {
            const desc = transaction.description || ''
            
            // Check if backend sends detailed donation info
            const senderName = (
                transaction.from_username || 
                transaction.from_display_name ||
                transaction.fromUserName ||
                transaction.from_user_name
            )
            
            const message = (
                transaction.donation_message ||
                transaction.message ||
                transaction.note
            )
            
            // If we have detailed info, show it
            if (senderName && message) {
                return `Nhận donate từ: ${senderName} - "${message}"`
            } else if (senderName) {
                return `Nhận donate từ: ${senderName}`
            } else if (message) {
                return `Nhận donate: "${message}"`
            }
            
            // Fallback to generic description
            if (desc === 'Donate tác giả' || desc === 'Donate' || !desc || desc.length < 5) {
                return `Nhận được donate ${Math.abs(transaction.coin)} coin`
            }
            
            // If description already contains proper format, use it as is
            if (desc.includes('từ ') || desc.includes('người dùng:')) {
                return desc
            }
            
            return `Nhận donate: ${desc}`
        }
        
        if (transaction.category === 'donate_given') {
            const desc = transaction.description || ''
            
            // Check if backend sends detailed donation info
            const authorName = (
                transaction.to_username || 
                transaction.to_display_name ||
                transaction.toUserName ||
                transaction.to_user_name
            )
            
            const message = (
                transaction.donation_message ||
                transaction.message ||
                transaction.note
            )
            
            // If we have detailed info, show it
            if (authorName && message) {
                return `Ủng hộ tác giả: ${authorName} - "${message}"`
            } else if (authorName) {
                return `Ủng hộ tác giả: ${authorName}`
            } else if (message) {
                return `Ủng hộ tác giả: "${message}"`
            }
            
            // Fallback to generic description
            if (desc === 'Donate tác giả' || desc === 'Donate' || !desc || desc.length < 5) {
                return `Đã donate ${Math.abs(transaction.coin)} coin`
            }
            
            // If description already contains proper format, use it as is
            if (desc.includes('cho ') || desc.includes('tác giả:')) {
                return desc
            }
            
            return `Ủng hộ tác giả: ${desc}`
        }
        
        if (transaction.category === 'purchase_chapter') {
            return transaction.description || 'Mua chương VIP'
        }
        
        // For other types, return description as is
        return transaction.description || 'Giao dịch không có mô tả'
    }
    
    // Pagination calculations
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex)
    
    // Pagination handlers
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }
    
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }
    
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

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
                <div className="flex gap-2">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        {showFilters ? 'Ẩn bộ lọc' : 'Bộ lọc'}
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]"
                        onClick={() => navigate('/')}
                    >
                        Quay lại
                    </button>
                </div>
            </div>
            
            {/* Filters Section */}
            {showFilters && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-6">
                    <h3 className="text-lg font-semibold mb-4">Bộ lọc giao dịch</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Từ ngày
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleStartDateChange(e.target.value)}
                                max={endDate || ''}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    dateError ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                        </div>
                        
                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Đến ngày
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleEndDateChange(e.target.value)}
                                min={startDate || ''}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    dateError ? 'border-red-300' : 'border-gray-300'
                                }`}
                            />
                        </div>
                        
                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Danh mục
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="topup">Nạp tiền</option>
                                <option value="purchase_chapter">Mua chương VIP</option>
                                <option value="donate_given">Ủng hộ người khác</option>
                                <option value="donate_received">Nhận donate</option>
                                <option value="withdraw">Rút tiền</option>
                                <option value="reward">Nhận thưởng</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                    </div>
                    
                    {/* Error Message */}
                    {dateError && (
                        <div className="mb-4 p-3 rounded-lg border border-red-300 bg-red-50 text-red-700 text-sm">
                            {dateError}
                        </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Hiển thị {dateError ? 0 : currentTransactions.length} / {filteredTransactions.length} giao dịch {filteredTransactions.length > 0 && `(Trang ${currentPage}/${totalPages})`}
                        </div>
                        <button
                            type="button"
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            onClick={resetFilters}
                        >
                            Reset bộ lọc
                        </button>
                    </div>
                </div>
            )}

            {error ? (
                <div className="mb-6 p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-200">
                    {error}
                </div>
            ) : null}

            {filteredTransactions.length === 0 && transactions.length > 0 ? (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold mb-2">Không tìm thấy giao dịch nào</h3>
                    <p className="opacity-80 mb-4">Không có giao dịch nào phù hợp với bộ lọc đã chọn.</p>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                        onClick={resetFilters}
                    >
                        Reset bộ lọc
                    </button>
                </div>
            ) : transactions.length === 0 ? (
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
                    {currentTransactions.map((transaction) => (
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
                                            {formatTransactionDescription(transaction)}
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
                                        {getCategoryText(transaction.category)}
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
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} của {filteredTransactions.length} giao dịch
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            ←
                        </button>
                        
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                // Show current page, first, last, and pages near current
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-2 rounded-lg font-medium ${
                                                page === currentPage
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                    return (
                                        <span key={page} className="px-2 text-gray-500">
                                            ...
                                        </span>
                                    )
                                }
                                return null
                            })}
                        </div>
                        
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            →
                        </button>
                    </div>
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
