import React from 'react';
import './PurchaseConfirmationModal.css';

const PurchaseConfirmationModal = ({ isOpen, onClose, chapter, wallet, onConfirm, loading }) => {
  if (!isOpen) return null;

  const chapterPrice = chapter?.priceCoin || 0;
  const currentBalance = wallet?.coinA + wallet?.coinB || 0;
  const balanceAfterPurchase = currentBalance - chapterPrice;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="purchase-modal-overlay" onClick={handleBackdropClick}>
      <div className="purchase-modal">
        <h2>Xác nhận mua chương</h2>
        <div className="purchase-details">
          <div className="detail-row">
            <span>Số tiền cần thanh toán:</span>
            <span>{chapterPrice} Coin</span>
          </div>
          <div className="detail-row">
            <span>Số dư hiện tại:</span>
            <span>{currentBalance} Coin</span>
          </div>
          <div className="detail-row">
            <span>Số dư sau khi mua:</span>
            <span>{balanceAfterPurchase} Coin</span>
          </div>
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button className="confirm-btn" onClick={onConfirm} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đồng ý'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmationModal;
