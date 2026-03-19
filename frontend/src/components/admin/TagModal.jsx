import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const TagModal = ({ tag, error, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [slug, setSlug] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (tag) {
      setFormData({ name: tag.name });
      setSlug(tag.slug);
    } else {
      setFormData({ name: '' });
      setSlug('');
    }
    setErrors({});
  }, [tag]);

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'name') {
      setSlug(generateSlug(value));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Tên tag không được để trống';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Tên tag phải có ít nhất 2 ký tự';
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Tên tag không được quá 200 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        name: formData.name.trim()
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {tag ? 'Chỉnh sửa Tag' : 'Thêm Tag mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên Tag <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Nhập tên tag..."
              autoFocus
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (Preview)
            </label>
            <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
              <span className="font-mono text-sm text-gray-600">{slug || 'will-be-generated'}</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Slug sẽ được tự động tạo từ tên tag
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {tag ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagModal;
