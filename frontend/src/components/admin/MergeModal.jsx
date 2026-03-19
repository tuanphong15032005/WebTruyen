import React, { useState } from 'react';
import { X, GitMerge } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';

const MergeModal = ({ tags, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    sourceTagId: '',
    targetTagId: ''
  });
  const [errors, setErrors] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    sourceTag: null,
    targetTag: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.sourceTagId) {
      newErrors.sourceTagId = 'Vui lòng chọn tag nguồn';
    }
    
    if (!formData.targetTagId) {
      newErrors.targetTagId = 'Vui lòng chọn tag đích';
    }
    
    if (formData.sourceTagId && formData.targetTagId && formData.sourceTagId === formData.targetTagId) {
      newErrors.targetTagId = 'Tag đích không được trùng với tag nguồn';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const sourceTag = tags.find(t => t.id.toString() === formData.sourceTagId);
      const targetTag = tags.find(t => t.id.toString() === formData.targetTagId);
      
      // Open confirm dialog instead of window.confirm
      setConfirmDialog({
        isOpen: true,
        sourceTag,
        targetTag
      });
    }
  };

  const confirmMerge = () => {
    onSubmit({
      sourceTagId: parseInt(formData.sourceTagId),
      targetTagId: parseInt(formData.targetTagId)
    });
    setConfirmDialog({ isOpen: false, sourceTag: null, targetTag: null });
  };

  const cancelMerge = () => {
    setConfirmDialog({ isOpen: false, sourceTag: null, targetTag: null });
  };

  const sortedTags = [...tags].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <GitMerge className="text-purple-600" size={24} />
            <h2 className="text-xl font-semibold text-gray-900">Gộp Tags</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800">
              <strong>Lưu ý:</strong> Tag nguồn sẽ bị xóa vĩnh viễn và tất cả truyện đang sử dụng nó sẽ được chuyển sang tag đích.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Nguồn <span className="text-red-500">*</span>
            </label>
            <select
              name="sourceTagId"
              value={formData.sourceTagId}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.sourceTagId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Chọn tag nguồn...</option>
              {sortedTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.usageCount} truyện)
                </option>
              ))}
            </select>
            {errors.sourceTagId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceTagId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tag Đích <span className="text-red-500">*</span>
            </label>
            <select
              name="targetTagId"
              value={formData.targetTagId}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.targetTagId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Chọn tag đích...</option>
              {sortedTags.map(tag => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.usageCount} truyện)
                </option>
              ))}
            </select>
            {errors.targetTagId && (
              <p className="mt-1 text-sm text-red-600">{errors.targetTagId}</p>
            )}
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Gộp Tags
            </button>
          </div>
        </form>
      </div>
      
      {confirmDialog.isOpen && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={cancelMerge}
          onConfirm={confirmMerge}
          title="Xác nhận gộp tag"
          message={`Bạn có chắc chắn muốn gộp tag "${confirmDialog.sourceTag?.name}" vào tag "${confirmDialog.targetTag?.name}?\n\nTag "${confirmDialog.sourceTag?.name}" sẽ bị xóa và tất cả truyện đang sử dụng nó sẽ được chuyển sang sử dụng tag "${confirmDialog.targetTag?.name}".`}
          confirmText="Gộp"
          cancelText="Hủy"
          type="warning"
        />
      )}
    </div>
  );
};

export default MergeModal;
