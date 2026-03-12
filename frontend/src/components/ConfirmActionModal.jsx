import React from 'react';
import '../styles/confirm-action-modal.css';

const ConfirmActionModal = ({
  isOpen,
  title = 'Xác nhận thay đổi',
  message,
  cancelText = 'Hủy',
  confirmText = 'Xác nhận',
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className='confirm-action-modal__backdrop' onClick={onCancel}>
      <div
        className='confirm-action-modal__panel'
        onClick={(event) => event.stopPropagation()}
      >
        <div className='confirm-action-modal__icon-wrap' aria-hidden='true'>
          <span className='confirm-action-modal__icon'>!</span>
        </div>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className='confirm-action-modal__actions'>
          <button type='button' className='cancel' onClick={onCancel}>
            {cancelText}
          </button>
          <button type='button' className='confirm' onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
