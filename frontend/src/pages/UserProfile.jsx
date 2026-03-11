import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  BookOpen,
  MessageSquare,
  Library,
  CreditCard,
  Search,
  ChevronDown,
  Menu,
  Calendar,
  Coins,
  Shield,
  Mail,
  UserCircle,
  Edit3,
  Save,
  Gem,
  Camera,
  Upload,
  Settings,
  Wallet,
  Target,
  Lock,
} from 'lucide-react';
import { dailyCheckIn, getUserProfileById, uploadAvatar, uploadCover } from '../api/userApi';
import { getWallet } from '../api/walletApi';
import { WalletContext } from '../context/WalletContext';

export default function UserProfile({ userData }) {
  const navigate = useNavigate();
  const { refreshWallet } = useContext(WalletContext);

  // ✅ Không hardcode, khởi tạo rỗng
  const [displayName, setDisplayName] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [tempName, setTempName] = useState('');
  const [bioMessage, setBioMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [profileData, setProfileData] = useState({});
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [lastCheckInAmount, setLastCheckInAmount] = useState(0);
  const [coinAnimation, setCoinAnimation] = useState(false);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasClaimedMonthlyBonus, setHasClaimedMonthlyBonus] = useState(false);
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

  // ✅ Fix: Fetch profile từ API dùng token, không hardcode
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Nếu userData đã có đầy đủ thông tin thì dùng luôn
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

        // Không có userData → fetch từ API bằng token
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
        } else {
          // Fallback: thử lấy theo id nếu có
          const userId = userData?.id || 1;
          const fallbackRes = await fetch(
            `http://localhost:8081/api/users/profile/${userId}`,
            {
              credentials: 'include',
            },
          );
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setProfileData(data);
            setDisplayName(data.displayName || data.username || '');
            setFavoriteQuote(data.bio || '');
            setTempName(data.displayName || data.username || '');
            setExistingAvatarUrl(data.avatarUrl || '');
            setExistingCoverUrl(data.coverUrl || '');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userData]);

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

  // ✅ Fix: Fetch wallet và log cấu trúc để debug
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        console.log('✅ walletData structure:', JSON.stringify(data, null, 2));
        setWalletData(data);

        // Check localStorage for persisted monthly bonus status
        const storedMonthlyBonusStatus =
          localStorage.getItem('monthlyBonusStatus');
        if (storedMonthlyBonusStatus) {
          const { claimed, month, year } = JSON.parse(storedMonthlyBonusStatus);
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
          const currentYear = now.getFullYear();

          // Only use stored status if it's for the current month
          if (claimed && month === currentMonth && year === currentYear) {
            setHasClaimedMonthlyBonus(true);
            console.log(
              '📅 Using stored monthly bonus status for current month',
            );
          } else {
            // Clear expired status
            localStorage.removeItem('monthlyBonusStatus');
            setHasClaimedMonthlyBonus(false);
          }
        }
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };
    fetchWallet();
  }, []);

  // Fetch user roles
  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');

        console.log('🔑 Fetching roles for userId:', userId);

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

        console.log('🔑 Response status:', response.status);
        console.log('🔑 Response ok:', response.ok);

        if (response.ok) {
          const rolesData = await response.json();
          console.log('🔑 Raw roles data from API:', rolesData);
          console.log('🔑 Roles data type:', typeof rolesData);
          console.log('🔑 Roles data length:', rolesData?.length);

          if (rolesData && rolesData.length > 0) {
            console.log('🔑 First role structure (DTO):', rolesData[0]);
            console.log('🔑 First role.roleName:', rolesData[0]?.roleName);
            console.log('🔑 First role.roleCode:', rolesData[0]?.roleCode);
            console.log('🔑 EXPECTED: Reader role should show "Reader"');
          }

          setUserRoles(rolesData);
        } else {
          console.log('🔑 Failed to fetch roles');
        }
      } catch (error) {
        console.error('🔑 Error fetching user roles:', error);
      }
    };

    fetchUserRoles();
  }, []);

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

  const handleAvatarChange = (event) => {
    const selected = event.target.files?.[0];
    if (!selected) return;

    // File validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

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

      // Update profile data with new avatar
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
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Tải avatar lên thất bại, vui lòng thử lại!';
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

    // File validation
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    const maxSize = 5 * 1024 * 1024; // 5MB

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

      // Update profile data with new cover
      setProfileData((prev) => ({ ...prev, coverUrl: newCoverUrl }));
      setExistingCoverUrl(newCoverUrl);
      
      // Update localStorage
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
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Tải ảnh bìa lên thất bại, vui lòng thử lại!';
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

  const handlePasswordChange = async () => {
    // Validation
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
        // Clear form
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

  const getUserRoleDisplay = () => {
    console.log('🎯 getUserRoleDisplay called');
    console.log('🎯 userRoles state:', userRoles);
    console.log('🎯 userRoles length:', userRoles?.length);

    if (!userRoles || userRoles.length === 0) {
      console.log('🎯 No roles found, returning "Thành viên"');
      return 'Thành viên';
    }

    // Extract role codes from userRoles array (DTO structure)
    const roleCodes = userRoles
      .map((userRole) => {
        console.log('🎯 Processing userRole:', userRole);
        console.log('🎯 userRole.roleName:', userRole?.roleName);
        console.log('🎯 userRole.roleCode:', userRole?.roleCode);
        return userRole?.roleCode || '';
      })
      .filter(Boolean);

    console.log('🎯 Extracted role codes:', roleCodes);

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
      console.log('🎯 No matching role found, returning "Thành viên"');
      return 'Thành viên';
    }
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const response = await dailyCheckIn();

      if (response.alreadyClaimed) {
        setHasClaimedMonthlyBonus(true);
        // Save to localStorage to prevent exploits
        const now = new Date();
        const monthlyBonusStatus = {
          claimed: true,
          month: now.getMonth() + 1, // JavaScript months are 0-indexed
          year: now.getFullYear(),
        };
        localStorage.setItem(
          'monthlyBonusStatus',
          JSON.stringify(monthlyBonusStatus),
        );
        return;
      }

      if (response.success) {
        const currentCoins = profileData?.wallet?.balance_coin_a ?? 0;
        const newCoinBalance = currentCoins + (response.addedAmount || 5000);

        const updatedProfileData = {
          ...profileData,
          wallet: {
            ...profileData?.wallet,
            balance_coin_a: newCoinBalance,
          },
        };
        setProfileData(updatedProfileData);
        setLastCheckInAmount(response.addedAmount || 5000);
        setHasClaimedMonthlyBonus(true);

        // Save to localStorage to prevent exploits
        const now = new Date();
        const monthlyBonusStatus = {
          claimed: true,
          month: now.getMonth() + 1, // JavaScript months are 0-indexed
          year: now.getFullYear(),
        };
        localStorage.setItem(
          'monthlyBonusStatus',
          JSON.stringify(monthlyBonusStatus),
        );

        setCoinAnimation(true);
        setTimeout(() => setCoinAnimation(false), 1000);

        try {
          const updatedWallet = await getWallet();
          setWalletData(updatedWallet);
          await refreshWallet();
        } catch (error) {
          console.error('Error refreshing wallet:', error);
        }
      } else {
        console.error('Monthly bonus claim failed:', response.message);
      }
    } catch (error) {
      console.error('Check-in error:', error);
    } finally {
      setCheckInLoading(false);
    }
  };

  const menuItems = [
    { icon: User, label: 'Hồ sơ', active: true, path: '/profile' },
    {
      icon: Edit3,
      label: 'Khu vực tác giả',
      active: false,
      path: '/authordashboard',
    },
    {
      icon: MessageSquare,
      label: 'Tin nhắn',
      active: false,
      path: '/messages',
    },
    { icon: Library, label: 'Tủ truyện', active: false, path: '/library' },
    {
      icon: CreditCard,
      label: 'Nạp tiền',
      active: false,
      path: '/wallet/topup',
    },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  // ✅ Fix coin mapping - thử nhiều field name có thể có từ backend
  const coinA =
    walletData?.coinA ??
    walletData?.balance_coin_a ??
    walletData?.coin_a ??
    walletData?.balanceCoinA ??
    profileData?.wallet?.balance_coin_a ??
    0;

  const coinB =
    walletData?.coinB ??
    walletData?.balance_coin_b ??
    walletData?.coin_b ??
    walletData?.balanceCoinB ??
    profileData?.wallet?.balance_coin_b ??
    0;

  const username = profileData?.username || '';
  const hasAvatar = Boolean(avatarPreviewUrl || existingAvatarUrl);

  // ✅ Hiển thị loading khi đang fetch
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f4f4f4',
        }}
      >
        <p style={{ fontSize: '18px', color: '#666' }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Giữ nguyên */}
        <aside className="w-80 min-w-[320px] bg-white shadow-sm min-h-screen sticky top-0">
          {/* Navigation Menu */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Menu</h2>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  item.active
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-6xl mx-auto px-6 pb-6">
          {/* Cover Image Banner */}
          <div className="h-52 rounded-xl overflow-hidden mb-6 relative group">
            {existingCoverUrl ? (
              <img
                src={existingCoverUrl}
                alt="Ảnh bìa"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-gray-300 to-gray-400"></div>
            )}
            
            {/* Cover Upload Button */}
            <div 
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center cursor-pointer"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-lg">
                <Camera size={16} />
                <span className="text-sm font-medium text-gray-700">Thay đổi ảnh bìa</span>
              </div>
            </div>
            
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </div>

          {/* Cover Upload Preview */}
          {coverFile && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 relative z-20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-700">
                  <Upload size={16} />
                  <span className="text-sm">Ảnh bìa mới đã chọn</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCoverUpload}
                    disabled={uploadingCover}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingCover ? 'Đang tải...' : 'Lưu'}
                  </button>
                  <button
                    onClick={handleCancelCoverUpload}
                    disabled={uploadingCover}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cover Message */}
          {coverMessage && (
            <div className={`mb-6 p-3 rounded-lg text-sm relative z-20 ${
              coverMessage.includes('thành công')
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {coverMessage}
            </div>
          )}

          {/* Profile Card - Nằm đè lên ảnh bìa */}
          <div className="bg-white rounded-xl shadow-lg p-6 -mt-16 mb-6 relative z-10">
            <div className="flex justify-between items-center">
              {/* Left side - Avatar and Info */}
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {hasAvatar ? (
                      <img
                        src={avatarPreviewUrl || existingAvatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-teal-600 flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {(displayName || username || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  {!hasAvatar && (
                    <div className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 border-2 border-white">
                      <Camera size={16} className="text-white" />
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {/* User Info */}
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {displayName || username || 'Người dùng'}
                  </h1>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full font-medium">
                      {getUserRoleDisplay()}
                    </span>
                    <span className="text-gray-500">@{username}</span>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex gap-6 text-sm">
                    <div>
                      <span className="font-semibold text-gray-800">{profileData?.storiesCount || 0}</span>
                      <span className="text-gray-500 ml-1">Truyện</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{profileData?.followersCount || 0}</span>
                      <span className="text-gray-500 ml-1">Người theo dõi</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Upload Preview */}
            {avatarFile && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Upload size={16} />
                    <span className="text-sm">Ảnh mới đã chọn</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {uploadingAvatar ? 'Đang tải...' : 'Lưu'}
                    </button>
                    <button
                      onClick={handleCancelAvatarUpload}
                      disabled={uploadingAvatar}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition duration-200 focus:ring-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Avatar Message */}
            {avatarMessage && (
              <div
                className={`mt-2 p-3 rounded-lg text-sm ${
                  avatarMessage.includes('thành công')
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {avatarMessage}
              </div>
            )}
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-[300px_1fr] gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Wallet Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wallet className="text-blue-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Ví</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Coin</div>
                      <div className="text-xl font-bold text-yellow-600">{coinA} Coin</div>
                    </div>
                    <Coins className="text-yellow-500" size={24} />
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-600">Kim cương</div>
                      <div className="text-xl font-bold text-purple-600">{coinB} Kim cương</div>
                    </div>
                    <Gem className="text-purple-500" size={24} />
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/wallet/topup')}
                  className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 font-medium transition duration-200 focus:ring-2 focus:ring-blue-400"
                >
                  Nạp tiền
                </button>
              </div>

              {/* Daily Missions Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="text-green-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Nhiệm vụ hằng ngày</h3>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  Hoàn thành nhiệm vụ mỗi ngày để nhận phần thưởng.
                </p>
                
                <button
                  onClick={() => navigate('/daily-tasks')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 font-medium transition duration-200 focus:ring-2 focus:ring-blue-400"
                >
                  Xem nhiệm vụ
                </button>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Account Settings Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="text-blue-500" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Cài đặt tài khoản</h3>
                </div>
                
                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên hiển thị
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        placeholder="Nhập tên hiển thị mới..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleChangeName}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition duration-200 focus:ring-2 focus:ring-blue-400"
                      >
                        Lưu tên
                      </button>
                    </div>
                    {nameMessage && (
                      <div
                        className={`mt-2 p-2 rounded text-sm ${
                          nameMessage.includes('thành công') || nameMessage.includes('thay đổi')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {nameMessage}
                      </div>
                    )}
                  </div>

                  {/* Favorite Quote */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trích dẫn yêu thích
                    </label>
                    <textarea
                      value={favoriteQuote}
                      onChange={(e) => setFavoriteQuote(e.target.value)}
                      placeholder="Nhập trích dẫn yêu thích của bạn..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      onClick={handleUpdateQuote}
                      className="mt-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition duration-200 focus:ring-2 focus:ring-blue-400"
                    >
                      Cập nhật
                    </button>
                    {bioMessage && (
                      <div
                        className={`mt-2 p-2 rounded text-sm ${
                          bioMessage.includes('thành công') || bioMessage.includes('cập nhật')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {bioMessage}
                      </div>
                    )}
                  </div>

                  {/* Security */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Lock className="text-red-500" size={20} />
                      <h4 className="text-md font-semibold text-gray-800">Bảo mật</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu cũ
                        </label>
                        <input
                          type="password"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          placeholder="Nhập mật khẩu hiện tại"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mật khẩu mới
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nhập lại mật khẩu
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Xác nhận lại mật khẩu mới"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <button 
                        onClick={handlePasswordChange}
                        disabled={changingPassword}
                        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 font-medium transition duration-200 focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                      </button>
                      {passwordMessage && (
                        <div className={`mt-2 p-2 rounded text-sm ${
                          passwordMessage.includes('thành công')
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {passwordMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
