import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  CheckSquare,
  Edit3,
  History,
  LogOut,
  MessageSquare,
  Settings,
  Shield,
  Trophy,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { getStoredUser, hasAnyRole } from '../utils/helpers';
import '../styles/site-shell.css';

const AppSidebar = ({ isOpen, onClose, overlayMode = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(() => getStoredUser());
  const [themeFlash, setThemeFlash] = useState('');
  const [isScrollActive, setIsScrollActive] = useState(false);
  const themeFlashTimeoutRef = useRef(null);
  const scrollHideTimeoutRef = useRef(null);

  useEffect(() => {
    const syncUserFromStorage = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('storage', syncUserFromStorage);
    window.addEventListener('user-updated', syncUserFromStorage);
    return () => {
      window.removeEventListener('storage', syncUserFromStorage);
      window.removeEventListener('user-updated', syncUserFromStorage);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (themeFlashTimeoutRef.current) {
        window.clearTimeout(themeFlashTimeoutRef.current);
      }
      if (scrollHideTimeoutRef.current) {
        window.clearTimeout(scrollHideTimeoutRef.current);
      }
    };
  }, []);

  const menuItems = useMemo(
    () => [
      {
        key: 'profile',
        label: 'Hồ sơ',
        icon: User,
        visible: true,
        active: location.pathname === '/profile' || location.pathname.startsWith('/user/'),
        onClick: () => navigate('/profile'),
      },
      {
        key: 'daily-tasks',
        label: 'Nhiệm vụ hàng ngày',
        icon: CheckSquare,
        visible: true,
        active: location.pathname === '/daily-tasks',
        onClick: () => navigate('/daily-tasks'),
      },
      {
        key: 'achievements',
        label: 'Thành tích',
        icon: Trophy,
        visible: true,
        active: location.pathname === '/achievements',
        onClick: () => navigate('/achievements'),
      },
      {
        key: 'bookmarks',
        label: 'Bookmark',
        icon: Bookmark,
        visible: true,
        active: location.pathname === '/bookmarks' || location.pathname.startsWith('/bookmarks/'),
        onClick: () => navigate('/bookmarks'),
      },
      {
        key: 'reading-history',
        label: 'Lịch sử đọc truyện',
        icon: History,
        visible: true,
        active: location.pathname === '/reading-history',
        onClick: () => navigate('/reading-history'),
      },
      {
        key: 'transaction-history',
        label: 'Lịch sử giao dịch',
        icon: Wallet,
        visible: true,
        active: location.pathname === '/donation-history',
        onClick: () => navigate('/donation-history'),
      },
            {
        key: 'author-area',
        label: 'Khu vực tác giả',
        icon: Edit3,
        visible: true,
        active: location.pathname === '/authordashboard',
        onClick: () => navigate('/authordashboard'),
      },
      {
        key: 'withdrawal-request',
        label: 'Yêu cầu rút tiền',
        icon: Wallet,
        visible: true,
        active: location.pathname === '/author/withdrawal-request',
        onClick: () => navigate('/author/withdrawal-request'),
      },
      {
        key: 'reviewer-area',
        label: 'Khu vực reviewer',
        icon: Shield,
        visible: true,
        active: location.pathname === '/reviewer-area',
        onClick: () => navigate('/reviewer-area'),
      },
      {
        key: 'notifications',
        label: 'Tin nhắn',
        icon: MessageSquare,
        visible: true,
        active: location.pathname === '/notifications',
        onClick: () => navigate('/notifications'),
      },
      {
        key: 'admin-dashboard',
        label: 'Dashboard quản trị',
        icon: Settings,
        visible: hasAnyRole(['ADMIN', 'MOD'], user),
        active: location.pathname.startsWith('/admin/dashboard'),
        onClick: () => navigate('/admin/dashboard'),
      },
    ],
    [location.pathname, navigate, user],
  );

  const handleMenuItemClick = (action) => {
    if (typeof action === 'function') {
      action();
    }
    onClose?.();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    onClose?.();
    window.location.assign('/login');
  };

  const handleThemeToggle = () => {
    const nextFlash = theme === 'dark' ? 'sun' : 'moon';
    setThemeFlash(nextFlash);
    toggleTheme();

    if (themeFlashTimeoutRef.current) {
      window.clearTimeout(themeFlashTimeoutRef.current);
    }

    themeFlashTimeoutRef.current = window.setTimeout(() => {
      setThemeFlash('');
    }, 420);
  };

  const handleSidebarScroll = () => {
    setIsScrollActive(true);

    if (scrollHideTimeoutRef.current) {
      window.clearTimeout(scrollHideTimeoutRef.current);
    }

    scrollHideTimeoutRef.current = window.setTimeout(() => {
      setIsScrollActive(false);
    }, 420);
  };

  const resolveMenuLabel = (item) => {
    return item?.label;
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {overlayMode && (
        <button
          type="button"
          aria-label="Đóng menu"
          className={`app-sidebar__backdrop ${isOpen ? 'is-visible' : ''}`}
          onClick={onClose}
        />
      )}

      <aside
        className={`app-sidebar ${overlayMode ? 'app-sidebar--overlay' : 'app-sidebar--push'} ${isOpen ? 'is-open' : ''}`}
        aria-hidden={!isOpen}
      >
        <div className="app-sidebar__panel">
          <div className="app-sidebar__header">
            <button
              type="button"
              className={`app-theme-toggle ${theme === 'dark' ? 'is-dark' : 'is-light'} ${themeFlash ? `flash-${themeFlash}` : ''}`}
              onClick={handleThemeToggle}
              aria-label={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              title={theme === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
            >
              <span className="app-theme-toggle__decor app-theme-toggle__decor--day" aria-hidden="true">
                <span className="app-theme-toggle__cloud app-theme-toggle__cloud--large" />
                <span className="app-theme-toggle__cloud app-theme-toggle__cloud--small" />
              </span>
              <span className="app-theme-toggle__decor app-theme-toggle__decor--night" aria-hidden="true">
                <span className="app-theme-toggle__star app-theme-toggle__star--one" />
                <span className="app-theme-toggle__star app-theme-toggle__star--two" />
                <span className="app-theme-toggle__star app-theme-toggle__star--three" />
              </span>
              <span className="app-theme-toggle__thumb" aria-hidden="true">
                <span className="app-theme-toggle__crater app-theme-toggle__crater--one" />
                <span className="app-theme-toggle__crater app-theme-toggle__crater--two" />
              </span>
            </button>
            <button
              type="button"
              className="app-sidebar__close"
              onClick={onClose}
              aria-label="Close navigation menu"
            >
              <X size={24} strokeWidth={2.4} />
            </button>
          </div>
          <div
            className={`app-sidebar__scroll ${isScrollActive ? 'is-scrolling' : ''}`}
            onScroll={handleSidebarScroll}
          >
            <ul className="app-sidebar__menu">
              {menuItems
                .filter((item) => item.visible)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        className={`app-sidebar__item ${item.active ? 'active' : ''}`}
                        onClick={() => handleMenuItemClick(item.onClick)}
                      >
                        <Icon className="app-sidebar__item-icon" />
                        <span>{resolveMenuLabel(item)}</span>
                      </button>
                    </li>
                  );
                })}
            </ul>
          </div>

          <div className="app-sidebar__footer">
            <button
              type="button"
              className="app-sidebar__item app-sidebar__item--logout"
              onClick={handleLogout}
            >
              <LogOut className="app-sidebar__item-icon" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
