import React from 'react';
import { Sparkles, Heart, MessageCircle } from 'lucide-react';

const UserPortfolioStats = ({
  data,
  onShowFollowers,
  followersCount: propFollowersCount,
  isDark = false,
}) => {
  const totalStories = data?.storiesCount || 0;

  const formatNumber = (num) => {
    if (num === '--' || num === null || num === undefined) return '--';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const calculateTotalViews = () => {
    if (data?.totalViews) return data.totalViews;
    if (data?.fullData?.totalViews) return data.fullData.totalViews;
    if (data?.viewsCount) return data.viewsCount;
    if (data?.profileViews) return data.profileViews;
    if (data?.totalProfileViews) return data.totalProfileViews;
    if (data?.views) return data.views;
    if (data?.reads) return data.reads;
    if (data?.readCount) return data.readCount;
    if (data?.totalReads) return data.totalReads;
    if (data?.likes) return data.likes;
    if (data?.likesCount) return data.likesCount;

    if (data?.fullData?.viewsCount) return data.fullData.viewsCount;
    if (data?.fullData?.profileViews) return data.fullData.profileViews;
    if (data?.fullData?.totalProfileViews) return data.fullData.totalProfileViews;
    if (data?.fullData?.views) return data.fullData.views;
    if (data?.fullData?.reads) return data.fullData.reads;
    if (data?.fullData?.readCount) return data.fullData.readCount;
    if (data?.fullData?.totalReads) return data.fullData.totalReads;
    if (data?.fullData?.likes) return data.fullData.likes;
    if (data?.fullData?.likesCount) return data.fullData.likesCount;
    if (data?.fullData?.viewCount) return data.fullData.viewCount;
    if (data?.fullData?.read_count) return data.fullData.read_count;
    if (data?.fullData?.total_reads) return data.fullData.total_reads;
    if (data?.fullData?.total_views) return data.fullData.total_views;

    if (Array.isArray(data?.stories)) {
      const storyViews = data.stories.reduce(
        (total, story) => total + (story.views || story.reads || 0),
        0,
      );
      if (storyViews > 0) return storyViews;
    }

    if (Array.isArray(data?.fullData?.stories)) {
      const storyViews = data.fullData.stories.reduce(
        (total, story) => total + (story.views || story.reads || 0),
        0,
      );
      if (storyViews > 0) return storyViews;
    }

    if (Array.isArray(data?.albums)) {
      const albumViews = data.albums.reduce((total, album) => total + (album.views || 0), 0);
      if (albumViews > 0) return albumViews;
    }

    if (data?.userData?.totalViews) return data.userData.totalViews;
    if (data?.userStats?.totalViews) return data.userStats.totalViews;
    if (data?.profile?.totalViews) return data.profile.totalViews;

    if (data?.commentsCount !== undefined) return data.commentsCount;

    return '--';
  };

  const totalViews = calculateTotalViews();
  const totalFollowers =
    propFollowersCount !== undefined ? propFollowersCount : data?.followersCount || 0;

  const cardStyle = {
    background: isDark ? 'var(--theme-surface-raised)' : '#ffffff',
    borderColor: isDark ? 'var(--theme-border)' : '#f1f5f9',
    color: 'var(--theme-text-primary)',
  };

  const labelStyle = {
    color: 'var(--theme-text-secondary)',
  };

  const valueStyle = {
    color: 'var(--theme-text-primary)',
  };

  return (
    <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div
        className="flex items-center gap-5 rounded-2xl border p-6 shadow-sm"
        style={cardStyle}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
          <Sparkles size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide" style={labelStyle}>
            Truyện
          </p>
          <p className="text-2xl font-extrabold" style={valueStyle}>
            {formatNumber(totalStories)}
          </p>
        </div>
      </div>

      <div
        className="flex cursor-pointer items-center gap-5 rounded-2xl border p-6 shadow-sm transition-shadow hover:shadow-md"
        onClick={onShowFollowers}
        style={cardStyle}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
          <Heart size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide" style={labelStyle}>
            Người theo dõi
          </p>
          <p className="text-2xl font-extrabold" style={valueStyle}>
            {formatNumber(totalFollowers)}
          </p>
        </div>
      </div>

      <div
        className="flex items-center gap-5 rounded-2xl border p-6 shadow-sm"
        style={cardStyle}
      >
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <MessageCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide" style={labelStyle}>
            Lượt xem
          </p>
          <p className="text-2xl font-extrabold" style={valueStyle}>
            {formatNumber(totalViews)}
          </p>
        </div>
      </div>
    </section>
  );
};

export default UserPortfolioStats;
