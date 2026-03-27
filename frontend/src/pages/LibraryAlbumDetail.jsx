import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import SkeletonBlock from '../components/SkeletonBlock';
import libraryAlbumService from '../services/libraryAlbumService';
import useNotify from '../hooks/useNotify';
import { resolveImmediateStoryTarget } from '../utils/storyAccess';
import '../styles/library-stories.css';
import '../styles/library-album-detail.css';

const ITEMS_PER_PAGE = 18;
const MIN_STORY_GRID_ITEMS = 12;

const SORT_OPTIONS = [
  { value: 'views', label: 'Lượt xem', defaultDirection: 'desc' },
  { value: 'saved', label: 'Lượt lưu', defaultDirection: 'desc' },
  { value: 'rating', label: 'Rating', defaultDirection: 'desc' },
  { value: 'publishTime', label: 'Thời gian đăng tải', defaultDirection: 'desc' },
];

const DEFAULT_SORT_BY = 'views';
const DEFAULT_SORT_DIRECTION = 'desc';

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const getDefaultSortDirection = (sortBy) =>
  SORT_OPTIONS.find((item) => item.value === sortBy)?.defaultDirection ||
  DEFAULT_SORT_DIRECTION;

const getSortValue = (story, sortBy) => {
  if (sortBy === 'saved') return Number(story?.savedCount || 0);
  if (sortBy === 'rating') return Number(story?.ratingAvg || 0);
  if (sortBy === 'publishTime') {
    const timestamp = Date.parse(story?.createdAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  return Number(story?.readerCount || 0);
};

const sortStories = (list, sortBy, sortDirection) => {
  const safeList = Array.isArray(list) ? [...list] : [];
  const directionFactor = sortDirection === 'asc' ? 1 : -1;

  safeList.sort((left, right) => {
    const leftValue = getSortValue(left, sortBy);
    const rightValue = getSortValue(right, sortBy);

    if (leftValue !== rightValue) {
      return directionFactor * (leftValue - rightValue);
    }

    const leftCreatedAt = Date.parse(left?.createdAt || '') || 0;
    const rightCreatedAt = Date.parse(right?.createdAt || '') || 0;
    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt;
    }

    return String(left?.title || '').localeCompare(String(right?.title || ''), 'vi');
  });

  return safeList;
};

const buildPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 1) return [1];
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  let visiblePages;
  if (currentPage <= 2) {
    visiblePages = [1, 2, 3];
  } else if (currentPage >= totalPages - 1) {
    visiblePages = [totalPages - 2, totalPages - 1, totalPages];
  } else {
    visiblePages = [currentPage - 1, currentPage, currentPage + 1];
  }

  const uniquePages = Array.from(
    new Set([1, ...visiblePages, totalPages].filter(Boolean)),
  ).sort((left, right) => left - right);

  const items = [];
  uniquePages.forEach((page, index) => {
    if (index > 0 && page - uniquePages[index - 1] > 1) {
      items.push(`ellipsis-${page}`);
    }
    items.push(page);
  });
  return items;
};

function LibraryAlbumDetail({ isPublic = false }) {
  const navigate = useNavigate();
  const { albumId } = useParams();
  const { notify } = useNotify();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [sortBy, setSortBy] = useState(DEFAULT_SORT_BY);
  const [sortDirection, setSortDirection] = useState(DEFAULT_SORT_DIRECTION);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchAlbumDetail = async () => {
      try {
        setLoading(true);
        setErrorMessage('');
        const response = isPublic 
          ? await libraryAlbumService.getPublicAlbumDetail(albumId)
          : await libraryAlbumService.getAlbumDetail(albumId);
        if (cancelled) return;
        setAlbum(response || null);
      } catch (error) {
        if (cancelled) return;
        console.error('getAlbumDetail error', error);
        setAlbum(null);
        setErrorMessage(isPublic ? 'Không tìm thấy bộ sưu tập công khai này.' : 'Không tải được bộ sưu tập này.');
        notify(isPublic ? 'Không tìm thấy bộ sưu tập công khai' : 'Không tải được bộ sưu tập', 'error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchAlbumDetail();

    return () => {
      cancelled = true;
    };
  }, [albumId, isPublic, notify]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortBy, sortDirection]);

  const sortedStories = useMemo(
    () => sortStories(album?.stories || [], sortBy, sortDirection),
    [album, sortBy, sortDirection],
  );

  const totalPages = Math.max(1, Math.ceil(sortedStories.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedStories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedStories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedStories, currentPage]);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const storyPlaceholders = useMemo(
    () =>
      Array.from({
        length: Math.max(
          0,
          Math.min(ITEMS_PER_PAGE, MIN_STORY_GRID_ITEMS) - paginatedStories.length,
        ),
      }),
    [paginatedStories.length],
  );

  const handleUnavailableStoryClick = (story) => {
    if (resolveImmediateStoryTarget({ story })) {
      return;
    }
    notify('Truyện này hiện không còn công khai.', 'info');
  };

  const handleSortByChange = (event) => {
    const nextSortBy = event.target.value;
    setSortBy(nextSortBy);
    setSortDirection(getDefaultSortDirection(nextSortBy));
  };

  const toggleSortDirection = () => {
    setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const renderAlbumStorySkeletonGrid = (count = MIN_STORY_GRID_ITEMS) => (
    <div className='library-cover-grid' aria-hidden='true'>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`library-album-story-skeleton-${index}`}
          className='library-cover-card library-cover-card--skeleton'
        >
          <div className='library-cover-card__media'>
            <SkeletonBlock className='library-cover-card__placeholder library-cover-card__placeholder--skeleton' />
            <div className='library-cover-card__overlay'>
              <SkeletonBlock className='library-cover-card__line-skeleton library-cover-card__line-skeleton--title' />
              <SkeletonBlock className='library-cover-card__line-skeleton' />
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <section className='library-album-shell'>
      <div className='library-album-shell__hero'>
        <div className='library-album-page library-album-page--hero-wrap'>
          <div className='library-album-page__hero'>
            <div className='library-album-page__hero-top'>
              <button
                type='button'
                className='library-page__back library-album-page__back'
                onClick={() => navigate('/library?tab=album')}
                aria-label='Quay lại thư viện'
              >
                <ArrowLeft size={28} />
              </button>

              {loading && !album ? (
                <SkeletonBlock className='library-album-page__badge-skeleton' />
              ) : (
                album?.visibility && (
                  <span
                    className={`library-album-page__badge ${
                      album.visibility === 'public'
                        ? 'library-album-page__badge--public'
                        : 'library-album-page__badge--private'
                    }`}
                  >
                    {album.visibility === 'public'
                      ? 'Bộ sưu tập công khai'
                      : 'Bộ sưu tập riêng tư'}
                  </span>
                )
              )}
            </div>

            {loading && !album ? (
              <div
                className='library-album-page__hero-copy-skeleton'
                aria-hidden='true'
              >
                <SkeletonBlock className='library-album-page__title-skeleton' />
                <SkeletonBlock className='library-album-page__line-skeleton' />
                <SkeletonBlock className='library-album-page__line-skeleton' />
                <SkeletonBlock className='library-album-page__line-skeleton library-album-page__line-skeleton--short' />
              </div>
            ) : (
              <>
                <h1>{album?.name || 'Bộ sưu tập'}</h1>
                <p>
                  {album?.description?.trim() ||
                    'Chưa có mô tả cho bộ sưu tập này. Bạn có thể cập nhật mô tả để người đọc hiểu rõ hơn nội dung đã lưu.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className='library-album-shell__band'>
        <div className='library-album-page library-album-page--content-wrap'>
          <div className='library-album-page__content'>
            {loading && (
              <div className='library-panel library-panel--skeleton' aria-hidden='true'>
                <div className='library-album-page__toolbar library-album-page__toolbar--skeleton'>
                  <div className='library-count library-count--skeleton'>
                    <SkeletonBlock className='library-count__value-skeleton' />
                    <SkeletonBlock className='library-count__label-skeleton' />
                  </div>
                  <div className='library-album-page__sort library-album-page__sort--skeleton'>
                    <SkeletonBlock className='library-album-page__sort-label-skeleton' />
                    <div className='library-album-page__sort-controls'>
                      <SkeletonBlock className='library-album-page__sort-input-skeleton' />
                      <SkeletonBlock className='library-album-page__sort-button-skeleton' />
                    </div>
                  </div>
                </div>
                {renderAlbumStorySkeletonGrid()}
                <nav className='library-pagination library-pagination--skeleton'>
                  <SkeletonBlock className='library-pagination__arrow-skeleton' />
                  <div className='library-pagination__pages'>
                    <SkeletonBlock className='library-pagination__page-skeleton active' />
                    <SkeletonBlock className='library-pagination__page-skeleton' />
                    <SkeletonBlock className='library-pagination__page-skeleton' />
                  </div>
                  <SkeletonBlock className='library-pagination__arrow-skeleton' />
                </nav>
              </div>
            )}

            {!loading && errorMessage && (
              <div className='library-page__empty'>
                <p>{errorMessage}</p>
                <button
                  type='button'
                  className='library-album-page__back-home'
                  onClick={() => navigate('/library?tab=album')}
                >
                  Quay lại thư viện
                </button>
              </div>
            )}

            {!loading && !errorMessage && (
              <>
                <div className='library-album-page__toolbar'>
                  <div className='library-count'>
                    <strong>{formatNumber(sortedStories.length)}</strong>
                    <span>truyện</span>
                  </div>

                  {sortedStories.length > 0 && (
                    <div className='library-album-page__sort'>
                      <label htmlFor='library-album-sort'>Sắp xếp theo</label>
                      <div className='library-album-page__sort-controls'>
                        <select
                          id='library-album-sort'
                          value={sortBy}
                          onChange={handleSortByChange}
                        >
                          {SORT_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type='button'
                          className='library-album-page__sort-direction'
                          onClick={toggleSortDirection}
                          aria-label={
                            sortDirection === 'desc'
                              ? 'Đang sắp xếp giảm dần, bấm để đổi thành tăng dần'
                              : 'Đang sắp xếp tăng dần, bấm để đổi thành giảm dần'
                          }
                          title={
                            sortDirection === 'desc'
                              ? 'Đang sắp xếp giảm dần'
                              : 'Đang sắp xếp tăng dần'
                          }
                        >
                          {sortDirection === 'desc' ? (
                            <ArrowUp size={16} />
                          ) : (
                            <ArrowDown size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {sortedStories.length === 0 ? (
                  <div className='library-page__empty'>
                    <p>Album này chưa có truyện nào.</p>
                  </div>
                ) : (
                  <div className='library-cover-grid'>
                    {paginatedStories.map((story) => {
                      const authorName =
                        story.authorPenName || story.authorName || 'Chưa có bút danh';

                      const storyTarget = resolveImmediateStoryTarget({ story });

                      return (
                        <article key={story.id} className='library-cover-card'>
                          {storyTarget ? (
                            <Link
                              to={storyTarget}
                              className='library-cover-card__link'
                            >
                            <div className='library-cover-card__media'>
                              {story.coverUrl ? (
                                <img
                                  src={story.coverUrl}
                                  alt={story.title}
                                  loading='lazy'
                                  decoding='async'
                                />
                              ) : (
                                <div className='library-cover-card__placeholder'>No cover</div>
                              )}

                              <div className='library-cover-card__overlay'>
                                <h3>{story.title}</h3>
                                <p>{authorName}</p>
                              </div>
                            </div>
                            </Link>
                          ) : (
                            <button
                              type='button'
                              className='library-cover-card__link'
                              onClick={() => handleUnavailableStoryClick(story)}
                              style={{
                                width: '100%',
                                padding: 0,
                                border: 'none',
                                background: 'transparent',
                                textAlign: 'inherit',
                              }}
                            >
                              <div className='library-cover-card__media'>
                                {story.coverUrl ? (
                                  <img
                                    src={story.coverUrl}
                                    alt={story.title}
                                    loading='lazy'
                                    decoding='async'
                                  />
                                ) : (
                                  <div className='library-cover-card__placeholder'>No cover</div>
                                )}

                                <div className='library-cover-card__overlay'>
                                  <h3>{story.title}</h3>
                                  <p>{authorName}</p>
                                </div>
                              </div>
                            </button>
                          )}
                        </article>
                      );
                    })}

                    {storyPlaceholders.map((_, index) => (
                      <article
                        key={`album-story-placeholder-${index}`}
                        className='library-cover-card library-cover-card--placeholder'
                        aria-hidden='true'
                      />
                    ))}
                  </div>
                )}

                <nav className='library-pagination' aria-label='Phân trang album'>
                  <button
                    type='button'
                    className='library-pagination__arrow'
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    aria-label='Trang trước'
                  >
                    <ChevronLeft size={18} />
                  </button>

                  <div className='library-pagination__pages'>
                    {paginationItems.map((item) =>
                      typeof item === 'number' ? (
                        <button
                          key={item}
                          type='button'
                          className={`library-pagination__page ${
                            item === currentPage ? 'active' : ''
                          }`}
                          onClick={() => setCurrentPage(item)}
                          aria-current={item === currentPage ? 'page' : undefined}
                        >
                          {item}
                        </button>
                      ) : (
                        <span
                          key={item}
                          className='library-pagination__ellipsis'
                          aria-hidden='true'
                        >
                          ...
                        </span>
                      ),
                    )}
                  </div>

                  <button
                    type='button'
                    className='library-pagination__arrow'
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                    disabled={currentPage === totalPages}
                    aria-label='Trang sau'
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default LibraryAlbumDetail;
