import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, BookOpen, Clock } from 'lucide-react';
import { getBookmarkStoryDetails, deleteBookmark } from '../services/BookmarkService';
import '../styles/BookmarkDetailPage.css';

const BookmarkDetailPage = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [storyTitle, setStoryTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarkDetails = async () => {
      try {
        const data = await getBookmarkStoryDetails(storyId);
        setBookmarks(data);
        if (data.length > 0) {
              // Extract story title from the first bookmark
          setStoryTitle(data[0].storyTitle || 'Untitled Story');
        }
      } catch (error) {
        console.error('Failed to fetch bookmark details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchBookmarkDetails();
    }
  }, [storyId]);

  const formatDate = (dateString) => {
    const now = new Date();
    const bookmarkDate = new Date(dateString);
    const diffTime = Math.abs(now - bookmarkDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Check if it's actually today by comparing dates
    const isToday = now.toDateString() === bookmarkDate.toDateString();
    
    // Debug logs
    console.log('formatDate debug:', {
      now: now.toISOString(),
      bookmarkDate: bookmarkDate.toISOString(),
      nowDateString: now.toDateString(),
      bookmarkDateString: bookmarkDate.toDateString(),
      isToday,
      diffTime,
      diffDays
    });
    
    if (isToday) return 'hôm nay';
    if (diffDays === 0) return 'hôm nay';
    if (diffDays === 1) return 'hôm qua';
    if (diffDays < 7) return `${diffDays} ngày trước`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  const handleContinueReading = (bookmark) => {
    navigate(`/stories/${storyId}/chapters/${bookmark.chapterId}${bookmark.segmentId ? `?segmentId=${bookmark.segmentId}` : ''}`);
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await deleteBookmark(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await Promise.all(bookmarks.map(b => deleteBookmark(b.id)));
      setBookmarks([]);
    } catch (error) {
      console.error('Failed to clear all bookmarks:', error);
    }
  };

  const handleBack = () => {
    navigate('/bookmarks');
  };

  if (loading) {
    return (
      <div className="bookmark-detail-page">
        <div className="page-header">
          <div className="header-left">
            <button className="back-button" onClick={handleBack}>
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1>Loading...</h1>
              <p>Your bookmarks</p>
            </div>
          </div>
        </div>
        <div className="loading">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="bookmark-detail-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>{storyTitle}</h1>
            <p>Bookmarks của bạn (đã lưu {bookmarks.length})</p>
          </div>
        </div>
        <div className="header-right">
          {bookmarks.length > 0 && (
            <button className="clear-all-button" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Bookmark List */}
      <div className="bookmark-list">
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id} className="bookmark-card">
            <div className="bookmark-header">
              <h3 className="chapter-title">{bookmark.chapterTitle}</h3>
              <div className="bookmark-meta">
                <Clock size={14} />
                <span>Lưu {formatDate(bookmark.createdAt)}</span>
              </div>
            </div>
            
            <div 
              className="bookmark-content"
              dangerouslySetInnerHTML={{ 
                __html: bookmark.segmentText || 'No content available' 
              }}
            />

            <div className="bookmark-actions">
              <button
                className="continue-button"
                onClick={() => handleContinueReading(bookmark)}
              >
                <BookOpen size={16} />
                Continue Reading
              </button>
              <button
                className="delete-button"
                onClick={() => handleDeleteBookmark(bookmark.id)}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {bookmarks.length === 0 && (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3>No bookmarks for this story</h3>
          <p>Start reading and bookmark your favorite moments</p>
        </div>
      )}
    </div>
  );
};

export default BookmarkDetailPage;
