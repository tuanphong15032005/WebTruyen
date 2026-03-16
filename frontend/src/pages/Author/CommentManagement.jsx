import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Searchable select: options = [{value, label}], value, onChange, placeholder, disabled, ariaLabel
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Chọn...',
  disabled = false,
  ariaLabel,
  getOptionLabel = (o) => o?.label ?? o?.title ?? String(o),
  getOptionValue = (o) => o?.value ?? o?.id ?? o,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => getOptionLabel(o).toLowerCase().includes(q));
  }, [options, search, getOptionLabel]);

  const selectedOption = useMemo(
    () => options.find((o) => String(getOptionValue(o)) === String(value)),
    [options, value, getOptionValue],
  );
  const displayText = selectedOption ? getOptionLabel(selectedOption) : '';

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const fn = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSelect = (opt) => {
    onChange(getOptionValue(opt));
    setSearch('');
    setOpen(false);
  };

  return (
    <div className='author-comments__searchable' ref={containerRef}>
      <div
        role='combobox'
        aria-expanded={open}
        aria-haspopup='listbox'
        aria-label={ariaLabel}
        className={`author-comments__searchable-trigger ${open ? 'author-comments__searchable-trigger--open' : ''} ${disabled ? 'author-comments__searchable-trigger--disabled' : ''}`}
        onClick={() => !disabled && !open && setOpen(true)}
      >
        <input
          ref={inputRef}
          type='text'
          className='author-comments__searchable-input'
          value={open ? search : displayText}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={!open}
          aria-autocomplete='list'
          autoComplete='off'
        />
      </div>
      {open && (
        <ul className='author-comments__searchable-dropdown' role='listbox'>
          {filteredOptions.map((opt) => {
            const optValue = getOptionValue(opt);
            const optLabel = getOptionLabel(opt);
            const isSelected = String(optValue) === String(value);
            return (
              <li
                key={optValue}
                role='option'
                aria-selected={isSelected}
                className={`author-comments__searchable-option ${isSelected ? 'author-comments__searchable-option--selected' : ''}`}
                onClick={() => handleSelect(opt)}
              >
                {optLabel}
              </li>
            );
          })}
          {filteredOptions.length === 0 && (
            <li className='author-comments__searchable-empty'>Không có kết quả</li>
          )}
        </ul>
      )}
    </div>
  );
};

// Compute fromDate, toDate from period (week|month|year) + optional year, month
const getDateRange = (period, year, month) => {
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  let from, to;
  if (period === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    from = new Date(d.setDate(diff));
    from.setHours(0, 0, 0, 0);
    to = new Date(from);
    to.setDate(to.getDate() + 6);
    to.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    from = new Date(y, m - 1, 1, 0, 0, 0, 0);
    to = new Date(y, m, 0, 23, 59, 59, 999);
  } else if (period === 'year') {
    from = new Date(y, 0, 1, 0, 0, 0, 0);
    to = new Date(y, 11, 31, 23, 59, 59, 999);
  } else {
    return { from: null, to: null };
  }
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
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
  const [timeFilter, setTimeFilter] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

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

  const dateRange = useMemo(() => {
    return getDateRange(timeFilter, filterYear, timeFilter === 'month' ? filterMonth : null);
  }, [timeFilter, filterYear, filterMonth]);

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
      const params = {
        storyId: selectedStoryId,
        chapterId: selectedChapterId ?? undefined,
      };
      if (dateRange?.from && dateRange?.to) {
        params.fromDate = dateRange.from;
        params.toDate = dateRange.to;
      }
      const response = await storyService.getAuthorComments(params);
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
  }, [notify, navigate, selectedChapterId, selectedStoryId, dateRange]);

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

  // Flatten reply tree: [{reply, parentDisplayName}] theo thời gian (Facebook-style flat list).
  const flattenRepliesWithParent = (replies, parentName = '') => {
    const result = [];
    const walk = (list, parent) => {
      if (!Array.isArray(list)) return;
      list.forEach((r) => {
        result.push({ reply: r, parentDisplayName: parent || 'Reader' });
        walk(r.replies || [], r.displayName || 'Reader');
      });
    };
    walk(replies, parentName);
    return result.sort((a, b) => new Date(a.reply.postedTime || 0) - new Date(b.reply.postedTime || 0));
  };

  // Renders one comment — Facebook style: flat layout, không bậc thang.
  const renderComment = (comment, { isReply = false, replyToName } = {}) => {
    const replies = Array.isArray(comment.replies) ? comment.replies : [];
    const flatReplies = !isReply ? flattenRepliesWithParent(replies, comment.displayName) : [];
    const actualReplying = replyForId === comment.id;
    const isActing = actingCommentId === comment.id;
    const statusLabel = comment.status === 'Normal' ? 'Normal' : comment.status === 'Reported' ? 'Reported' : comment.status === 'Hidden' ? 'Hidden' : (comment.status || 'Normal');

    return (
      <article
        key={comment.id}
        className={`author-comments__item ${isReply ? 'author-comments__item--reply' : ''}`}
        role='listitem'
      >
        <div className='author-comments__avatar' aria-hidden='true'>
          {comment.avatarUrl ? (
            <img src={comment.avatarUrl} alt='' />
          ) : (
            <span aria-hidden='true'>{getInitial(comment.displayName)}</span>
          )}
        </div>

        <div className='author-comments__body'>
          <div className='author-comments__head'>
            {replyToName && (
              <span className='author-comments__reply-to'>Trả lời {replyToName}</span>
            )}
            <strong className='author-comments__name'>{comment.displayName || 'Reader'}</strong>
            <time className='author-comments__time' dateTime={comment.postedTime || ''}>
              {formatDateTime(comment.postedTime)}
            </time>
            <span className={`author-comments__status author-comments__status--${statusClassName(comment.status)}`} title='Comment status'>
              {statusLabel}
            </span>
          </div>

          <p className='author-comments__content'>{comment.content}</p>

          <div className='author-comments__actions'>
            <button
              type='button'
              className='author-comments__btn author-comments__btn--reply'
              onClick={() => setReplyForId((prev) => (prev === comment.id ? null : comment.id))}
              aria-label='Reply to this comment'
            >
              Phản hồi
            </button>
            <button
              type='button'
              className='author-comments__btn author-comments__btn--delete'
              onClick={() => handleDelete(comment.id)}
              disabled={isActing}
              aria-label='Delete comment'
            >
              {isActing ? '…' : 'Xóa'}
            </button>
          </div>

          {actualReplying && (
            <div className='author-comments__reply-box'>
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder='Viết phản hồi…'
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
                  {isActing ? 'Đang gửi…' : 'Gửi'}
                </button>
              </div>
            </div>
          )}

          {flatReplies.length > 0 && (
            <div className='author-comments__replies' role='list'>
              {flatReplies.map(({ reply, parentDisplayName }) =>
                renderComment(reply, {
                  isReply: true,
                  replyToName: parentDisplayName,
                })
              )}
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

      {/* Field 1: Story selector (searchable) | Field 2: Chapter selector (searchable) */}
      <section className='author-comments__filters' aria-label='Filters'>
        <label className='author-comments__filter-group'>
          <span className='author-comments__label'>Truyện</span>
          <SearchableSelect
            options={stories}
            value={storyId}
            onChange={(v) => setStoryId(String(v ?? ''))}
            placeholder={loadingStories ? 'Đang tải...' : 'Tìm kiếm truyện...'}
            disabled={loadingStories}
            ariaLabel='Chọn truyện để xem bình luận'
            getOptionLabel={(o) => o?.title ?? ''}
            getOptionValue={(o) => o?.id ?? ''}
          />
        </label>
        <label className='author-comments__filter-group'>
          <span className='author-comments__label'>Chương</span>
          <SearchableSelect
            options={[{ id: '', title: 'Tất cả chương' }, ...chapters]}
            value={chapterId}
            onChange={(v) => setChapterId(String(v ?? ''))}
            placeholder={loadingChapters ? 'Đang tải...' : 'Tìm kiếm chương...'}
            disabled={!selectedStoryId || loadingChapters}
            ariaLabel='Chọn chương để xem bình luận'
            getOptionLabel={(o) => o?.id === '' ? 'Tất cả chương' : (o?.sequenceIndex ? `Ch. ${o.sequenceIndex}: ${o.title}` : o?.title ?? '')}
            getOptionValue={(o) => o?.id ?? ''}
          />
        </label>
        <label className='author-comments__filter-group'>
          <span className='author-comments__label'>Lọc theo thời gian</span>
          <select
            className='author-comments__select'
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            aria-label='Lọc bình luận theo tuần, tháng, năm'
          >
            <option value='all'>Tất cả</option>
            <option value='week'>Tuần này</option>
            <option value='month'>Tháng này</option>
            <option value='year'>Năm này</option>
          </select>
        </label>
        {timeFilter === 'month' && (
          <>
            <label className='author-comments__filter-group'>
              <span className='author-comments__label'>Năm</span>
              <select
                className='author-comments__select'
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            <label className='author-comments__filter-group'>
              <span className='author-comments__label'>Tháng</span>
              <select
                className='author-comments__select'
                value={filterMonth}
                onChange={(e) => setFilterMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>
          </>
        )}
        {timeFilter === 'year' && (
          <label className='author-comments__filter-group'>
            <span className='author-comments__label'>Năm</span>
            <select
              className='author-comments__select'
              value={filterYear}
              onChange={(e) => setFilterYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>
        )}
      </section>

      {/* Field 3: Comment list (list / thread view) — Display comments in threaded format (comment – reply). */}
      <section className='author-comments__list-section' aria-label='Comment list'>
        <h2 className='author-comments__list-title'>Bình luận</h2>
        <div className='author-comments__list' role='list'>
          {loadingComments && <p className='author-comments__empty'>Đang tải bình luận...</p>}
          {!loadingComments && comments.length === 0 && (
            <p className='author-comments__empty'>Chưa có bình luận cho truyện hoặc chương này.</p>
          )}
          {!loadingComments && comments.map((comment) => renderComment(comment))}
        </div>
      </section>
    </div>
  );
};

export default CommentManagement;
