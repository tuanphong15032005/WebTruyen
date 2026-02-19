import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css'; // Để dùng CSS chung
import { WalletContext } from '../context/WalletContext.jsx';

function Header() {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser);
        } catch {
            return null;
        }
    });
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const { wallet, refreshWallet, isLoggedIn } = React.useContext(WalletContext);

    const handleLogout = () => {
        localStorage.removeItem('user'); // Xóa user khỏi bộ nhớ
        setUser(null);
        setShowDropdown(false);

        refreshWallet();

        navigate('/login'); // Quay về trang login
    };

    return (
        <header className="header-container">
            {/* Logo bên trái */}
            <div className="logo">
                <Link to="/" className="logo-link">
                    📚 WebTruyen
                </Link>
            </div>

            {/* Menu bên phải */}
            <nav className="nav-menu">
                {isLoggedIn ? (
                    <div className="flex items-center gap-3 mr-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                            <span className="text-lg">💎</span>
                            <span className="font-semibold">{wallet.coinB}</span>
                            <button
                                type="button"
                                className="ml-1 px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)]"
                                onClick={() => navigate('/wallet/topup')}
                                title="Top up"
                            >
                                +
                            </button>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                            <span className="text-lg">🪙</span>
                            <span className="font-semibold">{wallet.coinA}</span>
                        </div>
                        <button
                            type="button"
                            className="px-2 py-1 rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)]"
                            onClick={() => refreshWallet()}
                            title="Refresh wallet"
                        >
                            ⟳
                        </button>
                    </div>
                ) : null}
                {user ? (
                    // --- TRƯỜNG HỢP ĐÃ ĐĂNG NHẬP ---
                    <div style={{ position: 'relative' }}>
                        <div 
                            className="user-info" 
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            <span style={{ marginRight: '10px' }}>Xin chào, <strong>{user.username}</strong></span>
                            {/* Avatar giả lập bằng chữ cái đầu */}
                            <div className="avatar">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="dropdown-menu">
                                <Link to="/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                                <Link to="/donation-history" className="dropdown-item">Lịch sử giao dịch</Link>
                                <div className="dropdown-divider"></div>
                                <button onClick={handleLogout} className="dropdown-item logout-btn">
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // --- TRƯỜNG HỢP CHƯA ĐĂNG NHẬP ---
                    <div>
                        <Link to="/login" className="nav-link">Đăng Nhập</Link>
                        <Link to="/register" className="nav-button">Đăng Ký</Link>
                    </div>
                )}
            </nav>
        </header>
    );
}

export default Header;
