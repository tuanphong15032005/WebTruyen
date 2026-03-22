import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AuthorApplicationForm = ({ onApplicationSuccess }) => {
    const [formData, setFormData] = useState({
        penName: '',
        bio: '',
        experience: '',
        motivation: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [canApply, setCanApply] = useState(false);
    const [daysUntilEligible, setDaysUntilEligible] = useState(0);
    const [hasAuthorRole, setHasAuthorRole] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [isCheckingPenName, setIsCheckingPenName] = useState(false);
    const [penNameValidated, setPenNameValidated] = useState(false);

    useEffect(() => {
        checkApplicationStatus();
    }, []);

    const checkApplicationStatus = async () => {
        try {
            setIsLoadingStatus(true);
            const response = await api.get('/author-application/status');
            setHasAuthorRole(response.hasAuthorRole);
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
            console.error('Error checking application status:', error);
        } finally {
            setIsLoadingStatus(false);
        }
    };

    const checkPenNameAvailability = async (penName) => {
        if (!penName || penName.trim().length < 2) {
            return;
        }

        // Check validation first before API call
        const words = penName.trim().split(/\s+/);
        const invalidWords = words.filter(word => word.length > 7);
        
        if (invalidWords.length > 0) {
            return; // Don't check availability if validation fails
        }

        setIsCheckingPenName(true);
        try {
            const response = await api.get(`/author-application/check-pen-name?penName=${encodeURIComponent(penName.trim())}`);
            if (!response.available) {
                setErrors(prev => ({
                    ...prev,
                    penName: 'Bút danh này đã tồn tại, vui lòng chọn bút danh khác'
                }));
                setPenNameValidated(false);
            } else {
                setErrors(prev => ({
                    ...prev,
                    penName: ''
                }));
                setPenNameValidated(true);
            }
        } catch (error) {
            console.error('Error checking pen name:', error);
        } finally {
            setIsCheckingPenName(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        // Validate pen name with word length limit
        if (!formData.penName.trim()) {
            newErrors.penName = 'Vui lòng nhập bút danh';
            isValid = false;
        } else {
            // Check each word doesn't exceed 7 characters
            const words = formData.penName.trim().split(/\s+/);
            const invalidWords = words.filter(word => word.length > 7);
            
            if (invalidWords.length > 0) {
                newErrors.penName = `Mỗi từ trong bút danh không được quá 7 ký tự. Các từ quá dài: ${invalidWords.join(', ')}`;
                isValid = false;
            } else if (formData.penName.length < 2) {
                newErrors.penName = 'Bút danh phải có ít nhất 2 ký tự';
                isValid = false;
            } else if (!penNameValidated && formData.penName.trim().length >= 2) {
                newErrors.penName = 'Vui lòng kiểm tra tính khả dụng của bút danh';
                isValid = false;
            }
        }

        // Validate bio with character limit
        if (!formData.bio.trim()) {
            newErrors.bio = 'Vui lòng nhập tiểu sử';
            isValid = false;
        } else if (formData.bio.length < 10) {
            newErrors.bio = 'Tiểu sử phải có ít nhất 10 ký tự';
            isValid = false;
        } else if (formData.bio.length > 2000) {
            newErrors.bio = 'Tiểu sử không được quá 2000 ký tự';
            isValid = false;
        }

        // Validate experience with character limit
        if (formData.experience.length > 1000) {
            newErrors.experience = 'Kinh nghiệm không được quá 1000 ký tự';
            isValid = false;
        }

        // Validate motivation with character limit
        if (!formData.motivation.trim()) {
            newErrors.motivation = 'Vui lòng nhập lý do muốn trở thành tác giả';
            isValid = false;
        } else if (formData.motivation.length < 20) {
            newErrors.motivation = 'Lý do phải có ít nhất 20 ký tự';
            isValid = false;
        } else if (formData.motivation.length > 1000) {
            newErrors.motivation = 'Lý do không được quá 1000 ký tự';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }

        // Check pen name availability when user types pen name
        if (name === 'penName') {
            setPenNameValidated(false); // Reset validation when user types
            
            // Real-time validation for word length
            if (value.trim()) {
                const words = value.trim().split(/\s+/);
                const invalidWords = words.filter(word => word.length > 8);
                
                if (invalidWords.length > 0) {
                    setErrors(prev => ({
                        ...prev,
                        penName: `Mỗi từ trong bút danh không được quá 8 ký tự. Các từ quá dài: ${invalidWords.join(', ')}`
                    }));
                    return; // Don't check availability if validation fails
                }
            }
            
            // Debounce the check to avoid too many API calls
            const timeoutId = setTimeout(() => {
                checkPenNameAvailability(value);
            }, 500);
            
            // Clear previous timeout
            if (window.penNameCheckTimeout) {
                clearTimeout(window.penNameCheckTimeout);
            }
            window.penNameCheckTimeout = timeoutId;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const response = await api.post('/author-application/apply', formData);
            setMessage(response.message || 'Đơn đăng ký đã được gửi thành công!');
            
            // Call the success callback if provided
            if (onApplicationSuccess) {
                onApplicationSuccess(response);
            }
            
            // Reset form
            setFormData({
                penName: '',
                bio: '',
                experience: '',
                motivation: ''
            });
            
            // Refresh status
            checkApplicationStatus();
            
        } catch (error) {
            setMessage(error.message || 'Có lỗi xảy ra khi gửi đơn đăng ký');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="author-application-form">
            <div className="form-header">
                <h2>Đăng ký trở thành tác giả</h2>
                <p>Điền thông tin dưới đây để đăng ký trở thành tác giả và bắt đầu sáng tác truyện của bạn</p>
            </div>

            {isLoadingStatus ? (
                <div className="loading-status">
                    <p>Đang kiểm tra trạng thái...</p>
                </div>
            ) : (
                <>
                    {hasAuthorRole ? (
                        <div className="status-message success">
                            <h3>🎉 Bạn đã là tác giả!</h3>
                            <p>Bạn đã có quyền tác giả và có thể bắt đầu đăng truyện của mình.</p>
                        </div>
                    ) : applicationStatus && applicationStatus.status === 'PENDING' ? (
                        <div className="status-message pending">
                            <h3>⏳ Đơn đang chờ duyệt</h3>
                            <p>Đơn đăng ký của bạn đã được gửi vào ngày {new Date(applicationStatus.submittedAt).toLocaleDateString('vi-VN')} và đang chờ admin xét duyệt.</p>
                        </div>
                    ) : !canApply ? (
                        <div className="status-message warning">
                            <h3>⏰ Chưa đủ điều kiện đăng ký</h3>
                            <p>Bạn cần có tài khoản ít nhất 7 ngày để có thể đăng ký trở thành tác giả.</p>
                            {daysUntilEligible > 0 && (
                                <p>Vui lòng đợi thêm <strong>{daysUntilEligible} ngày</strong> nữa.</p>
                            )}
                        </div>
                    ) : null}

                    {message && (
                        <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
                            {message}
                        </div>
                    )}

                    {canApply && !hasAuthorRole && (!applicationStatus || applicationStatus.status === 'REJECTED') && (
                        <>
                            {applicationStatus && applicationStatus.status === 'REJECTED' && (
                                <div className="status-message rejected">
                                    <h3>❌ Đơn bị từ chối</h3>
                                    <p>Đơn đăng ký của bạn đã bị từ chối.</p>
                                    {applicationStatus.rejectionReason && (
                                        <div className="rejection-reason">
                                            <strong>Lý do:</strong> {applicationStatus.rejectionReason}
                                        </div>
                                    )}
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="application-form">
                <div className="form-group">
                    <label htmlFor="penName">Bút danh *</label>
                    <div className="input-with-indicator">
                        <input
                            type="text"
                            id="penName"
                            name="penName"
                            value={formData.penName}
                            onChange={handleInputChange}
                            className={`${
                                errors.penName ? 'error' : 
                                penNameValidated ? 'success' : ''
                            }`}
                            placeholder="Nhập bút danh của bạn (tối đa 7 ký tự mỗi từ)"
                            disabled={isLoading}
                            maxLength={200}
                        />
                        {isCheckingPenName && (
                            <span className="checking-indicator">⏳</span>
                        )}
                        {penNameValidated && !errors.penName && (
                            <span className="valid-indicator">✓</span>
                        )}
                    </div>
                    {errors.penName && <span className="error-message">{errors.penName}</span>}
                </div>

                    <div className="form-group">
                        <label htmlFor="bio">
                            Tiểu sử * 
                            <span className={`char-count ${
                                formData.bio.length > 1800 ? 'danger' : 
                                formData.bio.length > 1500 ? 'warning' : ''
                            }`}>
                                ({formData.bio.length}/2000)
                            </span>
                        </label>
                        <textarea
                            id="bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            className={errors.bio ? 'error' : ''}
                            placeholder="Giới thiệu ngắn gọn về bản thân bạn"
                            rows="3"
                            disabled={isLoading}
                            maxLength={2000}
                        />
                        {errors.bio && <span className="error-message">{errors.bio}</span>}
                    </div>

                <div className="form-group">
                    <label htmlFor="experience">
                        Kinh nghiệm viết lách
                        <span className={`char-count ${
                            formData.experience.length > 900 ? 'danger' : 
                            formData.experience.length > 750 ? 'warning' : ''
                        }`}>
                            ({formData.experience.length}/1000)
                        </span>
                    </label>
                    <textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="Kinh nghiệm viết lách của bạn (nếu có)"
                        rows="3"
                        disabled={isLoading}
                        maxLength={1000}
                    />
                    {errors.experience && <span className="error-message">{errors.experience}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="motivation">
                        Lý do muốn trở thành tác giả *
                        <span className={`char-count ${
                            formData.motivation.length > 900 ? 'danger' : 
                            formData.motivation.length > 750 ? 'warning' : ''
                        }`}>
                            ({formData.motivation.length}/1000)
                        </span>
                    </label>
                    <textarea
                        id="motivation"
                        name="motivation"
                        value={formData.motivation}
                        onChange={handleInputChange}
                        className={errors.motivation ? 'error' : ''}
                        placeholder="Tại sao bạn muốn trở thành tác giả trên nền tảng của chúng tôi?"
                        rows="4"
                        disabled={isLoading}
                        maxLength={1000}
                    />
                    {errors.motivation && <span className="error-message">{errors.motivation}</span>}
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="submit-btn"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Đang gửi...' : 'Gửi đơn đăng ký'}
                    </button>
                </div>
                        </form>
                        </>
                    )}
                </>
            )}

            <style jsx>{`
                .author-application-form {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2rem;
                    border: 1px solid var(--theme-border);
                    border-radius: 12px;
                    background: var(--theme-surface-raised);
                    box-shadow: var(--shadow-sm);
                    color: var(--theme-text-primary);
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .form-header h2 {
                    color: var(--theme-text-primary);
                    margin-bottom: 0.5rem;
                }

                .form-header p {
                    color: var(--theme-text-secondary);
                    margin: 0;
                }

                .status-message,
                .message {
                    padding: 1.25rem;
                    margin-bottom: 1rem;
                    border: 1px solid transparent;
                    border-radius: 10px;
                    text-align: center;
                }

                .status-message.success,
                .message.success {
                    background: var(--theme-success-soft);
                    color: var(--theme-success-text);
                    border-color: var(--theme-success-border);
                }

                .status-message.warning {
                    background: var(--theme-warning-soft);
                    color: var(--theme-warning-text);
                    border-color: var(--theme-warning-border);
                }

                .status-message.pending {
                    background: var(--theme-info-soft);
                    color: var(--theme-info-text);
                    border-color: var(--theme-info-border);
                }

                .status-message.rejected,
                .message.error {
                    background: var(--theme-danger-soft);
                    color: var(--theme-danger-text);
                    border-color: var(--theme-danger-border);
                }

                .rejection-reason {
                    padding: 1rem;
                    margin: 1rem 0;
                    border-radius: 8px;
                    text-align: left;
                    background: color-mix(in srgb, var(--theme-surface-inverse) 8%, transparent);
                }

                .retry-btn,
                .submit-btn {
                    border: 1px solid transparent;
                    border-radius: 8px;
                    background: var(--gradient-brand);
                    color: #fff;
                    cursor: pointer;
                    transition: filter 0.2s ease, transform 0.2s ease;
                }

                .retry-btn {
                    margin-top: 1rem;
                    padding: 0.5rem 1rem;
                }

                .retry-btn:hover,
                .submit-btn:hover:not(:disabled) {
                    filter: brightness(1.05);
                    transform: translateY(-1px);
                }

                .loading-status {
                    padding: 2rem;
                    color: var(--theme-text-secondary);
                    text-align: center;
                }

                .application-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 0.5rem;
                    color: var(--theme-text-primary);
                    font-weight: 600;
                }

                .char-count {
                    color: var(--theme-text-muted);
                    font-size: 0.875rem;
                    font-weight: 400;
                }

                .char-count.warning {
                    color: var(--theme-warning-text);
                }

                .char-count.danger {
                    color: var(--theme-danger-text);
                }

                .form-group input,
                .form-group textarea {
                    padding: 0.75rem;
                    border: 1px solid var(--theme-input-border);
                    border-radius: 8px;
                    background: var(--theme-input-bg);
                    color: var(--theme-text-primary);
                    font-size: 1rem;
                    transition: border-color 0.2s ease, box-shadow 0.2s ease;
                }

                .form-group input::placeholder,
                .form-group textarea::placeholder {
                    color: var(--theme-input-placeholder);
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: var(--theme-input-border-focus);
                    box-shadow: 0 0 0 4px var(--theme-focus-ring);
                }

                .form-group input.error,
                .form-group textarea.error {
                    border-color: var(--theme-danger);
                }

                .form-group input.success {
                    border-color: var(--theme-success);
                }

                .input-with-indicator {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-with-indicator input {
                    flex: 1;
                    padding-right: 2.5rem;
                }

                .checking-indicator,
                .valid-indicator {
                    position: absolute;
                    right: 0.75rem;
                    font-size: 1.2rem;
                }

                .checking-indicator {
                    color: var(--theme-text-muted);
                }

                .valid-indicator {
                    color: var(--theme-success);
                }

                .error-message {
                    color: var(--theme-danger-text);
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 1rem;
                }

                .submit-btn {
                    padding: 0.75rem 2rem;
                    font-size: 1rem;
                }

                .submit-btn:disabled {
                    background: var(--theme-surface-active);
                    color: var(--theme-text-soft);
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default AuthorApplicationForm;
