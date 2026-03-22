import React from 'react';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xoa',
  cancelText = 'Huy',
}) => {
  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .confirm-dialog-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          background: var(--theme-overlay);
        }

        .confirm-dialog {
          width: min(400px, 90%);
          padding: 24px;
          border: 1px solid var(--theme-border);
          border-radius: 12px;
          background: var(--theme-modal-bg);
          box-shadow: var(--shadow-lg);
        }

        .confirm-dialog-header h3 {
          margin: 0 0 16px;
          color: var(--theme-text-primary);
          font-size: 18px;
          font-weight: 600;
        }

        .confirm-dialog-body p {
          margin: 0 0 24px;
          color: var(--theme-text-secondary);
          font-size: 14px;
          line-height: 1.5;
        }

        .confirm-dialog-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .confirm-btn {
          padding: 8px 16px;
          border: 1px solid transparent;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .confirm-btn.cancel {
          border-color: var(--theme-border);
          background: var(--theme-surface-active);
          color: var(--theme-text-primary);
        }

        .confirm-btn.cancel:hover {
          border-color: var(--theme-border-strong);
          background: var(--theme-surface-hover);
        }

        .confirm-btn.danger {
          background: var(--theme-danger);
          color: #fff;
        }

        .confirm-btn.danger:hover {
          background: var(--theme-danger-hover);
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
            <button className="confirm-btn cancel" onClick={onCancel}>
              {cancelText}
            </button>
            <button className="confirm-btn danger" onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmDialog;
