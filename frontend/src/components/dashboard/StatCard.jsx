import React from 'react';
import './StatCard.css';

/**
 * StatCard component
 * Individual statistics card for displaying key metrics
 * Shows title, value, growth indicator, and icon
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
    
    const isPositive = growthRate > 0;
    const formattedGrowth = Math.abs(growthRate).toFixed(1);
    
    return (
      <div className={`growth-indicator ${isPositive ? 'positive' : 'negative'}`}>
        <span className="growth-arrow">
          {isPositive ? '↑' : '↓'}
        </span>
        <span className="growth-value">
          {formattedGrowth}%
        </span>
      </div>
    );
  };

  return (
    <div className="dashboard-stat-card">
      <div className="dashboard-stat-header">
        <div className="dashboard-stat-icon" style={{ backgroundColor: color }}>
          {icon}
        </div>
        {growth !== undefined && formatGrowth(growth)}
      </div>
      
      <div className="dashboard-stat-content">
        <div className="dashboard-stat-value">
          {formatValue(value)}
        </div>
        <div className="dashboard-stat-title">
          {title}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
