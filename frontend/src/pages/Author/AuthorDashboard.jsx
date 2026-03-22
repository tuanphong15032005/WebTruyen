import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../../components/dashboard/TopBar';
import StatsGrid from '../../components/dashboard/StatsGrid';
import MyStories from '../../components/dashboard/MyStories';
import LatestCommentsSidebar from '../../components/dashboard/LatestCommentsSidebar';
import { fetchDashboardData } from '../../services/dashboardService';
import Button from '../../components/Button';
import AuthorApplicationForm from '../../components/AuthorApplicationForm';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import './AuthorDashboard.css';

/**
 * AuthorDashboard component
 * Main author dashboard page with modern layout
 * Displays statistics, stories, and comments for logged-in authors
 */
const AuthorDashboard = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const [applicationStatus, setApplicationStatus] = useState(null);
  const [canApply, setCanApply] = useState(false);
  const [daysUntilEligible, setDaysUntilEligible] = useState(0);

  const [reviewerApplicationStatus, setReviewerApplicationStatus] = useState(null);

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [error, setError] = useState(null);


  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const response = await api.get('/author-application/all-statuses');
        
        // Author application data
        const authorApp = response.authorApplication;
        setUserRole(authorApp.hasRole ? 'author' : 'reader');
        setCanApply(authorApp.canApply);
        setDaysUntilEligible(authorApp.daysUntilEligible || 0);
        
        if (authorApp.status) {
          setApplicationStatus({
            status: authorApp.status,
            submittedAt: authorApp.submittedAt,
            rejectionReason: authorApp.rejectionReason
          });
        }
        
        // Reviewer application data
        setReviewerApplicationStatus(response.reviewerApplication);
        
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('reader'); // Default to reader if error
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, []);

  useEffect(() => {
    if (userRole === 'author') {
      loadDashboardData();
    }
  }, [userRole]);

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    setError(null);
    
    try {
      const data = await fetchDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleApplicationSuccess = (response) => {
    setApplicationStatus({ status: 'PENDING', submittedAt: new Date().toISOString() });
    setShowApplicationForm(false);
  };

  if (loading) {
    return (
      <div className='dashboard-author dashboard-loading'>
        <div className='dashboard-spinner'></div>
        <p>Đang kiểm tra thông tin...</p>
      </div>
    );
  }

  if (userRole === 'reader' && !showApplicationForm) {
    return (
      <div className='dashboard-author dashboard-reader-view'>
        <div className='dashboard-reader-content'>
          {applicationStatus && (
            <div className="status-container">
              <div className={`status-card ${applicationStatus.status.toLowerCase()}`}>
                <div className="status-icon">
                  {applicationStatus.status === 'PENDING' && <Clock size={48} className="warning" />}
                  {applicationStatus.status === 'REJECTED' && <AlertCircle size={48} className="error" />}
                </div>
                <h3>📝 Đơn đăng ký Tác giả</h3>
                {applicationStatus.status === 'PENDING' ? (
                  <>
                    <h3>Đơn đang chờ duyệt</h3>
                    <p>Đơn đăng ký tác giả của bạn đang được admin xem xét. Vui lòng chờ thông báo kết quả.</p>
                    <div className="application-details">
                      <p><strong>Ngày gửi:</strong> {new Date(applicationStatus.submittedAt).toLocaleDateString('vi-VN')}</p>
                      <p><strong>Trạng thái:</strong> Đang chờ duyệt</p>
                    </div>
                  </>
                ) : applicationStatus.status === 'REJECTED' ? (
                  <>
                    <h3>Đơn bị từ chối</h3>
                    <p>Đơn đăng ký tác giả của bạn đã bị từ chối.</p>
                    {applicationStatus.rejectionReason && (
                      <div className="rejection-reason">
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-4">
                  Trở thành tác giả
                </h1>
                <p className="text-gray-600 text-base leading-relaxed mb-8">
                  Bạn hiện đang có vai trò người đọc. Để truy cập vào trang quản lý của tác giả, 
                  bạn cần đăng ký để bắt đầu hành trình sáng tạo của mình.
                </p>
                
                <h2 className="text-gray-500 text-sm font-medium uppercase tracking-wider text-center mb-8">
                  QUYỀN LỢI KHI TRỞ THÀNH TÁC GIẢ
                </h2>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
                  <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                        <span className='text-xl'>✏️</span>
                      </div>
                      <div>
                        <h4 className='text-gray-900 font-medium'>Tạo và đăng tải truyện riêng</h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                        <span className='text-xl'>📚</span>
                      </div>
                      <div>
                        <h4 className='text-gray-900 font-medium'>Quản lý chương và tập truyện</h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                        <span className='text-xl'>💬</span>
                      </div>
                      <div>
                        <h4 className='text-gray-900 font-medium'>Tương tác trực tiếp với độc giả</h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className='bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300'>
                    <div className='flex items-center gap-4'>
                      <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0'>
                        <span className='text-xl'>💰</span>
                      </div>
                      <div>
                        <h4 className='text-gray-900 font-medium'>Nhận donate từ độc giả</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowApplicationForm(true)}
                className='w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-lg'
              >
                Đăng ký trở thành tác giả
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (showApplicationForm) {
    return (
      <div className='dashboard-author dashboard-application-view'>
        <AuthorApplicationForm
          onApplicationSuccess={handleApplicationSuccess}
        />
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Button
            onClick={() => setShowApplicationForm(false)}
            style={{
              backgroundColor: 'var(--theme-text-muted)',
              color: 'var(--theme-text-inverse)',
            }}
          >
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (userRole === 'author') {
    return (
      <div className='dashboard-author'>
        <div className='dashboard-content-wrapper'>
          <TopBar />
          
          <div className='dashboard-content-area'>
            <div className='dashboard-page-header'>
              <h1 className='dashboard-page-title'>Trang cá nhân Tác giả</h1>
            </div>
            
            {error && (
              <div className='dashboard-error-message'>
                {error}
                <button onClick={loadDashboardData} className='dashboard-retry-btn'>
                  Thử lại
                </button>
              </div>
            )}
            
            {dashboardLoading ? (
              <div className="stats-grid loading">
                <div className="loading-skeleton"></div>
                <div className="loading-skeleton"></div>
                <div className="loading-skeleton"></div>
              </div>
            ) : (
              <StatsGrid summary={dashboardData?.summary} />
            )}
            
            <div className='dashboard-main-layout'>
              {/* Cột trái - Truyện của tôi (75%) */}
              <div className='dashboard-main-column'>
                <MyStories stories={dashboardData?.stories} />
              </div>
              
              {/* Cột phải - Sidebar (25%) */}
              <div className='dashboard-sidebar-column'>
                <LatestCommentsSidebar comments={dashboardData?.comments} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthorDashboard;
