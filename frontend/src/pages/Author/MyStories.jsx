import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import storyService from '../../services/storyService';
import Button from '../../components/Button';

const MyStories = () => {
  const [stories, setStories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await storyService.getMyStories();
        setStories(Array.isArray(response) ? response : []);
      } catch (error) {
        console.error('Lỗi gọi API:', error);
      }
    };

    fetchStories();
  }, []);

  const visibleStories = stories.filter(
    (story) => String(story?.status || '').toLowerCase() !== 'archived',
  );

  return (
    <div className='my-stories-page'>
      <h2>Danh sách truyện của tôi</h2>
      <div className='story-list'>
        {visibleStories.length === 0 ? <p>Bạn chưa có truyện nào.</p> : null}

        {visibleStories.map((story) => {
          const storyId = story?.id ?? story?.storyId;

          return (
            <div
              key={storyId}
              className='story-item'
              style={{
                border: '1px solid var(--theme-border)',
                margin: '10px',
                padding: '10px',
              }}
            >
              <h3>{story.title}</h3>
              <p>Trạng thái: {story.status}</p>
              <Button onClick={() => navigate(`/author/stories/${storyId}`)}>
                Sửa / Quản lý chương
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyStories;
