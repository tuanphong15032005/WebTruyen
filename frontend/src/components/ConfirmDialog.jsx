import React from 'react';

const ConfirmDialog = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Xóa", 
  cancelText = "Hủy" 
}) => {
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .confirm-dialog {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .confirm-dialog-header h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }

        .confirm-dialog-body p {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #666;
          line-height: 1.5;
        }

        .confirm-dialog-footer {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .confirm-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .confirm-btn.cancel {
          background-color: #f5f5f5;
          color: #666;
        }

        .confirm-btn.cancel:hover {
          background-color: #e8e8e8;
        }

        .confirm-btn.danger {
          background-color: #dc3545;
          color: white;
        }

        .confirm-btn.danger:hover {
          background-color: #c82333;
        }
      `}</style>
      
      <div className="confirm-dialog-overlay">
        <div className="confirm-dialog">
          <div className="confirm-dialog-header">
            <h3>{title}</h3>
          </div>
          <div className="confirm-dialog-body">
            <p>{message}</p>
          </div>
          <div className="confirm-dialog-footer">
            <button 
              className="confirm-btn cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button 
              className="confirm-btn danger"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
