import React, { useState } from 'react';
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
  Save
} from 'lucide-react';

export default function UserProfile({ userData }) {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(userData?.displayName || 'Thảo Trịnh');
  const [favoriteQuote, setFavoriteQuote] = useState(userData?.bio || '');
  const [tempName, setTempName] = useState(displayName);
  const [bioMessage, setBioMessage] = useState('');
  const [nameMessage, setNameMessage] = useState('');
  const [profileData, setProfileData] = useState(userData || {});

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

  const handleUpdateQuote = async () => {
    try {
      const userId = profileData?.id || 1;
      const response = await fetch(`http://localhost:8081/api/users/profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio: favoriteQuote
        })
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
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            displayName: tempName
          })
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

  const menuItems = [
    { icon: User, label: 'Hồ sơ', active: true, path: '/profile' },
    { icon: Edit3, label: 'Khu vực tác giả', active: false, path: '/authordashboard' },
    { icon: MessageSquare, label: 'Tin nhắn', active: false, path: '/messages' },
    { icon: Library, label: 'Tủ truyện', active: false, path: '/library' },
    { icon: CreditCard, label: 'Nạp tiền', active: false, path: '/recharge' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f4f4f4', 
      fontFamily: 'Arial, sans-serif',
      margin: 0,
      padding: 0
    }}>
      {/* Main Content */}
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '32px 24px', 
        display: 'flex', 
        gap: '32px',
        boxSizing: 'border-box'
      }}>
        {/* Sidebar - 30% */}
        <aside style={{ width: '30%', minWidth: '280px' }}>
          {/* User Info Card */}
          <div style={{
            background: 'linear-gradient(135deg, #17a2b8, #138496)',
            borderRadius: '16px',
            padding: '24px',
            color: 'white',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(23, 162, 184, 0.2)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{
                width: '96px',
                height: '96px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: 'bold',
                marginBottom: '16px',
                border: '4px solid rgba(255, 255, 255, 0.3)',
                boxSizing: 'border-box'
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{displayName}</h2>
              <p style={{ 
                margin: '0 0 16px 0', 
                opacity: 0.9, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                <Mail size={16} />
                {profileData?.email || 'thao.trinh@email.com'}
              </p>
              <div style={{
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                  <Coins size={24} style={{ color: '#ffd700' }} />
                  <span>{profileData?.coin || 0} Coin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            overflow: 'hidden', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            boxSizing: 'border-box'
          }}>
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleMenuClick(item.path)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 24px',
                  backgroundColor: item.active ? 'linear-gradient(135deg, #17a2b8, #138496)' : 'transparent',
                  color: item.active ? 'white' : '#666',
                  border: 'none',
                  borderBottom: index !== menuItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  fontSize: '16px',
                  fontWeight: '500',
                  boxSizing: 'border-box',
                  textAlign: 'left'
                }}
              >
                <item.icon size={22} strokeWidth={item.active ? 2.5 : 2} />
                <span style={{ textAlign: 'left', flex: 1 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content - 70% */}
        <main style={{ flex: 1 }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: 'bold', 
            color: '#333', 
            margin: '0 0 32px 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px' 
          }}>
            <div style={{ 
              width: '8px', 
              height: '48px', 
              background: 'linear-gradient(180deg, #17a2b8, #138496)', 
              borderRadius: '4px' 
            }}></div>
            Profile
          </h1>

          {/* Profile Overview */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '32px', 
            marginBottom: '32px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '32px', alignItems: 'flex-start' }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: '128px',
                  height: '128px',
                  background: 'linear-gradient(135deg, #17a2b8, #138496)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: 'white',
                  boxShadow: '0 8px 24px rgba(23, 162, 184, 0.3)'
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Info Grid */}
              <div style={{ 
                flex: 1, 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '20px',
                boxSizing: 'border-box'
              }}>
                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: '1px solid #e9ecef', 
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <UserCircle size={20} />
                    <span style={{ fontWeight: '500' }}>Tên hiển thị</span>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>{displayName}</p>
                </div>

                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: '1px solid #e9ecef', 
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Mail size={20} />
                    <span style={{ fontWeight: '500' }}>Email</span>
                  </div>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#333', margin: 0 }}>
                    {profileData?.email || 'thao.trinh@email.com'}
                  </p>
                </div>

                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: '1px solid #e9ecef', 
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Shield size={20} />
                    <span style={{ fontWeight: '500' }}>Chức vụ</span>
                  </div>
                  <span style={{ 
                    display: 'inline-block', 
                    background: 'linear-gradient(135deg, #17a2b8, #138496)', 
                    color: 'white', 
                    padding: '4px 16px', 
                    borderRadius: '20px', 
                    fontSize: '14px', 
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)'
                  }}>
                    Thành viên
                  </span>
                </div>

                <div style={{ 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: '1px solid #e9ecef', 
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#666', marginBottom: '8px', fontSize: '14px' }}>
                    <Calendar size={20} />
                    <span style={{ fontWeight: '500' }}>Điểm danh</span>
                  </div>
                  <a href="#" style={{ 
                    color: '#17a2b8', 
                    fontWeight: '600', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    transition: 'color 0.3s' 
                  }}>
                    Nhận coin miễn phí
                    <ChevronDown size={16} style={{ transform: 'rotate(-90deg)' }} />
                  </a>
                </div>

                <div style={{ 
                  backgroundColor: 'linear-gradient(135deg, #fff9e6, #ffedcc)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  border: '2px solid #ffd700',
                  gridColumn: '1 / -1',
                  boxSizing: 'border-box'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#b8860b', marginBottom: '8px', fontSize: '14px' }}>
                    <Coins size={20} />
                    <span style={{ fontWeight: '500' }}>Số Coin dư</span>
                  </div>
                  <p style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: '#b8860b', 
                    margin: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <Coins size={28} style={{ color: '#ffd700' }} />
                    {profileData?.coin || 0} Coin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Favorite Quote */}
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '16px', 
            padding: '32px', 
            marginBottom: '32px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#333', 
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <div style={{ 
                width: '6px', 
                height: '32px', 
                background: 'linear-gradient(180deg, #17a2b8, #138496)', 
                borderRadius: '3px' 
              }}></div>
              Trích dẫn yêu thích
            </h2>
            <textarea
              value={favoriteQuote}
              onChange={(e) => setFavoriteQuote(e.target.value)}
              placeholder="Nhập trích dẫn yêu thích của bạn..."
              style={{
                width: '100%',
                height: '160px',
                padding: '16px',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '16px',
                backgroundColor: '#f8f9fa',
                color: '#333',
                resize: 'none',
                outline: 'none',
                transition: 'border-color 0.3s',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
            {bioMessage && (
              <div style={{
                marginTop: '12px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#f8d7da' : '#d4edda',
                color: bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#721c24' : '#155724',
                border: `1px solid ${bioMessage.includes('thất bại') || bioMessage.includes('lỗi') ? '#f5c6cb' : '#c3e6cb'}`
              }}>
                {bioMessage}
              </div>
            )}
            <button
              onClick={handleUpdateQuote}
              style={{
                marginTop: '16px',
                background: 'linear-gradient(135deg, #17a2b8, #138496)',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'box-shadow 0.3s',
                boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)'
              }}
            >
              <Save size={20} />
              Cập nhật
            </button>
          </div>

          {/* Display Name */}
          <div style={{ 
            backgroundColor: 'white',
            borderRadius: '16px', 
            padding: '32px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            boxSizing: 'border-box'
          }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: '#333',
              marginBottom: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px' 
            }}>
              <div style={{ 
                width: '6px', 
                height: '32px', 
                background: 'linear-gradient(180deg, #17a2b8, #138496)', 
                borderRadius: '3px' 
              }}></div>
              Tên hiển thị
            </h2>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                placeholder="Nhập tên hiển thị mới..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '16px',
                  backgroundColor: '#f8f9fa',
                  color: '#333',
                  outline: 'none',
                  transition: 'border-color 0.3s',
                  boxSizing: 'border-box'
                }}
              />
              <button
                onClick={handleChangeName}
                style={{
                  background: 'linear-gradient(135deg, #17a2b8, #138496)',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'box-shadow 0.3s',
                  boxShadow: '0 4px 12px rgba(23, 162, 184, 0.3)'
                }}
              >
                <Edit3 size={20} />
                Thay đổi
              </button>
              {nameMessage && (
                <div style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  backgroundColor: nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#f8d7da' : '#d4edda',
                  color: nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#721c24' : '#155724',
                  border: `1px solid ${nameMessage.includes('thất bại') || nameMessage.includes('lỗi') ? '#f5c6cb' : '#c3e6cb'}`
                }}>
                  {nameMessage}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
