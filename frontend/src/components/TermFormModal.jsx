import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { createTerm, updateTerm, getTermDetail } from '../api/termApi';
import useNotify from '../hooks/useNotify';
import '../styles/admin-terms.css';

const TermFormModal = ({ isOpen, onClose, mode, termCode, onSuccess }) => {
  const { notify } = useNotify();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    content: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && termCode) {
        fetchTermDetail();
      } else {
        setFormData({ code: '', title: '', content: '' });
      }
    }
  }, [isOpen, mode, termCode]);

  // Debug formData changes
  useEffect(() => {
    console.log('FormData changed:', formData);
  }, [formData]);

  const fetchTermDetail = async () => {
    try {
      setLoading(true);
      const response = await getTermDetail(termCode);
      console.log('API Response for term detail:', response);
      
      // Handle different possible response structures
      let termData = response;
      
      // If response is nested in a data property
      if (response && typeof response === 'object' && response.data) {
        termData = response.data;
      }
      
      // Extract form data with fallbacks
      const formData = {
        code: termData?.code || '',
        title: termData?.title || termData?.['tiêu đề'] || termData?.tieuDe || '',
        content: termData?.content || termData?.['nội dung'] || termData?.noiDung || ''
      };
      console.log('Setting form data:', formData);
      setFormData(formData);
    } catch (error) {
      console.error('Error fetching term detail:', error);
      notify('Không thể tải thông tin term', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Form data before submission:', formData);
    
    if (!formData.code.trim() || !formData.title.trim() || !formData.content.trim()) {
      notify('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      setLoading(true);
      
      if (mode === 'create') {
        console.log('Creating term with data:', formData);
        await createTerm(formData);
        notify('Tạo term thành công', 'success');
      } else {
        const updateData = {
          title: formData.title,
          content: formData.content
        };
        console.log('Updating term with data:', updateData);
        await updateTerm(termCode, updateData);
        notify('Cập nhật term thành công', 'success');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      let errorMessage = 'Đã xảy ra lỗi';
      
      // Check for specific error messages
      const errorText = error.response?.data?.message || error.message || '';
      
      if (errorText.includes('already exists') || errorText.includes('đã tồn tại')) {
        errorMessage = 'Không thể tạo do term code đã tồn tại';
      } else if (errorText.includes('required') || errorText.includes('bắt buộc')) {
        errorMessage = 'Vui lòng điền đầy đủ thông tin';
      } else if (errorText.includes('not found') || errorText.includes('không tìm thấy')) {
        errorMessage = 'Không tìm thấy term cần cập nhật';
      } else {
        errorMessage = errorText || 'Đã xảy ra lỗi';
      }
      
      notify(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    console.log(`Updating ${field} to:`, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {mode === 'create' ? 'Thêm Term Mới' : 'Chỉnh Sửa Term'}
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="term-form">
          <div className="form-group">
            <label htmlFor="code">Term Code</label>
            <input
              type="text"
              id="code"
              value={formData.code}
              onChange={(e) => {
                console.log('Code input changed:', e.target.value);
                handleInputChange('code', e.target.value);
              }}
              placeholder="Nhập term code"
              disabled={mode === 'edit'}
              required
            />
            {mode === 'edit' && (
              <small className="form-hint">Code không thể thay đổi khi chỉnh sửa</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Tiêu đề</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => {
                console.log('Title input changed:', e.target.value);
                handleInputChange('title', e.target.value);
              }}
              placeholder="Nhập tiêu đề"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Nội dung</label>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => handleInputChange('content', value)}
              placeholder="Nhập nội dung term..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : (mode === 'create' ? 'Tạo Term' : 'Lưu Thay Đổi')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TermFormModal;
