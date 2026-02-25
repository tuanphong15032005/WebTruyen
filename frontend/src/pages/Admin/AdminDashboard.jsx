import { useState } from 'react';
import { Link } from 'react-router-dom';
import ContentModeration from './ContentModeration';
import ViolationReportManagement from './ViolationReportManagement';
import '../../styles/admin-dashboard.css';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('moderation');

  return (
    <section className='admin-dashboard'>

      <div className='admin-dashboard__topbar'>
        <div className='admin-dashboard__tabs'>
          <button
            type='button'
            className={activeTab === 'moderation' ? 'active' : ''}
            onClick={() => setActiveTab('moderation')}
          >
            Kiểm duyệt nội dung
          </button>
          <button
            type='button'
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Quản lý Báo cáo vi phạm
          </button>
        </div>

        <div className='admin-dashboard__links'>
          <Link to='/admin/content-moderation'>Mở trang kiểm duyệt riêng</Link>
          <Link to='/admin/violation-reports'>Mở trang báo cáo riêng</Link>
        </div>
      </div>

      <div className='admin-dashboard__panel'>
        {activeTab === 'moderation' ? <ContentModeration /> : <ViolationReportManagement />}
      </div>
    </section>
  );
}

export default AdminDashboard;
