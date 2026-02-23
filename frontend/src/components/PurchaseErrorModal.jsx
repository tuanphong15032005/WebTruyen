import React from 'react';
import './PurchaseErrorModal.css';

const PurchaseErrorModal = ({ isOpen, onClose, errorMessage }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="error-modal-overlay" onClick={handleBackdropClick}>
      <div className="error-modal">
        <h2>❌ Lỗi mua chương</h2>
        <div className="error-message">
          {errorMessage}
        </div>
        <div className="modal-actions">
          <button className="ok-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseErrorModal;
