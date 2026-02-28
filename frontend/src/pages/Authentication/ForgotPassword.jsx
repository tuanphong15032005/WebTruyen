import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/LoginStyles.css';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState({ email: '' });
    const emailRef = useRef(null);

    const validateForm = () => {
        const newErrors = { email: '' };
        let isValid = true;

        if (!email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        setMessage('');
        // Clear error when user starts typing
        if (errors.email) {
            setErrors({ email: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8081/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.text();

            if (response.ok) {
                setMessage('Email khôi phục mật khẩu đã được gửi! Vui lòng kiểm tra hộp thư.');
            } else {
                setMessage(data || 'Gửi email thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setMessage('Lỗi kết nối server! Vui lòng thử lại sau.');
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
                    <h2 className="form-title">❖ Quên Mật Khẩu ❖</h2>
                    
                    {message && (
                        <div className={`message ${message.includes('gửi') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('gửi') ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
                        Nhập email của bạn và chúng tôi sẽ gửi link khôi phục mật khẩu
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                ref={emailRef}
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="Email"
                                disabled={isLoading}
                                autoComplete="email"
                                required
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang gửi...
                                </>
                            ) : (
                                'Gửi Email Khôi Phục'
                            )}
                        </button>
                    </form>

                    <div className="form-links">
                        <Link to="/login" className="register-link">
                            Quay lại đăng nhập
                        </Link>
                        
                        <Link to="/register" className="register-link">
                            Chưa có tài khoản? Đăng ký tại đây
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ForgotPassword;
