import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../App.css'; // Để dùng CSS chung

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
    const userRoles = Array.isArray(user?.roles)
        ? user.roles
            .filter((role) => typeof role === 'string' && role.trim() !== '')
            .map((role) => role.trim().toUpperCase())
        : [];
    const normalizedRoles = userRoles.includes('MOD') && !userRoles.includes('ADMIN')
        ? [...userRoles, 'ADMIN']
        : userRoles;
    const isAdmin = normalizedRoles.includes('ADMIN');
    const isAuthor = normalizedRoles.includes('AUTHOR');

    const handleLogout = () => {
        localStorage.removeItem('user'); // Xóa user khỏi bộ nhớ
        setUser(null);
        setShowDropdown(false);

        navigate('/login'); // Quay về trang login
    };

    return (
        <header className="header-container">
            {/* Logo bên trái */}
            <div className="logo">
                <Link to="/" style={{ textDecoration: 'none', color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                    📚 WebTruyen
                </Link>
            </div>

            {/* Menu bên phải */}
            <nav className="nav-menu">
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
                                {isAdmin && (
                                    <>
                                        <Link to="/admin/moderation" className="dropdown-item">Kiểm duyệt nội dung</Link>
                                        <Link to="/admin/moderation/reports" className="dropdown-item">Xử lý báo cáo vi phạm</Link>
                                        <Link to="/admin/moderation/approved" className="dropdown-item">Nội dung đã duyệt</Link>
                                        <Link to="/admin/moderation/rejected" className="dropdown-item">Nội dung bị từ chối</Link>
                                        <Link to="/admin/conversion-rate" className="dropdown-item">Tỷ lệ quy đổi Coin</Link>
                                    </>
                                )}
                                {isAuthor && (
                                    <>
                                        <Link to="/author/comments" className="dropdown-item">Quản lý bình luận</Link>
                                        <Link to="/author/analytics" className="dropdown-item">Thống kê tác phẩm</Link>
                                    </>
                                )}
                                <Link to="/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
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