import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Bookmark,
  ChevronDown,
  Eye,
  Gem,
  Search,
  Star,
} from 'lucide-react';
import { WalletContext } from '../context/WalletContext.jsx';
import { getStoredUser, hasAnyRole } from '../utils/helpers';
import storyService from '../services/storyService';
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
  const searchRef = useRef(null);
  const searchRequestRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { wallet, refreshWallet, isLoggedIn } = useContext(WalletContext);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
    setShowDropdown(false);
    refreshWallet();
    navigate('/login');
  };

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
                <p className='site-search__suggestion-muted'>Đang tìm kiếm...</p>
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
                          <img src={story.coverUrl} alt={story.title || 'cover'} />
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
                  <Link to='/daily-tasks'>Nhiệm vụ hằng ngày</Link>
                  <Link to='/donation-history'>Lịch sử giao dịch</Link>

                  {hasAnyRole(['AUTHOR'], user) && (
                    <>
                      <Link to='/author/comments'>Quản lý bình luận</Link>
                      <Link to='/author/performance-analytics'>
                        Báo cáo hiệu suất truyện
                      </Link>
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
