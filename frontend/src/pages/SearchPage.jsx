import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Bookmark, Eye, Filter, Search, Star } from 'lucide-react';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/home-dashboard.css';
import '../styles/search-page.css';

const SEARCH_SIZE = 60;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ongoing', label: 'Đang tiến hành' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'cancelled', label: 'Tạm ngưng' },
];

const parseTagIdsCsv = (value) =>
  String(value || '')
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

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
  const [showAdvanced, setShowAdvanced] = useState(true);
  const [keywordInput, setKeywordInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [statusInput, setStatusInput] = useState('all');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [tags, setTags] = useState([]);
  const [stories, setStories] = useState([]);
  const [chapterMetaByStoryId, setChapterMetaByStoryId] = useState({});
  const [loading, setLoading] = useState(false);

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
    const q = searchParams.get('q') || '';
    const author = searchParams.get('author') || '';
    const completionStatus = searchParams.get('completionStatus') || 'all';
    const rawTagIds = parseTagIdsCsv(searchParams.get('tagIds') || '');
    const normalizedStatus = STATUS_OPTIONS.some(
      (item) => item.value === completionStatus,
    )
      ? completionStatus
      : 'all';

    setKeywordInput(q);
    setAuthorInput(author);
    setStatusInput(normalizedStatus);
    setSelectedTagIds(rawTagIds);
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
        const tagIds = parseTagIdsCsv(searchParams.get('tagIds') || '');

        if (q) params.q = q;
        if (author) params.author = author;
        if (completionStatus && completionStatus !== 'all') {
          params.completionStatus = completionStatus;
        }
        if (tagIds.length > 0) {
          params.tagIds = tagIds.join(',');
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

  const selectedTagSet = useMemo(
    () => new Set(selectedTagIds.map((id) => Number(id))),
    [selectedTagIds],
  );

  const toggleTag = (tagId) => {
    const normalizedId = Number(tagId);
    if (!normalizedId) return;
    setSelectedTagIds((prev) => {
      const exists = prev.some((id) => Number(id) === normalizedId);
      if (exists) {
        return prev.filter((id) => Number(id) !== normalizedId);
      }
      return [...prev, normalizedId];
    });
  };

  const applySearch = () => {
    const next = {};
    const keyword = keywordInput.trim();
    const author = authorInput.trim();
    if (keyword) next.q = keyword;
    if (author) next.author = author;
    if (statusInput !== 'all') next.completionStatus = statusInput;
    if (selectedTagIds.length > 0) {
      next.tagIds = selectedTagIds.join(',');
    }
    setSearchParams(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applySearch();
  };

  return (
    <section className='search-page'>
      <div className='search-page__container'>
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
            </div>

            <div className='search-page__advanced-right'>
              <h3>Thể loại</h3>
              <div className='search-page__tag-grid'>
                {tags.map((tag) => {
                  const checked = selectedTagSet.has(Number(tag?.id || 0));
                  return (
                    <label key={tag.id} className='search-page__tag-item'>
                      <input
                        type='checkbox'
                        checked={checked}
                        onChange={() => toggleTag(tag.id)}
                      />
                      <span>{tag.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className='search-page__result-head'>
          <p>
            {loading
              ? 'Đang tải kết quả...'
              : `Tìm thấy ${stories.length} truyện phù hợp`}
          </p>
        </div>

        {!loading && stories.length === 0 && (
          <div className='search-page__empty'>
            Không có truyện nào thỏa mãn bộ lọc hiện tại.
          </div>
        )}

        {!loading && stories.length > 0 && (
          <div className='home-story-grid search-page__results-grid'>
            {stories.map((story) => {
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
        )}

        {!loading && stories.length > 0 && (
          <div className='search-page__apply-row'>
            <button type='button' onClick={applySearch}>
              <Search size={16} />
              Áp dụng bộ lọc
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchPage;

