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

    const validateForm = () => {
        const newErrors = {};
        let isValid = true;

        if (!formData.penName.trim()) {
            newErrors.penName = 'Vui lòng nhập bút danh';
            isValid = false;
        } else if (formData.penName.length < 2) {
            newErrors.penName = 'Bút danh phải có ít nhất 2 ký tự';
            isValid = false;
        }

        if (!formData.bio.trim()) {
            newErrors.bio = 'Vui lòng nhập tiểu sử';
            isValid = false;
        } else if (formData.bio.length < 10) {
            newErrors.bio = 'Tiểu sử phải có ít nhất 10 ký tự';
            isValid = false;
        }

        if (!formData.motivation.trim()) {
            newErrors.motivation = 'Vui lòng nhập lý do muốn trở thành tác giả';
            isValid = false;
        } else if (formData.motivation.length < 20) {
            newErrors.motivation = 'Lý do phải có ít nhất 20 ký tự';
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

            {message && (
                <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="application-form">
                <div className="form-group">
                    <label htmlFor="penName">Bút danh *</label>
                    <input
                        type="text"
                        id="penName"
                        name="penName"
                        value={formData.penName}
                        onChange={handleInputChange}
                        className={errors.penName ? 'error' : ''}
                        placeholder="Nhập bút danh của bạn"
                        disabled={isLoading}
                    />
                    {errors.penName && <span className="error-message">{errors.penName}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="bio">Tiểu sử *</label>
                    <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        className={errors.bio ? 'error' : ''}
                        placeholder="Giới thiệu ngắn gọn về bản thân bạn"
                        rows="3"
                        disabled={isLoading}
                    />
                    {errors.bio && <span className="error-message">{errors.bio}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="experience">Kinh nghiệm viết lách</label>
                    <textarea
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="Kinh nghiệm viết lách của bạn (nếu có)"
                        rows="3"
                        disabled={isLoading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="motivation">Lý do muốn trở thành tác giả *</label>
                    <textarea
                        id="motivation"
                        name="motivation"
                        value={formData.motivation}
                        onChange={handleInputChange}
                        className={errors.motivation ? 'error' : ''}
                        placeholder="Tại sao bạn muốn trở thành tác giả trên nền tảng của chúng tôi?"
                        rows="4"
                        disabled={isLoading}
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

            <style jsx>{`
                .author-application-form {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 2rem;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                }

                .form-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .form-header h2 {
                    color: #333;
                    margin-bottom: 0.5rem;
                }

                .form-header p {
                    color: #666;
                    margin: 0;
                }

                .message {
                    padding: 1rem;
                    border-radius: 4px;
                    margin-bottom: 1rem;
                    text-align: center;
                }

                .message.success {
                    background-color: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }

                .message.error {
                    background-color: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
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
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: #333;
                }

                .form-group input,
                .form-group textarea {
                    padding: 0.75rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 1rem;
                    transition: border-color 0.3s;
                }

                .form-group input:focus,
                .form-group textarea:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .form-group input.error,
                .form-group textarea.error {
                    border-color: #dc3545;
                }

                .error-message {
                    color: #dc3545;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                }

                .form-actions {
                    display: flex;
                    justify-content: center;
                    margin-top: 1rem;
                }

                .submit-btn {
                    background-color: #007bff;
                    color: white;
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 4px;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }

                .submit-btn:hover:not(:disabled) {
                    background-color: #0056b3;
                }

                .submit-btn:disabled {
                    background-color: #6c757d;
                    cursor: not-allowed;
                }
            `}</style>
        </div>
    );
};

export default AuthorApplicationForm;
