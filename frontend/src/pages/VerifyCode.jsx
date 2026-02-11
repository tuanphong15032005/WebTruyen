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
        setMessage(text || 'X?c th?c th?t b?i');
      }
    } catch (error) {
      const errorText = error?.response?.data || 'L?i k?t n?i!';
      setMessage(errorText);
    }
  };

  return (
    <div className='container-center'>
      <h2>X?c th?c t?i kho?n</h2>
      <p>M? OTP ?? ???c g?i ??n email c?a b?n.</p>
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
          placeholder='Nh?p m? OTP 6 s?'
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          style={{ padding: '8px' }}
        />
        <button type='submit' style={{ padding: '10px' }}>
          X?c nh?n
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
    </div>
  );
}

export default VerifyCode;
