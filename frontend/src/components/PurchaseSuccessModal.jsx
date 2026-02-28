import React from 'react';
import '../styles/PurchaseSuccessModal.css';

const PurchaseSuccessModal = ({ isOpen, onClose, response }) => {
  if (!isOpen) return null;

  const chapterLabel = response?.chapterId || 'N/A';
  const amountPaid = Number(response?.amountPaid ?? response?.totalPrice ?? 0);
  const remainingBalance = Number(
    response?.remainingBalance ??
      (Number(response?.newBalanceA ?? 0) + Number(response?.newBalanceB ?? 0)),
  );

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className='success-modal-overlay' onClick={handleBackdropClick}>
      <div className='success-modal'>
        <h2>Mua thành công!</h2>
        <div className='success-details'>
          {response && (
            <>
              <div className='detail-row'>
                <span>Chương:</span>
                <span>{chapterLabel}</span>
              </div>
              <div className='detail-row'>
                <span>Đã trả:</span>
                <span>{amountPaid} Coin</span>
              </div>
              <div className='detail-row'>
                <span>Còn lại:</span>
                <span>{remainingBalance} Coin</span>
              </div>
            </>
          )}
        </div>
        <div className='modal-actions'>
          <button className='ok-btn' onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseSuccessModal;
