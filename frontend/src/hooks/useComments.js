import { useCallback, useEffect, useState } from 'react';
import storyService from '../services/storyService';

const DEFAULT_PAGE_SIZE = 8;

const normalizeCommentNode = (comment) => ({
  ...comment,
  replies: Array.isArray(comment?.replies)
    ? comment.replies.map(normalizeCommentNode)
    : [],
});

const useComments = (storyId, chapterId, pageSize = DEFAULT_PAGE_SIZE) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchCommentsPage = useCallback(
    async (pageIndex = 0, append = false) => {
      if (!storyId || !chapterId) {
        setComments([]);
        setPage(0);
        setHasMore(false);
        setTotal(0);
        return;
      }

      if (append) {
        setLoadingMoreComments(true);
      } else {
        setLoadingComments(true);
      }
      setError(null);

      try {
        const response = await storyService.getChapterComments(storyId, chapterId, {
          page: pageIndex,
          size: pageSize,
        });
        const items = Array.isArray(response?.items)
          ? response.items.map(normalizeCommentNode)
          : [];

        setComments((prev) => (append ? [...prev, ...items] : items));
        setPage(Number(response?.page ?? pageIndex));
        setHasMore(Boolean(response?.hasMore));
        setTotal(Number(response?.totalElements ?? 0));
      } catch (err) {
        setError(err?.message || 'Không thể tải bình luận');
      } finally {
        if (append) {
          setLoadingMoreComments(false);
        } else {
          setLoadingComments(false);
        }
      }
    },
    [chapterId, pageSize, storyId],
  );

  useEffect(() => {
    fetchCommentsPage(0, false);
  }, [fetchCommentsPage]);

  const createComment = useCallback(
    async ({ content, parentCommentId = null }) => {
      if (!storyId || !chapterId) {
        throw new Error('Không xác định được chapter để bình luận');
      }
      const normalizedContent = String(content || '').trim();
      if (!normalizedContent) {
        throw new Error('Vui lòng nhập nội dung bình luận');
      }

      setSubmittingComment(true);
      try {
        const response = await storyService.createChapterComment(storyId, chapterId, {
          content: normalizedContent,
          parentCommentId,
        });

        await fetchCommentsPage(0, false);
        return response;
      } finally {
        setSubmittingComment(false);
      }
    },
    [chapterId, fetchCommentsPage, storyId],
  );

  const updateComment = useCallback(
    async (commentId, content) => {
      if (!storyId || !chapterId) {
        throw new Error('Không xác định được chapter để cập nhật bình luận');
      }

      const normalizedContent = String(content || '').trim();
      if (!normalizedContent) {
        throw new Error('Vui lòng nhập nội dung bình luận');
      }

      setSubmittingComment(true);
      try {
        const response = await storyService.updateChapterComment(
          storyId,
          chapterId,
          commentId,
          { content: normalizedContent },
        );
        await fetchCommentsPage(0, false);
        return response;
      } finally {
        setSubmittingComment(false);
      }
    },
    [chapterId, fetchCommentsPage, storyId],
  );

  const deleteComment = useCallback(
    async (commentId) => {
      if (!storyId || !chapterId) {
        throw new Error('Không xác định được chapter để xóa bình luận');
      }
      await storyService.deleteChapterComment(storyId, chapterId, commentId);
      await fetchCommentsPage(0, false);
    },
    [chapterId, fetchCommentsPage, storyId],
  );

  const reportComment = useCallback(
    async (commentId, reason) => {
      if (!storyId || !chapterId) {
        throw new Error('Không xác định được chapter để báo cáo bình luận');
      }
      const normalizedReason = String(reason || '').trim();
      if (!normalizedReason) {
        throw new Error('Vui lòng nhập lý do báo cáo');
      }
      await storyService.reportChapterComment(storyId, chapterId, commentId, {
        reason: normalizedReason,
      });
    },
    [chapterId, storyId],
  );

  const loadMoreComments = useCallback(async () => {
    if (!hasMore || loadingMoreComments || loadingComments) return;
    await fetchCommentsPage(page + 1, true);
  }, [fetchCommentsPage, hasMore, loadingComments, loadingMoreComments, page]);

  return {
    comments,
    loadingComments,
    loadingMoreComments,
    submittingComment,
    error,
    hasMore,
    total,
    createComment,
    updateComment,
    deleteComment,
    reportComment,
    loadMoreComments,
    refreshComments: () => fetchCommentsPage(0, false),
  };
};

export default useComments;
