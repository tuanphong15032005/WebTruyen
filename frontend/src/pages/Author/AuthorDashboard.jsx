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
        <Button 
          onClick={() => navigate('')}
        >
          Sửa nội dung truyện cũ, thêm sửa xóa volume và chương
        </Button>
      </div>
    </div>
  );
};

export default AuthorDashboard;
