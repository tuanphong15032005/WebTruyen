import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/LoginStyles.css';

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
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const passwordRef = useRef(null);
    const confirmPasswordRef = useRef(null);

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
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
            isValid = false;
        } else if (formData.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            isValid = false;
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Vui lòng nhập họ và tên';
            isValid = false;
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Vui lòng nhập email';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
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
            newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
            isValid = false;
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Mật khẩu không khớp';
            isValid = false;
        }

        if (!formData.agreeTerms) {
            newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
            setMessage('');
            // Clear error for this field when user starts typing
            if (errors[name]) {
                setErrors({ ...errors, [name]: '' });
            }
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

            const response = await fetch('http://localhost:8081/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const text = await response.text();

            if (response.ok) {
                setMessage('Đăng ký thành công! Đang chuyển hướng...');
                setTimeout(() => {
                    navigate('/verify', { state: { email: formData.email } });
                }, 1000);
            } else {
                setMessage(text || 'Đăng ký thất bại. Vui lòng thử lại.');
            }
        } catch (error) {
            console.error('Register error:', error);
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
                    <h2 className="form-title">❖ Đăng ký ❖</h2>
                    
                    {message && (
                        <div className={`message ${message.includes('thành công') ? 'success-message' : 'error-message'}`}>
                            <span className="message-icon">
                                {message.includes('thành công') ? '✓' : '⚠'}
                            </span>
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`form-input ${errors.username ? 'error' : ''}`}
                                placeholder="Tên đăng nhập"
                                disabled={isLoading}
                                autoComplete="username"
                                required
                            />
                            {errors.username && <span className="error-text">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`form-input ${errors.fullName ? 'error' : ''}`}
                                placeholder="Họ và tên"
                                disabled={isLoading}
                                autoComplete="name"
                                required
                            />
                            {errors.fullName && <span className="error-text">{errors.fullName}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`form-input ${errors.email ? 'error' : ''}`}
                                placeholder="Email"
                                disabled={isLoading}
                                autoComplete="email"
                                required
                            />
                            {errors.email && <span className="error-text">{errors.email}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="password"
                                ref={passwordRef}
                                onChange={handleChange}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                placeholder="Mật khẩu"
                                disabled={isLoading}
                                autoComplete="new-password"
                                required
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <div className="form-group">
                            <input
                                type="password"
                                name="confirmPassword"
                                ref={confirmPasswordRef}
                                onChange={handleChange}
                                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder="Xác nhận mật khẩu"
                                disabled={isLoading}
                                autoComplete="new-password"
                                required
                            />
                            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreeTerms"
                                    checked={formData.agreeTerms}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                                <span className="checkmark"></span>
                                Tôi đồng ý với Điều khoản & Chính sách bảo mật
                            </label>
                            {errors.agreeTerms && <span className="error-text">{errors.agreeTerms}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang đăng ký...
                                </>
                            ) : (
                                'Đăng ký'
                            )}
                        </button>
                    </form>

                    <div className="form-links">
                        <Link to="/login" className="register-link">
                            Đã có tài khoản? Đăng nhập tại đây
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
