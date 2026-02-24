import { useState, useEffect, useCallback } from 'react';
import { getChapterDetail, getChaptersByStory } from '../services/ChapterService';

/**
 * Hook quản lý dữ liệu chương và danh sách chương của truyện.
 * @param {number|string} initialChapterId
 */
const useChapter = (initialChapterId) => {
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [chapter, setChapter] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!initialChapterId) return;
    setChapterId(initialChapterId);
  }, [initialChapterId]);

  useEffect(() => {
    if (!chapterId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getChapterDetail(chapterId)
      .then(async (data) => {
        if (cancelled) return;

        setChapter(data || null);

        if (data?.storyId) {
          try {
            const chapters = await getChaptersByStory(data.storyId);
            if (!cancelled) {
              setAllChapters(Array.isArray(chapters) ? chapters : []);
            }
          } catch {
            if (!cancelled) {
              setAllChapters([]);
            }
          }
        } else if (!cancelled) {
          setAllChapters([]);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Không thể tải chương');
          setChapter(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const navigateToChapter = useCallback((id) => {
    if (!id) return;
    const numericId = Number(id);
    setChapterId(Number.isNaN(numericId) ? id : numericId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const refreshChapter = useCallback(() => {
    const currentId = chapterId;
    setChapterId(null);
    setTimeout(() => setChapterId(currentId), 100);
  }, [chapterId]);

  return {
    chapterId,
    chapter,
    allChapters,
    loading,
    error,
    navigateToChapter,
    refreshChapter,
  };
};

export default useChapter;
