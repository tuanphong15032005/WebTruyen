//<<<<<<< HEAD
import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WalletContext } from '../context/WalletContext.jsx';
import { Search, ChevronDown } from 'lucide-react';

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
    const navigate = useNavigate();
    const { wallet, refreshWallet, isLoggedIn } = useContext(WalletContext);

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setShowDropdown(false);
        refreshWallet();
        navigate('/login');
    };

    return (
        <header style={{
            backgroundColor: 'white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            padding: '10px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>

            {/* Logo */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => navigate('/')}
            >
                <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #17a2b8, #138496)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '20px'
                }}>
                    📖
                </div>
                <h2 style={{
                    margin: 0,
                    fontWeight: 'bold',
                    fontSize: '22px',
                    background: 'linear-gradient(135deg, #17a2b8, #138496)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    WebTruyen
                </h2>
            </div>

            {/* Menu giữa */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Danh sách <ChevronDown size={16} />
                </button>

                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Thể loại <ChevronDown size={16} />
                </button>
            </nav>

            {/* Search */}
            <div style={{ position: 'relative', width: '300px' }}>
                <input
                    type="text"
                    placeholder="Tìm kiếm truyện..."
                    style={{
                        width: '100%',
                        padding: '10px 16px 10px 40px',
                        borderRadius: '10px',
                        border: '1px solid #ddd',
                        outline: 'none'
                    }}
                />
                <Search size={18} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#888'
                }} />
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                {/* Wallet */}
                {isLoggedIn && (
                    <>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{ padding: '0px 0px 0px 5px', border: '1px solid #ddd', borderRadius: '8px', color: '#000', display: 'flex', alignItems: 'center' }}>
                                💎 {wallet.coinB}
                                <button
                                    onClick={() => navigate('/wallet/topup')}
                                    style={{ marginLeft: '5px', border: 'none', background: 'none', cursor: 'pointer' }}
                                >
                                    +
                                </button>
                            </div>

                            <div style={{ padding: '10px 12px', border: '1px solid #ddd', borderRadius: '8px', color: '#000', display: 'flex', alignItems: 'center' }}>
                                🪙 {wallet.coinA}
                            </div>


                        </div>
                    </>
                )}

                {/* User */}
                {user ? (
                    <div style={{ position: 'relative' }}>
                        <div
                            onClick={() => setShowDropdown(!showDropdown)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer'
                            }}
                        >
                            <span style = {{color: 'black'}} >Xin chào, <strong>{user.username}</strong></span>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #17a2b8, #138496)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}>
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {showDropdown && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '120%',
                                background: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                minWidth: '180px'
                            }}>
                                <Link to="/profile" style={dropdownItemStyle}>Hồ sơ cá nhân</Link>
                                <Link to="/donation-history" style={dropdownItemStyle}>Lịch sử giao dịch</Link>
                                <Link to="/author/comments" style={dropdownItemStyle}>Quản lý bình luận</Link>
                                <Link to="/admin/content-moderation" style={dropdownItemStyle}>Quản lý kiểm duyệt nội dung</Link>
                                <div style={{ borderTop: '1px solid #eee' }}></div>
                                <button onClick={handleLogout} style={{ ...dropdownItemStyle, width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/login">Đăng nhập</Link>
                        <Link to="/register" style={{
                            padding: '6px 12px',
                            background: '#17a2b8',
                            color: 'white',
                            borderRadius: '8px',
                            textDecoration: 'none'
                        }}>
                            Đăng ký
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}

const dropdownItemStyle = {
    display: 'block',
    padding: '10px 16px',
    textDecoration: 'none',
    color: '#333',
    cursor: 'pointer'
};

export default Header;
//=======
// import React, { useState } from 'react';
// import { Link, useNavigate } from 'react-router-dom';
// import '../App.css';
//
// function Header() {
//   const [user, setUser] = useState(() => {
//     const raw = localStorage.getItem('user');
//     if (!raw) return null;
//     try {
//       return JSON.parse(raw);
//     } catch {
//       return null;
//     }
//   });
//   const [showDropdown, setShowDropdown] = useState(false);
//   const navigate = useNavigate();
//
//   const handleLogout = () => {
//     localStorage.removeItem('user');
//     setUser(null);
//     setShowDropdown(false);
//     navigate('/login');
//   };
//
//   return (
//     <header className='header-container'>
//       <div className='logo'>
//         <Link
//           to='/'
//           style={{
//             textDecoration: 'none',
//             color: '#26374f',
//             fontSize: '24px',
//             fontWeight: 'bold',
//           }}
//         >
//           WebTruyen
//         </Link>
//       </div>
//
//       <nav className='nav-menu'>
//         {user ? (
//           <div style={{ position: 'relative' }}>
//             <div
//               className='user-info'
//               onClick={() => setShowDropdown((prev) => !prev)}
//             >
//               <span style={{ marginRight: '10px' }}>
//                 Xin chào, <strong>{user.username}</strong>
//               </span>
//               <div className='avatar'>
//                 {user.username.charAt(0).toUpperCase()}
//               </div>
//             </div>
//
//             {showDropdown && (
//               <div className='dropdown-menu'>
//                 <Link to='/profile' className='dropdown-item'>
//                   Hồ sơ cá nhân
//                 </Link>
//                 <div className='dropdown-divider'></div>
//                 <button
//                   type='button'
//                   onClick={handleLogout}
//                   className='dropdown-item logout-btn'
//                 >
//                   Đăng xuất
//                 </button>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div>
//             <Link to='/login' className='nav-link'>
//               Đăng nhập
//             </Link>
//             <Link to='/register' className='nav-button'>
//               Đăng ký
//             </Link>
//           </div>
//         )}
//       </nav>
//     </header>
//   );
// }
//
// export default Header;
// >>>>>>> author-create-content
