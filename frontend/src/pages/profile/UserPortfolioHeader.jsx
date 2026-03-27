import React from 'react';
import { Heart, DollarSign } from 'lucide-react';
import { getStoredUser } from '../../utils/helpers';

const UserPortfolioHeader = ({
  data,
  onFollow,
  onDonate,
  isFollowing,
  followLoading,
  isOwnPortfolio,
  isDark = false,
}) => {
  const user = getStoredUser();
  const isAuthenticated = Boolean(user && user.userId);

  const primaryTextStyle = { color: 'var(--theme-text-primary)' };
  const secondaryTextStyle = { color: 'var(--theme-text-secondary)' };
  const nameplateStyle = {
    background: isDark ? 'var(--theme-surface-raised)' : 'rgba(255, 255, 255, 0.92)',
    borderColor: isDark ? 'var(--theme-border)' : 'rgba(255, 255, 255, 0.85)',
    boxShadow: isDark ? 'var(--shadow-lg)' : '0 18px 36px rgba(15, 23, 42, 0.12)',
  };

  const getFollowButtonClassName = () => {
    if (followLoading) {
      return 'bg-gray-200 text-gray-500 cursor-not-allowed';
    }

    if (!isAuthenticated) {
      return 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20';
    }

    if (isFollowing) {
      return isDark
        ? 'text-white hover:brightness-110'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300';
    }

    return 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20';
  };

  const followButtonStyle =
    isAuthenticated && isFollowing && isDark
      ? {
          background: 'var(--theme-surface-hover)',
          borderColor: 'var(--theme-border)',
        }
      : undefined;

  const donateButtonStyle = isDark
    ? {
        boxShadow: '0 10px 28px rgba(34, 197, 94, 0.26)',
      }
    : undefined;

  return (
    <section className="relative w-full">
      <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 shadow-sm">
        {data.coverUrl ? (
          <img
            src={data.coverUrl}
            alt={`Ảnh bìa của ${data.displayName || data.username}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-30" />
        )}
      </div>

      <div className="relative z-10 -mt-16 flex flex-col gap-5 px-5 sm:px-8 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:h-32 sm:w-32">
            <img
              className="h-full w-full object-cover"
              src={
                data.avatar ||
                data.avatarUrl ||
                data.coverUrl ||
                'https://via.placeholder.com/150x150'
              }
              alt="Ảnh đại diện người dùng"
            />
          </div>

          <div
            className="min-w-0 rounded-[28px] border px-5 py-4 backdrop-blur-md sm:px-6"
            style={nameplateStyle}
          >
            <h1
              className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl"
              style={primaryTextStyle}
            >
              {data.displayName || data.username}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium leading-7" style={secondaryTextStyle}>
              {data.author ? data.author_bio || data.bio : data.bio || data.description || ''}
            </p>
          </div>
        </div>

        <div className="flex w-full items-center justify-end gap-3 pb-1 max-sm:flex-wrap md:flex-nowrap xl:w-auto xl:shrink-0">
          {!isOwnPortfolio && (
            <button
              type="button"
              onClick={onFollow}
              disabled={followLoading}
              className={`min-h-11 min-w-[172px] justify-center rounded-full px-4 py-2.5 shadow-lg flex items-center gap-2 transition-all ${getFollowButtonClassName()}`}
              style={followButtonStyle}
            >
              <Heart size={18} fill={isFollowing ? 'currentColor' : 'none'} />
              {followLoading
                ? 'Đang xử lý...'
                : !isAuthenticated
                  ? 'Đăng nhập để theo dõi'
                  : isFollowing
                    ? 'Đang theo dõi'
                    : 'Theo dõi'}
            </button>
          )}

          {!isOwnPortfolio && data?.author && (
            <button
              type="button"
              onClick={onDonate}
              className="flex min-h-11 min-w-[172px] items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2.5 text-white shadow-lg transition-all hover:bg-green-600"
              style={donateButtonStyle}
            >
              <DollarSign size={18} />
              {!isAuthenticated ? 'Đăng nhập để ủng hộ' : 'Ủng hộ'}
            </button>
          )}

        </div>
      </div>
    </section>
  );
};

export default UserPortfolioHeader;
