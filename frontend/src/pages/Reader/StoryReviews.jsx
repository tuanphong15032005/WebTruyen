import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';
import '../../styles/story-reviews.css';

const STAR_VALUES = [1, 2, 3, 4, 5];
const PAGE_SIZE = 8;

const formatRelativeTime = (value) => {
  if (!value) return 'Chưa cập nhật';
  const date = new Date(value);
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.floor(diffHour / 24)} ngày trước`;
};

const getInitial = (name) => {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  return raw.charAt(0).toUpperCase();
};

const StoryReviews = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [story, setStory] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const fetchReviewsPage = useCallback(
    async (pageIndex, append) => {
      const response = await storyService.getStoryReviews(storyId, {
        page: pageIndex,
        size: PAGE_SIZE,
      });
      const items = Array.isArray(response?.data?.items)
        ? response.data.items
        : [];
      setReviews((prev) => (append ? [...prev, ...items] : items));
      setPage(Number(response?.data?.page || pageIndex));
      setHasMore(Boolean(response?.data?.hasMore));
    },
    [storyId],
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const storyRes = await storyService.getPublicStory(storyId);
      setStory(storyRes?.data || null);
      await fetchReviewsPage(0, false);
    } catch (error) {
      console.error('fetch story reviews page error', error);
      notify('Không tải được dữ liệu đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  }, [fetchReviewsPage, notify, storyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!currentUser) {
      notify('Bạn cần đăng nhập để đánh giá truyện', 'info');
      navigate('/login');
      return;
    }

    if (!rating) {
      notify('Vui lòng chọn số sao', 'info');
      return;
    }

    if (!content.trim()) {
      notify('Vui lòng nhập nội dung đánh giá', 'info');
      return;
    }

    try {
      setSubmitting(true);
      await storyService.upsertStoryReview(storyId, {
        rating,
        content: content.trim(),
      });
      notify('Đã gửi đánh giá', 'success');
      setContent('');
      setRating(0);
      await fetchReviewsPage(0, false);
    } catch (error) {
      console.error('submit review error', error);
      const msg =
        error?.response?.status === 409
          ? 'Bạn đã đánh giá truyện này rồi'
          : 'Không thể gửi đánh giá';
      notify(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    try {
      setLoadingMore(true);
      await fetchReviewsPage(page + 1, true);
    } catch (error) {
      console.error('load more reviews error', error);
      notify('Không thể tải thêm review', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className='story-reviews'>
      <section className='story-reviews__frame'>
        <div className='story-reviews__header'>
          <h2>Đánh giá truyện</h2>
          <Link
            to={`/stories/${storyId}/metadata`}
            className='story-reviews__back'
          >
            ← Quay lại trang chi tiết truyện
          </Link>
        </div>

        {story && <h3 className='story-reviews__story-title'>{story.title}</h3>}

        {!loading && (
          <form className='story-reviews__form' onSubmit={handleSubmit}>
            <p>
              Số điểm của bạn: <strong>{rating}/5</strong>
            </p>
            <div className='story-reviews__stars'>
              {STAR_VALUES.map((star) => (
                <button
                  key={star}
                  type='button'
                  className={`story-reviews__star ${rating >= star ? 'active' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder='Nhập đánh giá của bạn...'
              maxLength={2000}
            />

            <div className='story-reviews__form-footer'>
              <span>{content.trim().length} ký tự</span>
              <button type='submit' disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Đăng đánh giá'}
              </button>
            </div>
          </form>
        )}

        <div className='story-reviews__list'>
          {reviews.map((review) => (
            <article key={review.id} className='story-reviews__item'>
              <div className='story-reviews__item-head'>
                {review.avatarUrl ? (
                  <img src={review.avatarUrl} alt={review.username} />
                ) : (
                  <div className='story-reviews__avatar-fallback'>
                    {getInitial(review.username)}
                  </div>
                )}
                <div>
                  <strong>{review.username}</strong>
                  <div className='story-reviews__item-stars'>
                    {STAR_VALUES.map((star) => (
                      <span
                        key={`${review.id}-${star}`}
                        className={review.rating >= star ? 'active' : ''}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <small>
                    {formatRelativeTime(review.updatedAt || review.createdAt)}
                  </small>
                </div>
              </div>
              <p>{review.content}</p>
            </article>
          ))}
        </div>

        {hasMore && (
          <button
            type='button'
            className='story-reviews__load-more'
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Đang tải...' : 'Xem thêm review →'}
          </button>
        )}
      </section>
    </div>
  );
};

export default StoryReviews;
