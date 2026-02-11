import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css';

function Header() {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    navigate('/login');
  };

  return (
    <header className='header-container'>
      <div className='logo'>
        <Link
          to='/'
          style={{
            textDecoration: 'none',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          WebTruyen
        </Link>
      </div>

      <nav className='nav-menu'>
        {user ? (
          <div style={{ position: 'relative' }}>
            <div
              className='user-info'
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <span style={{ marginRight: '10px' }}>
                Xin chào, <strong>{user.username}</strong>
              </span>
              <div className='avatar'>
                {user.username.charAt(0).toUpperCase()}
              </div>
            </div>

            {showDropdown && (
              <div className='dropdown-menu'>
                <Link to='/profile' className='dropdown-item'>
                  Hồ sơ cá nhân
                </Link>
                <div className='dropdown-divider'></div>
                <button onClick={handleLogout} className='dropdown-item logout-btn'>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Link to='/login' className='nav-link'>
              Đăng nhập
            </Link>
            <Link to='/register' className='nav-button'>
              Đăng ký
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}

export default Header;
