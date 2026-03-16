import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { processVNPayReturn, confirmPayment } from '../api/paymentApi'
import { WalletContext } from '../context/WalletContext'
import { useContext } from 'react'

export default function VNPayReturnHandler() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('processing')
  const { refreshWallet } = useContext(WalletContext)

  useEffect(() => {
    const handleReturn = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries())
        console.log('VNPay return params:', params)
        
        const response = await processVNPayReturn(params)
        console.log('VNPay backend response:', response)
        
        // Handle both success response and error response from axios interceptor
        let responseData
        if (response && typeof response === 'object' && response.status !== undefined) {
          // Success case - axios interceptor returned response.data directly
          responseData = response
        } else if (response && typeof response === 'string') {
          // Error case - axios interceptor converted error to string
          throw new Error(response)
        } else {
          throw new Error('Invalid response from backend: ' + JSON.stringify(response))
        }
        
        console.log('Processed response data:', responseData)
        
        if (responseData.status === 'success') {
          // Confirm payment on backend
          await confirmPayment(responseData.orderId)
          // Refresh wallet balance
          await refreshWallet()
          setStatus('success')
          setTimeout(() => {
            navigate('/payment/success')
          }, 2000)
        } else if (responseData.status === 'cancelled') {
          // Payment cancelled by user
          setStatus('cancelled')
          setTimeout(() => {
            navigate('/wallet/topup', {
              state: { 
                message: 'Bạn đã hủy thanh toán',
                type: 'warning' 
              } 
            })
          }, 2000)
        } else {
          // Handle failed payment
          setStatus('failed')
          setTimeout(() => {
            navigate('/wallet/topup', {
              state: { 
                message: 'Thanh toán thất bại: ' + (responseData.message || 'Unknown error'),
                type: 'error' 
              } 
            })
          }, 2000)
        }
      } catch (error) {
        console.error('Error processing VNPay return:', error)
        setStatus('error')
        
        // Extract error message from different possible sources
        let errorMessage = 'Có lỗi xảy ra khi xử lý thanh toán'
        if (error?.response?.data) {
          errorMessage = typeof error.response.data === 'string' 
            ? error.response.data 
            : error.response.data.message || error.response.data.error || errorMessage
        } else if (error?.message) {
          errorMessage = error.message
        }
        
        setTimeout(() => {
          navigate('/wallet/topup', {
            state: { 
              message: errorMessage,
              type: 'error' 
            } 
          })
        }, 2000)
      }
    }

    handleReturn()
  }, [searchParams, navigate, refreshWallet])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        {status === 'processing' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang xử lý thanh toán...</p>
          </div>
        )}
        {status === 'success' && (
          <div>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <p className="text-green-600 font-semibold text-lg">Thanh toán thành công!</p>
            <p className="text-gray-600 mt-2">Đang chuyển hướng...</p>
          </div>
        )}
        {status === 'cancelled' && (
          <div>
            <div className="text-orange-600 text-6xl mb-4">✕</div>
            <p className="text-orange-600 font-semibold text-lg">Thanh toán đã bị hủy!</p>
            <p className="text-gray-600 mt-2">Đang chuyển hướng...</p>
          </div>
        )}
        {status === 'failed' && (
          <div>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <p className="text-red-600 font-semibold text-lg">Thanh toán thất bại!</p>
            <p className="text-gray-600 mt-2">Đang chuyển hướng...</p>
          </div>
        )}
        {status === 'error' && (
          <div>
            <div className="text-orange-600 text-6xl mb-4">!</div>
            <p className="text-orange-600 font-semibold text-lg">Có lỗi xảy ra!</p>
            <p className="text-gray-600 mt-2">Đang chuyển hướng...</p>
          </div>
        )}
      </div>
    </div>
  )
}
