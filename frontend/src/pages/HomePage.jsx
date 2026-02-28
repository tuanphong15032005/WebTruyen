import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bookmark,
  Bot,
  BookOpen,
  CheckCircle2,
  Eye,
  Languages,
  MessageSquare,
  PenTool,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/home-dashboard.css';

const HERO_COUNT = 6; //banner
const LATEST_COUNT = 8; //mới cập nhật
const VIEW_RANKING_COUNT = 10; //xếp hạng theo lượt xem
const SAVED_RANKING_COUNT = 10; //xếp hạng theo lượt lưu
const COMMUNITY_COUNT = 6; //bình luận mới cộng đồng
const RECOMMEND_COUNT = 4; //đề xuất
const SECTION_STORY_COUNT = 8; //Mỗi phần
const HERO_TRANSITION_MS = 320;
const HERO_SWIPE_THRESHOLD = 56;

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatRelativeTime = (value) => {
  if (!value) return 'Vừa xong';
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  return `${Math.floor(diffHour / 24)} ngày trước`;
};

const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getSummary = (story, max = 220) => {
  const raw = htmlToText(story?.summaryHtml || '');
  if (!raw) return 'Truyện hiện chưa có tóm tắt.';
  return raw.length > max ? `${raw.slice(0, max).trim()}...` : raw;
};

const getStoryCategory = (story) => {
  const tags = Array.isArray(story?.tags) ? story.tags : [];
  return tags[0] || null;
};

const formatRating = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return '0.0';
  return numericValue.toFixed(1);
};

const getStoryStatusInfo = (story) => {
  const completion = String(story?.completionStatus || '').toLowerCase();
  if (completion === 'completed') {
    return { label: 'Đã hoàn thành', className: 'completed' };
  }
  if (completion === 'cancelled') {
    return { label: 'Tạm ngưng', className: 'cancelled' };
  }
  return { label: 'Đang tiến hành', className: 'ongoing' };
};

const hasAuthSession = () => {
  try {
    if (localStorage.getItem('accessToken')) return true;
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return false;
    const parsed = JSON.parse(rawUser);
    return Boolean(parsed?.token || parsed?.accessToken);
  } catch {
    return false;
  }
};

const toEpoch = (value) => {
  if (!value) return 0;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : 0;
};

// Hieuson - 24/2 + Chá»n ngáº«u nhiÃªn má»™t táº­p con stories Ä‘á»ƒ lÃ m hero slider.
const pickRandomStories = (stories, size) => {
  const list = Array.isArray(stories) ? [...stories] : [];
  for (let idx = list.length - 1; idx > 0; idx -= 1) {
    const randomIdx = Math.floor(Math.random() * (idx + 1));
    [list[idx], list[randomIdx]] = [list[randomIdx], list[idx]];
  }
  return list.slice(0, size);
};

const formatChapterLabel = (chapter) => {
  const sequence = Number(chapter?.sequenceIndex || 0);
  const title = String(chapter?.title || '').trim();
  if (sequence > 0 && title) return `Chương ${sequence}: ${title}`;
  if (sequence > 0) return `Chương ${sequence}`;
  if (title) return title;
  return 'Chưa có chương';
};

const formatVolumeLabel = (chapter) => {
  const title = String(chapter?.volumeTitle || '').trim();
  const sequence = Number(chapter?.volumeSequenceIndex || 0);
  if (title) return title;
  if (sequence > 0) return `Táº­p ${sequence}`;
  return 'Chưa có tập';
};

// Hieuson - 24/2 + Sáº¯p xáº¿p danh sÃ¡ch chapter theo thá»© tá»± volume/chapter Ä‘á»ƒ láº¥y chÆ°Æ¡ng Ä‘áº§u vÃ  chÆ°Æ¡ng má»›i.
const flattenAndSortChapters = (volumes) => {
  const safeVolumes = Array.isArray(volumes) ? volumes : [];
  const sortedVolumes = [...safeVolumes].sort(
    (a, b) => Number(a?.sequenceIndex || 0) - Number(b?.sequenceIndex || 0),
  );

  const chapters = [];
  sortedVolumes.forEach((volume) => {
    const chapterList = Array.isArray(volume?.chapters) ? volume.chapters : [];
    const sortedChapters = [...chapterList].sort(
      (a, b) => Number(a?.sequenceIndex || 0) - Number(b?.sequenceIndex || 0),
    );
    sortedChapters.forEach((chapter) =>
      chapters.push({
        id: chapter?.id || null,
        title: chapter?.title || '',
        sequenceIndex: Number(chapter?.sequenceIndex || 0),
        volumeTitle: volume?.title || '',
        volumeSequenceIndex: Number(volume?.sequenceIndex || 0),
      }),
    );
  });

  return chapters;
};

// Hieuson - 24/2 + Láº¥y chapter Ä‘áº§u tiÃªn vÃ  tÃªn chapter má»›i nháº¥t theo story Ä‘á»ƒ phá»¥c vá»¥ banner + má»›i cáº­p nháº­t.
const getStoryChapterMeta = async (storyId) => {
  try {
    const volumes = await storyService.getPublicVolumes(storyId);
    const chapters = flattenAndSortChapters(volumes);
    const firstChapter = chapters[0] || null;
    const latestChapter = chapters[chapters.length - 1] || null;
    return {
      firstChapterId: firstChapter?.id || null,
      latestChapterTitle: latestChapter?.title || 'Chưa có chương',
      latestChapterLabel: formatChapterLabel(latestChapter),
      latestVolumeLabel: formatVolumeLabel(latestChapter),
      chapterCount: chapters.length,
    };
  } catch {
    return {
      firstChapterId: null,
      latestChapterTitle: 'Chưa có chương',
      latestChapterLabel: 'Chưa có chương',
      latestVolumeLabel: 'Chưa có tập',
      chapterCount: 0,
    };
  }
};

// Hieuson - 24/2 + Sáº¯p xáº¿p truyá»‡n theo rating cao nháº¥t Ä‘á»ƒ dÃ¹ng cho gá»£i Ã½ vÃ  fallback.
const getTopRatedStories = (stories, size) =>
  [...(Array.isArray(stories) ? stories : [])]
    .sort((a, b) => {
      const ratingA = Number(a?.ratingAvg || 0);
      const ratingB = Number(b?.ratingAvg || 0);
      if (ratingB !== ratingA) return ratingB - ratingA;
      return Number(b?.ratingCount || 0) - Number(a?.ratingCount || 0);
    })
    .slice(0, size);

// Hieuson - 24/2 + TÃ¬m danh má»¥c xuáº¥t hiá»‡n nhiá»u nháº¥t trong thÆ° viá»‡n cÃ¡ nhÃ¢n cá»§a user.
const getDominantTagFromLibrary = (libraryStories) => {
  const counter = new Map();
  (Array.isArray(libraryStories) ? libraryStories : []).forEach((story) => {
    const tags = Array.isArray(story?.tags) ? story.tags : [];
    tags.forEach((tag) => {
      const key = String(tag?.id || tag?.name || '');
      if (!key) return;
      const current = counter.get(key) || { tag, count: 0 };
      current.count += 1;
      counter.set(key, current);
    });
  });

  let dominant = null;
  counter.forEach((item) => {
    if (!dominant || item.count > dominant.count) dominant = item;
  });
  return dominant?.tag || null;
};

const buildHeroBackground = (story) => {
  const coverUrl = String(story?.coverUrl || '').trim();
  if (!coverUrl) {
    return 'linear-gradient(120deg, #172449 0%, #233a6e 50%, #1a2f59 100%)';
  }
  return `url(${coverUrl})`;
};

function HomePage() {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(false);
  const [heroStories, setHeroStories] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [latestStories, setLatestStories] = useState([]);
  const [originalStories, setOriginalStories] = useState([]);
  const [translatedStories, setTranslatedStories] = useState([]);
  const [aiStories, setAiStories] = useState([]);
  const [completedStories, setCompletedStories] = useState([]);
  const [viewRankingStories, setViewRankingStories] = useState([]);
  const [savedRankingStories, setSavedRankingStories] = useState([]);
  const [recommendedStories, setRecommendedStories] = useState([]);
  const [recommendTagName, setRecommendTagName] = useState('');
  const [communityComments, setCommunityComments] = useState([]);
  const [chapterMetaByStoryId, setChapterMetaByStoryId] = useState({});
  const [heroPrevStory, setHeroPrevStory] = useState(null);
  const [heroPrevVisible, setHeroPrevVisible] = useState(false);
  const [heroSlideDirection, setHeroSlideDirection] = useState(1);
  const [heroDragOffset, setHeroDragOffset] = useState(0);
  const [heroDragging, setHeroDragging] = useState(false);

  const heroTransitionTimerRef = useRef(null);
  const heroRafRef = useRef({ first: 0, second: 0 });
  const heroPointerRef = useRef({
    pointerId: null,
    startX: 0,
    lastX: 0,
    swiped: false,
  });
  const activeHeroIndexRef = useRef(0);

  const activeHeroStory = heroStories[activeHeroIndex] || null;

  useEffect(() => {
    activeHeroIndexRef.current = activeHeroIndex;
  }, [activeHeroIndex]);

  useEffect(() => {
    return () => {
      if (heroTransitionTimerRef.current) {
        window.clearTimeout(heroTransitionTimerRef.current);
      }
      if (heroRafRef.current.first) {
        window.cancelAnimationFrame(heroRafRef.current.first);
      }
      if (heroRafRef.current.second) {
        window.cancelAnimationFrame(heroRafRef.current.second);
      }
    };
  }, []);

  useEffect(() => {
    // Hieuson - 24/2 + Náº¡p dá»¯ liá»‡u trang chá»§ gá»“m banner, cáº­p nháº­t, ranking, gá»£i Ã½ vÃ  pháº£n há»“i cá»™ng Ä‘á»“ng.
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const response = await storyService.getPublicStories({
          page: 0,
          size: 60,
          sort: 'lastUpdatedAt,desc',
        });
        const publicStories = Array.isArray(response) ? response : [];
        const sortedByUpdated = [...publicStories].sort(
          (a, b) =>
            toEpoch(b?.lastUpdatedAt || b?.createdAt) -
            toEpoch(a?.lastUpdatedAt || a?.createdAt),
        );

        const newestStories = sortedByUpdated.slice(0, LATEST_COUNT);
        setLatestStories(newestStories);
        const originalList = sortedByUpdated
          .filter(
            (story) => String(story?.kind || '').toLowerCase() === 'original',
          )
          .slice(0, SECTION_STORY_COUNT);
        setOriginalStories(originalList);
        const translatedList = sortedByUpdated
          .filter(
            (story) => String(story?.kind || '').toLowerCase() === 'translated',
          )
          .slice(0, SECTION_STORY_COUNT);
        setTranslatedStories(translatedList);
        const aiList = sortedByUpdated
          .filter((story) => String(story?.kind || '').toLowerCase() === 'ai')
          .slice(0, SECTION_STORY_COUNT);
        setAiStories(aiList);
        const completedList = sortedByUpdated
          .filter((story) =>
            ['completed', 'complete', 'done', 'finished'].includes(
              String(story?.completionStatus || '').toLowerCase(),
            ),
          )
          .slice(0, SECTION_STORY_COUNT);
        setCompletedStories(completedList);

        const allTimeViewRanking = [...publicStories]
          .sort(
            (a, b) => Number(b?.readerCount || 0) - Number(a?.readerCount || 0),
          )
          .slice(0, VIEW_RANKING_COUNT);
        setViewRankingStories(allTimeViewRanking);

        const allTimeSavedRanking = [...publicStories]
          .sort(
            (a, b) => Number(b?.savedCount || 0) - Number(a?.savedCount || 0),
          )
          .slice(0, SAVED_RANKING_COUNT);
        setSavedRankingStories(allTimeSavedRanking);

        const randomHeroStories = pickRandomStories(publicStories, HERO_COUNT);
        setHeroStories(randomHeroStories);
        setActiveHeroIndex(0);
        activeHeroIndexRef.current = 0;
        setHeroPrevStory(null);
        setHeroPrevVisible(false);
        setHeroDragOffset(0);

        const loggedIn = hasAuthSession();
        let recommendPool = publicStories;
        let dominantTag = null;
        if (loggedIn) {
          try {
            const libraryStories = await storyService.getLibraryStories();
            dominantTag = getDominantTagFromLibrary(libraryStories);
            if (dominantTag) {
              recommendPool = publicStories.filter((story) => {
                const tags = Array.isArray(story?.tags) ? story.tags : [];
                return tags.some(
                  (tag) =>
                    String(tag?.id || '') === String(dominantTag?.id || ''),
                );
              });
            }
          } catch {
            dominantTag = null;
          }
        }
        const recommendList = getTopRatedStories(
          recommendPool.length > 0 ? recommendPool : publicStories,
          RECOMMEND_COUNT,
        );
        setRecommendedStories(recommendList);
        setRecommendTagName(dominantTag?.name || '');

        const chapterMetaStoryIds = [
          ...new Set(
            [
              ...randomHeroStories,
              ...newestStories,
              ...recommendList,
              ...originalList,
              ...translatedList,
              ...aiList,
              ...completedList,
            ]
              .map((story) => Number(story?.id || 0))
              .filter(Boolean),
          ),
        ];
        const chapterMetaEntries = await Promise.all(
          chapterMetaStoryIds.map(async (storyId) => [
            storyId,
            await getStoryChapterMeta(storyId),
          ]),
        );
        const chapterMetaMap = {};
        chapterMetaEntries.forEach(([storyId, meta]) => {
          chapterMetaMap[storyId] = meta;
        });
        setChapterMetaByStoryId(chapterMetaMap);

        const latestComments = await storyService.getLatestCommunityComments({
          size: COMMUNITY_COUNT,
        });
        setCommunityComments(
          Array.isArray(latestComments) ? latestComments : [],
        );
      } catch (error) {
        console.error('fetchHomeData error', error);
        notify('Không tải được dữ liệu trang chủ', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [notify]);

  const animateToHeroIndex = useCallback(
    (targetIndex, directionHint = 0) => {
      const count = heroStories.length;
      if (count <= 1) return;

      const currentIndex = activeHeroIndexRef.current;
      const normalizedIndex = (targetIndex + count) % count;
      if (normalizedIndex === currentIndex) return;
      const forwardSteps = (normalizedIndex - currentIndex + count) % count;
      const autoDirection = forwardSteps <= count / 2 ? 1 : -1;
      const direction =
        directionHint === 1 || directionHint === -1
          ? directionHint
          : autoDirection;

      const previousStory = heroStories[currentIndex] || null;
      if (heroTransitionTimerRef.current) {
        window.clearTimeout(heroTransitionTimerRef.current);
      }
      if (heroRafRef.current.first) {
        window.cancelAnimationFrame(heroRafRef.current.first);
      }
      if (heroRafRef.current.second) {
        window.cancelAnimationFrame(heroRafRef.current.second);
      }

      setHeroSlideDirection(direction);
      setHeroPrevStory(previousStory);
      setHeroPrevVisible(false);
      setActiveHeroIndex(normalizedIndex);
      activeHeroIndexRef.current = normalizedIndex;

      heroRafRef.current.first = window.requestAnimationFrame(() => {
        heroRafRef.current.second = window.requestAnimationFrame(() => {
          setHeroPrevVisible(true);
        });
      });

      heroTransitionTimerRef.current = window.setTimeout(() => {
        setHeroPrevStory(null);
        setHeroPrevVisible(false);
      }, HERO_TRANSITION_MS + 40);
    },
    [heroStories],
  );

  useEffect(() => {
    if (heroStories.length <= 1 || heroDragging) return undefined;
    // Hieuson - 24/2 + Tá»± Ä‘á»™ng trÆ°á»£t hero slider sau má»—i 5 giÃ¢y.
    const timer = window.setInterval(() => {
      animateToHeroIndex(activeHeroIndexRef.current + 1, 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [animateToHeroIndex, heroDragging, heroStories.length]);

  const heroCategoryName = useMemo(
    () => getStoryCategory(activeHeroStory)?.name || 'Không phân loại',
    [activeHeroStory],
  );

  const goPrevHero = useCallback(() => {
    animateToHeroIndex(activeHeroIndexRef.current - 1, -1);
  }, [animateToHeroIndex]);

  const goNextHero = useCallback(() => {
    animateToHeroIndex(activeHeroIndexRef.current + 1, 1);
  }, [animateToHeroIndex]);

  const handleHeroPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest('a, button, input, textarea, select')) return;

    heroPointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      lastX: event.clientX,
      swiped: false,
    };
    setHeroDragging(true);
    setHeroDragOffset(0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const releaseHeroDrag = useCallback(
    (event) => {
      if (heroPointerRef.current.pointerId == null) return;

      const deltaX =
        heroPointerRef.current.lastX - heroPointerRef.current.startX;
      if (
        !heroPointerRef.current.swiped &&
        Math.abs(deltaX) >= HERO_SWIPE_THRESHOLD
      ) {
        const swipeDirection = deltaX < 0 ? 1 : -1;
        animateToHeroIndex(
          activeHeroIndexRef.current + swipeDirection,
          swipeDirection,
        );
      }

      if (
        event?.pointerId != null &&
        event.currentTarget?.hasPointerCapture?.(event.pointerId)
      ) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }

      heroPointerRef.current = {
        pointerId: null,
        startX: 0,
        lastX: 0,
        swiped: false,
      };
      setHeroDragOffset(0);
      setHeroDragging(false);
    },
    [animateToHeroIndex],
  );

  const handleHeroPointerMove = (event) => {
    if (heroPointerRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - heroPointerRef.current.startX;
    heroPointerRef.current.lastX = event.clientX;
    setHeroDragOffset(deltaX);

    if (
      !heroPointerRef.current.swiped &&
      Math.abs(deltaX) >= HERO_SWIPE_THRESHOLD
    ) {
      heroPointerRef.current.swiped = true;
      heroPointerRef.current.startX = event.clientX;
      heroPointerRef.current.lastX = event.clientX;
      setHeroDragOffset(0);
      const swipeDirection = deltaX < 0 ? 1 : -1;
      animateToHeroIndex(
        activeHeroIndexRef.current + swipeDirection,
        swipeDirection,
      );
    }
  };

  const handleHeroPointerUp = useCallback(
    (event) => {
      releaseHeroDrag(event);
    },
    [releaseHeroDrag],
  );

  const handleHeroPointerCancel = useCallback(
    (event) => {
      releaseHeroDrag(event);
    },
    [releaseHeroDrag],
  );

  const openFirstChapter = (story) => {
    const storyId = Number(story?.id || 0);
    if (!storyId) return;
    const chapterMeta = chapterMetaByStoryId[storyId];
    const firstChapterId = Number(chapterMeta?.firstChapterId || 0);
    if (!firstChapterId) {
      notify('Truyện này chưa có chương để đọc', 'info');
      return;
    }
    navigate(`/stories/${storyId}/chapters/${firstChapterId}`);
  };

  const renderStoryTiles = useCallback(
    (stories) => {
      if (!Array.isArray(stories) || stories.length === 0) {
        return (
          <p className='home-story-grid__empty'>Chưa có truyện để hiển thị.</p>
        );
      }

      return stories.map((story) => {
        const meta = chapterMetaByStoryId[story.id];
        const categoryTag = getStoryCategory(story);
        const statusInfo = getStoryStatusInfo(story);
        const authorName =
          story.authorPenName || story.authorName || 'Chưa có bút danh';

        return (
          <article key={story.id} className='home-story-card'>
            <Link
              to={`/stories/${story.id}/metadata`}
              className='home-story-card__link'
            >
              <div className='home-story-card__cover'>
                {story.coverUrl ? (
                  <img src={story.coverUrl} alt={story.title} />
                ) : (
                  <div className='home-story-card__cover-empty'>No cover</div>
                )}
                <div className='home-story-card__overlay'>
                  <p className='home-story-card__chapter'>
                    {meta?.latestChapterLabel || 'Chưa có chương'}
                  </p>
                  <p className='home-story-card__volume'>
                    {meta?.latestVolumeLabel || 'Chưa có tập'}
                  </p>
                </div>
              </div>

              <div className='home-story-card__content'>
                <h3 className='home-story-card__title'>{story.title}</h3>

                <div className='home-story-card__meta'>
                  <span className='home-story-card__author'>{authorName}</span>
                  {categoryTag && (
                    <span className='home-story-card__category'>
                      {categoryTag.name}
                    </span>
                  )}
                </div>

                <p className='home-story-card__summary'>
                  {getSummary(story, 90)}
                </p>

                <div className='home-story-card__stats'>
                  <span className='home-story-card__stat home-story-card__stat--rating'>
                    <Star size={14} fill='currentColor' />
                    {formatRating(story.ratingAvg)}
                  </span>
                  <span className='home-story-card__stat'>
                    <Eye size={14} />
                    {formatNumber(story.readerCount || 0)}
                  </span>
                  <span className='home-story-card__stat'>
                    <Bookmark size={14} />
                    {formatNumber(story.savedCount || 0)}
                  </span>
                  <span className='home-story-card__stat'>
                    <BookOpen size={14} />
                    {formatNumber(meta?.chapterCount || 0)}
                  </span>
                </div>

                <div className='home-story-card__footer'>
                  <span
                    className={`home-story-card__status ${statusInfo.className}`}
                  >
                    <span className='home-story-card__status-dot' />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            </Link>
          </article>
        );
      });
    },
    [chapterMetaByStoryId],
  );

  const heroSlideClass = heroSlideDirection > 0 ? 'to-next' : 'to-prev';

  return (
    <div className='home-dashboard'>
      <div className='home-dashboard__container'>
        {loading && (
          <div className='home-dashboard__loading'>
            Đang tải dữ liệu trang chủ...
          </div>
        )}

        {!loading && activeHeroStory && (
          <section
            className={`home-hero ${heroDragging ? 'is-dragging' : ''}`}
            style={{
              '--hero-drag-x': `${heroDragOffset}px`,
              '--hero-slide-duration': `${HERO_TRANSITION_MS}ms`,
            }}
            onPointerDown={handleHeroPointerDown}
            onPointerMove={handleHeroPointerMove}
            onPointerUp={handleHeroPointerUp}
            onPointerCancel={handleHeroPointerCancel}
          >
            <div
              className={`home-hero__bg home-hero__bg--current ${heroPrevStory ? `is-incoming ${heroSlideClass} ${heroPrevVisible ? 'is-active' : ''}` : ''}`}
              style={{
                backgroundImage: buildHeroBackground(activeHeroStory),
              }}
            />
            {heroPrevStory && (
              <div
                className={`home-hero__bg home-hero__bg--prev is-outgoing ${heroSlideClass} ${heroPrevVisible ? 'is-active' : ''}`}
                style={{
                  backgroundImage: buildHeroBackground(heroPrevStory),
                }}
              />
            )}
            <div className='home-hero__shade' aria-hidden='true' />

            <button
              type='button'
              className='home-hero__nav home-hero__nav--left'
              onClick={goPrevHero}
              aria-label='Banner trước'
            >
              <span
                className='home-hero__nav-arrow home-hero__nav-arrow--left'
                aria-hidden='true'
              >
                {'<'}
              </span>
            </button>
            <button
              type='button'
              className='home-hero__nav home-hero__nav--right'
              onClick={goNextHero}
              aria-label='Banner sau'
            >
              <span
                className='home-hero__nav-arrow home-hero__nav-arrow--right'
                aria-hidden='true'
              >
                {'>'}
              </span>
            </button>

            <div className='home-hero__content'>
              <div className='home-hero__cover-wrap'>
                {activeHeroStory.coverUrl ? (
                  <img
                    src={activeHeroStory.coverUrl}
                    alt={activeHeroStory.title}
                    className='home-hero__cover'
                  />
                ) : (
                  <div className='home-hero__cover-empty'>No cover</div>
                )}
              </div>
              <div className='home-hero__text'>
                <span className='home-hero__category'>{heroCategoryName}</span>
                <h1>{activeHeroStory.title}</h1>
                <p>{getSummary(activeHeroStory)}</p>
                <div className='home-hero__actions'>
                  <button
                    type='button'
                    onClick={() => openFirstChapter(activeHeroStory)}
                  >
                    <BookOpen size={16} />
                    Đọc ngay
                  </button>
                  <Link to={`/stories/${activeHeroStory.id}/metadata`}>
                    Chi tiết
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {!loading && (
          <div className='home-main-grid'>
            <div className='home-main-grid__left'>
              <section className='home-section'>
                <div className='home-section__head'>
                  <h2>
                    <RefreshCw
                      size={22}
                      className='home-section__icon home-section__icon--updated'
                    />
                    Cập nhật gần đây
                  </h2>
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(latestStories)}
                </div>
              </section>

              <section className='home-section home-section--recommend'>
                <div className='home-section__head'>
                  <h2>
                    <Star
                      size={24}
                      className='home-section__icon home-section__icon--recommend'
                      fill='currentColor'
                    />
                    Gợi ý cho bạn
                  </h2>
                  {recommendTagName && (
                    <span className='home-section__meta'>
                      Danh mục ưu tiên: {recommendTagName}
                    </span>
                  )}
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(recommendedStories)}
                </div>
              </section>

              <section className='home-section'>
                <div className='home-section__head'>
                  <h2>
                    <PenTool
                      size={22}
                      className='home-section__icon home-section__icon--original'
                    />
                    Sáng tác
                  </h2>
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(originalStories)}
                </div>
              </section>

              <section className='home-section'>
                <div className='home-section__head'>
                  <h2>
                    <Languages
                      size={22}
                      className='home-section__icon home-section__icon--translated'
                    />
                    Truyện dịch
                  </h2>
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(translatedStories)}
                </div>
              </section>

              <section className='home-section'>
                <div className='home-section__head'>
                  <h2>
                    <Bot
                      size={22}
                      className='home-section__icon home-section__icon--ai'
                    />
                    Truyện AI
                  </h2>
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(aiStories)}
                </div>
              </section>

              <section className='home-section'>
                <div className='home-section__head'>
                  <h2>
                    <CheckCircle2
                      size={22}
                      className='home-section__icon home-section__icon--completed'
                    />
                    Truyện đã hoàn thành
                  </h2>
                </div>
                <div className='home-story-grid'>
                  {renderStoryTiles(completedStories)}
                </div>
              </section>
            </div>

            <aside className='home-main-grid__right'>
              <section className='home-ranking'>
                <div className='home-ranking__head'>
                  <h2>
                    <TrendingUp
                      size={24}
                      className='home-section__icon home-section__icon--ranking'
                    />
                    Top lượt đọc
                  </h2>
                </div>
                <ol className='home-ranking__list'>
                  {viewRankingStories.length === 0 ? (
                    <p className='home-ranking__empty'>
                      Chưa có dữ liệu lượt xem.
                    </p>
                  ) : (
                    viewRankingStories.map((story, idx) => (
                      <li key={story.id}>
                        <span className='home-ranking__index'>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className='home-ranking__story'>
                          <Link to={`/stories/${story.id}/metadata`}>
                            {story.title}
                          </Link>
                          <small>
                            {formatNumber(story.readerCount || 0)} lượt xem
                          </small>
                        </div>
                      </li>
                    ))
                  )}
                </ol>
              </section>

              <section className='home-ranking'>
                <div className='home-ranking__head'>
                  <h2>
                    <Bookmark
                      size={24}
                      className='home-section__icon home-section__icon--ranking'
                    />
                    Top lượt theo dõi
                  </h2>
                </div>
                <ol className='home-ranking__list'>
                  {savedRankingStories.length === 0 ? (
                    <p className='home-ranking__empty'>
                      Chưa có dữ liệu lượt lưu.
                    </p>
                  ) : (
                    savedRankingStories.map((story, idx) => (
                      <li key={story.id}>
                        <span className='home-ranking__index'>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className='home-ranking__story'>
                          <Link to={`/stories/${story.id}/metadata`}>
                            {story.title}
                          </Link>
                          <small>
                            {formatNumber(story.savedCount || 0)} lượt lưu
                          </small>
                        </div>
                      </li>
                    ))
                  )}
                </ol>
              </section>

              <section className='home-ranking'>
                <div className='home-ranking__head'>
                  <h2>
                    <MessageSquare
                      size={24}
                      className='home-section__icon home-section__icon--ranking'
                    />
                    Bình luận mới
                  </h2>
                </div>
                <ol className='home-ranking__list'>
                  {communityComments.length === 0 ? (
                    <p className='home-ranking__empty'>
                      Chưa có bình luận gần đây.
                    </p>
                  ) : (
                    communityComments.map((comment, idx) => (
                      <li key={comment.id}>
                        <span className='home-ranking__index'>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className='home-ranking__comment'>
                          <strong>{comment.username || 'Ẩn danh'}</strong>
                          <p className='home-ranking__comment-story'>
                            {comment.storyId ? (
                              <Link to={`/stories/${comment.storyId}/metadata`}>
                                {comment.storyTitle || 'Không rõ truyện'}
                              </Link>
                            ) : (
                              <span>
                                {comment.storyTitle || 'Không rõ truyện'}
                              </span>
                            )}
                          </p>
                          <p className='home-ranking__comment-content'>
                            {comment.content}
                          </p>
                          <small>{formatRelativeTime(comment.createdAt)}</small>
                        </div>
                      </li>
                    ))
                  )}
                </ol>
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
