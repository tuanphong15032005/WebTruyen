import React from 'react';
import { BookOpen, Library, MessageSquare } from 'lucide-react';
import StatCard from './StatCard';
import { formatCurrency, formatNumber } from '../../services/dashboardService';
import './StatsGrid.css';

/**
 * StatsGrid component
 * Grid of statistics cards displaying key performance metrics
 * Shows total stories, total chapters, and total comments with growth badges
 */
const StatsGrid = ({ summary }) => {
  if (!summary) {
    return (
      <div className="stats-grid loading">
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
        <div className="loading-skeleton"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Tổng số truyện',
      value: formatNumber(summary.totalStories),
      growth: summary.storiesGrowth,
      icon: <BookOpen className="stat-icon" />,
      color: 'purple'
    },
    {
      title: 'Tổng số chương',
      value: formatNumber(summary.totalChapters),
      growth: summary.chaptersGrowth,
      icon: <Library className="stat-icon" />,
      color: 'blue'
    },
    {
      title: 'Số lượt bình luận',
      value: formatNumber(summary.totalComments),
      growth: summary.commentsGrowth,
      icon: <MessageSquare className="stat-icon" />,
      color: 'teal'
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
