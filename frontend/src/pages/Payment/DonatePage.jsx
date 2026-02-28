import React, { useContext, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { WalletContext } from '../../context/WalletContext'
import api from '../../services/api'
import { donateToAuthor } from '../../api/walletApi'

const DONATION_PACKAGES = [
  { coinB: 100 },
  { coinB: 500 },
  { coinB: 1000 },
  { coinB: 5000 },
  { coinB: 10000 },
]

export default function DonatePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { wallet, refreshWallet } = useContext(WalletContext)
  const [authorData, setAuthorData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [donating, setDonating] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmPopup, setShowConfirmPopup] = useState(false)
  const [donationMessage, setDonationMessage] = useState('')

  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        console.log('🔍 Fetching author data for userId:', userId);
        const response = await api.get(`/users/${userId}/portfolio`);
        console.log('📡 Author data response:', response);
        setAuthorData(response);
      } catch (err) {
        console.error('❌ Error fetching author data:', err);
        setError(err.message || 'Failed to load author information');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAuthorData();
    }
  }, [userId]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('accessToken') || JSON.parse(localStorage.getItem('user') || '{}')?.token
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const handleDonate = async (packageIndex) => {
    if (!authorData?.author) {
      setError('This user is not an author')
      return
    }

    const pkg = DONATION_PACKAGES[packageIndex]
    if (wallet.coinB < pkg.coinB) {
      setError('Insufficient Coin B balance. Please top up your wallet.')
      return
    }

    setSelectedPackage(packageIndex)
    setShowConfirmPopup(true)
    setDonationMessage('')
  }

  const handleCustomDonate = () => {
    const amount = parseInt(customAmount)
    if (!amount || amount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ')
      return
    }
    if (wallet.coinB < amount) {
      setError('Insufficient Coin B balance. Please top up your wallet.')
      return
    }
    setShowCustomModal(true)
  }

  const confirmCustomDonate = async () => {
    const amount = parseInt(customAmount)
    if (!amount || amount <= 0) return

    setDonating(true)
    setError('')
    setSuccess('')
    setShowCustomModal(false)

    try {
      const response = await donateToAuthor(parseInt(userId), amount, customMessage)

      setSuccess(`Đã ủng hộ thành công ${amount.toLocaleString()} 💎 cho ${authorData.displayName || authorData.username}!`)
      
      // Refresh wallet to show updated balance
      await refreshWallet()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
      }, 3000)
      
      // Reset custom form
      setCustomAmount('')
      setCustomMessage('')
      
    } catch (err) {
      setError(err.response?.data?.message || 'Ủng hộ thất bại. Vui lòng thử lại.')
      console.error('Donation error:', err)
    } finally {
      setDonating(false)
    }
  }

  const confirmDonate = async () => {
    if (selectedPackage === null) return

    const pkg = DONATION_PACKAGES[selectedPackage]
    
    setDonating(true)
    setError('')
    setSuccess('')
    setShowConfirmPopup(false)

    try {
      const response = await donateToAuthor(parseInt(userId), pkg.coinB, donationMessage)

      setSuccess(`Đã ủng hộ thành công ${pkg.coinB} 💎 cho ${authorData.displayName || authorData.username}!`)
      
      // Refresh wallet to show updated balance
      await refreshWallet()
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('')
      }, 3000)
      
    } catch (err) {
      setError(err.response?.data?.message || 'Ủng hộ thất bại. Vui lòng thử lại.')
      console.error('Donation error:', err)
    } finally {
      setDonating(false)
      setSelectedPackage(null)
      setDonationMessage('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải trang ủng hộ...</p>
        </div>
      </div>
    )
  }

  if (!authorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Không tìm thấy tác giả</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Thử lại
            </button>
            <button
              onClick={() => navigate(`/user/${userId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Về trang cá nhân
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!authorData.author) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Người dùng này không phải là tác giả và không thể nhận ủng hộ</p>
          <button
            onClick={() => navigate(`/user/${userId}`)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Về trang cá nhân
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ủng hộ tác giả</h1>
              <p className="text-gray-600 mt-1">Ủng hộ {authorData.displayName || authorData.username} bằng đồng xu của bạn</p>
            </div>
            <button
              onClick={() => navigate(`/user/${userId}`)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← Về trang cá nhân
            </button>
          </div>
        </div>

        {/* Author Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-xl font-bold text-white">
                {(authorData.displayName || authorData.username)?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {authorData.displayName || authorData.username}
              </h2>
              <p className="text-gray-600">@{authorData.username}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <span className="mr-4">📚 {authorData.storiesCount || 0} Stories</span>
                <span>👥 {authorData.followersCount || 0} Followers</span>
              </div>
            </div>
          </div>
        </div>

        {/* Your Balance */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Số dư hiện tại của bạn</h3>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Kim Cương</p>
                <p className="text-2xl font-bold text-blue-900">{wallet.coinB?.toLocaleString() || 0}</p>
              </div>
              <div className="text-3xl">💎</div>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/wallet/topup')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Cần thêm xu? → Nạp ví
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Donation Packages */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn số tiền ủng hộ</h3>
          <p className="text-sm text-gray-600 mb-6">
            Ủng hộ Kim Cương (💎) để hỗ trợ tác giả yêu thích của bạn
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DONATION_PACKAGES.map((pkg, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedPackage === index
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                } ${wallet.coinB < pkg.coinB ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => wallet.coinB >= pkg.coinB && setSelectedPackage(index)}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 mb-3">
                    Gói {index + 1}
                  </div>
                  
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl">💎</span>
                    <span className="font-medium">{pkg.coinB.toLocaleString()}</span>
                  </div>
                  
                  {wallet.coinB < pkg.coinB && (
                    <p className="text-xs text-red-600 mt-2">Không đủ số dư</p>
                  )}
                  
                  <button
                    className={`mt-4 w-full py-2 rounded-lg font-medium transition-colors ${
                      selectedPackage === index
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${wallet.coinB < pkg.coinB ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={wallet.coinB < pkg.coinB || donating}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (wallet.coinB >= pkg.coinB) {
                        handleDonate(index)
                      }
                    }}
                  >
                    {donating ? 'Đang xử lý...' : 'Ủng hộ ngay'}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Custom Donation Option */}
            <div
              className={`border rounded-lg p-4 cursor-pointer transition-all border-gray-200 hover:border-gray-300 ${
                showCustomModal ? 'border-blue-500 bg-blue-50' : ''
              }`}
              onClick={() => setShowCustomModal(true)}
            >
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 mb-3">
                  Tùy chỉnh
                </div>
                
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">💎</span>
                  <span className="font-medium">Nhập số tiền</span>
                </div>
                
                <button
                  className="mt-4 w-full py-2 rounded-lg font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                  disabled={donating}
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowCustomModal(true)
                  }}
                >
                  {donating ? 'Đang xử lý...' : 'Ủng hộ tùy chỉnh'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Donation Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ủng hộ tùy chỉnh</h3>
              
              {/* Author Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {(authorData.displayName || authorData.username)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {authorData.displayName || authorData.username}
                  </p>
                  <p className="text-sm text-gray-600">@{authorData.username}</p>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số tiền ủng hộ (💎)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">💎</span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Nhập số tiền muốn ủng hộ"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    max={wallet.coinB}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Số dư khả dụng: {wallet.coinB?.toLocaleString() || 0} 💎
                </p>
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lời nhắn (tùy chọn)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Gửi lời nhắn động viên đến tác giả..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  maxLength="200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {customMessage.length}/200 ký tự
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCustomModal(false)
                    setCustomAmount('')
                    setCustomMessage('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={donating}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmCustomDonate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={donating || !customAmount || parseInt(customAmount) <= 0 || parseInt(customAmount) > wallet.coinB}
                >
                  {donating ? 'Đang xử lý...' : 'Xác nhận ủng hộ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Popup */}
        {showConfirmPopup && selectedPackage !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Xác nhận ủng hộ</h3>
              
              {/* Author Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {(authorData.displayName || authorData.username)?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {authorData.displayName || authorData.username}
                  </p>
                  <p className="text-sm text-gray-600">@{authorData.username}</p>
                </div>
              </div>

              {/* Donation Amount */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Số tiền ủng hộ</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">💎</span>
                  <span className="text-2xl font-bold text-blue-900">
                    {DONATION_PACKAGES[selectedPackage].coinB.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Để lại lời nhắn (tùy chọn)
                </label>
                <textarea
                  value={donationMessage}
                  onChange={(e) => setDonationMessage(e.target.value)}
                  placeholder="Gửi lời nhắn động viên đến tác giả..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  maxLength="200"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {donationMessage.length}/200 ký tự
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmPopup(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={donating}
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDonate}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={donating}
                >
                  {donating ? 'Đang xử lý...' : 'Xác nhận ủng hộ'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
