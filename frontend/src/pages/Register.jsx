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
        setMessage(data || '??ng k? th?t b?i');
      }
    } catch (error) {
      const errorText = error?.response?.data || 'L?i k?t n?i ??n server!';
      setMessage(errorText);
      console.error(error);
    }
  };

  return (
    <div className='container' style={{ maxWidth: '400px', margin: '50px auto' }}>
      <h2>??ng k? t?i kho?n</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label>Username:</label>
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
          <label>Password:</label>
          <input
            type='password'
            name='password'
            required
            style={{ width: '100%', padding: '8px' }}
            onChange={handleChange}
          />
        </div>
        <button type='submit' style={{ padding: '10px 20px', cursor: 'pointer' }}>
          ??ng k?
        </button>
      </form>
      {message && <p style={{ color: 'red' }}>{message}</p>}
      <p>
        ?? c? t?i kho?n? <Link to='/login'>??ng nh?p ngay</Link>
      </p>
    </div>
  );
}

export default Register;
