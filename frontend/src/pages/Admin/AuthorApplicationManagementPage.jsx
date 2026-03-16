import React, { useState, useEffect } from 'react';
import authorApplicationAdminApi from '../../services/authorApplicationAdminApi';
import styles from './AuthorApplicationManagementPage.module.css';

const AuthorApplicationManagementPage = () => {
    const [applications, setApplications] = useState([]);
    const [selectedApplication, setSelectedApplication] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [rejectionReason, setRejectionReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingApplicationId, setRejectingApplicationId] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab, searchQuery]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            
            let applicationsData;
            if (searchQuery.trim()) {
                applicationsData = await authorApplicationAdminApi.searchApplications(searchQuery);
            } else if (activeTab === 'all') {
                applicationsData = await authorApplicationAdminApi.getAllApplications();
            } else {
                applicationsData = await authorApplicationAdminApi.getApplicationsByStatus(activeTab);
            }
            
            setApplications(applicationsData);
            
            // Fetch stats
            const statsData = await authorApplicationAdminApi.getApplicationStats();
            setStats(statsData);
        } catch (err) {
            setError(err.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleViewApplication = async (application) => {
        try {
            setSelectedApplication(application);
            const userDetailsData = await authorApplicationAdminApi.getUserDetails(application.id);
            setUserDetails(userDetailsData);
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

    const handleApproveApplication = async (applicationId) => {
        try {
            await authorApplicationAdminApi.approveApplication(applicationId);
            alert('Application approved successfully!');
            fetchData();
            closeDetailModal();
        } catch (err) {
            setError(err.message || 'Failed to approve application');
        }
    };

    const handleRejectApplication = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            await authorApplicationAdminApi.rejectApplication(rejectingApplicationId, rejectionReason);
            alert('Application rejected successfully!');
            setShowRejectModal(false);
            setRejectionReason('');
            setRejectingApplicationId(null);
            fetchData();
            closeDetailModal();
        } catch (err) {
            setError(err.message || 'Failed to reject application');
        }
    };

    const openRejectModal = (applicationId) => {
        setRejectingApplicationId(applicationId);
        setShowRejectModal(true);
    };

    const closeRejectModal = () => {
        setShowRejectModal(false);
        setRejectionReason('');
        setRejectingApplicationId(null);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDING': return '#ffc107';
            case 'APPROVED': return '#28a745';
            case 'REJECTED': return '#dc3545';
            default: return '#6c757d';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    const renderStatsCards = () => {
        const pending = stats.PENDING || 0;
        const approved = stats.APPROVED || 0;
        const rejected = stats.REJECTED || 0;
        
        return (
            <div className={styles['stats-grid']}>
                <div className={styles['stat-card']}>
                    <h3>Tổng số đơn</h3>
                    <p className={styles['stat-number']}>{pending + approved + rejected}</p>
                </div>
                <div className={`${styles['stat-card']} ${styles.pending}`}>
                    <h3>Chờ duyệt</h3>
                    <p className={styles['stat-number']}>{pending}</p>
                </div>
                <div className={`${styles['stat-card']} ${styles.approved}`}>
                    <h3>Đã duyệt</h3>
                    <p className={styles['stat-number']}>{approved}</p>
                </div>
                <div className={`${styles['stat-card']} ${styles.rejected}`}>
                    <h3>Bị từ chối</h3>
                    <p className={styles['stat-number']}>{rejected}</p>
                </div>
            </div>
        );
    };

    const renderApplicationsTable = () => {
        if (loading) return <div className={styles.loading}>Loading...</div>;
        if (error) return <div className={styles.error}>{error}</div>;
        if (applications.length === 0) return <div className={styles['no-data']}>No applications found</div>;

        return (
            <div className={styles['applications-table']}>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Bút danh</th>
                            <th>Username</th>
                            <th>Trạng thái</th>
                            <th>Ngày gửi</th>
                            <th>Ngày duyệt</th>
                            <th>Người duyệt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {applications.map(app => (
                            <tr key={app.id} onClick={() => handleViewApplication(app)}>
                                <td>{app.id}</td>
                                <td>{app.penName}</td>
                                <td>{app.username || '-'}</td>
                                <td>
                                    <span 
                                        className={styles['status-badge']} 
                                        style={{ backgroundColor: getStatusColor(app.status) }}
                                    >
                                        {app.status}
                                    </span>
                                </td>
                                <td>{formatDate(app.submittedAt)}</td>
                                <td>{app.reviewedAt ? formatDate(app.reviewedAt) : '-'}</td>
                                <td>{app.reviewerName || '-'}</td>
                                <td className={styles.actions}>
                                    {app.status === 'PENDING' && (
                                        <>
                                            <button 
                                                className={styles['btn-approve']}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleApproveApplication(app.id);
                                                }}
                                            >
                                                Duyệt
                                            </button>
                                            <button 
                                                className={styles['btn-reject']}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRejectModal(app.id);
                                                }}
                                            >
                                                Từ chối
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className={styles['author-application-management']}>
            <div className={styles['page-header']}>
                <h1>Quản lý đơn đăng ký tác giả</h1>
            </div>

            {renderStatsCards()}

            <div className={styles['search-section']}>
                <input
                    type="text"
                    placeholder="Tìm kiếm theo username hoặc bút danh..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles['search-input']}
                />
            </div>

            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Tất cả
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'PENDING' ? styles.active : ''}`}
                    onClick={() => setActiveTab('PENDING')}
                >
                    Chờ duyệt
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'APPROVED' ? styles.active : ''}`}
                    onClick={() => setActiveTab('APPROVED')}
                >
                    Đã duyệt
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'REJECTED' ? styles.active : ''}`}
                    onClick={() => setActiveTab('REJECTED')}
                >
                    Bị từ chối
                </button>
            </div>

            <div className={styles['content-area']}>
                <div className={styles['table-section']}>
                    {renderApplicationsTable()}
                </div>
            </div>

            {showDetailModal && selectedApplication && (
                <div className={styles['modal-overlay']}>
                    <div className={`${styles.modal} ${styles['detail-modal']}`}>
                        <div className={styles['details-header']}>
                            <h3>Chi tiết đơn đăng ký #{selectedApplication.id}</h3>
                            <button className={styles['btn-close']} onClick={closeDetailModal}>
                                ✕
                            </button>
                        </div>

                        <div className={styles['details-content']}>
                            <div className={styles.section}>
                                <h4>Thông tin tác giả</h4>
                                <div className={styles['info-grid']}>
                                    <div className={styles['info-item']}>
                                        <strong>Bút danh:</strong> {selectedApplication.penName}
                                    </div>
                                    <div className={styles['info-item']}>
                                        <strong>Tiểu sử:</strong> {selectedApplication.bio}
                                    </div>
                                    <div className={styles['info-item']}>
                                        <strong>Kinh nghiệm:</strong> {selectedApplication.experience || 'Không có'}
                                    </div>
                                    <div className={styles['info-item']}>
                                        <strong>Lý do:</strong> {selectedApplication.motivation}
                                    </div>
                                </div>
                            </div>

                            {userDetails && (
                                <>
                                    <div className={styles.section}>
                                        <h4>Thông tin người dùng</h4>
                                        <div className={styles['info-grid']}>
                                            <div className={styles['info-item']}>
                                                <strong>Username:</strong> {userDetails.username}
                                            </div>
                                            <div className={styles['info-item']}>
                                                <strong>Email:</strong> {userDetails.email}
                                            </div>
                                            <div className={styles['info-item']}>
                                                <strong>Display Name:</strong> {userDetails.displayName || '-'}
                                            </div>
                                            <div className={styles['info-item']}>
                                                <strong>Ngày tạo:</strong> {formatDate(userDetails.createdAt)}
                                            </div>
                                            <div className={styles['info-item']}>
                                                <strong>Verified:</strong> {userDetails.verified ? '✅' : '❌'}
                                            </div>
                                        </div>
                                    </div>

                                    {userDetails.activity && (
                                        <div className={styles.section}>
                                            <h4>Hoạt động của user</h4>
                                            <div className={styles['activity-grid']}>
                                                <div className={styles['activity-item']}>
                                                    <span className={styles['activity-label']}>Chapters đã đọc:</span>
                                                    <span className={styles['activity-value']}>{userDetails.activity.chaptersRead || 0}</span>
                                                </div>
                                                <div className={styles['activity-item']}>
                                                    <span className={styles['activity-label']}>Số bình luận:</span>
                                                    <span className={styles['activity-value']}>{userDetails.activity.commentsCount || 0}</span>
                                                </div>
                                                <div className={styles['activity-item']}>
                                                    <span className={styles['activity-label']}>Ngày tồn tại:</span>
                                                    <span className={styles['activity-value']}>{userDetails.activity.daysSinceCreation || 0} ngày</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className={styles.section}>
                                        <h4>Link xem profile user</h4>
                                        <div className={styles['profile-link']}>
                                            <a 
                                                href={`/user/${userDetails?.username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles['profile-link-button']}
                                            >
                                                👤 Xem trang cá nhân
                                            </a>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className={styles.section}>
                                <h4>Trạng thái</h4>
                                <div className={styles['status-info']}>
                                    <span 
                                        className={styles['status-badge']} 
                                        style={{ backgroundColor: getStatusColor(selectedApplication.status) }}
                                    >
                                        {selectedApplication.status}
                                    </span>
                                    <p><strong>Ngày gửi:</strong> {formatDate(selectedApplication.submittedAt)}</p>
                                    {selectedApplication.reviewedAt && (
                                        <p><strong>Ngày duyệt:</strong> {formatDate(selectedApplication.reviewedAt)}</p>
                                    )}
                                    {selectedApplication.reviewerName && (
                                        <p><strong>Người duyệt:</strong> {selectedApplication.reviewerName}</p>
                                    )}
                                    {selectedApplication.rejectionReason && (
                                        <div className={styles['rejection-reason']}>
                                            <strong>Lý do từ chối:</strong> {selectedApplication.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {selectedApplication.status === 'PENDING' && (
                                <div className={styles['actions-section']}>
                                    <button 
                                        className={styles['btn-approve-large']}
                                        onClick={() => handleApproveApplication(selectedApplication.id)}
                                    >
                                        ✅ Duyệt đơn
                                    </button>
                                    <button 
                                        className={styles['btn-reject-large']}
                                        onClick={() => openRejectModal(selectedApplication.id)}
                                    >
                                        ❌ Từ chối đơn
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showRejectModal && (
                <div className={styles['modal-overlay']}>
                    <div className={styles.modal}>
                        <h3>Từ chối đơn đăng ký</h3>
                        <textarea
                            placeholder="Nhập lý do từ chối..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            rows="4"
                        />
                        <div className={styles['modal-actions']}>
                            <button 
                                className={styles['btn-cancel']}
                                onClick={closeRejectModal}
                            >
                                Hủy
                            </button>
                            <button 
                                className={styles['btn-reject-confirm']}
                                onClick={handleRejectApplication}
                            >
                                Xác nhận từ chối
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuthorApplicationManagementPage;
