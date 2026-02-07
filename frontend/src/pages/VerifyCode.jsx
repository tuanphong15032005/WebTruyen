import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function VerifyCode() {
    const location = useLocation();
    // Lấy username truyền từ trang Register sang (để đỡ phải nhập lại)
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleVerify = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8081/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const text = await response.text();
            if (response.ok) {
                // alert("Xác thực thành công! Bạn có thể đăng nhập.");
                navigate('/login');
            } else {
                setMessage(text);
            }
        } catch (error) {
            setMessage("Lỗi kết nối!");
        }
    };

    return (
        <div className="container-center">
            <h2>Xác Thực Tài Khoản</h2>
            <p>Mã OTP đã được gửi đến email của bạn.</p>
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                    type="email" placeholder="Email" value={email} 
                    onChange={(e) => setEmail(e.target.value)} disabled 
                    style={{ padding: '8px' }}
                />
                <input 
                    type="text" placeholder="Nhập mã OTP 6 số" value={otp} 
                    onChange={(e) => setOtp(e.target.value)} required 
                    style={{ padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px' }}>Xác Nhận</button>
            </form>
            {message && <p style={{ color: 'red' }}>{message}</p>}
        </div>
    );
}

export default VerifyCode;