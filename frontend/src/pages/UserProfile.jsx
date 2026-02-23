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
  const [displayName, setDisplayName] = useState(userData?.displayName || 'Thảo Trịnh');
  const [favoriteQuote, setFavoriteQuote] = useState(userData?.bio || '');
  const [tempName, setTempName] = useState(displayName);
  const [bioMessage, setBioMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [profileData, setProfileData] = useState(userData || {});
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [lastCheckInAmount, setLastCheckInAmount] = useState(0);
  const [coinAnimation, setCoinAnimation] = useState(false);
  const [walletData, setWalletData] = useState(null);

  // Fetch profile data from API if not provided
  React.useEffect(() => {
    if (!userData || !userData.email) {
      const fetchProfile = async () => {
        try {
          const userId = profileData?.id || 1;
          const response = await fetch(`http://localhost:8081/api/users/profile/${userId}`);
          if (response.ok) {
            const data = await response.json();
            setProfileData(data);
            setDisplayName(data.displayName || 'Thảo Trịnh');
            setFavoriteQuote(data.bio || '');
            setTempName(data.displayName || 'Thảo Trịnh');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      };
      fetchProfile();
    }
  }, [userData]);

  // Fetch wallet data
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data = await getWallet();
        setWalletData(data);
      } catch (error) {
        console.error('Error fetching wallet:', error);
      }
    };
    fetchWallet();
  }, [userData]);

  // Set profileData when userData is available
  useEffect(() => {
    if (userData && userData.email) {
      setProfileData(userData);
    }
  }, [userData]);

  
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

  const handleCheckIn = async () => {
    const userId = profileData?.id || userData?.id || 1;
    
    setCheckInLoading(true);
    try {
      // Call the backend API to add 5000 coin A to database
      const response = await dailyCheckIn();
      
      // Calculate new balance (current + 5000)
      const currentCoins = profileData?.wallet?.balance_coin_a ?? 0;
      const newCoinBalance = currentCoins + (response.addedAmount || 5000);
      
      // Update profile data with new coin balance
      const updatedProfileData = {
        ...profileData,
        wallet: {
          ...profileData?.wallet,
          balance_coin_a: newCoinBalance
        }
      };
      setProfileData(updatedProfileData);
      setLastCheckInAmount(response.addedAmount || 5000);
      
      // Trigger coin animation
      setCoinAnimation(true);
      setTimeout(() => setCoinAnimation(false), 1000);
      
      // Refresh wallet data to get updated balance
      try {
        const updatedWallet = await getWallet();
        setWalletData(updatedWallet);
        // Refresh wallet context to update Header display
        await refreshWallet();
      } catch (error) {
        console.error('Error refreshing wallet:', error);
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('Nhận coin thất bại. Vui lòng thử lại sau.');
    } finally {
      setCheckInLoading(false);
    }
  };

  const menuItems = [
    { icon: User, label: 'Hồ sơ', active: true, path: '/profile' },
    { icon: Edit3, label: 'Khu vực tác giả', active: false, path: '/authordashboard' },
    { icon: MessageSquare, label: 'Tin nhắn', active: false, path: '/messages' },
    { icon: Library, label: 'Tủ truyện', active: false, path: '/library' },
    { icon: CreditCard, label: 'Nạp tiền', active: false, path: '/recharge' },
  ];

  const handleMenuClick = (path) => { navigate(path); };

  // Coin values from DB wallet (coinA, coinB from backend API)
  const coinA = walletData?.coinA ?? profileData?.wallet?.balance_coin_a ?? profileData?.coinA ?? profileData?.balance_coin_a ?? 0;
  const coinB = walletData?.coinB ?? profileData?.wallet?.balance_coin_b ?? profileData?.coinB ?? profileData?.balance_coin_b ?? 0;
  const username = profileData?.username || 'username';

  return (
    <div style={{
      minHeight: '100vh',
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
                {displayName.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{displayName}</h2>

              {/* ✅ CHANGED: Hiển thị username thay vì email */}
              <p style={{ margin: '0 0 16px 0', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', fontSize: '14px' }}>
                <User size={16} />
                {username}
              </p>

              {/* ✅ CHANGED: Hiển thị 2 loại coin: A (xu) và B (kim cương) */}
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
                  <Coins size={22} style={{ 
                    color: '#ffd700',
                    animation: coinAnimation ? 'spin 0.5s ease-in-out' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '50%': { transform: 'rotate(180deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
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
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', boxSizing: 'border-box' }}>
                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <UserCircle size={20} />
                    <span style={{ fontWeight: '500' }}>Tên hiển thị</span>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{displayName}</p>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Mail size={20} />
                    <span style={{ fontWeight: '500' }}>Email</span>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{profileData?.email || 'thao.trinh@email.com'}</p>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Shield size={20} />
                    <span style={{ fontWeight: '500' }}>Chức vụ</span>
                  </div>
                  <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #17a2b8, #138496)', color: 'white', padding: '4px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)' }}>
                    Thành viên
                  </span>
                </div>

                <div style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '16px', border: '1px solid #e9ecef', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Calendar size={20} />
                    <span style={{ fontWeight: '500' }}>Nhận Coin</span>
                  </div>
                  <button onClick={handleCheckIn} disabled={checkInLoading} style={{ color: '#28a745', fontWeight: '600', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '6px', padding: '4px 8px', cursor: checkInLoading ? 'not-allowed' : 'pointer' }}>
                    {checkInLoading ? 'Đang xử lý...' : '🎁 Nhận 5000 coin'}
                                      </button>
                </div>

                {/* ✅ CHANGED: 2 ô coin riêng biệt thay vì 1 ô */}
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

          {/* Author Area */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', marginTop: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '6px', height: '32px', background: 'linear-gradient(180deg, #17a2b8, #138496)', borderRadius: '3px' }}></div>
              Khu vực tác giả
            </h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/author/create-story')}
                style={{
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  flex: '1',
                  minWidth: '200px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(40, 167, 69, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)';
                }}
              >
                <BookOpen size={24} />
                Thêm truyện mới
              </button>
              <button
                onClick={() => navigate('/manage-stories')}
                style={{
                  background: 'linear-gradient(135deg, #007bff, #6610f2)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 4px 12px rgba(0, 123, 255, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  flex: '1',
                  minWidth: '200px'
                }}
                onMouseOver={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 123, 255, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.3)';
                }}
              >
                <Edit3 size={24} />
                Quản lý truyện
              </button>
            </div>
            <p style={{ marginTop: '16px', color: '#666', fontSize: '14px' }}>
              Quản lý các tác phẩm của bạn: tạo truyện mới, chỉnh sửa thông tin truyện và thêm/sửa chương.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}