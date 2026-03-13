import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PurchaseErrorModal.css';

const PurchaseErrorModal = ({ isOpen, onClose, errorMessage, chapterPrice, currentBalance }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleTopUp = () => {
    onClose();
    navigate('/wallet/topup');
  };

  const calculateNeededAmount = () => {
    if (!chapterPrice || !currentBalance) return 0;
    const needed = chapterPrice - currentBalance;
    return needed > 0 ? needed : 0;
  };

  const neededAmount = calculateNeededAmount();

  return (
    <div className="error-modal-overlay" onClick={handleBackdropClick}>
      <div className="error-modal">
        <h2>Xin lỗi bạn không đủ tài chính</h2>
        
        <div className="chapter-price">
          <div className="price-label">Giá chương</div>
          <div className="price-value">{chapterPrice || 0} Coin</div>
        </div>
        
        <div className="error-message">
          {errorMessage}
        </div>
        
        <div className="modal-actions">
          <button className="top-up-btn" onClick={handleTopUp}>
            Nạp thêm
          </button>
          <button className="close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseErrorModal;
