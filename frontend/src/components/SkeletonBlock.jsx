import React from 'react';
import '../styles/skeleton.css';

const SkeletonBlock = ({
  as: Component = 'div',
  className = '',
  style,
  ...rest
}) => (
  <Component
    aria-hidden='true'
    className={`app-skeleton ${className}`.trim()}
    style={style}
    {...rest}
  />
);

export default SkeletonBlock;
