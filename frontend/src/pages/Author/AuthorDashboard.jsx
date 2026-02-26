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
          onClick={() => navigate('/author/followers')}
        >
          Thống kê người theo dõi
        </Button>
      </div>
    </div>
  );
};

export default AuthorDashboard;