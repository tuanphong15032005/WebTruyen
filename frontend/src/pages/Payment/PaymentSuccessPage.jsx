import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { WalletContext } from '../../context/WalletContext'
import { useContext } from 'react'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshWallet } = useContext(WalletContext)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    // Refresh wallet balance when component mounts
    const refreshBalance = async () => {
      setIsRefreshing(true)
      try {
        await refreshWallet()
      } catch (error) {
        console.error('Failed to refresh wallet:', error)
      } finally {
        setIsRefreshing(false)
      }
    }
    
    refreshBalance()
  }, [refreshWallet])

  const handleContinueTopup = () => {
    navigate('/wallet/topup')
  }

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Thanh toán thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Giao dịch đã được hoàn tất. Coin B sẽ được cộng vào tài khoản của bạn.
          </p>

          {/* Balance Refresh Status */}
          {isRefreshing && (
            <div className="mb-4 text-sm text-blue-600">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Đang cập nhật số dư...
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinueTopup}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
            >
              Nạp tiếp
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition duration-200"
            >
              Trở về màn hình chính
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 text-xs text-gray-500">
            <p>Mã giao dịch sẽ được gửi đến email của bạn.</p>
            <p>Nếu có vấn đề, vui lòng liên hệ hỗ trợ.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
