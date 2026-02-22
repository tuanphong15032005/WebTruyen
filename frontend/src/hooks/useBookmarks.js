import { useState, useEffect, useCallback } from 'react';
import {
  getBookmarksByChapter,
  createBookmark,
  deleteBookmark,
} from '../services/bookmarkService';

/**
 * Hook quản lý bookmark của user theo chương.
 * @param {number|string} chapterId
 */
const useBookmarks = (chapterId) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) return;

    let cancelled = false;
    setLoading(true);

    getBookmarksByChapter(chapterId)
      .then((data) => {
        if (!cancelled) setBookmarks(data);
      })
      .catch(() => {
        // Bookmark không critical – không block UI
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  /**
   * Toggle bookmark cho một segment.
   * Nếu đã có bookmark → xóa; chưa có → tạo mới.
   * @param {{ segmentId: number, text: string, positionPercent?: number }} options
   */
  const toggleBookmark = useCallback(
    async ({ segmentId, text, positionPercent }) => {
      const existing = bookmarks.find((b) => b.segmentId === segmentId);

      if (existing) {
        await deleteBookmark(existing.id);
        setBookmarks((prev) => prev.filter((b) => b.id !== existing.id));
      } else {
        const newBookmark = await createBookmark({
          chapterId,
          segmentId,
          positionPercent,
          isFavorite: false,
        });
        // Enrich với text để hiển thị trong side panel
        setBookmarks((prev) => [...prev, { ...newBookmark, text }]);
      }
    },
    [bookmarks, chapterId]
  );

  const removeBookmark = useCallback(
    async (bookmarkId) => {
      await deleteBookmark(bookmarkId);
      setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
    },
    []
  );

  return { bookmarks, loading, toggleBookmark, removeBookmark };
};

export default useBookmarks;