import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import '../../styles/LoginStyles.css';

function VerifyCode() {
    const location = useLocation();
    const [email] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const navigate = useNavigate();

    const handleResend = async () => {
        if (!email) {
            setMessage('Thiếu email để gửi OTP.');
            return;
        }

        setIsSending(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8081/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const text = await response.text();
            if (response.ok) {
                setMessage(text || 'Đã gửi lại OTP. Vui lòng kiểm tra email.');
            } else {
                setMessage(text || 'Gửi OTP thất bại.');
            }
        } catch (error) {
            console.error('Send OTP error:', error);
            setMessage('Lỗi kết nối server!');
        } finally {
            setIsSending(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();

        if (!otp.trim()) {
            setMessage('Vui lòng nhập mã OTP.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8081/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const text = await response.text();
            if (response.ok) {
                setMessage('Xác thực email thành công! Bạn có thể đăng nhập và thiết lập hồ sơ.');
                setTimeout(() => {
                    navigate('/login');
                }, 900);
            } else {
                setMessage(text || 'OTP không hợp lệ hoặc đã hết hạn.');
            }
        } catch (error) {
            console.error('Verify OTP error:', error);
            setMessage('Lỗi kết nối server!');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h2 className="form-title">❖ Xác thực Email ❖</h2>
                    <p style={{textAlign: 'center', color: '#666', marginBottom: '20px'}}>
                        Nhập mã OTP đã được gửi đến email của bạn
                    </p>
                    
                    {message && (
                        <div className={`message ${message.includes('thành công') || message.toLowerCase().includes('sent') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('thành công') || message.toLowerCase().includes('sent') ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleVerify}>
                        <div className="form-group">
                            <label htmlFor="email" style={{display: 'none'}}>Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="form-input"
                                placeholder="Email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="otp" style={{display: 'none'}}>Mã OTP</label>
                            <input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                name="otp"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="form-input"
                                placeholder="Nhập mã OTP"
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={isSending || isLoading}
                            className={`submit-button ${isSending ? 'loading' : ''}`}
                            style={{marginBottom: '15px'}}
                        >
                            {isSending ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang gửi OTP...
                                </>
                            ) : (
                                'Gửi lại mã OTP'
                            )}
                        </button>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang xác thực...
                                </>
                            ) : (
                                'Xác thực'
                            )}
                        </button>
                    </form>

                    <div className="form-links">
                        <Link to="/register" className="register-link">
                            Quay lại đăng ký
                        </Link>
                        
                        <Link to="/login" className="forgot-link">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerifyCode;
