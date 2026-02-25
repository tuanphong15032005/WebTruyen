import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronDown, Gem, Search } from 'lucide-react';
import { WalletContext } from '../context/WalletContext.jsx';
import { getStoredUser, hasAnyRole } from '../utils/helpers';
import '../styles/site-shell.css';

function Header() {
    // phần này thay thế bằng phần anh note 1234
//   const [user, setUser] = useState(() => {
//     const storedUser = localStorage.getItem('user');
//     if (!storedUser) return null;
//     try {
//       return JSON.parse(storedUser);
//     } catch {
//       return null;
//     }
//   });

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, refreshWallet, isLoggedIn } = useContext(WalletContext);
//mo 1234
  const [user, setUser] = useState(() => {
          return getStoredUser();
      });
//dong 1234
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
{/*               {showDropdown && ( */}
{/*                 <div className='site-user__dropdown'> */}
{/*                   <Link to='/profile'>Hồ sơ cá nhân</Link> */}
{/*                   <Link to='/donation-history'>Lịch sử giao dịch</Link> */}
{/*                   <button type='button' onClick={handleLogout}> */}
{/*                     Đăng xuất */}
{/*                   </button> */}
{/*                 </div> */}
{/*               )} */}
{/* thay doi showDropdown tam thoi, sau nay se toi gian lai khi anh Minh gop lam cho cai menu dropdown nay gon lai */}
{showDropdown && (
  <div className='site-user__dropdown'>
    <Link to='/profile'>Hồ sơ cá nhân</Link>
    <Link to='/donation-history'>Lịch sử giao dịch</Link>

    {hasAnyRole(['AUTHOR'], user) && (
      <>
        <Link to='/author/comments'>Quản lý bình luận</Link>
        <Link to='/author/performance-analytics'>Báo cáo hiệu suất truyện</Link>
      </>
    )}

    {hasAnyRole(['ADMIN', 'MOD'], user) && (
      <>
        <Link to='/admin/dashboard'>Dashboard quản trị</Link>
      </>
    )}

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
// <<<<<<< HEAD
          )}
        </div>
      </div>
    </header>
  );
// =======
//
//             {/* Right side */}
//             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
//
//                 {/* Wallet */}
//                 {isLoggedIn && (
//                     <>
//                         <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
//                             <div style={{ padding: '0px 0px 0px 5px', border: '1px solid #ddd', borderRadius: '8px', color: '#000', display: 'flex', alignItems: 'center' }}>
//                                 💎 {wallet.coinB}
//                                 <button
//                                     onClick={() => navigate('/wallet/topup')}
//                                     style={{ marginLeft: '5px', border: 'none', background: 'none', cursor: 'pointer' }}
//                                 >
//                                     +
//                                 </button>
//                             </div>
//
//                             <div style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', color: '#000', display: 'flex', alignItems: 'center' }}>
//                                 🪙 {wallet.coinA}
//                             </div>
//
//
//                         </div>
//                     </>
//                 )}
//
//                 {/* User */}
//                 {user ? (
//                     <div style={{ position: 'relative' }}>
//                         <div
//                             onClick={() => setShowDropdown(!showDropdown)}
//                             style={{
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 gap: '10px',
//                                 cursor: 'pointer'
//                             }}
//                         >
//                             <span style = {{color: 'black'}} >Xin chào, <strong>{user.username}</strong></span>
//                             <div style={{
//                                 width: '36px',
//                                 height: '36px',
//                                 borderRadius: '50%',
//                                 background: 'linear-gradient(135deg, #17a2b8, #138496)',
//                                 color: 'white',
//                                 display: 'flex',
//                                 alignItems: 'center',
//                                 justifyContent: 'center',
//                                 fontWeight: 'bold'
//                             }}>
//                                 {user.username.charAt(0).toUpperCase()}
//                             </div>
//                         </div>
//
//                         {showDropdown && (
//                             <div style={{
//                                 position: 'absolute',
//                                 right: 0,
//                                 top: '120%',
//                                 background: 'white',
//                                 boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
//                                 borderRadius: '10px',
//                                 overflow: 'hidden',
//                                 minWidth: '180px'
//                             }}>
//                                 <Link to="/profile" style={dropdownItemStyle}>Hồ sơ cá nhân</Link>
//                                 <Link to="/donation-history" style={dropdownItemStyle}>Lịch sử giao dịch</Link>
//                                 {hasAnyRole(['AUTHOR'], user) && (
//                                   <>
//                                     <Link to="/author/comments" style={dropdownItemStyle}>Quản lý bình luận</Link>
//                                     <Link to="/author/performance-analytics" style={dropdownItemStyle}>Báo cáo hiệu suất truyện</Link>
//                                   </>
//                                 )}
//                                 {hasAnyRole(['ADMIN', 'MOD'], user) && (
//                                   <>
//                                     <Link to="/admin/content-moderation" style={dropdownItemStyle}>Quản lý kiểm duyệt nội dung</Link>
//                                     <Link to="/admin/violation-reports" style={dropdownItemStyle}>Quản lý báo cáo vi phạm</Link>
//                                   </>
//                                 )}
//                                 <div style={{ borderTop: '1px solid #eee' }}></div>
//                                 <button onClick={handleLogout} style={{ ...dropdownItemStyle, width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>
//                                     Đăng xuất
//                                 </button>
//                             </div>
//                         )}
//                     </div>
//                 ) : (
//                     <div style={{ display: 'flex', gap: '12px' }}>
//                         <Link to="/login">Đăng nhập</Link>
//                         <Link to="/register" style={{
//                             padding: '6px 12px',
//                             background: '#17a2b8',
//                             color: 'white',
//                             borderRadius: '8px',
//                             textDecoration: 'none'
//                         }}>
//                             Đăng ký
//                         </Link>
//                     </div>
//                 )}
//             </div>
//         </header>
//     );
// >>>>>>> origin/minhfinal1
}

export default Header;
