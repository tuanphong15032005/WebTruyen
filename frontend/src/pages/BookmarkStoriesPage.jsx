import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked } from 'lucide-react';
import { getBookmarkStories } from '../services/BookmarkService';
import '../styles/BookmarkStoriesPage.css';

const BookmarkStoriesPage = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookmarkStories = async () => {
      try {
        const data = await getBookmarkStories();
        setStories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to fetch bookmark stories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarkStories();
  }, []);

  const formatLastBookmark = (date) => {
    if (!date) return '';

    const now = new Date();
    const bookmarkDate = new Date(date);
    const diffTime = Math.abs(now - bookmarkDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const isToday = now.toDateString() === bookmarkDate.toDateString();

    if (isToday || diffDays === 0) return 'Đánh dấu hôm nay';
    if (diffDays === 1) return 'Đánh dấu 1 ngày trước';
    if (diffDays < 7) return `Đánh dấu ${diffDays} ngày trước`;
    if (diffDays < 30) return `Đánh dấu ${Math.floor(diffDays / 7)} tuần trước`;
    return `Đánh dấu ${Math.floor(diffDays / 30)} tháng trước`;
  };

  const handleStoryClick = (storyId) => {
    navigate(`/bookmarks/story/${storyId}`);
  };

  return (
    <div className='bookmark-stories-page'>
      <div className='bookmark-stories-page__content'>
        <div className='page-header'>
          <h1>Truyện đã đánh dấu</h1>
          <p>Quản lý các điểm đánh dấu đọc thủ công của bạn trên tất cả truyện</p>
          <div className='total-badge'>Tổng: {stories.length} truyện</div>
        </div>

        {loading ? (
          <div className='loading'>Đang tải...</div>
        ) : (
          <>
            <div className='stories-grid'>
              {stories.map((story) => (
                <div
                  key={story.storyId}
                  className='story-card'
                  onClick={() => handleStoryClick(story.storyId)}
                >
                  <div className='story-cover'>
                    {story.coverImage ? (
                      <img src={story.coverImage} alt={story.title} />
                    ) : (
                      <div className='placeholder-cover'>
                        <BookMarked size={48} />
                      </div>
                    )}
                    <div className='bookmark-count-badge'>{story.bookmarkCount}</div>
                  </div>
                  <div className='story-info'>
                    <h3 className='story-title'>{story.title}</h3>
                    <p className='last-bookmarked'>
                      {formatLastBookmark(story.lastBookmark)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {stories.length === 0 && (
              <div className='empty-state'>
                <BookMarked size={64} />
                <h3>Chưa có đánh dấu nào</h3>
                <p>Bắt đầu đánh dấu các khoảnh khắc đọc yêu thích của bạn</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookmarkStoriesPage;
