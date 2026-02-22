import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);

    useEffect(() => {
        if (lockSecondsRemaining <= 0) {
            return;
        }

        const timer = setInterval(() => {
            setLockSecondsRemaining((prev) => {
                const next = prev - 1;
                return next <= 0 ? 0 : next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [lockSecondsRemaining]);

    const validateForm = () => {
        const newErrors = { username: '', password: '' };
        let isValid = true;

        if (!formData.username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
            isValid = false;
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        setMessage('');
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (lockSecondsRemaining > 0) {
            return;
        }

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const user = await response.json();

                // Lưu full user object
                localStorage.setItem('user', JSON.stringify(user));

                // Nếu backend trả JWT thì lưu riêng
                if (user.accessToken) {
                    localStorage.setItem("accessToken", user.accessToken);
                }

                if (user.userId) {
                    localStorage.setItem("userId", user.userId);
                }

                if (user.username) {
                    localStorage.setItem("username", user.username);
                }

                setMessage('Đăng nhập thành công! Đang chuyển hướng...');

                setTimeout(() => {
                    window.location.href = '/';
                }, 800);
            } else {
                const contentType = response.headers.get('content-type') || '';
                if (response.status === 423 && contentType.includes('application/json')) {
                    const body = await response.json();
                    const secondsRemaining = Number(body?.secondsRemaining);
                    setLockSecondsRemaining(Number.isFinite(secondsRemaining) && secondsRemaining > 0 ? Math.ceil(secondsRemaining) : 60);
                    setMessage('Tài khoản đã bị vô hiệu trong 1 phút. Vui lòng thử lại sau.');
                } else {
                    const errorText = await response.text();
                    if ((errorText || '').includes('Account is temporarily locked')) {
                        setLockSecondsRemaining(60);
                        setMessage('Tài khoản đã bị vô hiệu trong 1 phút. Vui lòng thử lại sau.');
                    } else {
                        setMessage(errorText || 'Tên đăng nhập hoặc mật khẩu không đúng');
                    }
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage("Lỗi kết nối server! Vui lòng thử lại sau.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div className="login-container">
            {/* Animated Background Shapes */}
            <div className="floating-shape shape-1"></div>
            <div className="floating-shape shape-2"></div>
            <div className="floating-shape shape-3"></div>
            <div className="floating-shape shape-4"></div>

            {/* Login Card */}
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <span className="logo-icon">📚</span>
                    </div>
                    <h1 className="login-title">WebTruyen</h1>
                    <p className="login-subtitle">Đăng nhập để khám phá thế giới truyện</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {message && (
                        <div className={`message ${message.includes('thành công') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('thành công') ? '✓' : '⚠'}
                            </span>
                            {lockSecondsRemaining > 0
                                ? `${message} (${lockSecondsRemaining}s)`
                                : message}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="username">
                            Tên đăng nhập
                        </label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.username ? 'has-error' : ''} ${formData.username ? 'has-value' : ''}`}>
                                <span className="input-icon">👤</span>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    autoComplete="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    onKeyPress={handleKeyPress}
                                    className="form-input input-with-icon"
                                    placeholder="Nhập tên đăng nhập"
                                    disabled={isLoading || lockSecondsRemaining > 0}
                                />
                            </div>
                            {errors.username && (
                                <span className="field-error">{errors.username}</span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">
                            Mật khẩu
                        </label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.password ? 'has-error' : ''} ${formData.password ? 'has-value' : ''}`}>
                                <span className="input-icon">🔒</span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyPress={handleKeyPress}
                                    className="form-input input-with-icon has-password-toggle"
                                    placeholder="Nhập mật khẩu"
                                    disabled={isLoading || lockSecondsRemaining > 0}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    tabIndex="-1"
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.password && (
                                <span className="field-error">{errors.password}</span>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || lockSecondsRemaining > 0}
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <>
                                <span>{lockSecondsRemaining > 0 ? 'Đang bị khóa...' : 'Đăng Nhập'}</span>
                                <span className="button-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <div className="footer-links">
                        <Link to="/forgot-password" className="forgot-password-link">
                            Quên mật khẩu?
                        </Link>
                    </div>
                    <p className="footer-text">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="register-link">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>

            {/* Decorative elements */}
            <div className="decoration-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    );
}

export default Login;