import React, { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

const SimpleNotification = ({ 
  isVisible, 
  message, 
  type = 'success', 
  duration = 4000,
  onClose 
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      
      // Auto close after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration]);

  const handleClose = () => {
    setShouldShow(false);
    // Wait for animation to complete before calling onClose
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const getNotificationClass = () => {
    const baseClass = 'simple-notification';
    const visibilityClass = shouldShow ? 'simple-notification--show' : 'simple-notification--hide';
    const typeClass = type === 'success' ? 'simple-notification--success' : 'simple-notification--error';
    
    return `${baseClass} ${visibilityClass} ${typeClass}`;
  };

  return (
    <div className={getNotificationClass()}>
      <div className="simple-notification__content">
        <div className="simple-notification__icon">
          {type === 'success' ? (
            <CheckCircle size={20} className="notification-icon" />
          ) : (
            <X size={20} className="notification-icon" />
          )}
        </div>
        <div className="simple-notification__text">
          <p>{message}</p>
        </div>
        <button 
          className="simple-notification__close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default SimpleNotification;
