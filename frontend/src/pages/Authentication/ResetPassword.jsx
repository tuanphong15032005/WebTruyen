import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../../styles/LoginStyles.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setTokenValid(false);
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const validateForm = () => {
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('http://localhost:8081/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          newPassword 
        }),
      });

      const data = await response.text();

      if (response.ok) {
        setMessage(data);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data);
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="login-container">
        {/* Cột Trái */}
        <div className="left-column">
          <div className="brand-content">
            <h1 className="brand-title">TramDoc</h1>
          </div>
        </div>

        {/* Cột Phải */}
        <div className="right-column">
          <div className="form-container">
            <h2 className="form-title">❖ Liên kết không hợp lệ ❖</h2>
            
            <div className="message error-message">
              <span className="message-icon">⚠</span>
              {error}
            </div>
            
            <button 
              className="submit-button" 
              onClick={() => navigate('/forgot-password')}
            >
              Yêu cầu liên kết mới
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* Cột Trái */}
      <div className="left-column">
        <div className="brand-content">
          <h1 className="brand-title">TramDoc</h1>
        </div>
      </div>

      {/* Cột Phải */}
      <div className="right-column">
        <div className="form-container">
          <h2 className="form-title">❖ Đặt lại mật khẩu ❖</h2>
          
          {message && (
            <div className="message success-message">
              <span className="message-icon">✓</span>
              {message}
            </div>
          )}
          
          {error && (
            <div className="message error-message">
              <span className="message-icon">⚠</span>
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword" style={{display: 'none'}}>Mật khẩu mới</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="Mật khẩu mới (tối thiểu 8 ký tự)"
                disabled={loading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword" style={{display: 'none'}}>Xác nhận mật khẩu</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="Xác nhận mật khẩu mới"
                disabled={loading}
                required
              />
            </div>
            
            <button type="submit" className={`submit-button ${loading ? 'loading' : ''}`} disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Đang xử lý...
                </>
              ) : (
                'Đặt lại mật khẩu'
              )}
            </button>
          </form>
          
          <div className="form-links">
            <button 
              type="button" 
              className="forgot-link" 
              onClick={() => navigate('/login')}
              style={{
                background: 'none',
                border: 'none',
                color: '#d63384',
                textDecoration: 'none',
                fontSize: '0.9rem',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit'
              }}
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
