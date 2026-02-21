import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api'; // Import Axios
import '../styles/Login.css';

function VerifyCode() {
    const location = useLocation();
    const [email] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    // Hàm Gửi lại OTP
    const handleResend = async () => {
        if (!email) {
            setMessage('Thiếu email để gửi OTP.');
            return;
        }

        setIsSending(true);
        setMessage('');

        try {
            // Thay thế fetch bằng Axios
            const response = await api.post('/api/auth/send-otp', { email });

            if (response.status === 200 || response.status === 201) {
                // Lấy message từ server trả về, nếu không có thì dùng text mặc định
                const text = response.data;
                setMessage(typeof text === 'string' && text ? text : 'Đã gửi lại OTP. Vui lòng kiểm tra email.');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            const errorText = error?.response?.data;
            setMessage(typeof errorText === 'string' ? errorText : 'Gửi OTP thất bại.');
        } finally {
            setIsSending(false);
        }
    };

    // Hàm Xác thực OTP
    const handleVerify = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            setMessage('Vui lòng nhập mã OTP.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // Thay thế fetch bằng Axios
            const response = await api.post('/api/auth/verify-otp', { email, otp });

            if (response.status === 200 || response.status === 201) {
                setMessage('Xác thực email thành công! Bạn có thể đăng nhập và thiết lập hồ sơ.');
                setTimeout(() => {
                    navigate('/login');
                }, 900);
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            const errorText = error?.response?.data;
            setMessage(typeof errorText === 'string' ? errorText : 'OTP không hợp lệ hoặc đã hết hạn.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
            <div className="floating-shape shape-4"></div>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">📚</span>
                    </div>
                    <h1 className="login-title">Xác thực Email</h1>
                    <p className="login-subtitle">Nhập mã OTP đã được gửi đến email của bạn</p>
                </div>

                <form onSubmit={handleVerify} noValidate>
                    {message && (
                        <div className={`message ${message.includes('thành công') || message.toLowerCase().includes('đã gửi') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('thành công') || message.toLowerCase().includes('đã gửi') ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${email ? 'has-value' : ''}`}>
                                <span className="input-icon">✉️</span>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    disabled
                                    className="form-input input-with-icon"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="otp">Mã OTP</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${otp ? 'has-value' : ''}`}>
                                <span className="input-icon">🔢</span>
                                <input
                                    id="otp"
                                    type="text"
                                    inputMode="numeric"
                                    name="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="form-input input-with-icon"
                                    placeholder="Nhập mã OTP"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSending || isLoading}
                        className={`login-button ${isSending ? 'loading' : ''}`}
                        style={{ marginTop: 0 }}
                    >
                        {isSending ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Đang gửi OTP...</span>
                            </>
                        ) : (
                            <>
                                <span>Gửi lại mã OTP</span>
                                <span className="button-arrow">→</span>
                            </>
                        )}
                    </button>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Đang xác thực...</span>
                            </>
                        ) : (
                            <>
                                <span>Xác thực</span>
                                <span className="button-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="footer-text">
                        Quay lại{' '}
                        <Link to="/register" className="register-link">
                            Đăng ký
                        </Link>
                        {' '}hoặc{' '}
                        <Link to="/login" className="register-link">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>

            <div className="decoration-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
}

export default VerifyCode;