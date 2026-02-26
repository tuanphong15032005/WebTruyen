import { useState } from 'react';
import ContentModeration from './ContentModeration';
import ViolationReportManagement from './ViolationReportManagement';
// Minhdq - 25/02/2026
// [Fix admin-conversion-rate/tab/id - V2 - branch: minhfinal2]
import ConversionRateManagement from './ConversionRateManagement';
// Minhdq - 25/02/2026
// [Fix admin-author-payout/tab/id - V2 - branch: minhfinal2]
import AuthorPayoutManagement from './AuthorPayoutManagement';
import '../../styles/admin-dashboard.css';

function AdminDashboard() {
  // Minhdq - 25/02/2026
  // [Fix admin-dashboard/tab/id - V2 - branch: minhfinal2]
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
          <button
            type='button'
            className={activeTab === 'conversion-rate' ? 'active' : ''}
            onClick={() => setActiveTab('conversion-rate')}
          >
            Tỷ giá Coin
          </button>
          <button
            type='button'
            className={activeTab === 'author-payout' ? 'active' : ''}
            onClick={() => setActiveTab('author-payout')}
          >
            Chi trả doanh thu
          </button>
        </div>


      </div>

      <div className='admin-dashboard__panel'>
        {activeTab === 'moderation' && <ContentModeration />}
        {activeTab === 'reports' && <ViolationReportManagement />}
        {/* Minhdq - 25/02/2026 */}
        {/* [Fix admin-conversion-rate/tab/id - V2 - branch: minhfinal2] */}
        {activeTab === 'conversion-rate' && <ConversionRateManagement />}
        {/* Minhdq - 25/02/2026 */}
        {/* [Fix admin-author-payout/tab/id - V2 - branch: minhfinal2] */}
        {activeTab === 'author-payout' && <AuthorPayoutManagement />}
      </div>
    </section>
  );
}

export default AdminDashboard;
