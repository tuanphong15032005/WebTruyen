import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';

const AuthorDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="author-dashboard">
      <h1>Author Dashboard</h1>
      <div className="dashboard-buttons">
        <Button 
          onClick={() => navigate('/author/create-story')}
        >
          Tạo truyện mới hoàn toàn
        </Button>
        {/* Sửa đường dẫn ở đây để đến trang danh sách truyện */}
        <Button
          onClick={() => navigate('/author/my-stories')}
        >
          Quản lý truyện đã đăng
        </Button>
        <Button
          onClick={() => navigate('/author/drafts')}
        >
          {/* Minhdq - 26/02/2026 */}
          {/* [Add quick-access-button-to-author-draft-management - V1 - branch: clone-minhfinal2] */}
          Bản nháp truyện & chương
        </Button>
        <Button
          onClick={() => navigate('/author/followers')}
        >
          {/* Minhdq - 26/02/2026 */}
          {/* [Add quick-access-button-to-author-follower-analytics - V1 - branch: clone-minhfinal2] */}
          Thống kê người theo dõi
        </Button>
      </div>
    </div>
  );
};

export default AuthorDashboard;