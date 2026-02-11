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
      const errorText = error?.response?.data || 'L?i k?t n?i server!';
      setMessage(errorText);
    }
  };

  return (
    <div className='container' style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>??ng nh?p</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username:</label>
          <input
            type='text'
            name='username'
            required
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label>Password:</label>
          <input
            type='password'
            name='password'
            required
            onChange={handleChange}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type='submit' style={{ padding: '10px 20px' }}>
          ??ng nh?p
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <p>
        Ch?a c? t?i kho?n? <Link to='/register'>??ng k?</Link>
      </p>
    </div>
  );
}

export default Login;
