import React, { useState, useEffect } from 'react';
import { Shield, Clock, CheckCircle, AlertCircle, Send, X } from 'lucide-react';
import reviewerApi from '../../services/reviewerApi';
import '../../styles/reviewer-application.css';

function ReviewerApplicationForm({ onClose, onSuccess, isResubmission = false }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    experience: '',
    motivation: '',
    availability: '',
    skills: '',
  });

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      const response = await reviewerApi.checkEligibility();
      setUserData(response);
    } catch (err) {
      setError(err.message || 'Không thể kiểm tra điều kiện đăng ký');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await reviewerApi.submitApplication(formData);
      setSuccess(isResubmission 
        ? 'Đơn đăng ký reviewer đã được gửi lại thành công! Vui lòng chờ admin xét duyệt.'
        : 'Đơn đăng ký reviewer đã được gửi thành công! Vui lòng chờ admin xét duyệt.'
      );
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Gửi đơn đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) {
    return (
      <div className="reviewer-application-modal">
        <div className="reviewer-application-content">
          <div className="reviewer-application-header">
            <h2>Đăng ký trở thành Reviewer</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="reviewer-application-body">
            <div className="loading-check">
              <div className="spinner"></div>
              <p>Đang kiểm tra điều kiện đăng ký...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userData.canApply) {
    return (
      <div className="reviewer-application-modal">
        <div className="reviewer-application-content">
          <div className="reviewer-application-header">
            <h2>Đăng ký trở thành Reviewer</h2>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="reviewer-application-body">
            <div className="eligibility-check">
              <div className="eligibility-icon">
                <Clock size={48} className="warning" />
              </div>
              <h3>Chưa đủ điều kiện đăng ký</h3>
              <p>Bạn cần có tài khoản ít nhất 7 ngày để có thể đăng ký trở thành reviewer.</p>
              <div className="days-remaining">
                <span className="days-count">{userData.daysUntilEligible}</span>
                <span className="days-text">ngày nữa</span>
              </div>
              <p className="come-back">Hãy quay lại sau khi đủ điều kiện nhé!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reviewer-application-modal">
      <div className="reviewer-application-content">
        <div className="reviewer-application-header">
          <h2>{isResubmission ? 'Gửi lại đơn đăng ký Reviewer' : 'Đăng ký trở thành Reviewer'}</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="reviewer-application-body">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="application-form">
            <div className="form-group">
              <label htmlFor="experience">Kinh nghiệm đọc truyện *</label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                required
                placeholder="Hãy chia sẻ về kinh nghiệm đọc truyện của bạn (ví dụ: thể loại yêu thích, số năm đọc truyện, các nền tảng đã tham gia...)"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="motivation">Lý do muốn trở thành reviewer *</label>
              <textarea
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                required
                placeholder="Tại sao bạn muốn trở thành reviewer? Bạn mong muốn đóng góp gì cho cộng đồng?"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label htmlFor="availability">Thời gian có thể hoạt động *</label>
              <textarea
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleInputChange}
                required
                placeholder="Bạn có thể dành bao nhiêu thời gian mỗi tuần cho việc kiểm duyệt? (ví dụ: 2-3 tiếng/ngày, cuối tuần...)"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="skills">Kỹ năng liên quan</label>
              <textarea
                id="skills"
                name="skills"
                value={formData.skills}
                onChange={handleInputChange}
                placeholder="Các kỹ năng khác có thể hữu ích cho vai trò reviewer (ví dụ: hiểu biết về thể loại văn học, kỹ năng đánh giá nội dung...)"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Hủy
              </button>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Gửi đơn đăng ký
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReviewerApplicationForm;
