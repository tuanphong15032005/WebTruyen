import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bookmark,
  Check,
  Eye,
  Filter,
  Star,
  X,
} from 'lucide-react';
import ScrollTopButton from '../components/ScrollTopButton';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/home-dashboard.css';
import '../styles/search-page.css';

const SEARCH_SIZE = 60;
const MAX_RESULT_ROWS = 5;
const SEARCH_GRID_GAP = 12;
const SEARCH_CARD_MIN_WIDTH = 210;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ongoing', label: 'Đang tiến hành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Tạm ngưng' },
];

const STORY_KIND_OPTIONS = [
  { value: 'all', label: 'Bỏ chọn' },
  { value: 'original', label: 'Truyện sáng tác' },
  { value: 'ai', label: 'Truyện AI' },
  { value: 'translated', label: 'Truyện dịch' },
];

const SORT_OPTIONS = [
  { value: 'auto', label: 'Bỏ chọn', defaultDirection: 'desc' },
  { value: 'views', label: 'Lượt xem', defaultDirection: 'desc' },
  { value: 'saved', label: 'Lượt lưu', defaultDirection: 'desc' },
  { value: 'rating', label: 'Rating', defaultDirection: 'desc' },
  { value: 'publishTime', label: 'Thời gian đăng tải', defaultDirection: 'desc' },
  { value: 'title', label: 'A-Z', defaultDirection: 'asc' },
];

const DEFAULT_SORT_BY = 'auto';
const DEFAULT_SORT_DIRECTION = 'desc';
const TAG_FILTER_NONE = 'none';
const TAG_FILTER_INCLUDE = 'include';
const TAG_FILTER_EXCLUDE = 'exclude';
const DEFAULT_CHAPTER_TARGET = 0;
const CHAPTER_FILTER_TOLERANCE = 50;
const MIN_CHAPTER_SLIDER_MAX = 1000;
const SEARCH_KIND_LABEL = 'Lo\u1ea1i truy\u1ec7n';
const SEARCH_SORT_LABEL = 'S\u1eafp x\u1ebfp theo';
const SEARCH_CHAPTER_LABEL = 'S\u1ed1 l\u01b0\u1ee3ng ch\u01b0\u01a1ng';
const SEARCH_CHAPTER_DISABLED_LABEL = 'Kh\u00f4ng \u00e1p d\u1ee5ng';
const SEARCH_CHAPTER_RESET_LABEL = 'H\u1ee7y \u00e1p d\u1ee5ng';

const STORY_KIND_LABELS = {
  all: 'B\u1ecf ch\u1ecdn',
  original: 'Truy\u1ec7n s\u00e1ng t\u00e1c',
  ai: 'Truy\u1ec7n AI',
  translated: 'Truy\u1ec7n d\u1ecbch',
};

const SORT_LABELS = {
  auto: 'B\u1ecf ch\u1ecdn',
  views: 'L\u01b0\u1ee3t xem',
  saved: 'L\u01b0\u1ee3t l\u01b0u',
  rating: 'Rating',
  publishTime: 'Th\u1eddi gian \u0111\u0103ng t\u1ea3i',
  title: 'A-Z',
};

const parseTagIdsCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

const buildTagStateMap = (includedTagIds, excludedTagIds) => {
  const next = {};
  includedTagIds.forEach((id) => {
    next[String(id)] = TAG_FILTER_INCLUDE;
  });
  excludedTagIds.forEach((id) => {
    next[String(id)] = TAG_FILTER_EXCLUDE;
  });
  return next;
};

const collectTagIdsByState = (tagStates, targetState) =>
  Object.entries(tagStates)
    .filter(([, value]) => value === targetState)
    .map(([id]) => Number(id))
    .filter((id) => Number.isFinite(id) && id > 0);

const getDefaultSortDirection = (sortBy) =>
  SORT_OPTIONS.find((item) => item.value === sortBy)?.defaultDirection ||
  DEFAULT_SORT_DIRECTION;

const normalizeChapterTarget = (value) => {
  const numericValue = Math.round(Number(value) || 0);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0;
};

const getChapterFilterRange = (target) => {
  const normalizedTarget = normalizeChapterTarget(target);
  if (normalizedTarget <= 0) {
    return {
      isActive: false,
      min: 0,
      max: 0,
    };
  }

  return {
    isActive: true,
    min: Math.max(0, normalizedTarget - CHAPTER_FILTER_TOLERANCE),
    max: normalizedTarget + CHAPTER_FILTER_TOLERANCE,
  };
};

const getSortValue = (story, sortBy) => {
  if (sortBy === 'title') {
    return String(story?.title || '').trim();
  }
  if (sortBy === 'saved') return Number(story?.savedCount || 0);
  if (sortBy === 'rating') return Number(story?.ratingAvg || 0);
  if (sortBy === 'publishTime') {
    const timestamp = Date.parse(story?.createdAt || '');
    return Number.isFinite(timestamp) ? timestamp : 0;
  }
  return Number(story?.readerCount || 0);
};

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'd')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getSearchTokens = (value) =>
  normalizeSearchText(value)
    .split(' ')
    .filter(Boolean);

const getSearchRelevance = (story, query) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return Number.MAX_SAFE_INTEGER;

  const normalizedTitle = normalizeSearchText(story?.title || '');
  const tokens = getSearchTokens(query);

  if (!normalizedTitle) return Number.MAX_SAFE_INTEGER;
  if (normalizedTitle === normalizedQuery) return 0;
  if (normalizedTitle.startsWith(`${normalizedQuery} `)) return 1;
  if (normalizedTitle.includes(normalizedQuery)) return 2;
  if (tokens.length > 0 && tokens.every((token) => normalizedTitle.includes(token))) {
    return 3;
  }
  return 4;
};

const getStoryTitleSortMeta = (story) => {
  const rawTitle = String(story?.title || '').trim();
  const startsWithSpecial =
    rawTitle.length > 0 && !/^[\p{L}\p{N}]/u.test(rawTitle);
  const normalizedTitle = rawTitle.replace(/^[^\p{L}\p{N}]+/u, '').trim() || rawTitle;

  return {
    rawTitle,
    normalizedTitle,
    startsWithSpecial,
  };
};

const compareStoryTitles = (left, right, sortDirection = 'asc') => {
  const leftMeta = getStoryTitleSortMeta(left);
  const rightMeta = getStoryTitleSortMeta(right);

  if (leftMeta.startsWithSpecial !== rightMeta.startsWithSpecial) {
    return leftMeta.startsWithSpecial ? 1 : -1;
  }

  const directionFactor = sortDirection === 'desc' ? -1 : 1;
  const normalizedCompare = leftMeta.normalizedTitle.localeCompare(
    rightMeta.normalizedTitle,
    'vi',
    {
      sensitivity: 'base',
      numeric: true,
    },
  );

  if (normalizedCompare !== 0) {
    return directionFactor * normalizedCompare;
  }

  return directionFactor * leftMeta.rawTitle.localeCompare(rightMeta.rawTitle, 'vi', {
    sensitivity: 'base',
    numeric: true,
  });
};

const sortStories = (list, sortBy, sortDirection, query) => {
  const safeList = Array.isArray(list) ? [...list] : [];
  const directionFactor = sortDirection === 'asc' ? 1 : -1;
  const useRelevantSort = sortBy === 'auto' && String(query || '').trim().length > 0;

  safeList.sort((left, right) => {
    if (useRelevantSort) {
      const leftRelevance = getSearchRelevance(left, query);
      const rightRelevance = getSearchRelevance(right, query);
      if (leftRelevance !== rightRelevance) {
        return leftRelevance - rightRelevance;
      }
    }

    const leftValue = getSortValue(left, sortBy);
    const rightValue = getSortValue(right, sortBy);

    if (sortBy === 'title') {
      const titleCompare = compareStoryTitles(left, right, sortDirection);
      if (titleCompare !== 0) {
        return titleCompare;
      }
    } else if (leftValue !== rightValue) {
      return directionFactor * (leftValue - rightValue);
    }

    const leftCreatedAt = Date.parse(left?.createdAt || '') || 0;
    const rightCreatedAt = Date.parse(right?.createdAt || '') || 0;
    if (leftCreatedAt !== rightCreatedAt) {
      return rightCreatedAt - leftCreatedAt;
    }

    return compareStoryTitles(left, right);
  });

  return safeList;
};

const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatRating = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return '0.0';
  return numericValue.toFixed(1);
};

const getStoryCategory = (story) => {
  const tags = Array.isArray(story?.tags) ? story.tags : [];
  return tags[0] || null;
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

const htmlToText = (html) => {
  if (!html) return '';
  return html
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getSummary = (story, max = 90) => {
  const raw = htmlToText(story?.summaryHtml || '');
  if (!raw) return 'Truyện hiện chưa có tóm tắt.';
  return raw.length > max ? `${raw.slice(0, max).trim()}...` : raw;
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

const getStoryChapterMeta = async (storyId) => {
  try {
    const volumes = await storyService.getPublicVolumes(storyId);
    const chapters = flattenAndSortChapters(volumes);
    const latestChapter = chapters[chapters.length - 1] || null;
    return {
      latestChapterLabel: formatChapterLabel(latestChapter),
      latestVolumeLabel: formatVolumeLabel(latestChapter),
      chapterCount: chapters.length,
    };
  } catch {
    return {
      latestChapterLabel: 'Chưa có chương',
      latestVolumeLabel: 'Chưa có tập',
      chapterCount: 0,
    };
  }
};

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { notify } = useNotify();
  const containerRef = useRef(null);
  const resultsAnchorRef = useRef(null);
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [statusInput, setStatusInput] = useState('all');
  const [kindInput, setKindInput] = useState('all');
  const [sortByInput, setSortByInput] = useState(DEFAULT_SORT_BY);
  const [chapterTargetInput, setChapterTargetInput] = useState(DEFAULT_CHAPTER_TARGET);
  const [sortDirectionInput, setSortDirectionInput] = useState(
    DEFAULT_SORT_DIRECTION,
  );
  const [tagStates, setTagStates] = useState({});
  const [tags, setTags] = useState([]);
  const [stories, setStories] = useState([]);
  const [chapterMetaByStoryId, setChapterMetaByStoryId] = useState({});
  const [loading, setLoading] = useState(false);
  const [gridColumnCount, setGridColumnCount] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const scrollResultsToTop = useCallback((behavior = 'smooth') => {
    if (typeof window === 'undefined') return;
    const anchorTop =
      (resultsAnchorRef.current?.getBoundingClientRect().top || 0) + window.scrollY - 14;
    window.scrollTo({ top: Math.max(0, anchorTop), behavior });
  }, []);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await storyService.getTags();
        setTags(Array.isArray(response) ? response : []);
      } catch {
        setTags([]);
      }
    };
    fetchTags();
  }, []);

  useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;

    const resolveColumnCount = (width) => {
      if (width <= 380) return 1;
      if (width <= 520) return 2;
      if (width <= 768) return 3;
      if (width <= 1024) return 4;
      return Math.max(
        1,
        Math.floor((width + SEARCH_GRID_GAP) / (SEARCH_CARD_MIN_WIDTH + SEARCH_GRID_GAP)),
      );
    };

    const syncColumnCount = () => {
      const width = element.clientWidth || window.innerWidth || 0;
      setGridColumnCount(resolveColumnCount(width));
    };

    syncColumnCount();
    const observer = new ResizeObserver(syncColumnCount);
    observer.observe(element);
    window.addEventListener('resize', syncColumnCount);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncColumnCount);
    };
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    const author = searchParams.get('author') || '';
    const completionStatus = searchParams.get('completionStatus') || 'all';
    const kind = searchParams.get('kind') || 'all';
    const chapterTarget = normalizeChapterTarget(searchParams.get('chapterCount') || 0);
    const rawTagIds = parseTagIdsCsv(searchParams.get('tagIds') || '');
    const rawExcludedTagIds = parseTagIdsCsv(
      searchParams.get('excludeTagIds') || '',
    );
    const normalizedStatus = STATUS_OPTIONS.some(
      (item) => item.value === completionStatus,
    )
      ? completionStatus
      : 'all';

    setKeywordInput(q);
    setAuthorInput(author);
    setStatusInput(normalizedStatus);
    setKindInput(
      STORY_KIND_OPTIONS.some((item) => item.value === kind) ? kind : 'all',
    );
    setChapterTargetInput(chapterTarget);
    setTagStates(buildTagStateMap(rawTagIds, rawExcludedTagIds));
  }, [searchParams]);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const params = {
          page: 0,
          size: SEARCH_SIZE,
          sort: 'lastUpdatedAt,desc',
        };
        const q = (searchParams.get('q') || '').trim();
        const author = (searchParams.get('author') || '').trim();
        const completionStatus = (
          searchParams.get('completionStatus') || 'all'
        ).trim();
        const kind = (searchParams.get('kind') || 'all').trim();
        const tagIds = parseTagIdsCsv(searchParams.get('tagIds') || '');
        const excludeTagIds = parseTagIdsCsv(
          searchParams.get('excludeTagIds') || '',
        );

        if (q) params.q = q;
        if (author) params.author = author;
        if (completionStatus && completionStatus !== 'all') {
          params.completionStatus = completionStatus;
        }
        if (kind && kind !== 'all') {
          params.kind = kind;
        }
        if (tagIds.length > 0) {
          params.tagIds = tagIds.join(',');
        }
        if (excludeTagIds.length > 0) {
          params.excludeTagIds = excludeTagIds.join(',');
        }

        const response = await storyService.getPublicStories(params);
        const fetchedStories = Array.isArray(response) ? response : [];
        setStories(fetchedStories);

        const metaEntries = await Promise.all(
          fetchedStories.map(async (story) => [
            Number(story?.id || 0),
            await getStoryChapterMeta(Number(story?.id || 0)),
          ]),
        );
        const metaMap = {};
        metaEntries.forEach(([storyId, meta]) => {
          if (storyId) metaMap[storyId] = meta;
        });
        setChapterMetaByStoryId(metaMap);
      } catch (error) {
        console.error('search stories error', error);
        notify('Không tải được kết quả tìm kiếm', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [notify, searchParams]);

  const includedTagIds = useMemo(
    () => collectTagIdsByState(tagStates, TAG_FILTER_INCLUDE),
    [tagStates],
  );

  const excludedTagIds = useMemo(
    () => collectTagIdsByState(tagStates, TAG_FILTER_EXCLUDE),
    [tagStates],
  );

  const activeSortOption = useMemo(
    () => SORT_OPTIONS.find((item) => item.value === sortByInput) || SORT_OPTIONS[0],
    [sortByInput],
  );

  const sortUsesDirection = sortByInput !== 'auto';

  const appliedChapterTarget = useMemo(
    () => normalizeChapterTarget(searchParams.get('chapterCount') || 0),
    [searchParams],
  );

  const inputChapterRange = useMemo(
    () => getChapterFilterRange(chapterTargetInput),
    [chapterTargetInput],
  );

  const appliedChapterRange = useMemo(
    () => getChapterFilterRange(appliedChapterTarget),
    [appliedChapterTarget],
  );

  const chapterSliderMax = useMemo(() => {
    const chapterCounts = Object.values(chapterMetaByStoryId).map((meta) =>
      Number(meta?.chapterCount || 0),
    );
    const maxChapterCount = Math.max(
      MIN_CHAPTER_SLIDER_MAX,
      chapterTargetInput,
      appliedChapterTarget,
      ...chapterCounts,
    );
    return Math.max(
      MIN_CHAPTER_SLIDER_MAX,
      Math.ceil(maxChapterCount / 100) * 100,
    );
  }, [appliedChapterTarget, chapterMetaByStoryId, chapterTargetInput]);

  const sliderChapterTarget = Math.min(chapterTargetInput, chapterSliderMax);

  const chapterSliderVisual = useMemo(() => {
    const maxValue = chapterSliderMax || MIN_CHAPTER_SLIDER_MAX;
    const range = getChapterFilterRange(sliderChapterTarget);
    const bandStart = range.isActive ? (range.min / maxValue) * 100 : 0;
    const bandEnd = range.isActive
      ? (Math.min(maxValue, range.max) / maxValue) * 100
      : 0;

    return {
      bandStart,
      bandWidth: Math.max(0, bandEnd - bandStart),
    };
  }, [chapterSliderMax, sliderChapterTarget]);

  const filteredStories = useMemo(() => {
    if (!appliedChapterRange.isActive) return stories;
    return stories.filter((story) => {
      const chapterCount = Number(chapterMetaByStoryId[story?.id]?.chapterCount || 0);
      return chapterCount >= appliedChapterRange.min && chapterCount <= appliedChapterRange.max;
    });
  }, [appliedChapterRange, chapterMetaByStoryId, stories]);

  const sortedStories = useMemo(
    () =>
      sortStories(
        filteredStories,
        sortByInput,
        sortDirectionInput,
        searchParams.get('q') || '',
      ),
    [filteredStories, sortByInput, sortDirectionInput, searchParams],
  );

  const itemsPerPage = useMemo(
    () => Math.max(1, gridColumnCount * MAX_RESULT_ROWS),
    [gridColumnCount],
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedStories.length / itemsPerPage)),
    [itemsPerPage, sortedStories.length],
  );

  const currentPageStories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStories.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, itemsPerPage, sortedStories]);

  const cycleTagState = (tagId) => {
    const normalizedId = Number(tagId);
    if (!normalizedId) return;
    setTagStates((prev) => {
      const currentState = prev[String(normalizedId)] || TAG_FILTER_NONE;
      const nextState =
        currentState === TAG_FILTER_NONE
          ? TAG_FILTER_INCLUDE
          : currentState === TAG_FILTER_INCLUDE
            ? TAG_FILTER_EXCLUDE
            : TAG_FILTER_NONE;

      if (nextState === TAG_FILTER_NONE) {
        const next = { ...prev };
        delete next[String(normalizedId)];
        return next;
      }

      return {
        ...prev,
        [String(normalizedId)]: nextState,
      };
    });
  };

  const handleSortByChange = (event) => {
    const nextSortBy = event.target.value;
    setSortByInput(nextSortBy);
    setSortDirectionInput(getDefaultSortDirection(nextSortBy));
  };

  const handleChapterTargetChange = (event) => {
    setChapterTargetInput(normalizeChapterTarget(event.target.value));
  };

  const handleChapterTargetReset = () => {
    setChapterTargetInput(DEFAULT_CHAPTER_TARGET);
    if (appliedChapterTarget <= 0) return;

    const next = new URLSearchParams(searchParams);
    next.delete('chapterCount');
    setSearchParams(next);
  };

  const toggleSortDirection = () => {
    if (!sortUsesDirection) return;
    setSortDirectionInput((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  const applySearch = () => {
    const next = {};
    const keyword = keywordInput.trim();
    const author = authorInput.trim();
    const chapterTarget = normalizeChapterTarget(chapterTargetInput);
    if (keyword) next.q = keyword;
    if (author) next.author = author;
    if (statusInput !== 'all') next.completionStatus = statusInput;
    if (kindInput !== 'all') next.kind = kindInput;
    if (chapterTarget > 0) next.chapterCount = String(chapterTarget);
    if (includedTagIds.length > 0) {
      next.tagIds = includedTagIds.join(',');
    }
    if (excludedTagIds.length > 0) {
      next.excludeTagIds = excludedTagIds.join(',');
    }
    setSearchParams(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applySearch();
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage, searchParams, sortByInput, sortDirectionInput]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const handlePageChange = (nextPage) => {
    const normalizedPage = Math.min(Math.max(nextPage, 1), totalPages);
    if (normalizedPage === currentPage) return;
    setCurrentPage(normalizedPage);
    scrollResultsToTop();
  };

  return (
    <section className='search-page'>
      <div ref={containerRef} className='search-page__container'>
        <header className='search-page__header'>
          <span className='search-page__dot' aria-hidden='true' />
          <h1>Tìm kiếm</h1>
        </header>

        <form className='search-page__toolbar' onSubmit={handleSubmit}>
          <div className='search-page__search-wrap'>
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder='Nhập tên truyện...'
              aria-label='Tìm kiếm theo tên truyện'
            />
            <button type='submit'>Tìm kiếm</button>
          </div>

          <button
            type='button'
            className='search-page__advanced-toggle'
            onClick={() => setShowAdvanced((prev) => !prev)}
          >
            <Filter size={16} />
            {showAdvanced ? 'Ẩn tìm kiếm nâng cao' : 'Tìm kiếm nâng cao'}
          </button>
        </form>

        {showAdvanced && (
          <div className='search-page__advanced'>
            <div className='search-page__advanced-left'>
              <label htmlFor='search-author'>Tác giả</label>
              <input
                id='search-author'
                value={authorInput}
                onChange={(event) => setAuthorInput(event.target.value)}
                placeholder='Có thể bỏ trống...'
              />

              <label htmlFor='search-status'>Tình trạng</label>
              <select
                id='search-status'
                value={statusInput}
                onChange={(event) => setStatusInput(event.target.value)}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <label htmlFor='search-kind'>Loại truyện</label>
              <select
                id='search-kind'
                value={kindInput}
                onChange={(event) => setKindInput(event.target.value)}
              >
                {STORY_KIND_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {STORY_KIND_LABELS[item.value] || item.label}
                  </option>
                ))}
              </select>

              <label htmlFor='search-sort'>{SEARCH_SORT_LABEL}</label>
              <select
                id='search-sort'
                value={sortByInput}
                onChange={handleSortByChange}
              >
                {SORT_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {SORT_LABELS[item.value] || item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className='search-page__advanced-right'>
              <h3>Thể loại</h3>
              <div className='search-page__tag-grid'>
                {tags.map((tag) => {
                  const tagState =
                    tagStates[String(Number(tag?.id || 0))] || TAG_FILTER_NONE;
                  const isIncluded = tagState === TAG_FILTER_INCLUDE;
                  const isExcluded = tagState === TAG_FILTER_EXCLUDE;
                  return (
                    <button
                      key={tag.id}
                      type='button'
                      className={`search-page__tag-item search-page__tag-item--${tagState}`}
                      onClick={() => cycleTagState(tag.id)}
                      aria-pressed={tagState !== TAG_FILTER_NONE}
                      title={
                        isIncluded
                          ? 'Đang bao gồm tag này'
                          : isExcluded
                            ? 'Đang loại trừ tag này'
                            : 'Chưa chọn tag này'
                      }
                    >
                      <span className='search-page__tag-indicator' aria-hidden='true'>
                        {isIncluded ? (
                          <Check size={14} />
                        ) : isExcluded ? (
                          <X size={14} />
                        ) : null}
                      </span>
                      <span>{tag.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className='search-page__chapter-filter'>
                <div className='search-page__chapter-filter-head'>
                  <div>
                    <p className='search-page__chapter-filter-label'>{SEARCH_CHAPTER_LABEL}</p>
                    <p className='search-page__chapter-filter-hint'>
                      {chapterTargetInput > 0
                        ? `${formatNumber(inputChapterRange.min)} - ${formatNumber(inputChapterRange.max)} chương`
                        : `Kéo khỏi mốc 0 để lọc theo ±${CHAPTER_FILTER_TOLERANCE} chương`}
                    </p>
                  </div>

                  <div className='search-page__chapter-filter-meta'>
                    <span>
                      {chapterTargetInput > 0
                        ? formatNumber(chapterTargetInput)
                        : SEARCH_CHAPTER_DISABLED_LABEL}
                    </span>
                    {chapterTargetInput > 0 && (
                      <button
                        type='button'
                        className='search-page__chapter-filter-reset'
                        onClick={handleChapterTargetReset}
                      >
                        {SEARCH_CHAPTER_RESET_LABEL}
                      </button>
                    )}
                  </div>
                </div>

                <div
                  className='search-page__chapter-slider-shell'
                  style={{
                    '--chapter-band-start': `${chapterSliderVisual.bandStart}%`,
                    '--chapter-band-width': `${chapterSliderVisual.bandWidth}%`,
                  }}
                >
                  <div
                    className={`search-page__chapter-slider-band ${
                      chapterTargetInput > 0 ? 'is-active' : ''
                    }`.trim()}
                    aria-hidden='true'
                  />
                  <input
                    id='search-chapter-count'
                    type='range'
                    min='0'
                    max={chapterSliderMax}
                    step='1'
                    value={sliderChapterTarget}
                    onChange={handleChapterTargetChange}
                    aria-label={SEARCH_CHAPTER_LABEL}
                  />
                </div>

                <div className='search-page__chapter-slider-scale' aria-hidden='true'>
                  <span>0</span>
                  <span>{formatNumber(chapterSliderMax)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={resultsAnchorRef} className='search-page__result-head'>
          <p>
            {loading
              ? 'Đang tải kết quả...'
              : `Tìm thấy ${sortedStories.length} truyện phù hợp`}
          </p>
          {!loading && sortedStories.length > 0 && (
            <div className='search-page__result-sort'>
              <span>{SORT_LABELS[activeSortOption.value] || activeSortOption.label}</span>
              <button
                type='button'
                className={`search-page__sort-direction ${!sortUsesDirection ? 'is-hidden' : ''}`.trim()}
                onClick={toggleSortDirection}
                disabled={!sortUsesDirection}
                aria-label={
                  sortDirectionInput === 'desc'
                    ? 'Đang sắp xếp giảm dần, bấm để đổi thành tăng dần'
                    : 'Đang sắp xếp tăng dần, bấm để đổi thành giảm dần'
                }
                title={
                  sortDirectionInput === 'desc'
                    ? 'Đang sắp xếp giảm dần'
                    : 'Đang sắp xếp tăng dần'
                }
              >
                {sortDirectionInput === 'desc' ? (
                  <ArrowUp size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}
              </button>
            </div>
          )}
        </div>

        {!loading && sortedStories.length === 0 && (
          <div className='search-page__empty'>
            Không có truyện nào thỏa mãn bộ lọc hiện tại.
          </div>
        )}

        {!loading && sortedStories.length > 0 && (
          <div className='search-page__results-shell'>
            <div className='home-story-grid search-page__results-grid'>
              {currentPageStories.map((story) => {
              const meta = chapterMetaByStoryId[story.id] || {};
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
                          {meta.latestChapterLabel || 'Chưa có chương'}
                        </p>
                        <p className='home-story-card__volume'>
                          {meta.latestVolumeLabel || 'Chưa có tập'}
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
                          {formatNumber(meta.chapterCount || 0)}
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
            })}
            </div>
            {totalPages > 1 && (
              <div className='search-page__pagination'>
                <button
                  type='button'
                  className='search-page__page-btn'
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <ArrowLeft size={16} />
                  Trước
                </button>
                <p className='search-page__page-status'>
                  Trang {currentPage}/{totalPages}
                </p>
                <button
                  type='button'
                  className='search-page__page-btn'
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Sau
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {false && (
          <div className='search-page__apply-row'>
            <button type='button' onClick={applySearch}>
              <Search size={16} />
              Áp dụng bộ lọc
            </button>
          </div>
        )}
      </div>
      <ScrollTopButton />
    </section>
  );
}

export default SearchPage;

