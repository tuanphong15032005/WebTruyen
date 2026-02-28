import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/LoginStyles.css';

function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errors, setErrors] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lockSecondsRemaining, setLockSecondsRemaining] = useState(0);
    const nativeFormRef = useRef(null);
    const passwordInputRef = useRef(null);

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

    const validateForm = (data = formData) => {
        const newErrors = { username: '', password: '' };
        let isValid = true;

        if (!data.username.trim()) {
            newErrors.username = 'Vui lòng nhập tên đăng nhập';
            isValid = false;
        } else if (data.username.length < 3) {
            newErrors.username = 'Tên đăng nhập phải có ít nhất 3 ký tự';
            isValid = false;
        }

        if (!data.password) {
            newErrors.password = 'Vui lòng nhập mật khẩu';
            isValid = false;
        } else if (data.password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            // Handle checkbox if needed in future
            return;
        } else {
            if (name === 'password') {
                // For password input, let browser handle it but still track for form submission
                setFormData({ ...formData, [name]: e.target.value });
            } else {
                setFormData({ ...formData, [name]: value });
            }
            setMessage('');
            // Clear error for this field when user starts typing
            if (errors[name]) {
                setErrors({ ...errors, [name]: '' });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (lockSecondsRemaining > 0) {
            return;
        }

        // Get password from ref for uncontrolled input
        const passwordValue = passwordInputRef.current?.value || formData.password;
        const submitData = { ...formData, password: passwordValue };

        if (!validateForm(submitData)) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // Use JSON for backend compatibility but trigger password manager
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData),
                credentials: 'include'
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

                // Trigger password manager by submitting hidden form
                setTimeout(() => {
                    if (nativeFormRef.current) {
                        const hiddenUsername = nativeFormRef.current.querySelector('input[name="username"]');
                        const hiddenPassword = nativeFormRef.current.querySelector('input[name="password"]');
                        if (hiddenUsername && hiddenPassword) {
                            hiddenUsername.value = submitData.username;
                            hiddenPassword.value = submitData.password;
                            // Create a temporary submit event to trigger password manager
                            const submitEvent = new Event('submit', { cancelable: true });
                            nativeFormRef.current.dispatchEvent(submitEvent);
                        }
                    }
                }, 100);

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

    return (
        <div className="login-container">
            {/* Hidden native form for password manager */}
            <form 
                ref={nativeFormRef} 
                style={{display: 'none'}} 
                action="http://localhost:8081/api/auth/login" 
                method="post"
                onSubmit={(e) => {
                    e.preventDefault();
                    // Copy data to visible form
                    const usernameInput = document.getElementById('username');
                    const passwordInput = document.getElementById('password');
                    if (usernameInput && passwordInput) {
                        handleSubmit(e);
                    }
                }}
            >
                <input type="text" name="username" autoComplete="username" />
                <input type="password" name="password" autoComplete="current-password" />
                <input type="submit" value="Login" />
            </form>

            {/* Cột Trái */}
            <div className="left-column">
                <div className="brand-content">
                    <h1 className="brand-title">TramDoc</h1>
                </div>
            </div>

            {/* Cột Phải */}
            <div className="right-column">
                <div className="form-container">
                    <h2 className="form-title">❖ Đăng nhập ❖</h2>
                    
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

                    <form onSubmit={handleSubmit} autoComplete="on" method="post" action="/api/auth/login" name="login-form">
                        <div className="form-group">
                            <label htmlFor="username" style={{display: 'none'}}>Tên đăng nhập</label>
                            <input
                                id="username"
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`form-input ${errors.username ? 'error' : ''}`}
                                placeholder="Tên đăng nhập"
                                disabled={isLoading || lockSecondsRemaining > 0}
                                autoComplete="username"
                                required
                            />
                            {errors.username && <span className="error-text">{errors.username}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password" style={{display: 'none'}}>Mật khẩu</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                ref={passwordInputRef}
                                onChange={handleChange}
                                className={`form-input ${errors.password ? 'error' : ''}`}
                                placeholder="Mật khẩu"
                                disabled={isLoading || lockSecondsRemaining > 0}
                                autoComplete="current-password"
                                required
                            />
                            {errors.password && <span className="error-text">{errors.password}</span>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || lockSecondsRemaining > 0}
                            className={`submit-button ${isLoading ? 'loading' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <span className="spinner"></span>
                                    Đang đăng nhập...
                                </>
                            ) : (
                                lockSecondsRemaining > 0 ? `Đăng nhập sau ${lockSecondsRemaining}s` : 'Đăng nhập'
                            )}
                        </button>
                    </form>

                    <div className="form-links">
                        <Link to="/forgot-password" className="forgot-link">
                            Quên mật khẩu? Khôi phục mật khẩu
                        </Link>
                        
                        <Link to="/register" className="register-link">
                            Bạn chưa có tài khoản? Đăng ký tại đây
                        </Link>
                    </div>

                    <div className="terms-text">
                        Bằng cách tiếp tục, bạn đồng ý với Điều khoản & Chính sách bảo mật
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
