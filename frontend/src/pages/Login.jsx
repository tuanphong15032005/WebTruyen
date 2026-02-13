import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

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
      const response = await api.post('/api/auth/login', formData);
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      navigate('/');
    } catch (error) {
      const errorText = error?.response?.data || 'Lỗi kết nối server!';
      setMessage(errorText);
    }
  };

  return (
    <div className='container' style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>Đăng nhập</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Tên đăng nhập:</label>
          <input
            type='text'
            name='username'
            required
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Mật khẩu:</label>
          <input
            type='password'
            name='password'
            required
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type='submit' style={{ padding: '10px 20px' }}>
          Đăng nhập
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <p>
        Chưa có tài khoản? <Link to='/register'>Đăng ký</Link>
      </p>
    </div>
  );
}

export default Login;
