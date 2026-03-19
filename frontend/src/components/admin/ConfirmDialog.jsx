import React from 'react';
import { X } from 'lucide-react';

const ConfirmDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Xác nhận", 
  message = "Bạn có chắc chắn muốn thực hiện hành động này?",
  confirmText = "OK",
  cancelText = "Cancel",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirmBg: 'bg-red-600 hover:bg-red-700',
          confirmText: 'text-white',
          icon: '⚠️'
        };
      case 'warning':
        return {
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          confirmText: 'text-white',
          icon: '⚠️'
        };
      case 'info':
        return {
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          confirmText: 'text-white',
          icon: 'ℹ️'
        };
      default:
        return {
          confirmBg: 'bg-gray-600 hover:bg-gray-700',
          confirmText: 'text-white',
          icon: 'ℹ️'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{styles.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-600">{message}</p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors ${styles.confirmBg} ${styles.confirmText}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
