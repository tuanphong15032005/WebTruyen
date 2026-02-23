import { useState, useEffect, useCallback } from 'react';
import storyService from '../services/storyService';

const useComments = (storyId, chapterId = null) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalElements, setTotalElements] = useState(0);

  // Load comments (same logic as Metadata)
  const loadComments = useCallback(async (pageIndex = 0, append = false) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (chapterId) {
        // Load chapter comments (same API as Metadata)
        response = await storyService.getChapterComments(storyId, chapterId, {
          page: pageIndex,
          size: 8,
        });
      } else {
        // Load story comments (same API as Metadata)
        response = await storyService.getStoryComments(storyId, {
          page: pageIndex,
          size: 8,
        });
      }
      
      const items = Array.isArray(response?.items) ? response.items : [];
      
      if (append) {
        setComments(prev => [...prev, ...items]);
      } else {
        setComments(items);
      }
      
      setPage(Number(response?.page || pageIndex));
      setHasMore(Boolean(response?.hasMore));
      setTotalElements(Number(response?.totalElements || 0));
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load comments');
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [storyId, chapterId]);

  // Add new comment (same logic as Metadata)
  const addComment = useCallback(async (commentData) => {
    try {
      let response;
      
      if (chapterId) {
        // Create chapter comment (same API as Metadata)
        response = await storyService.createChapterComment(storyId, chapterId, commentData);
      } else {
        // Create story comment (same API as Metadata)
        response = await storyService.createStoryComment(storyId, commentData);
      }
      
      // Reload comments to get the updated list (same as Metadata)
      await loadComments(0, false);
      
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add comment';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [storyId, chapterId, loadComments]);

  // Load more comments (same as Metadata)
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadComments(page + 1, true);
    }
  }, [loading, hasMore, page, loadComments]);

  // Initial load
  useEffect(() => {
    if (storyId) {
      loadComments(0, false);
    }
  }, [storyId, chapterId, loadComments]);

  return {
    comments,
    loading,
    error,
    page,
    hasMore,
    totalElements,
    addComment,
    loadMore,
    refreshComments: () => loadComments(0, false),
  };
};

export default useComments;
