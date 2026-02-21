import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Login.css';
import api from '../services/api';

function Register() {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
    });
    const [errors, setErrors] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        agreeTerms: '',
    });
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateForm = () => {
        const newErrors = {
            username: '',
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            agreeTerms: '',
        };
        let isValid = true;

        if (!formData.username.trim()) {
            newErrors.username = 'Vui lòng nhập username';
            isValid = false;
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
            isValid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
            isValid = false;
        }

        if (!formData.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
            isValid = false;
        } else if (formData.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
            isValid = false;
        } else if (formData.confirmPassword !== formData.password) {
            newErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
            isValid = false;
        }

        if (!formData.agreeTerms) {
            newErrors.agreeTerms = 'Bạn cần đồng ý Điều khoản & Điều kiện';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
        setMessage('');
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
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
                const payload = {
                    username: formData.username,
                    email: formData.email,
                    password: formData.password,
                    displayName: formData.fullName,
                };

                // 1. Gọi API bằng Axios
                const response = await api.post('/api/auth/register', payload);

                // 2. Axios coi các mã status 2xx (200, 201) là thành công
                if (response.status === 200 || response.status === 201) {
                    navigate('/verify', { state: { email: formData.email } });
                }
            } catch (error) {
                console.error('Register error:', error);
                // 3. Axios tự động nhảy vào catch nếu server trả về lỗi (400, 401, 500...)
                // Lấy câu thông báo lỗi từ server (ví dụ: "Email đã tồn tại")
                const errorText = error?.response?.data;
                setMessage(
                    typeof errorText === 'string'
                    ? errorText
                    : 'Đăng ký thất bại. Vui lòng thử lại.'
                );
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
                    <h1 className="login-title">WebTruyen</h1>
                    <p className="login-subtitle">Tạo tài khoản để bắt đầu</p>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {message && (
                        <div className={`message ${message.includes('thành công') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('thành công') ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="username">Username</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.username ? 'has-error' : ''} ${formData.username ? 'has-value' : ''}`}>
                                <span className="input-icon">👤</span>
                                <input
                                    id="username"
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="form-input input-with-icon"
                                    placeholder="Nhập username"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.username && <span className="field-error">{errors.username}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="fullName">Họ và tên</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.fullName ? 'has-error' : ''} ${formData.fullName ? 'has-value' : ''}`}>
                                <span className="input-icon">🪪</span>
                                <input
                                    id="fullName"
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="form-input input-with-icon"
                                    placeholder="Nhập họ và tên"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.email ? 'has-error' : ''} ${formData.email ? 'has-value' : ''}`}>
                                <span className="input-icon">✉️</span>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-input input-with-icon"
                                    placeholder="Nhập email"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && <span className="field-error">{errors.email}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Mật khẩu</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.password ? 'has-error' : ''} ${formData.password ? 'has-value' : ''}`}>
                                <span className="input-icon">🔒</span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="form-input input-with-icon has-password-toggle"
                                    placeholder="Nhập mật khẩu"
                                    disabled={isLoading}
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
                            {errors.password && <span className="field-error">{errors.password}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
                        <div className="input-wrapper">
                            <div className={`input-group ${errors.confirmPassword ? 'has-error' : ''} ${formData.confirmPassword ? 'has-value' : ''}`}>
                                <span className="input-icon">🔁</span>
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="form-input input-with-icon has-password-toggle"
                                    placeholder="Nhập lại mật khẩu"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="password-toggle"
                                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                    tabIndex="-1"
                                >
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <input
                                type="checkbox"
                                name="agreeTerms"
                                checked={formData.agreeTerms}
                                onChange={handleChange}
                                disabled={isLoading}
                                style={{ marginRight: '10px' }}
                            />
                            Tôi đồng ý Điều khoản & Điều kiện
                        </label>
                        {errors.agreeTerms && <span className="field-error">{errors.agreeTerms}</span>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <span className="loading-spinner"></span>
                                <span>Đang tạo tài khoản...</span>
                            </>
                        ) : (
                            <>
                                <span>Đăng Ký</span>
                                <span className="button-arrow">→</span>
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="footer-text">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="register-link">
                            Đăng nhập ngay
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

export default Register;
