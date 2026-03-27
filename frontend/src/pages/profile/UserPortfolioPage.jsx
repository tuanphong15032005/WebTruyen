import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import api from '../../services/api';
import UserPortfolioHeader from './UserPortfolioHeader';
import UserPortfolioSidebar from './UserPortfolioSidebar';
import UserPortfolioStats from './UserPortfolioStats';
import UserPortfolioAlbums from './UserPortfolioAlbums';
import AuthorStories from './AuthorStories';
import FollowersModal from '../../components/FollowersModal';
import { getFollowersList, toggleFollow, getFollowStatus } from '../../api/userApi';
import { getStoredUser } from '../../utils/helpers';
import { useTheme } from '../../context/ThemeContext';

const UserPortfolioPage = () => {
  const { userId, username } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersList, setFollowersList] = useState([]);
  const [followersLoading, setFollowersLoading] = useState(false);
  const [currentFollowersCount, setCurrentFollowersCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUser = getStoredUser();
  const currentUserId = currentUser?.userId ? Number(currentUser.userId) : null;
  const routeUserId = userId ? Number(userId) : null;
  const portfolioOwnerId = portfolioData?.userId
    ? Number(portfolioData.userId)
    : routeUserId;
  const privacyStorageKey = portfolioOwnerId ? `privacy_${portfolioOwnerId}` : null;

  const isOwnPortfolio = useMemo(() => {
    if (currentUserId === null || portfolioOwnerId === null || Number.isNaN(portfolioOwnerId)) {
      return false;
    }

    return currentUserId === portfolioOwnerId;
  }, [currentUserId, portfolioOwnerId]);

  const surfaceCardStyle = {
    background: isDark ? 'var(--theme-surface-raised)' : '#ffffff',
    borderColor: isDark ? 'var(--theme-border)' : '#f1f5f9',
  };
  const primaryTextStyle = { color: 'var(--theme-text-primary)' };
  const secondaryTextStyle = { color: 'var(--theme-text-secondary)' };
  const softSurfaceStyle = {
    background: isDark ? 'var(--theme-surface-hover)' : '#f3f4f6',
  };

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setLoading(true);
        setError(null);

        let response;
        if (username) {
          response = await api.get(`/users/username/${username}/portfolio`);
        } else if (userId) {
          response = await api.get(`/users/${userId}/portfolio`);
        } else {
          throw new Error('Missing portfolio identifier');
        }

        const nextPortfolioData = response.data || response;
        setPortfolioData(nextPortfolioData);

        if (nextPortfolioData.followersCount !== undefined) {
          setCurrentFollowersCount(nextPortfolioData.followersCount);
        }

        if (nextPortfolioData.isPrivate !== undefined) {
          setIsPrivate(nextPortfolioData.isPrivate);
        } else if (window.location.hostname === 'localhost') {
          const fallbackStorageKey = `privacy_${nextPortfolioData.userId || userId}`;
          const savedPrivacy = localStorage.getItem(fallbackStorageKey);
          if (savedPrivacy !== null) {
            setIsPrivate(savedPrivacy === 'true');
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu trang tác giả');
      } finally {
        setLoading(false);
      }
    };

    if (userId || username) {
      fetchPortfolioData();
    }
  }, [userId, username]);

  useEffect(() => {
    if (portfolioData?.followersCount !== undefined) {
      setCurrentFollowersCount(portfolioData.followersCount);
    }
  }, [portfolioData]);

  useEffect(() => {
    const handleFollowStatusChanged = (event) => {
      const { authorId, followersCount } = event.detail;
      if (String(authorId) === String(portfolioOwnerId || userId)) {
        setCurrentFollowersCount(followersCount);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChanged);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChanged);
    };
  }, [portfolioOwnerId, userId]);

  useEffect(() => {
    const targetUserId = portfolioOwnerId;
    if (!targetUserId || !currentUserId || currentUserId === targetUserId) {
      setIsFollowing(false);
      return;
    }

    let cancelled = false;

    const fetchFollowStatus = async () => {
      try {
        const followStatus = await getFollowStatus(targetUserId, currentUserId);
        if (!cancelled) {
          setIsFollowing(Boolean(followStatus?.isFollowing));
        }
      } catch (followError) {
        console.error('Error checking follow status:', followError);
      }
    };

    fetchFollowStatus();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, portfolioOwnerId]);

  const getPrivacyState = () => {
    if (portfolioData?.isPrivate !== undefined) {
      return portfolioData.isPrivate;
    }

    if (window.location.hostname === 'localhost' && privacyStorageKey) {
      return localStorage.getItem(privacyStorageKey) === 'true';
    }

    return false;
  };

  const isPrivateAndNotOwner = getPrivacyState() && !isOwnPortfolio;

  const handleDonateClick = () => {
    if (!currentUser?.userId) {
      navigate('/login');
      return;
    }

    if (!portfolioOwnerId || currentUserId === portfolioOwnerId) {
      return;
    }

    navigate(`/donate/${portfolioOwnerId}`);
  };

  const handleToggleFollow = async () => {
    if (!currentUser?.userId) {
      navigate('/login');
      return;
    }

    if (!portfolioOwnerId || currentUserId === portfolioOwnerId) {
      return;
    }

    setFollowLoading(true);
    try {
      const response = await toggleFollow(portfolioOwnerId, currentUserId);
      setIsFollowing(Boolean(response.isFollowing));
      setCurrentFollowersCount(response.followersCount);

      window.dispatchEvent(
        new CustomEvent('followStatusChanged', {
          detail: {
            authorId: String(portfolioOwnerId),
            isFollowing: response.isFollowing,
            followersCount: response.followersCount,
          },
        }),
      );
    } catch (followError) {
      console.error('Error toggling follow:', followError);
      alert('Không thể thực hiện thao tác theo dõi');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleTogglePrivacy = async (event) => {
    const newPrivacyState = event.target.checked;
    setIsPrivate(newPrivacyState);

    try {
      if (!portfolioOwnerId) return;
      await api.put(`/users/${portfolioOwnerId}/privacy`, { isPrivate: newPrivacyState });
    } catch (privacyError) {
      console.error('Error updating privacy settings:', privacyError);

      if (window.location.hostname === 'localhost' && privacyStorageKey) {
        localStorage.setItem(privacyStorageKey, newPrivacyState.toString());
        return;
      }

      setIsPrivate(!newPrivacyState);
      alert('Không thể cập nhật cài đặt riêng tư');
    }
  };

  const handleShowFollowers = async () => {
    if (!portfolioOwnerId) return;

    setShowFollowersModal(true);
    setFollowersLoading(true);
    try {
      const followers = await getFollowersList(portfolioOwnerId);
      setFollowersList(Array.isArray(followers) ? followers : []);
    } catch (followersError) {
      console.error('Error fetching followers:', followersError);
      setFollowersList([]);
    } finally {
      setFollowersLoading(false);
    }
  };

  const handleShare = async () => {
    const shareTitle = `Portfolio của ${portfolioData?.displayName || portfolioData?.username}`;
    const shareText = portfolioData?.bio || 'Xem portfolio của tác giả này trên WebTruyen!';

    if (navigator.share) {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: window.location.href,
      });
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép liên kết portfolio!');
  };

  const renderHeroShell = (title, subtitle) => (
    <section className="relative w-full">
      <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-30" />
      </div>
      <div className="relative z-10 -mt-16 flex flex-col gap-5 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
            <BookOpen className="h-16 w-16 text-gray-400" />
          </div>
          <div className="pb-2">
            <h1 className="text-3xl font-extrabold tracking-tight" style={primaryTextStyle}>
              {title}
            </h1>
            <p className="font-medium" style={secondaryTextStyle}>
              {subtitle}
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8" style={primaryTextStyle}>
        <section className="relative w-full">
          <div className="relative h-64 w-full overflow-hidden rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-30" />
          </div>
          <div className="relative z-10 -mt-16 flex flex-col gap-5 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
                <div className="h-full w-full animate-pulse bg-gray-200" />
              </div>
              <div className="pb-2">
                <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              <div className="h-11 w-11 animate-pulse rounded-full bg-gray-200" />
            </div>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center gap-5 rounded-2xl border p-6 shadow-sm"
              style={surfaceCardStyle}
            >
              <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200" />
              <div>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-12 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </section>

        <section className="mt-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border shadow-sm"
                style={surfaceCardStyle}
              >
                <div className="h-48 animate-pulse bg-gray-200" />
                <div className="p-5">
                  <div className="mb-2 h-5 w-full animate-pulse rounded bg-gray-200" />
                  <div className="mb-4 h-4 w-full animate-pulse rounded bg-gray-200" />
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
                    <div className="flex gap-3">
                      <div className="h-3 w-8 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-8 animate-pulse rounded bg-gray-200" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8" style={primaryTextStyle}>
        {renderHeroShell('Trang tác giả', 'Không thể tải portfolio')}
        <section className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold" style={primaryTextStyle}>
            Đã xảy ra lỗi
          </h3>
          <p style={secondaryTextStyle}>{error}</p>
        </section>
      </div>
    );
  }

  if (!portfolioData) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8" style={primaryTextStyle}>
        {renderHeroShell('Trang tác giả', 'Không có dữ liệu để hiển thị')}
        <section className="py-12 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold" style={primaryTextStyle}>
            Dữ liệu không khả dụng
          </h3>
          <p style={secondaryTextStyle}>Hiện chưa có dữ liệu cho trang tác giả này.</p>
        </section>
      </div>
    );
  }

  if (isPrivateAndNotOwner) {
    return (
      <div className="mx-auto max-w-6xl p-4 md:p-8" style={primaryTextStyle}>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style={softSurfaceStyle}
          >
            <Lock size={40} className="text-gray-400" />
          </div>
          <h2 className="mb-4 text-2xl font-bold" style={primaryTextStyle}>
            Người dùng này đã khoá portfolio
          </h2>
          <p className="max-w-md" style={secondaryTextStyle}>
            Portfolio này đang ở chế độ riêng tư. Chỉ chủ sở hữu mới có thể xem nội dung bên trong.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8" style={primaryTextStyle}>
      <UserPortfolioHeader
        data={portfolioData}
        onShare={handleShare}
        onFollow={handleToggleFollow}
        onDonate={handleDonateClick}
        isFollowing={isFollowing}
        followLoading={followLoading}
        isOwnPortfolio={isOwnPortfolio}
        isDark={isDark}
      />

      <UserPortfolioStats
        data={portfolioData}
        onShowFollowers={handleShowFollowers}
        followersCount={currentFollowersCount}
        isDark={isDark}
      />

      {isOwnPortfolio && (
        <UserPortfolioSidebar isPrivate={isPrivate} onTogglePrivacy={handleTogglePrivacy} />
      )}

      <UserPortfolioAlbums userId={portfolioOwnerId} isDark={isDark} />

      {portfolioData?.author && (
        <div className="mt-8 rounded-2xl border p-6 shadow-sm" style={surfaceCardStyle}>
          <AuthorStories userId={portfolioOwnerId} isDark={isDark} />
        </div>
      )}

      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        followers={followersList}
        loading={followersLoading}
      />
    </div>
  );
};

export default UserPortfolioPage;
