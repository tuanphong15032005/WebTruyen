import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Heart,
} from 'lucide-react';
import SkeletonBlock from '../components/SkeletonBlock';
import libraryAlbumService from '../services/libraryAlbumService';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/library-stories.css';

const STORY_ITEMS_PER_PAGE = 18;
const ALBUM_ITEMS_PER_PAGE = 9;
const MIN_STORY_GRID_ITEMS = 12;
const TAB_TRANSITION_MS = 220;

const TAB_OPTIONS = [
  { key: 'reading', label: 'Đang đọc', icon: BookOpen },
  { key: 'plan_to_read', label: 'Sẽ đọc', icon: BookMarked },
  { key: 'completed', label: 'Đã đọc xong', icon: CheckCircle2 },
  { key: 'favorite', label: 'Yêu thích', icon: Heart },
  { key: 'album', label: 'Album', icon: Folder },
];

const EMPTY_MESSAGES = {
  reading: 'Bạn chưa có truyện nào ở mục đang đọc.',
  plan_to_read: 'Bạn chưa lưu truyện nào vào mục sẽ đọc.',
  completed: 'Bạn chưa đánh dấu hoàn thành truyện nào.',
  favorite: 'Bạn chưa thả tim truyện nào trong thư viện.',
  album: 'Bạn chưa có album nào trong thư viện.',
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const matchesTab = (story, tabKey) => {
  const readingStatus = String(story?.readingStatus || '').toLowerCase();
  if (tabKey === 'favorite') return Boolean(story?.favorite);
  return readingStatus === tabKey;
};

const resolveInitialTab = (tabValue) =>
  TAB_OPTIONS.some((tab) => tab.key === tabValue) ? tabValue : 'reading';

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

function LibraryStories() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { notify } = useNotify();
  const tabsRef = useRef(null);
  const tabButtonRefs = useRef({});
  const initialTab = resolveInitialTab(searchParams.get('tab'));
  const [stories, setStories] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visibleTab, setVisibleTab] = useState(initialTab);
  const [currentPage, setCurrentPage] = useState(1);
  const [panelState, setPanelState] = useState('idle');
  const [panelDirection, setPanelDirection] = useState(1);
  const [tabIndicatorStyle, setTabIndicatorStyle] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLibraryData = async () => {
      setLoading(true);

      const [storiesResult, albumsResult] = await Promise.allSettled([
        storyService.getLibraryStories(),
        libraryAlbumService.getAlbums(),
      ]);

      if (cancelled) return;

      if (storiesResult.status === 'fulfilled') {
        setStories(Array.isArray(storiesResult.value) ? storiesResult.value : []);
      } else {
        console.error('getLibraryStories error', storiesResult.reason);
        setStories([]);
        notify('Không tải được danh sách truyện trong thư viện', 'error');
      }

      if (albumsResult.status === 'fulfilled') {
        setAlbums(Array.isArray(albumsResult.value) ? albumsResult.value : []);
      } else {
        console.error('getAlbums error', albumsResult.reason);
        setAlbums([]);
        notify('Không tải được danh sách album', 'error');
      }

      setLoading(false);
    };

    fetchLibraryData();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  const tabCounts = useMemo(
    () =>
      TAB_OPTIONS.reduce((accumulator, tab) => {
        accumulator[tab.key] =
          tab.key === 'album'
            ? albums.length
            : stories.filter((story) => matchesTab(story, tab.key)).length;
        return accumulator;
      }, {}),
    [stories, albums],
  );

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const container = tabsRef.current;
      const activeButton = tabButtonRefs.current[activeTab];
      if (!container || !activeButton) {
        setTabIndicatorStyle(null);
        return;
      }

      setTabIndicatorStyle({
        left: activeButton.offsetLeft,
        top: activeButton.offsetTop,
        width: activeButton.offsetWidth,
        height: activeButton.offsetHeight,
      });
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [activeTab, tabCounts]);

  useEffect(() => {
    if (activeTab === visibleTab) {
      return undefined;
    }

    setPanelState('exit');
    const exitTimer = window.setTimeout(() => {
      setVisibleTab(activeTab);
      setCurrentPage(1);
      setPanelState('enter');
    }, TAB_TRANSITION_MS);

    return () => window.clearTimeout(exitTimer);
  }, [activeTab, visibleTab]);

  useEffect(() => {
    if (panelState !== 'enter') {
      return undefined;
    }

    const enterTimer = window.setTimeout(() => {
      setPanelState('idle');
    }, TAB_TRANSITION_MS);

    return () => window.clearTimeout(enterTimer);
  }, [panelState]);

  const filteredStories = useMemo(
    () => stories.filter((story) => matchesTab(story, visibleTab)),
    [stories, visibleTab],
  );

  const visibleAlbums = useMemo(
    () => (visibleTab === 'album' ? albums : []),
    [albums, visibleTab],
  );

  const itemsPerPage =
    visibleTab === 'album' ? ALBUM_ITEMS_PER_PAGE : STORY_ITEMS_PER_PAGE;
  const activeItemCount =
    visibleTab === 'album' ? visibleAlbums.length : filteredStories.length;

  const totalPages = Math.max(1, Math.ceil(activeItemCount / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedStories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStories, currentPage, itemsPerPage]);

  const paginatedAlbums = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return visibleAlbums.slice(startIndex, startIndex + itemsPerPage);
  }, [visibleAlbums, currentPage, itemsPerPage]);

  const paginationItems = useMemo(
    () => buildPaginationItems(currentPage, totalPages),
    [currentPage, totalPages],
  );

  const storyPlaceholders = useMemo(
    () =>
      Array.from({
        length: Math.max(
          0,
          Math.min(STORY_ITEMS_PER_PAGE, MIN_STORY_GRID_ITEMS) - paginatedStories.length,
        ),
      }),
    [paginatedStories.length],
  );

  const albumPlaceholders = useMemo(
    () =>
      Array.from({
        length: Math.max(0, ALBUM_ITEMS_PER_PAGE - paginatedAlbums.length),
      }),
    [paginatedAlbums.length],
  );

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;

    const currentIndex = TAB_OPTIONS.findIndex((tab) => tab.key === activeTab);
    const nextIndex = TAB_OPTIONS.findIndex((tab) => tab.key === nextTab);
    setPanelDirection(nextIndex >= currentIndex ? 1 : -1);
    setActiveTab(nextTab);
  };

  const renderStorySkeletonGrid = (count = MIN_STORY_GRID_ITEMS) => (
    <div className='library-cover-grid' aria-hidden='true'>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`library-story-skeleton-${index}`}
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

  const renderAlbumSkeletonGrid = (count = 6) => (
    <div className='library-album-grid' aria-hidden='true'>
      {Array.from({ length: count }, (_, index) => (
        <article
          key={`library-album-skeleton-${index}`}
          className='library-album-card library-album-card--skeleton'
        >
          <div className='library-album-card__mosaic'>
            <SkeletonBlock className='library-album-card__tile library-album-card__tile--primary' />
            <SkeletonBlock className='library-album-card__tile' />
            <SkeletonBlock className='library-album-card__tile' />
          </div>
          <div className='library-album-card__body'>
            <SkeletonBlock className='library-album-card__line-skeleton library-album-card__line-skeleton--title' />
            <SkeletonBlock className='library-album-card__line-skeleton' />
            <SkeletonBlock className='library-album-card__line-skeleton library-album-card__line-skeleton--short' />
          </div>
        </article>
      ))}
    </div>
  );

  return (
    <section className='library-shell'>
      <div className='library-shell__hero'>
        <div className='library-page library-page--hero'>
          <header className='library-page__top'>
            <button
              type='button'
              className='library-page__back'
              onClick={() => navigate(-1)}
              aria-label='Quay lại'
            >
              <ArrowLeft size={28} />
            </button>

            <h1 className='library-page__title'>Thư viện</h1>
          </header>

          <div
            ref={tabsRef}
            className={`library-tabs ${tabIndicatorStyle ? 'library-tabs--ready' : ''}`}
            role='tablist'
            aria-label='Bộ lọc thư viện'
          >
            {tabIndicatorStyle && (
              <span
                className='library-tabs__indicator'
                aria-hidden='true'
                style={{
                  left: `${tabIndicatorStyle.left}px`,
                  top: `${tabIndicatorStyle.top}px`,
                  width: `${tabIndicatorStyle.width}px`,
                  height: `${tabIndicatorStyle.height}px`,
                }}
              />
            )}

            {TAB_OPTIONS.map((tab) => {
              const Icon = tab.icon;
              const itemCount = tabCounts[tab.key] || 0;

              return (
                <button
                  key={tab.key}
                  ref={(node) => {
                    tabButtonRefs.current[tab.key] = node;
                  }}
                  type='button'
                  className={`library-tab ${activeTab === tab.key ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab.key)}
                  role='tab'
                  aria-selected={activeTab === tab.key}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  <strong>{itemCount}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className='library-shell__band'>
        <div className='library-page library-page--content'>
          {loading && (
            <div className='library-panel library-panel--skeleton' aria-hidden='true'>
              <div className='library-count library-count--skeleton'>
                <SkeletonBlock className='library-count__value-skeleton' />
                <SkeletonBlock className='library-count__label-skeleton' />
              </div>
              {visibleTab === 'album'
                ? renderAlbumSkeletonGrid()
                : renderStorySkeletonGrid()}
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

          {!loading && (
            <div
              className={`library-panel ${panelState !== 'idle' ? `is-${panelState}` : ''}`}
              style={{ '--library-slide-direction': panelDirection }}
            >
              <div className='library-count'>
                <strong>{formatNumber(activeItemCount)}</strong>
                <span>{visibleTab === 'album' ? 'bộ sưu tập' : 'truyện'}</span>
              </div>

              {activeItemCount === 0 ? (
                <div className='library-page__empty'>
                  <p>{EMPTY_MESSAGES[visibleTab] || 'Chưa có truyện trong mục này.'}</p>
                  {visibleTab !== 'album' && (
                    <Link to='/' className='library-page__browse-link'>
                      Khám phá truyện trên trang chủ
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {visibleTab === 'album' ? (
                    <div className='library-album-grid'>
                      {paginatedAlbums.map((album) => {
                        const previewCoverUrls = Array.isArray(album?.previewCoverUrls)
                          ? album.previewCoverUrls.slice(0, 3)
                          : [];
                        const description = String(album?.description || '').trim();

                        return (
                          <article key={album.id} className='library-album-card'>
                            <Link
                              to={`/library/albums/${album.id}`}
                              className='library-album-card__link'
                            >
                              <div className='library-album-card__mosaic'>
                                {[0, 1, 2].map((index) => {
                                  const coverUrl = previewCoverUrls[index] || '';
                                  const isLastTile = index === 2;
                                  const showMoreBadge =
                                    isLastTile && Number(album.remainingCount || 0) > 0;
                                  const tileClass =
                                    index === 0
                                      ? 'library-album-card__tile library-album-card__tile--primary'
                                      : `library-album-card__tile ${
                                          showMoreBadge
                                            ? 'library-album-card__tile--stacked'
                                            : ''
                                        }`;

                                  return (
                                    <div key={`${album.id}-${index}`} className={tileClass}>
                                      {coverUrl ? (
                                        <img
                                          src={coverUrl}
                                          alt={album.name}
                                          loading='lazy'
                                          decoding='async'
                                        />
                                      ) : (
                                        <div className='library-album-card__tile-placeholder' />
                                      )}

                                      {showMoreBadge && (
                                        <span className='library-album-card__more'>
                                          +{formatNumber(album.remainingCount)}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>

                              <div className='library-album-card__body'>
                                <h3>{album.name}</h3>
                                <p>
                                  {description || 'Chưa có mô tả cho bộ sưu tập này.'}
                                </p>
                                <span className='library-album-card__meta'>
                                  {formatNumber(album.itemCount || 0)} truyện
                                </span>
                              </div>
                            </Link>
                          </article>
                        );
                      })}

                      {albumPlaceholders.map((_, index) => (
                        <article
                          key={`album-placeholder-${index}`}
                          className='library-album-card library-album-card--placeholder'
                          aria-hidden='true'
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='library-cover-grid'>
                      {paginatedStories.map((story) => {
                        const authorName =
                          story.authorPenName || story.authorName || 'Chưa có bút danh';

                        return (
                          <article key={story.id} className='library-cover-card'>
                            <Link
                              to={`/stories/${story.id}/metadata`}
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
                                  <div className='library-cover-card__placeholder'>
                                    No cover
                                  </div>
                                )}

                                {story.favorite && (
                                  <span
                                    className='library-cover-card__favorite'
                                    title='Truyện yêu thích'
                                  >
                                    <Heart size={13} fill='currentColor' />
                                  </span>
                                )}

                                <div className='library-cover-card__overlay'>
                                  <h3>{story.title}</h3>
                                  <p>{authorName}</p>
                                </div>
                              </div>
                            </Link>
                          </article>
                        );
                      })}

                      {storyPlaceholders.map((_, index) => (
                        <article
                          key={`story-placeholder-${index}`}
                          className='library-cover-card library-cover-card--placeholder'
                          aria-hidden='true'
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              <nav className='library-pagination' aria-label='Phân trang thư viện'>
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default LibraryStories;
