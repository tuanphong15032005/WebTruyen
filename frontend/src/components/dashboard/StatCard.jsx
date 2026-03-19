import React from 'react';
import './StatCard.css';

/**
 * StatCard component
 * Individual statistics card for displaying key metrics
 * Shows title, value, growth indicator with dynamic color, and icon with pastel colors
 */
const StatCard = ({ title, value, growth, icon, color }) => {
  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return (val / 1000000).toFixed(1) + 'M';
      }
      if (val >= 1000) {
        return (val / 1000).toFixed(1) + 'K';
      }
      return val.toLocaleString();
    }
    return val;
  };

  const formatGrowth = (growthRate) => {
    if (growthRate === undefined || growthRate === null) return null;
    
    const isPositive = growthRate >= 0;
    const formattedGrowth = Math.abs(growthRate).toFixed(1);
    
    return (
      <div className={`stat-growth ${isPositive ? 'positive' : 'negative'}`}>
        <span className="growth-arrow">
          {isPositive ? '+' : '-'}
        </span>
        <span className="growth-value">
          {formattedGrowth}%
        </span>
      </div>
    );
  };

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-icon-wrapper">
        {icon}
      </div>
      
      <div className="stat-content">
        <div className="stat-title">
          {title}
        </div>
        <div className="stat-value">
          {formatValue(value)}
        </div>
      </div>
      
      {growth !== undefined && growth !== null && formatGrowth(growth)}
    </div>
  );
};

export default StatCard;
