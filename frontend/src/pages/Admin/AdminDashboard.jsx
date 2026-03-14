import { useState } from 'react';
import ContentModeration from './ContentModeration';
import ViolationReportManagement from './ViolationReportManagement';
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
        </nav>
      </aside>
      <main className='admin-dashboard__main'>
        {activeTab === 'moderation' ? <ContentModeration /> : <ViolationReportManagement />}
      </main>
    </div>
  );
}

export default AdminDashboard;
