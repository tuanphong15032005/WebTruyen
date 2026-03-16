import React from 'react';
import '../styles/loading-spinner.css';

const LoadingSpinner = ({ label = 'Đang tải dữ liệu...', size = 72 }) => {
  return (
    <div className='loading-wheel' role='status' aria-live='polite'>
      <span
        className='loading-wheel__spinner'
        style={{ '--loading-wheel-size': `${size}px` }}
        aria-hidden='true'
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <span
            key={index}
            className='loading-wheel__segment'
            style={{ '--loading-wheel-index': index }}
          />
        ))}
      </span>
      {label ? <p className='loading-wheel__label'>{label}</p> : null}
    </div>
  );
};

export default LoadingSpinner;
