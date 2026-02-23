import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/Button';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';

const ManageStories = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await storyService.getMyStories();
        setStories(response.data);
      } catch (error) {
        notify('Error fetching stories', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [notify]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="manage-stories">
      <h1>Quản lý truyện của tôi</h1>
      {stories.length === 0 ? (
        <p>Bạn chưa có truyện nào.</p>
      ) : (
        <div className="stories-list">
          {stories.map((story) => (
            <div key={story.id} className="story-item">
              <h3>{story.title}</h3>
              <p>Trạng thái: {story.status}</p>
              <p>Hoàn thành: {story.completionStatus}</p>
              <div className="actions">
                <Link to={`/author/stories/${story.id}/edit`}>
                  <Button>Sửa truyện</Button>
                </Link>
                <Link to={`/author/stories/${story.id}`}>
                  <Button>Quản lý Volume và Chương</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageStories;
