import { useState, useEffect, useCallback } from 'react';
import { getChapterDetail, getChaptersByStory } from '../services/chapterService';

/**
 * Hook quản lý dữ liệu chương và danh sách chương của truyện.
 * @param {number|string} initialChapterId - ID chương ban đầu
 */
const useChapter = (initialChapterId) => {
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [chapter, setChapter] = useState(null);
  const [allChapters, setAllChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy chi tiết chương khi chapterId thay đổi
  useEffect(() => {
    if (!chapterId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getChapterDetail(chapterId)
      .then((data) => {
        if (cancelled) return;
        setChapter(data);

        // Khi lần đầu load, lấy danh sách chương của truyện
        if (data.storyId && allChapters.length === 0) {
          getChaptersByStory(data.storyId)
            .then((chapters) => {
              if (!cancelled) setAllChapters(chapters);
            })
            .catch(() => {
              // Không block UI nếu không lấy được danh sách chương
            });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId]);

  const navigateToChapter = useCallback((id) => {
    setChapterId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return {
    chapterId,
    chapter,
    allChapters,
    loading,
    error,
    navigateToChapter,
  };
};

export default useChapter;