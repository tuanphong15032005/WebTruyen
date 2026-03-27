import React, { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  Eye,
  Gem,
  Menu,
  Search,
  Star,
  Wallet,
} from 'lucide-react';
import { WalletContext } from '../context/WalletContext.jsx';
import { getStoredUser } from '../utils/helpers';
import storyService from '../services/storyService';
import NotificationBell from './NotificationBell.jsx';
import '../styles/site-shell.css';

function Header({ onMenuToggle = () => {}, isSidebarOpen = false }) {
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

  const searchRef = useRef(null);
  const searchRequestRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const { wallet, isLoggedIn } = useContext(WalletContext);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
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
    window.addEventListener('user-updated', syncUserFromStorage);
    return () => {
      window.removeEventListener('storage', syncUserFromStorage);
      window.removeEventListener('user-updated', syncUserFromStorage);
    };
  }, []);

  useEffect(() => {
    // Hieuson - 24/2 + Tu dong dong menu user khi click ra ngoai dropdown.
    const handleOutsideClick = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setShowSearchSuggestions(false);
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/search') return;
    const params = new URLSearchParams(location.search || '');
    setSearchValue(params.get('q') || '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    const keyword = searchValue.trim();
    if (keyword.length < 1) {
      setSearchSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setSearchLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await storyService.getPublicStories({
          page: 0,
          size: 6,
          sort: 'lastUpdatedAt,desc',
          q: keyword,
        });
        if (searchRequestRef.current !== requestId) return;
        setSearchSuggestions(Array.isArray(response) ? response : []);
      } catch {
        if (searchRequestRef.current !== requestId) return;
        setSearchSuggestions([]);
      } finally {
        if (searchRequestRef.current === requestId) {
          setSearchLoading(false);
        }
      }
    }, 320);

    return () => window.clearTimeout(timer);
  }, [searchValue]);

  useLayoutEffect(() => {
    if (!isHomePage) {
      setIsHeaderScrolled(false);
      return undefined;
    }

    let mountFrameId = 0;
    let scrollFrameId = 0;
    let cancelled = false;

    const syncHomeHeaderState = () => {
      if (cancelled) return false;

      const heroElement = document.querySelector('.home-hero');
      if (!heroElement) {
        setIsHeaderScrolled(false);
        return false;
      }

      const headerHeightCss = getComputedStyle(
        document.documentElement,
      ).getPropertyValue('--site-header-height');
      const headerHeight = Number.parseFloat(headerHeightCss) || 72;
      const heroBottom = heroElement.getBoundingClientRect().bottom;

      setIsHeaderScrolled(heroBottom <= headerHeight);
      return true;
    };

    const mountSync = () => {
      if (cancelled) return;
      const heroFound = syncHomeHeaderState();
      if (!heroFound) {
        mountFrameId = window.requestAnimationFrame(mountSync);
      }
    };

    const handleViewportChange = () => {
      if (scrollFrameId) {
        window.cancelAnimationFrame(scrollFrameId);
      }
      scrollFrameId = window.requestAnimationFrame(() => {
        syncHomeHeaderState();
      });
    };

    mountSync();
    window.addEventListener('scroll', handleViewportChange, { passive: true });
    window.addEventListener('resize', handleViewportChange);

    return () => {
      cancelled = true;
      window.removeEventListener('scroll', handleViewportChange);
      window.removeEventListener('resize', handleViewportChange);
      if (mountFrameId) {
        window.cancelAnimationFrame(mountFrameId);
      }
      if (scrollFrameId) {
        window.cancelAnimationFrame(scrollFrameId);
      }
    };
  }, [isHomePage, location.pathname]);

  const handleSearchSubmit = (event) => {
    if (event) event.preventDefault();
    const keyword = searchValue.trim();
    if (!keyword) {
      navigate('/search');
      setShowSearchSuggestions(false);
      return;
    }
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
    setShowSearchSuggestions(false);
  };

  const handleSelectSuggestion = (story) => {
    if (!story?.id) return;
    setSearchValue(story.title || '');
    setShowSearchSuggestions(false);
    navigate(`/stories/${story.id}/metadata`);
  };

  const handleSearchIconClick = () => {
    if (!isSearchOpen) {
      setIsSearchOpen(true);
      setShowSearchSuggestions(false);
      window.requestAnimationFrame(() => {
        const inputElement = searchRef.current?.querySelector('input');
        inputElement?.focus();
      });
      return;
    }

    handleSearchSubmit();
  };

  const formatSuggestionRating = (value) => {
    const numericValue = Number(value || 0);
    if (!Number.isFinite(numericValue)) return '0.0';
    return numericValue.toFixed(1);
  };

  const formatSuggestionCount = (value) =>
    Number(value || 0).toLocaleString('vi-VN');

  const getSuggestionStatus = (story) => {
    const key = String(story?.completionStatus || '').toLowerCase();
    if (key === 'completed') {
      return { label: 'Đã hoàn thành', className: 'completed' };
    }
    if (key === 'cancelled') {
      return { label: 'Tạm ngưng', className: 'cancelled' };
    }
    return { label: 'Đang tiến hành', className: 'ongoing' };
  };

  return (
    <header
      className={`site-header ${isHomePage ? 'site-header--overlay' : 'site-header--solid'} ${isHomePage && isHeaderScrolled ? 'scrolled' : ''}`}
    >
      <div className='site-header__inner'>
        <div className='site-header__lead'>
          {user && (
            <button
              type='button'
              className={`site-menu-toggle ${
                isHomePage && !isHeaderScrolled
                  ? 'site-menu-toggle--light'
                  : 'site-menu-toggle--dark'
              } ${isSidebarOpen ? 'site-menu-toggle--hidden' : ''}`}
              onClick={onMenuToggle}
              aria-label='Mở menu điều hướng'
            >
              <Menu size={28} strokeWidth={2.4} />
            </button>
          )}
          <Link to='/' className='site-brand'>
            <span className='site-brand__logo'>
              <BookOpen size={18} />
            </span>
            <span className='site-brand__text'>Tramdoc</span>
          </Link>

          <nav className='site-nav' aria-label='Điều hướng chính'>
            <NavLink
              to='/ranking'
              className={({ isActive }) =>
                `site-nav__item ${isActive ? 'active' : ''}`
              }
            >
              Xếp hạng
            </NavLink>
            <NavLink
              to='/authors'
              className={({ isActive }) =>
                `site-nav__item ${isActive ? 'active' : ''}`
              }
            >
              Tác giả
            </NavLink>
            <NavLink
              to='/library'
              className={({ isActive }) =>
                `site-nav__item ${isActive ? 'active' : ''}`
              }
            >
              Tủ truyện
            </NavLink>
            {isLoggedIn && (
              <NavLink
                to='/author/withdrawal-request'
                className={({ isActive }) =>
                  `site-nav__item ${isActive ? 'active' : ''}`
                }
              >
                Rút tiền
              </NavLink>
            )}
          </nav>
        </div>

        <form
          className={`site-search ${isSearchOpen ? 'is-open' : ''}`}
          onSubmit={handleSearchSubmit}
          role='search'
          ref={searchRef}
        >
          <input
            value={searchValue}
            onChange={(event) => {
              const nextValue = event.target.value;
              setSearchValue(nextValue);
              setSearchTouched(true);
              setShowSearchSuggestions(nextValue.trim().length >= 1);
            }}
            onFocus={() => {
              if (searchTouched && searchValue.trim().length >= 1) {
                setShowSearchSuggestions(true);
              }
            }}
            placeholder='Tìm kiếm truyện, tác giả...'
            aria-label='Tìm kiếm truyện'
          />
          <button
            type='button'
            className='site-search__submit'
            onClick={handleSearchIconClick}
            aria-label='Mở tìm kiếm'
          >
            <Search size={17} />
          </button>

          {isSearchOpen && showSearchSuggestions && (
            <div className='site-search__suggestions'>
              {searchLoading && (
                <p className='site-search__suggestion-muted'>
                  Đang tìm kiếm...
                </p>
              )}

              {!searchLoading &&
                searchValue.trim().length >= 1 &&
                searchSuggestions.length === 0 && (
                  <p className='site-search__suggestion-muted'>
                    Không có truyện phù hợp.
                  </p>
                )}

              {!searchLoading &&
                searchSuggestions.map((story) => {
                  const statusInfo = getSuggestionStatus(story);
                  return (
                    <button
                      type='button'
                      key={story.id}
                      className='site-search__suggestion-item'
                      onClick={() => handleSelectSuggestion(story)}
                    >
                      <span className='site-search__suggestion-cover'>
                        {story.coverUrl ? (
                          <img
                            src={story.coverUrl}
                            alt={story.title || 'cover'}
                          />
                        ) : (
                          <span className='site-search__suggestion-cover-empty'>
                            No cover
                          </span>
                        )}
                      </span>
                      <span className='site-search__suggestion-main'>
                        <strong>{story.title || 'Không rõ tên truyện'}</strong>
                        <span className='site-search__suggestion-meta'>
                          <span className='site-search__suggestion-rating'>
                            <Star size={13} fill='currentColor' />
                            {formatSuggestionRating(story.ratingAvg)}
                          </span>
                          <span className='site-search__suggestion-views'>
                            <Eye size={13} />
                            {formatSuggestionCount(story.readerCount)}
                          </span>
                          <span className='site-search__suggestion-saved'>
                            <Bookmark size={13} />
                            {formatSuggestionCount(story.savedCount)}
                          </span>
                        </span>
                      </span>

                      <span className='site-search__suggestion-status-wrap'>
                        <span
                          className={`site-search__suggestion-status ${statusInfo.className}`}
                        >
                          <span className='site-search__suggestion-status-dot' />
                          {statusInfo.label}
                        </span>
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </form>

        <div className='site-header__actions'>
          {isLoggedIn && (
            <>
              <NotificationBell />
              
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
            </>
          )}

          {user ? (
            <div className='site-user'>
              <button
                type='button'
                className='site-user__trigger'
                onClick={() => navigate('/profile')}
                aria-label='Hồ sơ cá nhân'
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.username || 'avatar'}
                    className='site-user__avatar-image'
                  />
                ) : (
                  <span className='site-user__avatar'>
                    {String(user.username || '?')
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}
              </button>
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
