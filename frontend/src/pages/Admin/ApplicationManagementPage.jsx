import React, { useState, useEffect } from 'react';
import { Shield, Edit3, CheckCircle, XCircle, Clock, AlertCircle, Eye, X, Send, Search } from 'lucide-react';
import applicationAdminApi from '../../services/applicationAdminApi';
import ConfirmActionModal from '../../components/ConfirmActionModal';
import '../../styles/application-management.css';

function ApplicationManagementPage() {
  const [activeTab, setActiveTab] = useState('author');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    application: null,
    reason: ''
  });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    application: null
  });

  useEffect(() => {
    loadApplications();
  }, [activeTab, statusFilter, searchQuery]);

  useEffect(() => {
    if (selectedApplication) {
      // Application selected - debugging removed
    }
  }, [selectedApplication]);

  const loadApplications = async () => {
    setLoading(true);
    setError('');
    try {
      let data;
      if (searchQuery.trim()) {
        data = await applicationAdminApi.searchApplications(searchQuery, activeTab);
        // Apply status filter on top of search results
        if (statusFilter !== 'all') {
          data = (Array.isArray(data) ? data : []).filter(
            (application) => application?.status === statusFilter
          );
        }
      } else if (activeTab === 'author') {
        data = await applicationAdminApi.getAuthorApplications(
          statusFilter === 'all' ? null : statusFilter
        );
      } else {
        data = await applicationAdminApi.getReviewerApplications(
          statusFilter === 'all' ? null : statusFilter
        );
      }
      
      setApplications(data || []);
      
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách đơn');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplication = async (application) => {
    try {
      // Set initial data immediately
      setSelectedApplication(application);
      
      // Get user details
      const userDetailsData = await applicationAdminApi.getUserDetails(application.id, activeTab);
      setUserDetails(userDetailsData);
      
      // Try to get original data as well
      try {
        const allUserData = await applicationAdminApi.getAllUserData(application.userId, activeTab);
        
        if (activeTab === 'author' && allUserData.authorApplicationData) {
          // Update with ORIGINAL data from database for author applications
          const updatedData = {
            ...application,
            penName: allUserData.authorApplicationData.authorPenName || application.penName,
            bio: allUserData.authorApplicationData.authorBio || application.bio,
            experience: allUserData.authorApplicationData.authorExperience || application.experience,
            motivation: allUserData.authorApplicationData.authorMotivation || application.motivation
          };
          
          setSelectedApplication(updatedData);
        } else if (activeTab === 'reviewer' && allUserData.reviewerApplicationData) {
          // Update with ORIGINAL data from database for reviewer applications
          const updatedData = {
            ...application,
            experience: allUserData.reviewerApplicationData.reviewerExperience || application.experience,
            motivation: allUserData.reviewerApplicationData.reviewerMotivation || application.motivation,
            availability: allUserData.reviewerApplicationData.reviewerAvailability || application.availability,
            skills: allUserData.reviewerApplicationData.reviewerSkills || application.skills
          };
          
          setSelectedApplication(updatedData);
        }
      } catch (err) {
        // Error fetching original data - continue with initial data
      }
      
      setShowDetailModal(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch application details');
    }
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedApplication(null);
    setUserDetails(null);
  };

  const handleApprove = async (application) => {
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận duyệt đơn ${activeTab === 'author' ? 'tác giả' : 'reviewer'}`,
      message: `Bạn có chắc chắn muốn duyệt đơn ${activeTab === 'author' ? 'tác giả' : 'reviewer'} này?`,
      confirmText: 'Duyệt',
      onConfirm: () => approveApplication(application),
      application
    });
  };

  const approveApplication = async (application) => {
    try {
      if (activeTab === 'author') {
        await applicationAdminApi.approveAuthorApplication(application.userId);
      } else {
        await applicationAdminApi.approveReviewerApplication(application.userId);
      }
      
      await loadApplications();
      closeDetailModal();
      setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, application: null });
    } catch (err) {
      setError(err.message || 'Duyệt đơn thất bại');
    }
  };

  const handleReject = (application) => {
    setRejectionModal({
      open: true,
      application,
      reason: ''
    });
  };

  const handleRejectSubmit = async () => {
    if (!rejectionModal.reason.trim()) {
      setError('Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      if (activeTab === 'author') {
        await applicationAdminApi.rejectAuthorApplication(
          rejectionModal.application.userId,
          rejectionModal.reason
        );
      } else {
        await applicationAdminApi.rejectReviewerApplication(
          rejectionModal.application.userId,
          rejectionModal.reason
        );
      }
      
      await loadApplications();
      setRejectionModal({ open: false, application: null, reason: '' });
      closeDetailModal();
    } catch (err) {
      setError(err.message || 'Từ chối đơn thất bại');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'APPROVED': return 'approved';
      case 'REJECTED': return 'rejected';
      default: return '';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'APPROVED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  return (
    <div className="application-management">
      <div className="application-management__header">
        <h1>Quản lý Đơn đăng ký</h1>
        <div className="application-management__tabs">
          <button
            className={`tab ${activeTab === 'author' ? 'active' : ''}`}
            onClick={() => setActiveTab('author')}
          >
            <Edit3 size={16} />
            Đơn tác giả
          </button>
          <button
            className={`tab ${activeTab === 'reviewer' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviewer')}
          >
            <Shield size={16} />
            Đơn reviewer
          </button>
        </div>
      </div>


      <div className="application-management__controls">
        <div className="search-section">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo username hoặc bút danh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <div className="status-filters">
          <button
            className={`status-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tất cả
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Chờ duyệt
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'APPROVED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('APPROVED')}
          >
            Đã duyệt
          </button>
          <button
            className={`status-filter-btn ${statusFilter === 'REJECTED' ? 'active' : ''}`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Từ chối
          </button>
        </div>
        <button className="refresh-btn" onClick={loadApplications} disabled={loading}>
          Tải lại
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          {error}
          <button className="close-alert" onClick={() => setError('')}>
            <X size={16} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải danh sách đơn...</p>
        </div>
      ) : (
        <div className="application-management__table">
          <table>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Loại đơn</th>
                <th>Ngày gửi</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-state">
                    Không có đơn nào ở trạng thái này
                  </td>
                </tr>
              ) : (
                applications.map((application) => (
                  <tr key={`${activeTab}-${application.userId}`}>
                    <td>
                      <div className="user-info">
                        <strong>{application.username}</strong>
                      </div>
                    </td>
                    <td>{application.email}</td>
                    <td>
                      <span className="application-type">
                        {activeTab === 'author' ? (
                          <>
                            <Edit3 size={14} />
                            Tác giả
                          </>
                        ) : (
                          <>
                            <Shield size={14} />
                            Reviewer
                          </>
                        )}
                      </span>
                    </td>
                    <td>{formatDate(application.submittedAt)}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {getStatusText(application.status)}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="view-btn"
                          onClick={() => {
                            handleViewApplication(application);
                          }}
                        >
                          <Eye size={14} />
                          Xem chi tiết
                        </button>
                        {application.status === 'PENDING' && (
                          <>
                            <button
                              className="approve-btn"
                              onClick={() => handleApprove(application)}
                            >
                              <CheckCircle size={14} />
                              Duyệt
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => handleReject(application)}
                            >
                              <XCircle size={14} />
                              Từ chối
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Detail Modal */}
      {showDetailModal && selectedApplication && (
        <div className="modal-backdrop" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết đơn đăng ký {activeTab === 'author' ? 'tác giả' : 'reviewer'} #{selectedApplication.id}</h2>
              <button className="close-btn" onClick={closeDetailModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Application Form Data Section */}
              <div className="application-form-section">
                <h3>📝 Thông tin đơn đăng ký {activeTab === 'author' ? 'tác giả' : 'reviewer'} (Dữ liệu gốc từ form)</h3>
                <div className="detail-grid">
                  {activeTab === 'author' && selectedApplication.penName && (
                    <div className="detail-item">
                      <strong>Bút danh:</strong> 
                      <div style={{
                        padding: '15px', 
                        borderRadius: '5px', 
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        lineHeight: '1.5',
                        minHeight: '60px'
                      }}>
                        <span style={{ color: 'var(--theme-text-primary)', fontWeight: 'bold' }}>
                          {selectedApplication.penName || '-'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'author' && selectedApplication.bio && (
                    <div className="detail-item full-width">
                      <strong>Tiểu sử:</strong> 
                      <div className="bio-content" style={{
                        padding: '15px', 
                        borderRadius: '5px', 
                        border: 'none',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        lineHeight: '1.5',
                        minHeight: '60px'
                      }}>
                        {selectedApplication.bio && selectedApplication.bio.trim() !== '' ? 
                          selectedApplication.bio : 
                          <span style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic' }}>Không có tiểu sử</span>
                        }
                      </div>
                    </div>
                  )}
                  
                  {activeTab === 'author' && (
                    <>
                      <div className="detail-item full-width" style={{padding: '10px', borderRadius: '5px'}}>
                        <strong style={{ color: 'var(--theme-text-primary)', fontSize: '16px' }}>Kinh nghiệm viết:</strong>
                        <div style={{marginTop: '10px'}}>
                          {selectedApplication.experience ? (
                            <div className="bio-content" style={{
                              padding: '15px', 
                              borderRadius: '5px', 
                              border: 'none',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              lineHeight: '1.5',
                              minHeight: '60px'
                            }}>
                              {selectedApplication.experience}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic', padding: '15px', borderRadius: '5px', fontWeight: 'bold' }}>
                              Không có kinh nghiệm
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="detail-item full-width" style={{padding: '10px', borderRadius: '5px'}}>
                        <strong style={{ color: 'var(--theme-text-primary)', fontSize: '16px' }}>Lý do muốn trở thành tác giả:</strong>
                        <div style={{marginTop: '10px'}}>
                          {selectedApplication.motivation ? (
                            <div className="bio-content" style={{
                              padding: '15px', 
                              borderRadius: '5px', 
                              border: 'none',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              lineHeight: '1.5',
                              minHeight: '60px'
                            }}>
                              {selectedApplication.motivation}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--theme-text-secondary)', fontStyle: 'italic', padding: '15px', borderRadius: '5px', fontWeight: 'bold' }}>
                              Không có lý do
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  
                  {activeTab === 'reviewer' && (
                    <>
                      <div className="detail-item full-width">
                        <label>Kinh nghiệm đọc truyện:</label>
                        <p>{selectedApplication.experience || 'Không có'}</p>
                      </div>
                      
                      <div className="detail-item full-width">
                        <label>Lý do muốn trở thành reviewer:</label>
                        <p>{selectedApplication.motivation || 'Không có'}</p>
                      </div>
                      
                      <div className="detail-item full-width">
                        <label>Thời gian có thể hoạt động:</label>
                        <p>{selectedApplication.availability || 'Không có'}</p>
                      </div>
                      
                      <div className="detail-item full-width">
                        <label>Kỹ năng liên quan:</label>
                        <p>{selectedApplication.skills || 'Không có'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* User Information Section */}
              {userDetails && (
                <>
                  <div className="user-info-section">
                    <h3>👤 Thông tin người dùng</h3>
                    <div className="detail-grid">
                      <div className="detail-item">
                        <label>Username:</label> {userDetails.username}
                      </div>
                      <div className="detail-item">
                        <label>Email:</label> {userDetails.email || 'Không có email'}
                      </div>
                      <div className="detail-item">
                        <label>Display Name:</label> {userDetails.displayName || '-'}
                      </div>
                      <div className="detail-item">
                        <label>Ngày tạo:</label> {formatDate(userDetails.createdAt)}
                      </div>
                    </div>
                  </div>

                  {userDetails.activity && (
                    <div className="user-info-section">
                      <h3>Hoạt động của user</h3>
                      <div className="activity-grid">
                        <div className="activity-item">
                          <span className="activity-label">Chapters đã đọc:</span>
                          <span className="activity-value">{userDetails.activity.chaptersRead || 0}</span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-label">Số bình luận:</span>
                          <span className="activity-value">{userDetails.activity.commentsCount || 0}</span>
                        </div>
                        <div className="activity-item">
                          <span className="activity-label">Ngày tồn tại:</span>
                          <span className="activity-value">{userDetails.activity.daysSinceCreation || 0} ngày</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="user-info-section">
                    <h3>Link xem portfolio user</h3>
                    <div className="profile-link">
                      <a 
                        href={`/portfolio/username/${userDetails?.username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="profile-link-button"
                      >
                        👤 Xem trang cá nhân
                      </a>
                    </div>
                  </div>
                </>
              )}

              <div className="user-info-section">
                <h3>Trạng thái</h3>
                <div className="status-info">
                  <span 
                    className={`status-badge ${getStatusColor(selectedApplication.status)}`}
                  >
                    {getStatusIcon(selectedApplication.status)}
                    {getStatusText(selectedApplication.status)}
                  </span>
                  <p><strong>Ngày gửi:</strong> {formatDate(selectedApplication.submittedAt)}</p>
                  {selectedApplication.reviewedAt && (
                    <p><strong>Ngày duyệt:</strong> {formatDate(selectedApplication.reviewedAt)}</p>
                  )}
                  {selectedApplication.reviewerName && (
                    <p><strong>Người duyệt:</strong> {selectedApplication.reviewerName}</p>
                  )}
                  {selectedApplication.rejectionReason && (
                    <div className="rejection-reason">
                      <strong>Lý do từ chối:</strong> {selectedApplication.rejectionReason}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              {selectedApplication.status === 'PENDING' && (
                <>
                  <button
                    className="approve-btn"
                    onClick={() => handleApprove(selectedApplication)}
                  >
                    <CheckCircle size={16} />
                    Duyệt đơn
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleReject(selectedApplication)}
                  >
                    <XCircle size={16} />
                    Từ chối đơn
                  </button>
                </>
              )}
              <button className="cancel-btn" onClick={closeDetailModal}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="modal-backdrop" onClick={() => setRejectionModal({ open: false, application: null, reason: '' })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Từ chối đơn đăng ký {activeTab === 'author' ? 'tác giả' : 'reviewer'}</h2>
              <button className="close-btn" onClick={() => setRejectionModal({ open: false, application: null, reason: '' })}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Lý do từ chối *</label>
                <textarea
                  value={rejectionModal.reason}
                  onChange={(e) => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do từ chối đơn đăng ký này..."
                  rows={4}
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setRejectionModal({ open: false, application: null, reason: '' })}
              >
                Hủy
              </button>
              <button
                className="reject-btn"
                onClick={handleRejectSubmit}
                disabled={!rejectionModal.reason.trim()}
              >
                <Send size={16} />
                Gửi từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmModal.isOpen && (
        <ConfirmActionModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText || 'Duyệt'}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null, application: null })}
          onConfirm={confirmModal.onConfirm}
        />
      )}
    </div>
  );
}

export default ApplicationManagementPage;
