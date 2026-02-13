import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/register', formData);
      const data = response?.data;
      if (response.status === 200) {
        navigate('/verify-code', { state: { email: formData.email } });
      } else {
        setMessage(data || 'Đăng ký thất bại');
      }
    } catch (error) {
      const errorText = error?.response?.data || 'Lỗi kết nối đến server!';
      setMessage(errorText);
      console.error(error);
    }
  };

  return (
    <div className='container' style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Đăng ký tài khoản</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Tên đăng nhập:</label>
          <input
            type='text'
            name='username'
            required
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Email:</label>
          <input
            type='email'
            name='email'
            required
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu:</label>
          <input
            type='password'
            name='password'
            required
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>
        <button type='submit' style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Đăng ký
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <p>
        Đã có tài khoản? <Link to='/login'>Đăng nhập ngay</Link>
      </p>
    </div>
  );
}

export default Register;
