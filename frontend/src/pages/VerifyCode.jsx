import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

function VerifyCode() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/verify-otp', { email, otp });
      const text = response?.data;
      if (response.status === 200) {
        navigate('/login');
      } else {
        setMessage(text || 'Xác thực thất bại');
      }
    } catch (error) {
      const errorText = error?.response?.data || 'Lỗi kết nối!';
      setMessage(errorText);
    }
  };

  return (
    <div className='container-center'>
      <h2>Xác thực tài khoản</h2>
      <p>Mã OTP đã được gửi đến email của bạn.</p>
      <form
        onSubmit={handleVerify}
        style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
      >
        <input
          type='email'
          placeholder='Email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled
          style={{ padding: '8px' }}
        />
        <input
          type='text'
          placeholder='Nhập mã OTP 6 số'
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <button type='submit' style={{ padding: '10px' }}>
          Xác nhận
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}

export default VerifyCode;
