import React from 'react';

const Button = ({
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  children,
  className = '',
  style,
  ...restProps
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${className}`.trim()}
      onClick={onClick}
      disabled={isDisabled}
      style={style}
      {...restProps}
    >
      {loading ? 'Đang xử lý...' : children}
    </button>
  );
};

export default Button;
