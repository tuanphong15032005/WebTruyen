import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABELS = {
  published: 'Đã xuất bản',
  ongoing: 'Đang tiến hành',
  completed: 'Hoàn thành',
  hiatus: 'Tạm ngưng',
  dropped: 'Đã dừng',
};

const AuthorStories = ({ userId, isDark = false }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const publishedStories = stories.filter(
    (story) => String(story?.status || '').trim().toLowerCase() === 'published',
  );

  useEffect(() => {
    const fetchAuthorStories = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8081/api/users/${userId}/stories`);
        const storiesData = await response.json();
        setStories(storiesData);
      } catch (error) {
        console.error('Error fetching author stories:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchAuthorStories();
    }
  }, [userId]);

  const handleStoryClick = (storyId) => {
    navigate(`/stories/${storyId}/metadata`);
  };

  const primaryTextStyle = { color: 'var(--theme-text-primary)' };
  const secondaryTextStyle = { color: 'var(--theme-text-secondary)' };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
        <p className="mt-2" style={secondaryTextStyle}>
          Đang tải truyện...
        </p>
      </div>
    );
  }

  if (publishedStories.length === 0) {
    return (
      <div className="py-8 text-center">
        <p style={secondaryTextStyle}>Tác giả này chưa có truyện đã xuất bản.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold" style={primaryTextStyle}>
        Truyện đã xuất bản
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {publishedStories.map((story) => {
          const normalizedStatus = String(story.status || '').trim().toLowerCase();
          const statusLabel = STATUS_LABELS[normalizedStatus] || 'Đang cập nhật';

          return (
            <div
              key={story.storyId}
              onClick={() => handleStoryClick(story.storyId)}
              className="group cursor-pointer"
            >
              <div
                className="relative overflow-hidden rounded-lg shadow-md transition-shadow duration-300 hover:shadow-xl"
                style={{
                  background: isDark ? 'var(--theme-surface-base)' : '#ffffff',
                }}
              >
                <div className="aspect-w-3 aspect-h-4 bg-gray-200">
                  {story.coverUrl ? (
                    <img
                      src={story.coverUrl}
                      alt={story.title}
                      className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-64 w-full items-center justify-center bg-gray-300">
                      <span className="text-4xl text-gray-500">📚</span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 to-transparent p-4">
                  <h4 className="line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-blue-300">
                    {story.title}
                  </h4>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-300">{statusLabel}</span>
                    <span className="text-xs text-gray-300">
                      {new Date(story.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AuthorStories;
