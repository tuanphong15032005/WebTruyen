import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MessageSquare,
  Library,
  Settings,
  Target,
  Lock,
  Camera,
  Edit3,
  Save,
} from 'lucide-react';
import { dailyCheckIn, getUserProfileById, uploadAvatar, uploadCover } from '../api/userApi';
import './UserProfile.css';

export default function UserProfile({ userData }) {
  const navigate = useNavigate();

  // State variables
  const [displayName, setDisplayName] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [tempName, setTempName] = useState('');
  const [bioMessage, setBioMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState('');
  const [existingAvatarUrl, setExistingAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');
  const avatarInputRef = useRef(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState('');
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverMessage, setCoverMessage] = useState('');
  const coverInputRef = useRef(null);

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
      try {
        if (userData && userData.email) {
          setProfileData(userData);
          setDisplayName(userData.displayName || userData.username || '');
          setFavoriteQuote(userData.bio || '');
          setTempName(userData.displayName || userData.username || '');
          setExistingAvatarUrl(userData.avatarUrl || '');
          setExistingCoverUrl(userData.coverUrl || '');
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(
          `http://localhost:8081/api/users/profile/${userId}`,
          {
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          },
        );

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setDisplayName(data.displayName || data.username || '');
          setFavoriteQuote(data.bio || '');
          setTempName(data.displayName || data.username || '');
          setExistingAvatarUrl(data.avatarUrl || '');
          setExistingCoverUrl(data.coverUrl || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userData]);

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

    if (roleCodes.includes('ADMIN')) {
      return 'Quản trị viên';
    } else if (roleCodes.includes('MOD')) {
      return 'Biên tập viên';
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

  const handleUpdateQuote = async () => {
    try {
      const userId = profileData?.id || 1;
      const response = await fetch(
        `http://localhost:8081/api/users/profile/${userId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: favoriteQuote }),
        },
      );
      if (response.ok) {
        setBioMessage('Trích dẫn đã được cập nhật!');
        setTimeout(() => setBioMessage(''), 3000);
      } else {
        setBioMessage('Cập nhật thất bại, vui lòng thử lại!');
        setTimeout(() => setBioMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating bio:', error);
      setBioMessage('Có lỗi xảy ra, vui lòng thử lại!');
      setTimeout(() => setBioMessage(''), 3000);
    }
  };

  const handleChangeName = async () => {
    if (tempName.trim()) {
      try {
        const userId = profileData?.id || 1;
        const response = await fetch(
          `http://localhost:8081/api/users/profile/${userId}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ displayName: tempName }),
          },
        );
        if (response.ok) {
          setDisplayName(tempName);
          setNameMessage('Tên hiển thị đã được thay đổi!');
          setTimeout(() => setNameMessage(''), 3000);
        } else {
          setNameMessage('Cập nhật thất bại, vui lòng thử lại!');
          setTimeout(() => setNameMessage(''), 3000);
        }
      } catch (error) {
        console.error('Error updating displayName:', error);
        setNameMessage('Có lỗi xảy ra, vui lòng thử lại!');
        setTimeout(() => setNameMessage(''), 3000);
      }
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

  const username = profileData?.username || '';
  const hasAvatar = Boolean(avatarPreviewUrl || existingAvatarUrl);

  if (loading) {
    return (
      <div className="user-profile-container">
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ fontSize: '18px', color: '#666' }}>Đang tải...</p>
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
              <button className="sidebar-menu-item active">
                <User className="icon" />
                Hồ sơ
              </button>
            </li>
            <li>
              <button className="sidebar-menu-item" onClick={() => navigate('/authordashboard')}>
                <Edit3 className="icon" />
                Khu vực tác giả
              </button>
            </li>
            <li>
              <button className="sidebar-menu-item" onClick={() => navigate('/messages')}>
                <MessageSquare className="icon" />
                Tin nhắn
              </button>
            </li>
            <li>
              <button className="sidebar-menu-item" onClick={() => navigate('/library')}>
                <Library className="icon" />
                Tủ truyện
              </button>
            </li>
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
              <div style={{ marginTop: '16px' }}>
                <div className="message info">
                  <span>Ảnh mới đã chọn</span>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
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
                      className="btn-primary"
                      style={{ backgroundColor: '#6b7280' }}
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
          </div>

          {/* Daily Missions */}
          <div className="daily-missions-card">
            <div className="daily-missions-header">
              <div className="missions-icon-circle">
                <Target className="icon" />
              </div>
              <h3 className="daily-missions-title">Nhiệm vụ hằng ngày</h3>
            </div>
            <p className="daily-missions-description">
              Hoàn thành nhiệm vụ mỗi ngày để nhận phần thưởng.
            </p>
            <button
              onClick={() => navigate('/daily-tasks')}
              className="daily-missions-button"
            >
              Xem nhiệm vụ
            </button>
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
                <label className="form-label">Tên hiển thị</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    placeholder="Nhập tên hiển thị mới..."
                    className="form-input"
                  />
                  <button onClick={handleChangeName} className="btn-primary">
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
                <label className="form-label">Tiểu sử</label>
                <textarea
                  value={favoriteQuote}
                  onChange={(e) => setFavoriteQuote(e.target.value)}
                  placeholder="Nhập trích dẫn yêu thích của bạn..."
                  className="form-textarea"
                />
                <button onClick={handleUpdateQuote} className="btn-primary">
                  Cập nhật
                </button>
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
