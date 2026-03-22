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
            ? 'Xin l\u1ed7i b\u1ea1n kh\u00f4ng \u0111\u1ee7 t\u00e0i ch\u00ednh'
            : 'Kh\u00f4ng th\u1ec3 mua ch\u01b0\u01a1ng'}
        </h2>

        <div className="chapter-price">
          <div className="price-label">Gi\u00e1 ch\u01b0\u01a1ng</div>
          <div className="price-value">{safeChapterPrice} Coin</div>
        </div>

        <div className="error-message">{errorMessage}</div>

        <div className="modal-actions">
          {isInsufficientBalance && (
            <button className="top-up-btn" onClick={handleTopUp}>
              N\u1ea1p th\u00eam
            </button>
          )}
          <button className="close-btn" onClick={onClose}>
            \u0110\u00f3ng
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseErrorModal;
