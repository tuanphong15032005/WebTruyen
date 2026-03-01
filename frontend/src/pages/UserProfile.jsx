import React, { useState, useEffect, useContext } from 'react';
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
  Gem
} from 'lucide-react';
import { dailyCheckIn, getUserProfileById } from '../api/userApi';
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
          setLoading(false);
          return;
        }

        // Không có userData → fetch từ API bằng token
        const token = localStorage.getItem('accessToken');
        const userId = localStorage.getItem('userId');
        const response = await fetch(`http://localhost:8081/api/users/profile/${userId}`, {
          headers: {
...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setDisplayName(data.displayName || data.username || '');
          setFavoriteQuote(data.bio || '');
          setTempName(data.displayName || data.username || '');
        } else {
          // Fallback: thử lấy theo id nếu có
          const userId = userData?.id || 1;
          const fallbackRes = await fetch(`http://localhost:8081/api/users/profile/${userId}`, {
            credentials: 'include'
          });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            setProfileData(data);
            setDisplayName(data.displayName || data.username || '');
            setFavoriteQuote(data.bio || '');
            setTempName(data.displayName || data.username || '');
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

  // ✅ Fix: Fetch wallet và log cấu trúc để debug
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        console.log('✅ walletData structure:', JSON.stringify(data, null, 2));
        setWalletData(data);
        
        // Check localStorage for persisted monthly bonus status
        const storedMonthlyBonusStatus = localStorage.getItem('monthlyBonusStatus');
        if (storedMonthlyBonusStatus) {
          const { claimed, month, year } = JSON.parse(storedMonthlyBonusStatus);
          const now = new Date();
          const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
          const currentYear = now.getFullYear();
          
          // Only use stored status if it's for the current month
          if (claimed && month === currentMonth && year === currentYear) {
            setHasClaimedMonthlyBonus(true);
            console.log('📅 Using stored monthly bonus status for current month');
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
        
        const response = await fetch(`http://localhost:8081/api/users/profile/${userId}/roles`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        
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
      const response = await fetch(`http://localhost:8081/api/users/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: favoriteQuote })
      });
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
        const response = await fetch(`http://localhost:8081/api/users/profile/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: tempName })
        });
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

  const getUserRoleDisplay = () => {
    console.log('🎯 getUserRoleDisplay called');
    console.log('🎯 userRoles state:', userRoles);
    console.log('🎯 userRoles length:', userRoles?.length);
    
    if (!userRoles || userRoles.length === 0) {
      console.log('🎯 No roles found, returning "Thành viên"');
      return 'Thành viên';
    }
    
    // Extract role names from userRoles array (DTO structure)
    const roles = userRoles
      .map(userRole => {
        console.log('🎯 Processing userRole:', userRole);
        console.log('🎯 userRole.roleName:', userRole?.roleName);
        console.log('🎯 userRole.roleCode:', userRole?.roleCode);
        return userRole?.roleName || '';
      })
      .filter(Boolean);
    
    console.log('🎯 Extracted role names:', roles);
    
    if (roles.includes('ADMIN')) {
      return 'Quản trị viên';
    } else if (roles.includes('MOD')) {
      return 'Biên tập viên';
    } else if (roles.includes('AUTHOR')) {
      return 'Tác giả';
    } else if (roles.includes('REVIEWER')) {
      return 'Reviewer';
    } else if (roles.includes('READER')) {
      return 'Reader';
    } else if (roles.includes('Reader')) {
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
          year: now.getFullYear()
        };
        localStorage.setItem('monthlyBonusStatus', JSON.stringify(monthlyBonusStatus));
        return;
      }

      if (response.success) {
        const currentCoins = profileData?.wallet?.balance_coin_a ?? 0;
        const newCoinBalance = currentCoins + (response.addedAmount || 5000);

        const updatedProfileData = {
          ...profileData,
          wallet: {
            ...profileData?.wallet,
            balance_coin_a: newCoinBalance
          }
        };
        setProfileData(updatedProfileData);
        setLastCheckInAmount(response.addedAmount || 5000);
        setHasClaimedMonthlyBonus(true);

        // Save to localStorage to prevent exploits
        const now = new Date();
        const monthlyBonusStatus = {
          claimed: true,
          month: now.getMonth() + 1, // JavaScript months are 0-indexed
          year: now.getFullYear()
        };
        localStorage.setItem('monthlyBonusStatus', JSON.stringify(monthlyBonusStatus));

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
    { icon: Edit3, label: 'Khu vực tác giả', active: false, path: '/authordashboard' },
    { icon: MessageSquare, label: 'Tin nhắn', active: false, path: '/messages' },
    { icon: Library, label: 'Tủ truyện', active: false, path: '/library' },
    { icon: CreditCard, label: 'Nạp tiền', active: false, path: '/wallet/topup' },
  ];

  const handleMenuClick = (path) => { navigate(path); };

  // ✅ Fix coin mapping - thử nhiều field name có thể có từ backend
  const coinA = walletData?.coinA
    ?? walletData?.balance_coin_a
    ?? walletData?.coin_a
    ?? walletData?.balanceCoinA
    ?? profileData?.wallet?.balance_coin_a
    ?? 0;

  const coinB = walletData?.coinB
    ?? walletData?.balance_coin_b
    ?? walletData?.coin_b
    ?? walletData?.balanceCoinB
    ?? profileData?.wallet?.balance_coin_b
    ?? 0;

  const username = profileData?.username || '';

  // ✅ Hiển thị loading khi đang fetch
  if (loading) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f4f4' }}>
        <p style={{ fontSize: '18px', color: '#666' }}>Đang tải...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100%',
      backgroundColor: '#f4f4f4',
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0
    }}>
      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px', display: 'flex', gap: '32px', boxSizing: 'border-box' }}>

        {/* Sidebar - 30% */}
        <aside style={{ width: '30%', minWidth: '280px' }}>
          {/* User Info Card */}
          <div style={{ background: 'linear-gradient(135deg, #17a2b8, #138496)', borderRadius: '16px', padding: '24px', color: 'white', marginBottom: '24px', boxShadow: '0 8px 24px rgba(23, 162, 184, 0.2)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '96px', height: '96px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: 'bold', marginBottom: '16px', border: '4px solid rgba(255,255,255,0.3)', boxSizing: 'border-box' }}>
                {/* ✅ Fallback avatar */}
                {(displayName || username || '?').charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {displayName || username || 'Người dùng'}
              </h2>

              <p style={{ margin: '0 0 16px 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '14px' }}>
                <User size={16} />
                {username || 'username'}
              </p>

              <div style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.3)', boxSizing: 'border-box' }}>
                {/* Coin A */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  transition: 'all 0.3s ease',
                  transform: coinAnimation ? 'scale(1.1)' : 'scale(1)',
                  backgroundColor: coinAnimation ? 'rgba(255,215,0,0.2)' : 'transparent',
                  borderRadius: '8px',
                  padding: '4px 8px'
                }}>
                  <Coins size={22} style={{ color: '#ffd700' }} />
                  <span>{coinA} Coin</span>
                </div>
                {/* Divider */}
                <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.25)', margin: '8px 0' }} />
                {/* Coin B */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                  <Gem size={22} style={{ color: '#a78bfa' }} />
                  <span>{coinB} Kim cương</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.path)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px', backgroundColor: 'transparent', color: item.active ? '#17a2b8' : '#666', border: 'none', borderBottom: index !== menuItems.length - 1 ? '1px solid #f0f0f0' : 'none', cursor: 'pointer', fontSize: '16px', fontWeight: item.active ? '700' : '500', boxSizing: 'border-box', textAlign: 'left' }}
              >
                <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                <span style={{ textAlign: 'left', flex: 1 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - 70% */}
        <main style={{ flex: 1 }}>
          <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', margin: '0 0 32px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '48px', background: 'linear-gradient(180deg, #17a2b8, #138496)', borderRadius: '4px' }}></div>
            Profile
          </h1>

          {/* Profile Overview */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                <div style={{ width: '128px', height: '128px', background: 'linear-gradient(135deg, #17a2b8, #138496)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: 'bold', color: 'white', boxShadow: '0 8px 24px rgba(23, 162, 184, 0.3)' }}>
                  {/* ✅ Fallback avatar */}
                  {(displayName || username || '?').charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <UserCircle size={20} />
                    <span style={{ fontWeight: '500' }}>Tên hiển thị</span>
                  </div>
                  {/* ✅ Không hardcode */}
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>
                    {displayName || username || 'Chưa có tên'}
                  </p>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Mail size={20} />
                    <span style={{ fontWeight: '500' }}>Email</span>
                  </div>
                  {/* ✅ Không hardcode */}
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>
                    {profileData?.email || 'Chưa có email'}
                  </p>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Shield size={20} />
                    <span style={{ fontWeight: '500' }}>Chức vụ</span>
                  </div>
                  <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #17a2b8, #138496)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)' }}>
                    {getUserRoleDisplay()}
                  </span>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Calendar size={20} />
                    <span style={{ fontWeight: '500' }}>Nhận 5000 coin</span>
                  </div>
                  <button 
                    onClick={handleCheckIn} 
                    disabled={checkInLoading}
                    style={{ 
                      color: hasClaimedMonthlyBonus ? '#6c757d' : '#28a745', 
                      fontWeight: '600', 
                      textDecoration: 'none', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      backgroundColor: hasClaimedMonthlyBonus ? '#e9ecef' : '#d4edda', 
                      border: hasClaimedMonthlyBonus ? '1px solid #ced4da' : '1px solid #c3e6cb', 
                      borderRadius: '6px', 
                      padding: '4px 8px', 
                      cursor: checkInLoading ? 'not-allowed' : 'pointer',
                      opacity: checkInLoading ? 0.6 : 1
                    }}
                  >
                    {checkInLoading ? 'Đang xử lý...' : (hasClaimedMonthlyBonus ? '✅ Đã nhận thưởng' : '🎁 Nhận 5000 coin')}
                  </button>
                </div>

                <div style={{ backgroundColor: '#fffbeb', borderRadius: '12px', padding: '16px', border: '2px solid #fcd34d', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b45309', marginBottom: '8px', fontSize: '14px' }}>
                    <Coins size={20} />
                    <span style={{ fontWeight: '500' }}>Coin (A)</span>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#b45309', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coins size={26} style={{ color: '#fbbf24' }} />
                    {coinA} Coin
                  </p>
                </div>

                <div style={{ backgroundColor: '#f5f3ff', borderRadius: '12px', padding: '16px', border: '2px solid #c4b5fd', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#6d28d9', marginBottom: '8px', fontSize: '14px' }}>
                    <Gem size={20} />
                    <span style={{ fontWeight: '500' }}>Kim cương (B)</span>
                  </div>
                  <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#6d28d9', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Gem size={26} style={{ color: '#a78bfa' }} />
                    {coinB} Kim cương
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite Quote */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginBottom: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '6px', height: '32px', background: 'linear-gradient(180deg, #17a2b8, #138496)', borderRadius: '3px' }}></div>
              Trích dẫn yêu thích
            </h2>
            <textarea
              value={favoriteQuote}
              onChange={(e) => setFavoriteQuote(e.target.value)}
              placeholder="Nhập trích dẫn yêu thích của bạn..."
              style={{ width: '100%', height: '160px', padding: '16px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f8f9fa', color: '#333', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
            {bioMessage && (
              <div style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', backgroundColor: bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#f8d7da' : '#d4edda', color: bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#721c24' : '#155724', border: `1px solid ${bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#f5c6cb' : '#c3e6cb'}` }}>
                {bioMessage}
              </div>
            )}
            <button onClick={handleUpdateQuote} style={{ marginTop: '16px', background: 'linear-gradient(135deg, #17a2b8, #138496)', color: 'white', padding: '12px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)' }}>
              <Save size={20} /> Cập nhật
            </button>
          </div>

          {/* Display Name */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '6px', height: '32px', background: 'linear-gradient(180deg, #17a2b8, #138496)', borderRadius: '3px' }}></div>
              Tên hiển thị
            </h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Nhập tên hiển thị mới..."
                style={{ flex: 1, padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '12px', fontSize: '16px', backgroundColor: '#f8f9fa', color: '#333', outline: 'none', boxSizing: 'border-box' }}
              />
              <button onClick={handleChangeName} style={{ background: 'linear-gradient(135deg, #17a2b8, #138496)', color: 'white', padding: '12px 32px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)' }}>
                <Edit3 size={20} /> Thay đổi
              </button>
              {nameMessage && (
                <div style={{ marginTop: '12px', padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', backgroundColor: nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#f8d7da' : '#d4edda', color: nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#721c24' : '#155724', border: `1px solid ${nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#f5c6cb' : '#c3e6cb'}` }}>
                  {nameMessage}
                </div>
              )}
            </div>
          </div>

{/*           Author Area */}
{/*           <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginTop: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}> */}
{/*             <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}> */}
{/*               <div style={{ width: '6px', height: '32px', background: 'linear-gradient(180deg, #17a2b8, #138496)', borderRadius: '3px' }}></div> */}
{/*               Khu vực tác giả */}
{/*             </h2> */}
{/*             <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}> */}
{/*               <button */}
{/*                 onClick={() => navigate('/author/create-story')} */}
{/*                 style={{ */}
{/*                   background: 'linear-gradient(135deg, #28a745, #20c997)', */}
{/*                   color: 'white', */}
{/*                   padding: '16px 32px', */}
{/*                   borderRadius: '12px', */}
{/*                   fontSize: '16px', */}
{/*                   fontWeight: '600', */}
{/*                   border: 'none', */}
{/*                   cursor: 'pointer', */}
{/*                   display: 'flex', */}
{/*                   alignItems: 'center', */}
{/*                   gap: '12px', */}
{/*                   boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)', */}
{/*                   transition: 'transform 0.2s, box-shadow 0.2s', */}
{/*                   flex: '1', */}
{/*                   minWidth: '200px' */}
{/*                 }} */}
{/*                 onMouseOver={(e) => { */}
{/*                   e.currentTarget.style.transform = 'translateY(-2px)'; */}
{/*                   e.currentTarget.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)'; */}
{/*                 }} */}
{/*                 onMouseOut={(e) => { */}
{/*                   e.currentTarget.style.transform = 'translateY(0)'; */}
{/*                   e.currentTarget.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)'; */}
{/*                 }} */}
{/*               > */}
{/*                 <BookOpen size={24} /> */}
{/*                 Thêm truyện mới */}
{/*               </button> */}
{/*               <button */}
{/*                 onClick={() => navigate('/manage-stories')} */}
{/*                 style={{ */}
{/*                   background: 'linear-gradient(135deg, #007bff, #6610f2)', */}
{/*                   color: 'white', */}
{/*                   padding: '16px 32px', */}
{/*                   borderRadius: '12px', */}
{/*                   fontSize: '16px', */}
{/*                   fontWeight: '600', */}
{/*                   border: 'none', */}
{/*                   cursor: 'pointer', */}
{/*                   display: 'flex', */}
{/*                   alignItems: 'center', */}
{/*                   gap: '12px', */}
{/*                   boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)', */}
{/*                   transition: 'transform 0.2s, box-shadow 0.2s', */}
{/*                   flex: '1', */}
{/*                   minWidth: '200px' */}
{/*                 }} */}
{/*                 onMouseOver={(e) => { */}
{/*                   e.currentTarget.style.transform = 'translateY(-2px)'; */}
{/*                   e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)'; */}
{/*                 }} */}
{/*                 onMouseOut={(e) => { */}
{/*                   e.currentTarget.style.transform = 'translateY(0)'; */}
{/*                   e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)'; */}
{/*                 }} */}
{/*               > */}
{/*                 <Edit3 size={24} /> */}
{/*                 Quản lý truyện */}
{/*               </button> */}
{/*             </div> */}
{/*             <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}> */}
{/*               Quản lý các tác phẩm của bạn: tạo truyện mới, chỉnh sửa thông tin truyện và thêm/sửa chương. */}
{/*             </p> */}
{/*           </div> */}
        </main>
      </div>
    </div>
  );
}
