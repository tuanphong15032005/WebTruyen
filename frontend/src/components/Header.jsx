import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, Gem, Search } from 'lucide-react';
import { WalletContext } from '../context/WalletContext.jsx';
import '../styles/site-shell.css';

function Header() {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, refreshWallet, isLoggedIn } = useContext(WalletContext);

  useEffect(() => {
    // Hieuson - 24/2 + Dong bo lai user tren header khi localStorage thay doi.
    const syncUserFromStorage = () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        setUser(null);
        return;
      }
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', syncUserFromStorage);
    return () => window.removeEventListener('storage', syncUserFromStorage);
  }, []);

  useEffect(() => {
    // Hieuson - 24/2 + Tu dong dong menu user khi click ra ngoai dropdown.
    const handleOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
    setShowDropdown(false);
    refreshWallet();
    navigate('/login');
  };

  return (
    <header className='site-header'>
      <div className='site-header__inner'>
        <Link to='/' className='site-brand'>
          <span className='site-brand__logo'>
            <BookOpen size={18} />
          </span>
          <span className='site-brand__text'>Tramdoc</span>
        </Link>

        <nav className='site-nav'>
          <Link
            to='/'
            className={`site-nav__item ${location.pathname === '/' ? 'active' : ''}`}
          >
            Trang chủ
          </Link>
          <button type='button' className='site-nav__item'>
            Thể loại
            <ChevronDown size={14} />
          </button>
          <button type='button' className='site-nav__item'>
            Xếp hạng
          </button>
        </nav>

        <div className='site-search'>
          <Search size={17} />
          <input placeholder='Tìm kiếm truyện, tác giả...' />
        </div>

        <div className='site-header__actions'>
          {isLoggedIn && (
            <div className='site-wallet'>
              <button
                type='button'
                className='site-wallet__chip site-wallet__chip--gem'
                onClick={() => navigate('/wallet/topup')}
              >
                <Gem size={14} />
                {wallet.coinB}
                <span className='site-wallet__plus'>+</span>
              </button>
              <span className='site-wallet__chip'>
                <span className='site-wallet__coin-icon'>C</span>
                {wallet.coinA}
              </span>
            </div>
          )}

          {user ? (
            <div className='site-user' ref={dropdownRef}>
              <button
                type='button'
                className='site-user__trigger'
                onClick={() => setShowDropdown((prev) => !prev)}
              >
                <span>
                  Xin chao, <strong>{user.username}</strong>
                </span>
                <span className='site-user__avatar'>
                  {String(user.username || '?')
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </button>
              {showDropdown && (
                <div className='site-user__dropdown'>
                  <Link to='/profile'>Hồ sơ cá nhân</Link>
                  <Link to='/donation-history'>Lịch sử giao dịch</Link>
                  <button type='button' onClick={handleLogout}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className='site-auth'>
              <Link to='/login' className='site-auth__login'>
                Đăng nhập
              </Link>
              <Link to='/register' className='site-auth__register'>
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
