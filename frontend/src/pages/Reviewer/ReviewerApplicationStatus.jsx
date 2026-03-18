import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, Send, RefreshCw } from 'lucide-react';
import reviewerApi from '../../services/reviewerApi';
import ReviewerApplicationForm from './ReviewerApplicationForm';
import '../../styles/reviewer-application.css';

function ReviewerApplicationStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔍 Checking eligibility...');
      const response = await reviewerApi.checkEligibility();
      console.log('🔍 Eligibility response:', response);
      setStatus(response);
    } catch (err) {
      console.error('🔍 Error checking eligibility:', err);
      setError(err.message || 'Không thể kiểm tra trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSuccess = () => {
    // Đợi một chút để backend xử lý, sau đó kiểm tra lại trạng thái
    setTimeout(() => {
      checkStatus();
    }, 500);
  };

  if (loading) {
    return (
      <div className="reviewer-status-container">
        <div className="loading-check">
          <div className="spinner"></div>
          <p>Đang kiểm tra trạng thái...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reviewer-status-container">
        <div className="alert alert-error">
          <AlertCircle size={16} />
          {error}
          <button className="btn-refresh" onClick={checkStatus}>
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (status.alreadyReviewer) {
    return (
      <div className="reviewer-status-container">
        <div className="status-card success">
          <div className="status-icon">
            <CheckCircle size={48} className="success" />
          </div>
          <h3>Bạn đã là Reviewer</h3>
          <p>Bạn đã có quyền truy cập khu vực reviewer. Hãy bắt đầu kiểm duyệt nội dung nhé!</p>
        </div>
      </div>
    );
  }

  if (status.hasPendingApplication) {
    return (
      <div className="reviewer-status-container">
        <div className="status-card pending">
          <div className="status-icon">
            <Clock size={48} className="warning" />
          </div>
          <h3>Đơn đang chờ duyệt</h3>
          <p>Đơn đăng ký reviewer của bạn đang được admin xem xét. Vui lòng chờ thông báo kết quả.</p>
          <div className="application-details">
            <p><strong>Ngày gửi:</strong> {new Date(status.applicationSubmittedAt).toLocaleDateString('vi-VN')}</p>
            <p><strong>Trạng thái:</strong> Đang chờ duyệt</p>
          </div>
        </div>
      </div>
    );
  }

  if (status.hasRejectedApplication) {
    return (
      <div className="reviewer-status-container">
        <div className="status-card rejected">
          <div className="status-icon">
            <AlertCircle size={48} className="error" />
          </div>
          <h3>Đơn đã bị từ chối</h3>
          <p>Đơn đăng ký reviewer của bạn đã bị từ chối.</p>
          {status.rejectionReason && (
            <div className="rejection-reason">
              <p><strong>Lý do:</strong> {status.rejectionReason}</p>
            </div>
          )}
          <button 
            className="btn-apply-again" 
            onClick={() => setShowApplicationForm(true)}
          >
            <Send size={16} />
            Gửi đơn lại
          </button>
        </div>
        
        {showApplicationForm && (
          <ReviewerApplicationForm
            onClose={() => setShowApplicationForm(false)}
            onSuccess={handleApplicationSuccess}
            isResubmission={true}
          />
        )}
      </div>
    );
  }

  if (!status.canApply) {
    return (
      <div className="reviewer-status-container">
        <div className="status-card not-eligible">
          <div className="status-icon">
            <Clock size={48} className="warning" />
          </div>
          <h3>Chưa đủ điều kiện đăng ký</h3>
          <p>Bạn cần có tài khoản ít nhất 7 ngày để có thể đăng ký trở thành reviewer.</p>
          <div className="days-remaining">
            <span className="days-count">{status.daysUntilEligible}</span>
            <span className="days-text">ngày nữa</span>
          </div>
          <div className="benefits-preview">
            <h4>Lợi ích khi trở thành Reviewer</h4>
            <ul>
              <li>Đóng góp cho cộng đồng</li>
              <li>Quyền kiểm duyệt nội dung</li>
              <li>Linh hoạt thời gian</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // User is eligible and can apply
  return (
    <div className="reviewer-status-container">
      <div className="status-card eligible">
        <div className="status-icon">
          <Shield size={48} className="primary" />
        </div>
        <h3>Bạn đủ điều kiện trở thành Reviewer!</h3>
        <p>Tài khoản của bạn đã đủ điều kiện để đăng ký trở thành reviewer.</p>
        
        <div className="benefits-section">
          <h4>Lợi ích khi trở thành Reviewer</h4>
          <div className="benefits-grid">
            <div className="benefit-item">
              <Shield size={24} className="benefit-icon" />
              <div>
                <h5>Đóng góp cho cộng đồng</h5>
                <p>Giúp duy trì chất lượng nội dung</p>
              </div>
            </div>
            <div className="benefit-item">
              <CheckCircle size={24} className="benefit-icon" />
              <div>
                <h5>Quyền kiểm duyệt</h5>
                <p>Truy cập khu vực reviewer</p>
              </div>
            </div>
            <div className="benefit-item">
              <Clock size={24} className="benefit-icon" />
              <div>
                <h5>Linh hoạt thời gian</h5>
                <p>Làm việc theo thời gian của bạn</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          className="btn-apply-now" 
          onClick={() => setShowApplicationForm(true)}
        >
          <Send size={16} />
          Đăng ký trở thành Reviewer
        </button>
      </div>

      {showApplicationForm && (
        <ReviewerApplicationForm
          onClose={() => setShowApplicationForm(false)}
          onSuccess={handleApplicationSuccess}
          isResubmission={status?.hasRejectedApplication || false}
        />
      )}
    </div>
  );
}

export default ReviewerApplicationStatus;
