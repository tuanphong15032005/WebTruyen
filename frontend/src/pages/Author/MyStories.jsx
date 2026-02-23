import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import storyService from '../../services/storyService';
import Button from '../../components/Button';

const MyStories = () => {
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Gọi API khi component được load
    const fetchStories = async () => {
      try {
        const response = await storyService.getMyStories();
        // Kiểm tra log xem dữ liệu trả về dạng nào
        console.log('API Response:', response);

        // API service đã unwrap response.data ở interceptor
        setStories(response || []);
      } catch (error) {
        console.error('Lỗi gọi API:', error);
      }
    };

    fetchStories();
  }, []);

  return (
    <div className='my-stories-page'>
      <h2>Danh sách truyện của tôi</h2>
      <div className='story-list'>
        {stories.length === 0 ? <p>Bạn chưa có truyện nào.</p> : null}

        {stories.map((story) => (
          <div
            key={story.id}
            className='story-item'
            style={{
              border: '1px solid #ccc',
              margin: '10px',
              padding: '10px',
            }}
          >
            <h3>{story.title}</h3>
            <p>Trạng thái: {story.status}</p>
            {/* Nút để vào sửa truyện */}
            <Button onClick={() => navigate(`/author/stories/${story.id}`)}>
              Sửa / Quản lý chương
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyStories;
