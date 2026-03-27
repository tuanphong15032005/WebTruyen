import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PurchaseErrorModal.css';

const PurchaseErrorModal = ({
  isOpen,
  onClose,
  errorMessage,
  chapterPrice,
  currentBalance,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const safeChapterPrice = Number(chapterPrice || 0);
  const safeCurrentBalance = Number(currentBalance || 0);
  const isInsufficientBalance = safeChapterPrice > safeCurrentBalance;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleTopUp = () => {
    onClose();
    navigate('/wallet/topup');
  };

  return (
    <div className="error-modal-overlay" onClick={handleBackdropClick}>
      <div className="error-modal">
        <h2>
          {isInsufficientBalance
            ? 'Xin lỗi bạn không đủ tài chính'
            : 'Không thể mua chương'}
        </h2>

        <div className="chapter-price">
          <div className="price-label">Giá chương</div>
          <div className="price-value">{safeChapterPrice} Coin</div>
        </div>

        <div className="error-message">{errorMessage}</div>

        <div className="modal-actions">
          {isInsufficientBalance && (
            <button className="top-up-btn" onClick={handleTopUp}>
              Nạp thêm
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseErrorModal;
