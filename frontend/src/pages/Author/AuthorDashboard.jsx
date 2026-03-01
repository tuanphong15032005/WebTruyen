import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import AuthorApplicationForm from '../../components/AuthorApplicationForm';
import api from '../../services/api';
import '../../styles/AuthorDashboard.css';

const AuthorDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await api.get('/author-application/status');
        setUserRole(response.hasAuthorRole ? 'author' : 'reader');
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('reader'); // Default to reader if error
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  const handleApplicationSuccess = (response) => {
    setUserRole('author');
    setShowApplicationForm(false);
  };

  if (loading) {
    return (
      <div className='author-dashboard loading'>
        <div className='spinner'></div>
        <p>Đang kiểm tra thông tin...</p>
      </div>
    );
  }

  if (userRole === 'reader' && !showApplicationForm) {
    return (
      <div className='author-dashboard reader-view'>
        <div className='reader-content'>
          <h1>Trở thành tác giả</h1>
          <div className='reader-info'>
            <p>
              Bạn hiện đang có vai trò người đọc. Để truy cập vào trang quản lý
              của tác giả, bạn cần đăng ký trở thành tác giả.
            </p>
            <div className='benefits'>
              <h3>Quyền lợi khi trở thành tác giả:</h3>
              <ul>
                <li>Tạo và đăng tải truyện của riêng bạn</li>
                <li>Quản lý các chương và tập truyện</li>
                <li>Tương tác với độc giả qua bình luận</li>
                <li>Nhận donate từ độc giả</li>
                <li>Xây dựng thương hiệu cá nhân</li>
              </ul>
            </div>
            <Button
              onClick={() => setShowApplicationForm(true)}
              className='apply-btn'
            >
              Đăng ký trở thành tác giả
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (showApplicationForm) {
    return (
      <div className='author-dashboard application-view'>
        <AuthorApplicationForm
          onApplicationSuccess={handleApplicationSuccess}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button
            onClick={() => setShowApplicationForm(false)}
            style={{ backgroundColor: '#6c757d' }}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='author-dashboard'>
      <h1>Author Dashboard</h1>
      <div className='dashboard-buttons'>
        <Button onClick={() => navigate('/author/create-story')}>
          Tạo truyện mới hoàn toàn
        </Button>
        <Button onClick={() => navigate('/author/my-stories')}>
          Quản lý truyện đã đăng
        </Button>
      </div>
    </div>
  );
};

export default AuthorDashboard;
