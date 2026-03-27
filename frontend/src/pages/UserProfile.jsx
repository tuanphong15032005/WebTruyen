import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  User,
  MessageSquare,
  Settings,
  Lock,
  Camera,
  Edit3,
  Trophy,
  Bookmark,
  CheckSquare,
  Shield,
  Wallet,
  Settings as AdminIcon,
} from 'lucide-react';
import { dailyCheckIn, getUserProfileById, getUserProfileByUsername, uploadAvatar, uploadCover } from '../api/userApi';
import { hasAnyRole, getStoredUser } from '../utils/helpers';
import '../styles/UserProfile.css';

export default function UserProfile({ userData }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { username: urlUsername } = useParams(); // Get username from URL

  // State variables
  const [displayName, setDisplayName] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [tempName, setTempName] = useState('');
  const [bioMessage, setBioMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRoles, setUserRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const readerRefundLabel = 'Y\u00eau c\u1ea7u ho\u00e0n ti\u1ec1n';
  const avatarInputRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const coverInputRef = useRef(null);

  // Debug log
  console.log('🔍 UserProfile component rendering');
  console.log('🔍 existingCoverUrl:', existingCoverUrl);
  console.log('🔍 coverInputRef:', coverInputRef);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // Get current user from localStorage for role checking
        const currentUser = getStoredUser();
        
        // If we have userData passed as prop, use it
        if (userData && userData.email) {
          setProfileData({ ...userData, roles: currentUser?.roles || [] });
          setDisplayName(userData.displayName || userData.username || '');
          setFavoriteQuote(userData.bio || '');
          setTempName(userData.displayName || userData.username || '');
          setExistingAvatarUrl(userData.avatarUrl || '');
          setExistingCoverUrl(userData.coverUrl || '');
          setLoading(false);
          return;
        }

        // If we have username from URL, fetch by username
        if (urlUsername) {
          console.log('Fetching profile by username:', urlUsername);
          const data = await getUserProfileByUsername(urlUsername);
          console.log('Profile data received:', data);
          
          setProfileData({ ...data, roles: currentUser?.roles || [] });
          setDisplayName(data.displayName || data.username || '');
          setFavoriteQuote(data.bio || '');
          setTempName(data.displayName || data.username || '');
          setExistingAvatarUrl(data.avatarUrl || '');
          setExistingCoverUrl(data.coverUrl || '');
          setLoading(false);
          return;
        }

        // Fallback to current user from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('No userId found in localStorage');
          setError('Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.');
          setLoading(false);
          return;
        }

        console.log('Fetching profile for userId:', userId);
        const data = await getUserProfileById(userId);
        console.log('Profile data received:', data);
        
        setProfileData({ ...data, roles: currentUser?.roles || [] });
        setDisplayName(data.displayName || data.username || '');
        setFavoriteQuote(data.bio || '');
        setTempName(data.displayName || data.username || '');
        setExistingAvatarUrl(data.avatarUrl || '');
        setExistingCoverUrl(data.coverUrl || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Không thể tải dữ liệu trang cá nhân. ' + (error.message || 'Vui lòng thử lại sau.'));
        
        // Fallback to fetch if API fails
        try {
          let url;
          if (urlUsername) {
            url = `http://localhost:8081/api/users/profile/username/${urlUsername}`;
          } else {
            const userId = localStorage.getItem('userId');
            url = `http://localhost:8081/api/users/profile/${userId}`;
          }
          
          const token = localStorage.getItem('accessToken');
          const response = await fetch(url, {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();
            const currentUser = getStoredUser();
            setProfileData({ ...data, roles: currentUser?.roles || [] });
            setDisplayName(data.displayName || data.username || '');
            setFavoriteQuote(data.bio || '');
            setTempName(data.displayName || data.username || '');
            setExistingAvatarUrl(data.avatarUrl || '');
            setExistingCoverUrl(data.coverUrl || '');
            setError(''); // Clear error on success
          } else {
            setError('Không thể tải dữ liệu trang cá nhân. Server trả về lỗi: ' + response.status);
          }
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
          setError('Không thể tải dữ liệu trang cá nhân. Vui lòng kiểm tra kết nối mạng.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userData, urlUsername]);

  // Fetch user roles
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');

        const response = await fetch(
          `http://localhost:8081/api/users/profile/${userId}/roles`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        );

        if (response.ok) {
          const rolesData = await response.json();
          setUserRoles(rolesData);
        }
      } catch (error) {
        console.error('Error fetching user roles:', error);
      }
    };

    fetchUserRoles();
  }, []);

  // Handle avatar preview
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setAvatarPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

  // Handle cover preview
  useEffect(() => {
    if (!coverFile) {
      setCoverPreviewUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(coverFile);
    setCoverPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [coverFile]);

  const getUserRoleDisplay = () => {
    if (!userRoles || userRoles.length === 0) {
      return 'Thành viên';
    }

    const roleCodes = userRoles
      .map((userRole) => userRole?.roleCode || '')
      .filter(Boolean);

    if (roleCodes.includes('MOD')) {
      return 'Quản trị viên';
    } else if (roleCodes.includes('AUTHOR')) {
      return 'Tác giả';
    } else if (roleCodes.includes('REVIEWER')) {
      return 'Reviewer';
    } else if (roleCodes.includes('READER')) {
      return 'Reader';
    } else {
      return 'Thành viên';
    }
  };

  const hasReviewerRole = () => {
    if (!userRoles || userRoles.length === 0) {
      return false;
    }
    const roleCodes = userRoles
      .map((userRole) => userRole?.roleCode || '')
      .filter(Boolean);
    
    // Debug: Log roles to console
    console.log('🔍 User roles:', userRoles);
    console.log('🔍 Role codes:', roleCodes);
    console.log('🔍 Has reviewer role:', roleCodes.includes('MOD') || roleCodes.includes('REVIEWER'));
    
    return roleCodes.includes('MOD') || roleCodes.includes('REVIEWER');
  };

  const handleUpdateQuote = async () => {
    // Validation cho bio rỗng
    if (!favoriteQuote.trim()) {
      setBioMessage('Tiểu sử không được để trống!');
      setTimeout(() => setBioMessage(''), 3000);
      return;
    }

    // Validation và giới hạn số từ trong bio (max 200 từ)
    const wordCount = favoriteQuote.trim().split(/\s+/).length;
    if (wordCount > 200) {
      setBioMessage(`Tiểu sử không được vượt quá 200 từ (hiện tại: ${wordCount} từ)!`);
      setTimeout(() => setBioMessage(''), 3000);
      return;
    }

    // Validation cho độ dài bio (max 1000 ký tự, không tính dấu cách)
    const charCountWithoutSpaces = favoriteQuote.replace(/\s/g, '').length;
    if (charCountWithoutSpaces > 1000) {
      setBioMessage('Tiểu sử không được vượt quá 1000 ký tự (không tính dấu cách)!');
      setTimeout(() => setBioMessage(''), 3000);
      return;
    }

    // Sanitize HTML tags để tránh XSS
    const sanitizedBio = favoriteQuote.replace(/<[^>]*>/g, '');
    if (sanitizedBio.length !== favoriteQuote.length) {
      setBioMessage('Tiểu sử không được chứa HTML tags!');
      setTimeout(() => setBioMessage(''), 3000);
      return;
    }

    try {
      const userId = profileData?.id || 1;
      const response = await fetch(
        `http://localhost:8081/api/users/profile/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: sanitizedBio.trim() }),
        },
      );
      if (response.ok) {
        setFavoriteQuote(sanitizedBio.trim());
        setBioMessage('Trích dẫn đã được cập nhật!');
        setTimeout(() => setBioMessage(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setBioMessage(errorData.message || 'Cập nhật thất bại, vui lòng thử lại!');
        setTimeout(() => setBioMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      setBioMessage('Có lỗi xảy ra, vui lòng thử lại!');
      setTimeout(() => setBioMessage(''), 3000);
    }
  };

  const handleChangeName = async () => {
    // Validation cho tên hiển thị rỗng
    if (!tempName.trim()) {
      setNameMessage('Tên hiển thị không được để trống!');
      setTimeout(() => setNameMessage(''), 3000);
      return;
    }

    // Validation cho độ dài tên hiển thị (max 30 ký tự)
    if (tempName.length > 30) {
      setNameMessage('Tên hiển thị không được vượt quá 30 ký tự!');
      setTimeout(() => setNameMessage(''), 3000);
      return;
    }

    // Validation và sanitize ký tự đặc biệt
    const hasInvalidChars = /[<>"'&@#$%^*()+={}[\]|\\:;,\.?\/]/.test(tempName);
    if (hasInvalidChars) {
      setNameMessage('Tên hiển thị không được chứa ký tự đặc biệt! Chỉ chấp nhận chữ, số và khoảng trắng.');
      setTimeout(() => setNameMessage(''), 3000);
      return;
    }

    try {
      const userId = profileData?.id || 1;
      const response = await fetch(
        `http://localhost:8081/api/users/profile/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: tempName.trim() }),
        },
      );
      if (response.ok) {
        setDisplayName(tempName.trim());
        setNameMessage('Tên hiển thị đã được thay đổi!');
        setTimeout(() => setNameMessage(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setNameMessage(errorData.message || 'Cập nhật thất bại, vui lòng thử lại!');
        setTimeout(() => setNameMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating displayName:', error);
      setNameMessage('Có lỗi xảy ra, vui lòng thử lại!');
      setTimeout(() => setNameMessage(''), 3000);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Vui lòng điền đầy đủ tất cả các trường');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage('Mật khẩu mới phải có ít nhất 8 ký tự');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('Mật khẩu mới và xác nhận mật khẩu không khớp');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordMessage('Mật khẩu mới phải khác mật khẩu cũ');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    setChangingPassword(true);
    setPasswordMessage('');

    try {
      const userId = profileData?.id || localStorage.getItem('userId') || 1;
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `http://localhost:8081/api/users/profile/${userId}/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            oldPassword: oldPassword,
            newPassword: newPassword,
          }),
        },
      );

      if (response.ok) {
        setPasswordMessage('Mật khẩu đã được cập nhật thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setPasswordMessage(errorData.message || 'Cập nhật mật khẩu thất bại, vui lòng thử lại!');
        setTimeout(() => setPasswordMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage('Có lỗi xảy ra, vui lòng thử lại!');
      setTimeout(() => setPasswordMessage(''), 3000);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selected.type)) {
      setAvatarMessage('Chỉ chấp nhận các định dạng: JPEG, PNG, GIF, WebP');
      setTimeout(() => setAvatarMessage(''), 3000);
      return;
    }

    if (selected.size > maxSize) {
      setAvatarMessage('Kích thước file không được vượt quá 5MB');
      setTimeout(() => setAvatarMessage(''), 3000);
      return;
    }

    setAvatarFile(selected);
    setAvatarMessage('');
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setAvatarMessage('');

    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const userId = profileData?.id || localStorage.getItem('userId') || 1;
      const data = await uploadAvatar(userId, formData);
      const newAvatarUrl = data.avatarUrl || data.url;

      setProfileData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
      setExistingAvatarUrl(newAvatarUrl);

      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          localStorage.setItem(
            'user',
            JSON.stringify({ ...parsedUser, avatarUrl: newAvatarUrl }),
          );
          window.dispatchEvent(new Event('user-updated'));
        }
      } catch (storageError) {
        console.warn('Failed to sync avatar to localStorage:', storageError);
      }

      setAvatarFile(null);
      setAvatarPreviewUrl('');
      setAvatarMessage('Cập nhật avatar thành công!');
      setTimeout(() => setAvatarMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Tải avatar lên thất bại, vui lòng thử lại!';
      setAvatarMessage(errorMessage);
      setTimeout(() => setAvatarMessage(''), 3000);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCancelAvatarUpload = () => {
    setAvatarFile(null);
    setAvatarPreviewUrl('');
    setAvatarMessage('');
  };

  const handleCoverChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selected.type)) {
      setCoverMessage('Chỉ chấp nhận các định dạng: JPEG, PNG, GIF, WebP');
      setTimeout(() => setCoverMessage(''), 3000);
      return;
    }

    if (selected.size > maxSize) {
      setCoverMessage('Kích thước file không được vượt quá 5MB');
      setTimeout(() => setCoverMessage(''), 3000);
      return;
    }

    setCoverFile(selected);
    setCoverMessage('');
  };

  const handleCoverUpload = async () => {
    if (!coverFile) return;

    setUploadingCover(true);
    setCoverMessage('');

    try {
      const formData = new FormData();
      formData.append('cover', coverFile);

      const userId = profileData?.id || localStorage.getItem('userId') || 1;
      const data = await uploadCover(userId, formData);
      const newCoverUrl = data.coverUrl || data.url;

      setProfileData((prev) => ({ ...prev, coverUrl: newCoverUrl }));
      setExistingCoverUrl(newCoverUrl);

      try {
        const rawUser = localStorage.getItem('user');
        if (rawUser) {
          const parsedUser = JSON.parse(rawUser);
          localStorage.setItem(
            'user',
            JSON.stringify({ ...parsedUser, coverUrl: newCoverUrl }),
          );
          window.dispatchEvent(new Event('user-updated'));
        }
      } catch (storageError) {
        console.warn('Failed to sync cover to localStorage:', storageError);
      }

      setCoverFile(null);
      setCoverPreviewUrl('');
      setCoverMessage('Cập nhật ảnh bìa thành công!');
      setTimeout(() => setCoverMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading cover:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Tải ảnh bìa lên thất bại, vui lòng thử lại!';
      setCoverMessage(errorMessage);
      setTimeout(() => setCoverMessage(''), 3000);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCancelCoverUpload = () => {
    setCoverFile(null);
    setCoverPreviewUrl('');
    setCoverMessage('');
  };

  const username = profileData?.username || '';
  const portfolioUserId =
    profileData?.id || localStorage.getItem('userId') || '';
  const portfolioHref = portfolioUserId ? `/portfolio/${portfolioUserId}` : '';
  const hasAvatar = Boolean(avatarPreviewUrl || existingAvatarUrl);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div className="profile-loading-state">
          <p className="profile-loading-text">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container">
        <div className="profile-error-state">
          <div className="profile-error-card">
            <h3>Lỗi tải dữ liệu</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <aside className="user-profile-sidebar">
          <ul className="sidebar-menu">
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                <User className="icon" />
                Hồ sơ
              </button>
            </li>
            {hasAnyRole(['READER', 'AUTHOR'], getStoredUser()) && (
              <li>
                <button
                  className={`sidebar-menu-item ${location.pathname === '/reader/refund-request' ? 'active' : ''}`}
                  onClick={() => navigate('/reader/refund-request')}
                >
                  <Wallet className="icon" />
                  {readerRefundLabel}
                </button>
              </li>
            )}
            {false && hasAnyRole(['READER', 'AUTHOR'], getStoredUser()) && (
              <li>
                <button
                  className={`sidebar-menu-item ${location.pathname === '/reader/refund-request' ? 'active' : ''}`}
                  onClick={() => navigate('/reader/refund-request')}
                >
                  <Wallet className="icon" />
                  YÃªu cáº§u hoÃ n tiá»n
                </button>
              </li>
            )}
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/daily-tasks' ? 'active' : ''}`} onClick={() => navigate('/daily-tasks')}>
                <CheckSquare className="icon" />
                Nhiệm vụ hàng ngày
              </button>
            </li>
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/achievements' ? 'active' : ''}`} onClick={() => navigate('/achievements')}>
                <Trophy className="icon" />
                Thành tích
              </button>
            </li>
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/bookmarks' ? 'active' : ''}`} onClick={() => navigate('/bookmarks')}>
                <Bookmark className="icon" />
                Bookmark
              </button>
            </li>
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/donation-history' ? 'active' : ''}`} onClick={() => navigate('/donation-history')}>
                <Wallet className="icon" />
                Lịch sử giao dịch
              </button>
            </li>
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/authordashboard' ? 'active' : ''}`} onClick={() => navigate('/authordashboard')}>
                <Edit3 className="icon" />
                Khu vực tác giả
              </button>
            </li>
            {hasAnyRole(['AUTHOR'], getStoredUser()) && (
              <li>
                <button
                  className={`sidebar-menu-item ${location.pathname === '/author/withdrawal-request' ? 'active' : ''}`}
                  onClick={() => navigate('/author/withdrawal-request')}
                >
                  <Wallet className="icon" />
                  Yêu cầu rút tiền
                </button>
              </li>
            )}
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/reviewer-area' ? 'active' : ''}`} onClick={() => navigate('/reviewer-area')}>
                <Shield className="icon" />
                Khu vực reviewer
              </button>
            </li>
            <li>
              <button className={`sidebar-menu-item ${location.pathname === '/notifications' ? 'active' : ''}`} onClick={() => navigate('/notifications')}>
                <MessageSquare className="icon" />
                Tin nhắn
              </button>
            </li>
            {hasAnyRole(['MOD'], getStoredUser()) && (
              <li>
                <button className={`sidebar-menu-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`} onClick={() => navigate('/admin/dashboard')}>
                  <AdminIcon className="icon" />
                  Dashboard quản trị
                </button>
              </li>
            )}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="user-profile-main">
          {/* Banner */}
          <div className="profile-banner-container">
            {existingCoverUrl ? (
              <img src={existingCoverUrl} alt="Banner" className="profile-banner" />
            ) : (
              <div className="profile-banner" />
            )}
            {/* Cover Upload Button */}
            <div className="cover-upload-container">
              <button 
                className="cover-upload-btn"
                onClick={() => coverInputRef.current?.click()}
                title="Thay đổi ảnh bìa"
              >
                <Camera className="icon" />
                <span>Thay đổi ảnh bìa</span>
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Profile Info Card */}
          <div className="profile-info-card">
            <div className="profile-content">
              <div className="profile-left">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={avatarPreviewUrl || existingAvatarUrl}
                    alt="Avatar"
                    className="profile-avatar"
                    onClick={() => avatarInputRef.current?.click()}
                  />
                  <div className="avatar-upload-overlay" onClick={() => avatarInputRef.current?.click()}>
                    <Camera className="icon" />
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* User Info */}
                <div className="profile-info">
                  <h1>{displayName || username || 'Người dùng'}</h1>
                  <div className="profile-role-badge">{getUserRoleDisplay()}</div>
                  <div className="profile-username">@{username}</div>
                  {portfolioHref && (
                    <button
                      type="button"
                      className="profile-portfolio-button"
                      onClick={() => navigate(portfolioHref)}
                    >
                      Xem trang cá nhân
                    </button>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="profile-stats">
                <div className="stat-box">
                  <span className="stat-number">{profileData?.storiesCount || 0}</span>
                  <span className="stat-label">TRUYỆN</span>
                </div>
                <div className="stat-box">
                  <span className="stat-number">{profileData?.followersCount || 0}</span>
                  <span className="stat-label">FOLLOWERS</span>
                </div>
              </div>
            </div>

            {/* Avatar Upload Preview */}
            {avatarFile && (
              <div className="profile-preview-block">
                <div className="message info">
                  <span>Ảnh mới đã chọn</span>
                  <div className="profile-preview-actions">
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="btn-primary"
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Lưu'}
                    </button>
                    <button
                      onClick={handleCancelAvatarUpload}
                      disabled={uploadingAvatar}
                      className="btn-secondary"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Message */}
            {avatarMessage && (
              <div className={`message ${avatarMessage.includes('thành công') ? 'success' : 'error'}`}>
                {avatarMessage}
              </div>
            )}

            {/* Cover Upload Preview */}
            {coverFile && (
              <div className="profile-preview-block">
                <div className="message info">
                  <div className="profile-preview-actions--column">
                    <span className="profile-preview-title">Ảnh bìa mới đã chọn</span>
                    <div className="profile-preview-actions">
                      <button
                        onClick={handleCoverUpload}
                        disabled={uploadingCover}
                        className="btn-primary"
                      >
                        {uploadingCover ? 'Đang tải...' : 'Lưu ảnh bìa'}
                      </button>
                      <button
                        onClick={handleCancelCoverUpload}
                        disabled={uploadingCover}
                        className="btn-secondary"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cover Message */}
            {coverMessage && (
              <div className={`message ${coverMessage.includes('thành công') ? 'success' : 'error'}`}>
                {coverMessage}
              </div>
            )}
          </div>

          {/* Settings & Security Grid */}
          <div className="settings-security-grid">
            {/* Settings Card */}
            <div className="settings-card">
              <div className="card-header">
                <Settings className="icon" />
                <h3 className="card-title">Cài đặt tài khoản</h3>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tên hiển thị
                  <span className="text-gray-500 text-sm ml-2">
                    {tempName.length}/30 ký tự
                  </span>
                </label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Nhập tên hiển thị mới..."
                    className={`form-input ${
                      tempName.length > 30 ? 'border-red-500' : ''
                    }`}
                    maxLength={31}
                  />
                  <button 
                    onClick={handleChangeName} 
                    className="btn-primary"
                    disabled={!tempName.trim() || tempName.length > 30}
                  >
                    Lưu thông tin
                  </button>
                </div>
                {nameMessage && (
                  <div className={`message ${nameMessage.includes('thành công') ? 'success' : 'error'}`}>
                    {nameMessage}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tiểu sử
                  <span className="text-gray-500 text-sm ml-2">
                    {favoriteQuote.trim().split(/\s+/).filter(word => word.length > 0).length}/200 từ | {favoriteQuote.replace(/\s/g, '').length}/1000 ký tự
                  </span>
                </label>
                <textarea
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="Nhập trích dẫn yêu thích của bạn..."
                  className={`form-textarea ${
                    favoriteQuote.replace(/\s/g, '').length > 1000 || favoriteQuote.trim().split(/\s+/).filter(word => word.length > 0).length > 200 
                      ? 'border-red-500' 
                      : ''
                  }`}
                  rows={4}
                />
                <div className="flex justify-between items-center mt-2">
                  <button 
                    onClick={handleUpdateQuote} 
                    className="btn-primary"
                    disabled={
                      !favoriteQuote.trim() || 
                      favoriteQuote.replace(/\s/g, '').length > 1000 || 
                      favoriteQuote.trim().split(/\s+/).filter(word => word.length > 0).length > 200
                    }
                  >
                    Cập nhật
                  </button>
                  {favoriteQuote.trim().split(/\s+/).filter(word => word.length > 0).length > 180 && (
                    <span className="text-orange-500 text-sm">
                      ⚠️ Sắp đạt giới hạn từ (180/200)
                    </span>
                  )}
                </div>
                {bioMessage && (
                  <div className={`message ${bioMessage.includes('thành công') ? 'success' : 'error'}`}>
                    {bioMessage}
                  </div>
                )}
              </div>
            </div>

            {/* Security Card */}
            <div className="security-card">
              <div className="card-header">
                <Lock className="icon" />
                <h3 className="card-title">Bảo mật</h3>
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu cũ</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nhập lại mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Xác nhận lại mật khẩu mới"
                  className="form-input"
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={changingPassword}
                className="btn-dark"
              >
                {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>

              {passwordMessage && (
                <div className={`message ${passwordMessage.includes('thành công') ? 'success' : 'error'}`}>
                  {passwordMessage}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
