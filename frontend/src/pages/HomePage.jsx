import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  MessageSquare,
  RefreshCw,
  Star,
  TrendingUp,
} from 'lucide-react';
import storyService from '../services/storyService';
import useNotify from '../hooks/useNotify';
import '../styles/home-dashboard.css';

const HERO_COUNT = 4;
const LATEST_COUNT = 6;
const RANKING_COUNT = 5;
const RECOMMEND_COUNT = 4;

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

// Hieuson - 24/2 + Chọn ngẫu nhiên một tập con stories để làm hero slider.
const pickRandomStories = (stories, size) => {
  const list = Array.isArray(stories) ? [...stories] : [];
  for (let idx = list.length - 1; idx > 0; idx -= 1) {
    const randomIdx = Math.floor(Math.random() * (idx + 1));
    [list[idx], list[randomIdx]] = [list[randomIdx], list[idx]];
  }
  return list.slice(0, size);
};

// Hieuson - 24/2 + Sắp xếp danh sách chapter theo thứ tự volume/chapter để lấy chương đầu và chương mới.
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
    sortedChapters.forEach((chapter) => chapters.push(chapter));
  });

  return chapters;
};

// Hieuson - 24/2 + Lấy chapter đầu tiên và tên chapter mới nhất theo story để phục vụ banner + mới cập nhật.
const getStoryChapterMeta = async (storyId) => {
  try {
    const volumes = await storyService.getPublicVolumes(storyId);
    const chapters = flattenAndSortChapters(volumes);
    const firstChapter = chapters[0] || null;
    const latestChapter = chapters[chapters.length - 1] || null;
    return {
      firstChapterId: firstChapter?.id || null,
      latestChapterTitle: latestChapter?.title || 'Chưa có chương',
    };
  } catch {
    return { firstChapterId: null, latestChapterTitle: 'Chưa có chương' };
  }
};

// Hieuson - 24/2 + Sắp xếp truyện theo rating cao nhất để dùng cho gợi ý và fallback.
const getTopRatedStories = (stories, size) =>
  [...(Array.isArray(stories) ? stories : [])]
    .sort((a, b) => {
      const ratingA = Number(a?.ratingAvg || 0);
      const ratingB = Number(b?.ratingAvg || 0);
      if (ratingB !== ratingA) return ratingB - ratingA;
      return Number(b?.ratingCount || 0) - Number(a?.ratingCount || 0);
    })
    .slice(0, size);

// Hieuson - 24/2 + Tìm danh mục xuất hiện nhiều nhất trong thư viện cá nhân của user.
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

const getInitial = (name) => {
  const raw = String(name || '').trim();
  return raw ? raw[0].toUpperCase() : '?';
};

function HomePage() {
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [loading, setLoading] = useState(false);
  const [heroStories, setHeroStories] = useState([]);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [latestStories, setLatestStories] = useState([]);
  const [rankingStories, setRankingStories] = useState([]);
  const [recommendedStories, setRecommendedStories] = useState([]);
  const [recommendTagName, setRecommendTagName] = useState('');
  const [communityComments, setCommunityComments] = useState([]);
  const [chapterMetaByStoryId, setChapterMetaByStoryId] = useState({});

  const activeHeroStory = heroStories[activeHeroIndex] || null;

  useEffect(() => {
    // Hieuson - 24/2 + Nạp dữ liệu trang chủ gồm banner, cập nhật, ranking, gợi ý và phản hồi cộng đồng.
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const response = await storyService.getPublicStories({
          page: 0,
          size: 60,
          sort: 'lastUpdatedAt,desc',
        });
        const publicStories = Array.isArray(response) ? response : [];

        const newestStories = [...publicStories]
          .sort(
            (a, b) =>
              toEpoch(b?.lastUpdatedAt || b?.createdAt) -
              toEpoch(a?.lastUpdatedAt || a?.createdAt),
          )
          .slice(0, LATEST_COUNT);
        setLatestStories(newestStories);

        const allTimeRanking = [...publicStories]
          .sort(
            (a, b) => Number(b?.readerCount || 0) - Number(a?.readerCount || 0),
          )
          .slice(0, RANKING_COUNT);
        setRankingStories(allTimeRanking);

        const randomHeroStories = pickRandomStories(publicStories, HERO_COUNT);
        setHeroStories(randomHeroStories);
        setActiveHeroIndex(0);

        const chapterMetaStoryIds = [
          ...new Set(
            [...randomHeroStories, ...newestStories]
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

        const latestComments = await storyService.getLatestCommunityComments({
          size: 3,
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

  useEffect(() => {
    if (heroStories.length <= 1) return undefined;
    // Hieuson - 24/2 + Tự động trượt hero slider sau mỗi 5 giây.
    const timer = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroStories.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroStories]);

  const heroCategoryName = useMemo(
    () => getStoryCategory(activeHeroStory)?.name || 'Không phân loại',
    [activeHeroStory],
  );

  const goPrevHero = () => {
    if (!heroStories.length) return;
    setActiveHeroIndex(
      (prev) => (prev - 1 + heroStories.length) % heroStories.length,
    );
  };

  const goNextHero = () => {
    if (!heroStories.length) return;
    setActiveHeroIndex((prev) => (prev + 1) % heroStories.length);
  };

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
            className='home-hero'
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(10, 20, 50, 0.92) 0%, rgba(15, 26, 52, 0.7) 45%, rgba(8, 14, 30, 0.65) 100%), url(${activeHeroStory.coverUrl || ''})`,
            }}
          >
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
                    <RefreshCw size={18} />
                    Cập nhật gần đây
                  </h2>
                </div>
                <div className='home-updated-grid'>
                  {latestStories.map((story) => {
                    const meta = chapterMetaByStoryId[story.id];
                    return (
                      <article key={story.id} className='home-updated-card'>
                        <Link
                          to={`/stories/${story.id}/metadata`}
                          className='home-updated-card__cover-link'
                        >
                          {story.coverUrl ? (
                            <img src={story.coverUrl} alt={story.title} />
                          ) : (
                            <div className='home-updated-card__cover-empty'>
                              No cover
                            </div>
                          )}
                        </Link>
                        <div className='home-updated-card__body'>
                          <h3>
                            <Link to={`/stories/${story.id}/metadata`}>
                              {story.title}
                            </Link>
                          </h3>
                          <p className='home-updated-card__author'>
                            {story.authorPenName || 'Chưa có bút danh'}
                          </p>
                          <p className='home-updated-card__chapter'>
                            {meta?.latestChapterTitle || 'Chưa có chương'}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className='home-section home-section--recommend'>
                <div className='home-section__head'>
                  <h2>
                    <Star size={18} />
                    Gợi ý cho bạn
                  </h2>
                  {recommendTagName && (
                    <span className='home-section__meta'>
                      Danh mục ưu tiên: {recommendTagName}
                    </span>
                  )}
                </div>
                <div className='home-recommend-grid'>
                  {recommendedStories.map((story) => (
                    <article key={story.id} className='home-recommend-card'>
                      <Link
                        to={`/stories/${story.id}/metadata`}
                        className='home-recommend-card__cover'
                      >
                        {story.coverUrl ? (
                          <img src={story.coverUrl} alt={story.title} />
                        ) : (
                          <div className='home-recommend-card__cover-empty'>
                            No cover
                          </div>
                        )}
                      </Link>
                      <div className='home-recommend-card__body'>
                        <h3>
                          <Link to={`/stories/${story.id}/metadata`}>
                            {story.title}
                          </Link>
                        </h3>
                        <p>{getSummary(story, 120)}</p>
                        <div className='home-recommend-card__meta'>
                          <span>
                            {getStoryCategory(story)?.name || 'Không phân loại'}
                          </span>
                          <span>
                            {Number(story?.ratingAvg || 0).toFixed(1)} / 5
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <aside className='home-main-grid__right'>
              <section className='home-ranking'>
                <div className='home-ranking__head'>
                  <h2>
                    <TrendingUp size={10} />
                    Bảng xếp hạng
                  </h2>
                </div>
                <ol className='home-ranking__list'>
                  {rankingStories.map((story, idx) => (
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
                  ))}
                </ol>
              </section>
            </aside>
          </div>
        )}

        {!loading && (
          <section className='home-section home-section--community'>
            <div className='home-section__head'>
              <h2>
                <MessageSquare size={18} />
                Phản hồi từ cộng đồng
              </h2>
            </div>
            <div className='home-community-list'>
              {communityComments.map((comment) => (
                <article key={comment.id} className='home-community-item'>
                  <div className='home-community-item__avatar'>
                    {comment.avatarUrl ? (
                      <img
                        src={comment.avatarUrl}
                        alt={comment.username || 'user'}
                      />
                    ) : (
                      <span>{getInitial(comment.username)}</span>
                    )}
                  </div>
                  <div className='home-community-item__body'>
                    <div className='home-community-item__head'>
                      <strong>{comment.username || 'Unknown'}</strong>
                      <small>{formatRelativeTime(comment.createdAt)}</small>
                    </div>
                    <p className='home-community-item__story'>
                      Bình luận tại:{' '}
                      {comment.storyId ? (
                        <Link to={`/stories/${comment.storyId}/metadata`}>
                          {comment.storyTitle || 'Story'}
                        </Link>
                      ) : (
                        <span>{comment.storyTitle || 'Story'}</span>
                      )}
                    </p>
                    <p className='home-community-item__content'>
                      {comment.content}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default HomePage;
