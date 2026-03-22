import React, { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message) => addToast(message, 'success'),
    error: (message) => addToast(message, 'error'),
    info: (message) => addToast(message, 'info'),
    warning: (message) => addToast(message, 'warning'),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const ToastContainer = () => {
  const context = useContext(ToastContext);

  if (!context || !context.toasts) {
    return null;
  }

  const { toasts, removeToast } = context;

  return (
    <div className='toast-container toast-container--managed'>
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--managed toast-${toast.type}`}>
          <span className='toast__message'>{toast.message}</span>
          <button
            type='button'
            onClick={() => removeToast(toast.id)}
            className='toast__close'
            aria-label='Close toast'
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
};
