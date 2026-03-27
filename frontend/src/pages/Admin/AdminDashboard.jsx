import { NavLink, Outlet } from 'react-router-dom';
import '../../styles/admin-dashboard.css';

function AdminDashboard() {
  return (
    <div className='admin-dashboard'>
      <aside className='admin-dashboard__sidebar'>
        <div className='admin-dashboard__logo'>
          <span className='admin-dashboard__logo-icon'>A</span>
          <span className='admin-dashboard__logo-text'>Trang Quản Trị</span>
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
            to='finance'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>💳</span>
            Quản lý chi trả và hoàn tiền
          </NavLink>
          <NavLink
            to='daily-missions'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>🎯</span>
            Quản lý Nhiệm vụ hàng ngày
          </NavLink>
          <NavLink
            to='achievement-management'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>🏆</span>
            Quản lý Thành tựu
          </NavLink>
          <NavLink
            to='applications'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>📋</span>
            Quản lý Đơn
          </NavLink>
          <NavLink
            to='tags'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>🏷️</span>
            Quản lý Tags
          </NavLink>
          <NavLink
            to='terms'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>📜</span>
            Quản lý điều khoản
          </NavLink>
          <NavLink
            to='users'
            className={({ isActive }) =>
              `admin-dashboard__nav-item ${isActive ? 'active' : ''}`
            }
          >
            <span className='admin-dashboard__nav-icon'>👤</span>
            Quản lý Người Dùng
          </NavLink>
        </nav>
      </aside>
      <main className='admin-dashboard__main'>
        <Outlet />
      </main>
    </div>
  );
}

export default AdminDashboard;
