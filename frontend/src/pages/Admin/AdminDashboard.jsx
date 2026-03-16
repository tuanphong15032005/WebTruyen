import { useState } from 'react';
import ContentModeration from './ContentModeration';
import ViolationReportManagement from './ViolationReportManagement';
import DailyMissionManagement from './DailyMissionManagement';
import AchievementManagementPage from './AchievementManagementPage';
import AuthorApplicationManagementPage from './AuthorApplicationManagementPage';
import '../../styles/admin-dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('moderation');

  return (
    <div className='admin-dashboard'>
      <aside className='admin-dashboard__sidebar'>
        <div className='admin-dashboard__logo'>
          <span className='admin-dashboard__logo-icon'>A</span>
          <span className='admin-dashboard__logo-text'>Admin Panel</span>
        </div>
        <nav className='admin-dashboard__nav'>
          <button
            type='button'
            className={`admin-dashboard__nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <span className='admin-dashboard__nav-icon'>📋</span>
            Kiểm duyệt nội dung
          </button>
          <button
            type='button'
            className={`admin-dashboard__nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <span className='admin-dashboard__nav-icon'>⚠️</span>
            Quản lý Báo cáo vi phạm
          </button>
          <button
            type='button'
            className={`admin-dashboard__nav-item ${activeTab === 'daily-missions' ? 'active' : ''}`}
            onClick={() => setActiveTab('daily-missions')}
          >
            <span className='admin-dashboard__nav-icon'>🎯</span>
            Quản lý Nhiệm vụ hàng ngày
          </button>
          <button
            type='button'
            className={`admin-dashboard__nav-item ${activeTab === 'achievements' ? 'active' : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            <span className='admin-dashboard__nav-icon'>🏆</span>
            Quản lý Thành tựu
          </button>
          <button
            type='button'
            className={`admin-dashboard__nav-item ${activeTab === 'author-applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('author-applications')}
          >
            <span className='admin-dashboard__nav-icon'>✍️</span>
            Quản lý Đơn tác giả
          </button>
        </nav>
      </aside>
      <main className='admin-dashboard__main'>
        {activeTab === 'moderation' ? <ContentModeration /> : 
         activeTab === 'reports' ? <ViolationReportManagement /> : 
         activeTab === 'daily-missions' ? <DailyMissionManagement /> : 
         activeTab === 'achievements' ? <AchievementManagementPage /> :
         <AuthorApplicationManagementPage />}
      </main>
    </div>
  );
}

export default AdminDashboard;
