import React from 'react';
import StatCard from './StatCard';
import { formatCurrency, formatNumber } from '../../services/dashboardService';
import './StatsGrid.css';

/**
 * StatsGrid component
 * Grid of statistics cards displaying key performance metrics
 * Shows total views, followers, revenue, and comments
 */
const StatsGrid = ({ summary }) => {
  if (!summary) {
    return (
      <div className="stats-grid loading">
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Tổng lượt xem',
      value: formatNumber(summary.totalViews),
      growth: summary.viewsGrowth,
      icon: '👁️',
      color: '#3B82F6'
    },
    {
      title: 'Người theo dõi',
      value: formatNumber(summary.followers),
      growth: summary.followersGrowth,
      icon: '👥',
      color: '#10B981'
    },
    {
      title: 'Doanh thu',
      value: formatCurrency(summary.revenue),
      growth: null, // Revenue growth calculation would need historical data
      icon: '💰',
      color: '#F59E0B'
    },
    {
      title: 'Bình luận',
      value: formatNumber(summary.comments),
      growth: null,
      icon: '💬',
      color: '#8B5CF6'
    }
  ];

  return (
    <div className="stats-grid">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          growth={stat.growth}
          icon={stat.icon}
          color={stat.color}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
