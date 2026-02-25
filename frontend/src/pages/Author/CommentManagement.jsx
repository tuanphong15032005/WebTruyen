import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/author-comment-management.css';

const isUnauthorized = (err) =>
  err?.response?.status === 401 || /unauthorized|đăng nhập|login/i.test(String(err?.message || ''));

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
};

const getInitial = (name) => {
  const value = String(name || '').trim();
  return value ? value.charAt(0).toUpperCase() : '?';
};

const statusClassName = (status) => {
  const key = String(status || '').toLowerCase();
  if (key === 'hidden') return 'hidden';
  if (key === 'reported') return 'reported';
  return 'normal';
};

const CommentManagement = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialStoryId = searchParams.get('storyId');
  const { notify } = useNotify();

  const [stories, setStories] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [comments, setComments] = useState([]);

  const [storyId, setStoryId] = useState(initialStoryId || '');
  const [chapterId, setChapterId] = useState('');

  const [loadingStories, setLoadingStories] = useState(false);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  const [replyForId, setReplyForId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [actingCommentId, setActingCommentId] = useState(null);

  const selectedStoryId = useMemo(() => {
    const value = Number(storyId);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [storyId]);

  const selectedChapterId = useMemo(() => {
    if (!chapterId) return null;
    const value = Number(chapterId);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [chapterId]);

  const fetchStories = useCallback(async () => {
    try {
      setLoadingStories(true);
      const response = await storyService.getAuthorCommentStories();
      const list = Array.isArray(response) ? response : [];
      setStories(list);
      if (!storyId && list.length > 0) {
        setStoryId(String(list[0].id));
      }
    } catch (error) {
      console.error('getAuthorCommentStories error', error);
      if (isUnauthorized(error)) {
        notify('Vui lòng đăng nhập để quản lý bình luận', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể tải danh sách truyện', 'error');
    } finally {
      setLoadingStories(false);
    }
  }, [notify, navigate, storyId]);

  const fetchChapters = useCallback(async () => {
    if (!selectedStoryId) {
      setChapters([]);
      return;
    }
    try {
      setLoadingChapters(true);
      const response = await storyService.getAuthorCommentChapters(selectedStoryId);
      const list = Array.isArray(response) ? response : [];
      const sorted = [...list].sort(
        (a, b) => Number(a.sequenceIndex || 0) - Number(b.sequenceIndex || 0),
      );
      setChapters(sorted);
    } catch (error) {
      console.error('getAuthorCommentChapters error', error);
      if (isUnauthorized(error)) {
        notify('Vui lòng đăng nhập để quản lý bình luận', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể tải danh sách chương', 'error');
    } finally {
      setLoadingChapters(false);
    }
  }, [notify, navigate, selectedStoryId]);

  const fetchComments = useCallback(async () => {
    if (!selectedStoryId) {
      setComments([]);
      return;
    }
    try {
      setLoadingComments(true);
      const response = await storyService.getAuthorComments({
        storyId: selectedStoryId,
        chapterId: selectedChapterId ?? undefined,
      });
      setComments(Array.isArray(response) ? response : []);
      setReplyForId(null);
      setReplyContent('');
    } catch (error) {
      console.error('getAuthorComments error', error);
      if (isUnauthorized(error)) {
        notify('Vui lòng đăng nhập để quản lý bình luận', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể tải bình luận', 'error');
    } finally {
      setLoadingComments(false);
    }
  }, [notify, navigate, selectedChapterId, selectedStoryId]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    setChapterId('');
    fetchChapters();
  }, [fetchChapters]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleReply = async (commentId) => {
    if (!replyContent.trim()) {
      notify('Vui lòng nhập nội dung phản hồi', 'info');
      return;
    }
    try {
      setActingCommentId(commentId);
      await storyService.replyAuthorComment(commentId, {
        content: replyContent.trim(),
      });
      setReplyForId(null);
      setReplyContent('');
      notify('Đã gửi phản hồi', 'success');
      await fetchComments();
    } catch (error) {
      console.error('replyAuthorComment error', error);
      if (isUnauthorized(error)) {
        notify('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể gửi phản hồi', 'error');
    } finally {
      setActingCommentId(null);
    }
  };

  const handleHide = async (commentId) => {
    try {
      setActingCommentId(commentId);
      await storyService.hideAuthorComment(commentId);
      notify('Đã ẩn bình luận', 'success');
      await fetchComments();
    } catch (error) {
      console.error('hideAuthorComment error', error);
      if (isUnauthorized(error)) {
        notify('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể ẩn bình luận', 'error');
    } finally {
      setActingCommentId(null);
    }
  };

  const handleUnhide = async (commentId) => {
    try {
      setActingCommentId(commentId);
      await storyService.unhideAuthorComment(commentId);
      notify('Đã hiện lại bình luận', 'success');
      await fetchComments();
    } catch (error) {
      console.error('unhideAuthorComment error', error);
      if (isUnauthorized(error)) {
        notify('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể hiện lại bình luận', 'error');
    } finally {
      setActingCommentId(null);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      setActingCommentId(commentId);
      await storyService.deleteAuthorComment(commentId);
      notify('Đã xóa bình luận', 'success');
      await fetchComments();
    } catch (error) {
      console.error('deleteAuthorComment error', error);
      if (isUnauthorized(error)) {
        notify('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'error');
        navigate('/login', { replace: true, state: { from: '/author/comments' } });
        return;
      }
      notify('Không thể xóa bình luận', 'error');
    } finally {
      setActingCommentId(null);
    }
  };

  // Renders one comment (or reply) with Fields 4–10: avatar, display name, content, time, status, Reply, Hide/Delete.
  const renderNode = (comment) => {
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    const isReplying = replyForId === comment.id;
    const isActing = actingCommentId === comment.id;
    const statusLabel = comment.status === 'Normal' ? 'Normal' : comment.status === 'Reported' ? 'Reported' : comment.status === 'Hidden' ? 'Hidden' : (comment.status || 'Normal');

    return (
      <article key={comment.id} className='author-comments__item' role='listitem'>
        {/* Field 4: Reader avatar (display field) */}
        <div className='author-comments__avatar' aria-hidden='true'>
          {comment.avatarUrl ? (
            <img src={comment.avatarUrl} alt='' />
          ) : (
            <span aria-hidden='true'>{getInitial(comment.displayName)}</span>
          )}
        </div>

        <div className='author-comments__body'>
          {/* Field 5: Reader display name | Field 7: Comment posted time | Field 8: Comment status (Normal / Reported / Hidden) */}
          <div className='author-comments__head'>
            <strong className='author-comments__name'>{comment.displayName || 'Reader'}</strong>
            <time className='author-comments__time' dateTime={comment.postedTime || ''}>
              {formatDateTime(comment.postedTime)}
            </time>
            <span className={`author-comments__status author-comments__status--${statusClassName(comment.status)}`} title='Comment status'>
              {statusLabel}
            </span>
          </div>

          {/* Field 6: Comment content (display field) */}
          <p className='author-comments__content'>{comment.content}</p>

          {/* Field 9: Reply action (action button) | Field 10: Hide / Delete action (action buttons) */}
          <div className='author-comments__actions'>
            <button
              type='button'
              className='author-comments__btn author-comments__btn--reply'
              onClick={() => setReplyForId((prev) => (prev === comment.id ? null : comment.id))}
              aria-label='Reply to this comment'
            >
              Reply
            </button>
            {String(comment.status || '').toLowerCase() === 'hidden' ? (
              <button
                type='button'
                className='author-comments__btn author-comments__btn--unhide'
                onClick={() => handleUnhide(comment.id)}
                disabled={isActing}
                aria-label='Unhide comment'
              >
                {isActing ? '…' : 'Unhide'}
              </button>
            ) : (
              <button
                type='button'
                className='author-comments__btn author-comments__btn--hide'
                onClick={() => handleHide(comment.id)}
                disabled={isActing}
                aria-label='Hide comment'
              >
                {isActing ? '…' : 'Hide'}
              </button>
            )}
            <button
              type='button'
              className='author-comments__btn author-comments__btn--delete'
              onClick={() => handleDelete(comment.id)}
              disabled={isActing}
              aria-label='Delete comment'
            >
              {isActing ? '…' : 'Delete'}
            </button>
          </div>

          {isReplying && (
            <div className='author-comments__reply-box'>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder='Write your reply…'
                maxLength={4000}
                aria-label='Reply text'
              />
              <div className='author-comments__reply-footer'>
                <span>{replyContent.trim().length} / 4000</span>
                <button
                  type='button'
                  className='author-comments__btn author-comments__btn--submit'
                  onClick={() => handleReply(comment.id)}
                  disabled={isActing}
                >
                  {isActing ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </div>
          )}

          {replies.length > 0 && (
            <div className='author-comments__replies' role='list'>
              {replies.map((reply) => renderNode(reply))}
            </div>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className='author-comments' role='region' aria-label='Comment Management'>
      {/* Mô tả màn hình theo spec: Authors access the Comment Management screen to manage and respond to reader comments. */}
      <header className='author-comments__header'>
        <h1 className='author-comments__title'>Comment Management</h1>
        <p className='author-comments__desc'>
          Manage and respond to reader comments on each story chapter. View, reply, and moderate comments that violate community guidelines.
        </p>
      </header>

      {/* Field 1: Story selector (dropdown) — Select the story for which comments will be displayed. */}
      {/* Field 2: Chapter selector (dropdown) — Select a specific chapter to view related comments. */}
      <section className='author-comments__filters' aria-label='Filters'>
        <label className='author-comments__filter-group'>
          <span className='author-comments__label'>Story</span>
          <select
            className='author-comments__select'
            value={storyId}
            onChange={(e) => setStoryId(e.target.value)}
            disabled={loadingStories}
            aria-label='Select the story for which comments will be displayed'
          >
            <option value=''>{loadingStories ? 'Loading...' : 'Select story'}</option>
            {stories.map((story) => (
              <option key={story.id} value={story.id}>{story.title}</option>
            ))}
          </select>
        </label>
        <label className='author-comments__filter-group'>
          <span className='author-comments__label'>Chapter</span>
          <select
            className='author-comments__select'
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            disabled={!selectedStoryId || loadingChapters}
            aria-label='Select a specific chapter to view related comments'
          >
            <option value=''>{loadingChapters ? 'Loading...' : 'All chapters'}</option>
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>
                {chapter.sequenceIndex ? `Ch. ${chapter.sequenceIndex}: ${chapter.title}` : chapter.title}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Field 3: Comment list (list / thread view) — Display comments in threaded format (comment – reply). */}
      <section className='author-comments__list-section' aria-label='Comment list'>
        <h2 className='author-comments__list-title'>Comments</h2>
        <div className='author-comments__list' role='list'>
          {loadingComments && <p className='author-comments__empty'>Loading comments...</p>}
          {!loadingComments && comments.length === 0 && (
            <p className='author-comments__empty'>No comments for this story or chapter.</p>
          )}
          {!loadingComments && comments.map((comment) => renderNode(comment))}
        </div>
      </section>
    </div>
  );
};

export default CommentManagement;
