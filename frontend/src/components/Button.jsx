import React from 'react';

const Button = ({
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={isDisabled}
    >
      {loading ? 'Dang xu li...' : children}
    </button>
  );
};

export default Button;
