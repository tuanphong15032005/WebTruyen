import React from 'react';
import './PurchaseSuccessModal.css';

const PurchaseSuccessModal = ({ isOpen, onClose, response }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="success-modal-overlay" onClick={handleBackdropClick}>
      <div className="success-modal">
        <h2>✅ Mua chương thành công!</h2>
        <div className="success-details">
          {response && (
            <>
              <div className="detail-row">
                <span>Chương đã mua:</span>
                <span>Chương {response.chapterId || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span>Số tiền đã thanh toán:</span>
                <span>{response.amountPaid || 0} Coin</span>
              </div>
              <div className="detail-row">
                <span>Số dư còn lại:</span>
                <span>{response.remainingBalance || 0} Coin</span>
              </div>
            </>
          )}
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

export default PurchaseSuccessModal;
