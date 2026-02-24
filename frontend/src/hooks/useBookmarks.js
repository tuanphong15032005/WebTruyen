import { useState, useEffect, useCallback } from 'react';
import {
  getBookmarksByChapter,
  createBookmark,
  deleteBookmark,
} from '../services/BookmarkService';

const getBookmarkSegmentId = (bookmark) =>
  Number(bookmark?.segmentId ?? bookmark?.segment?.id ?? bookmark?.chapterSegmentId ?? 0);

/**
 * Hook quản lý bookmark của user theo chương.
 * @param {number|string} chapterId
 */
const useBookmarks = (chapterId) => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!chapterId) {
      setBookmarks([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getBookmarksByChapter(chapterId)
      .then((data) => {
        if (!cancelled) {
          setBookmarks(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBookmarks([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  /**
   * Toggle bookmark cho mot segment.
   * @param {{ segmentId: number, text: string, positionPercent?: number }} options
   */
  const toggleBookmark = useCallback(
    async ({ segmentId, text, positionPercent }) => {
      const normalizedSegmentId = Number(segmentId);
      if (!chapterId || !normalizedSegmentId) {
        throw new Error('Không xác định được segment để bookmark');
      }

      const existing = bookmarks.find(
        (bookmark) => getBookmarkSegmentId(bookmark) === normalizedSegmentId,
      );

      if (existing) {
        await deleteBookmark(existing.id);
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== existing.id));
        return;
      }

      const created = await createBookmark({
        chapterId,
        segmentId: normalizedSegmentId,
        positionPercent,
        isFavorite: false,
      });

      const normalizedCreated = {
        ...created,
        segmentId: Number(created?.segmentId ?? created?.segment?.id ?? normalizedSegmentId),
        text,
      };
      setBookmarks((prev) => [...prev, normalizedCreated]);
    },
    [bookmarks, chapterId],
  );

  const removeBookmark = useCallback(async (bookmarkId) => {
    await deleteBookmark(bookmarkId);
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== bookmarkId));
  }, []);

  return { bookmarks, loading, toggleBookmark, removeBookmark, getBookmarkSegmentId };
};

export default useBookmarks;
