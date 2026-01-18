import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8081/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const user = await response.json();
                // alert(`Xin chào, ${user.username}!`);
                console.log("Thông tin user:", user);
                // Lưu tạm vào localStorage để nhớ đăng nhập
                localStorage.setItem('user', JSON.stringify(user)); 
                window.location.href = '/'; 
            } else {
                const errorText = await response.text();
                setMessage(errorText);
            }
        } catch (error) {
            setMessage("Lỗi kết nối server!");
        }
    };

    return (
        <div className="container" style={{ maxWidth: '400px', margin: '50px auto' }}>
            <h2>Đăng Nhập</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Username:</label>
                    <input type="text" name="username" required onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <label>Password:</label>
                    <input type="password" name="password" required onChange={handleChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <button type="submit" style={{ padding: '10px 20px' }}>Đăng Nhập</button>
            </form>
            {message && <p style={{ color: 'red' }}>{message}</p>}
            <p>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
        </div>
    );
}

export default Login;