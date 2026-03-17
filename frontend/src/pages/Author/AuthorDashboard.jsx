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
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [canApply, setCanApply] = useState(false);
  const [daysUntilEligible, setDaysUntilEligible] = useState(0);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await api.get('/author-application/status');
        setUserRole(response.hasAuthorRole ? 'author' : 'reader');
        setCanApply(response.canApply);
        setDaysUntilEligible(response.daysUntilEligible || 0);
        if (response.applicationStatus) {
          setApplicationStatus({
            status: response.applicationStatus,
            submittedAt: response.submittedAt,
            rejectionReason: response.rejectionReason
          });
        }
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
    setApplicationStatus({ status: 'PENDING', submittedAt: new Date().toISOString() });
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
          
          {applicationStatus && (
            <div className={`application-status ${applicationStatus.status.toLowerCase()}`}>
              {applicationStatus.status === 'PENDING' ? (
                <>
                  <h3>⏳ Đơn đang chờ duyệt</h3>
                  <p>Đơn đăng ký của bạn đã được gửi vào ngày {new Date(applicationStatus.submittedAt).toLocaleDateString('vi-VN')} và đang chờ admin xét duyệt.</p>
                </>
              ) : applicationStatus.status === 'REJECTED' ? (
                <>
                  <h3>❌ Đơn bị từ chối</h3>
                  <p>Đơn đăng ký của bạn đã bị từ chối.</p>
                  {applicationStatus.rejectionReason && (
                    <div className='rejection-reason'>
                      <strong>Lý do:</strong> {applicationStatus.rejectionReason}
                    </div>
                  )}
                  <Button
                    onClick={() => {
                      setApplicationStatus(null);
                      setShowApplicationForm(true);
                    }}
                    className='retry-btn'
                  >
                    Gửi lại đơn
                  </Button>
                </>
              ) : null}
            </div>
          )}

          {!applicationStatus && !canApply && (
            <div className='eligibility-warning'>
              <h3>⏰ Chưa đủ điều kiện đăng ký</h3>
              <p>Bạn cần có tài khoản ít nhất 7 ngày để có thể đăng ký trở thành tác giả.</p>
              {daysUntilEligible > 0 && (
                <p>Vui lòng đợi thêm <strong>{daysUntilEligible} ngày</strong> nữa.</p>
              )}
            </div>
          )}

          {!applicationStatus && canApply && (
            <>
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
              </div>
              <Button
                onClick={() => setShowApplicationForm(true)}
                className='apply-btn'
              >
                Đăng ký trở thành tác giả
              </Button>
            </>
          )}
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
