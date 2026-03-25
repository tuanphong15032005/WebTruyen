import React from 'react';
import { BookOpen, Library, MessageSquare } from 'lucide-react';
import StatCard from './StatCard';
import { formatCurrency, formatNumber } from '../../services/dashboardService';
import '../../styles/StatsGrid.css';

/**
 * StatsGrid component
 * Grid of statistics cards displaying key performance metrics
 * Shows total stories, total chapters, and total comments with growth badges
 */
const StatsGrid = ({ summary }) => {
  if (!summary) {
    return (
      <div className="stats-grid stats-grid--dashboard loading">
        <div className="stats-grid__main">
          <div className="loading-skeleton"></div>
          <div className="loading-skeleton"></div>
        </div>
        <div className="stats-grid__side">
          <div className="loading-skeleton"></div>
        </div>
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
    <div className="stats-grid stats-grid--dashboard">
      <div className="stats-grid__main">
        {stats.slice(0, 2).map((stat, index) => (
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
      <div className="stats-grid__side">
        <StatCard
          title={stats[2].title}
          value={stats[2].value}
          growth={stats[2].growth}
          icon={stats[2].icon}
          color={stats[2].color}
        />
      </div>
    </div>
  );
};

export default StatsGrid;
