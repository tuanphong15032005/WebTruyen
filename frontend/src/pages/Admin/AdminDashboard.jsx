import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import ContentModeration from './ContentModeration';
import ViolationReportManagement from './ViolationReportManagement';
import DailyMissionManagement from './DailyMissionManagement';
import AchievementManagementPage from './AchievementManagementPage';
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
          <NavLink
            to='moderation'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>📋</span>
            Kiểm duyệt nội dung
          </NavLink>
          <NavLink
            to='reports'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>⚠️</span>
            Quản lý Báo cáo vi phạm
          </NavLink>
          <NavLink
            to='achievements'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>🏆</span>
            Quản lý thành tích
          </NavLink>
          <NavLink
            to='finance'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>💳</span>
            Quản lý chi trả và hoàn tiền
          </NavLink>
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
        </nav>
      </aside>
      <main className='admin-dashboard__main'>
        <Outlet />
        {activeTab === 'moderation' ? <ContentModeration /> :
         activeTab === 'reports' ? <ViolationReportManagement /> :
         activeTab === 'daily-missions' ? <DailyMissionManagement /> :
         <AchievementManagementPage />}
      </main>
    </div>
  );
}

export default AdminDashboard;
