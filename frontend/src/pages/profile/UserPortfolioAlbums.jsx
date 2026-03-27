import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import libraryAlbumService from '../../services/libraryAlbumService';
import { getStoredUser } from '../../utils/helpers';
import '../../styles/library-stories.css';

const UserPortfolioAlbums = ({ userId, isDark = false }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = useMemo(() => getStoredUser(), []);
  const isOwnAlbums = useMemo(
    () => currentUser && currentUser.userId === userId?.toString(),
    [currentUser, userId],
  );

  useEffect(() => {
    const fetchUserAlbums = async () => {
      try {
        setLoading(true);
        setError(null);

        let response = null;

        try {
          response = await libraryAlbumService.getUserAlbums(userId);
        } catch (err) {
          console.log('Album fetch failed:', err.message);

          if (err.response?.status === 403) {
            if (!currentUser) {
              console.log('Albums require authentication - not logged in');
            } else if (!isOwnAlbums) {
              console.log("Albums are private - viewing someone else's profile");
            } else {
              throw err;
            }
          } else if (err.response?.status === 404) {
            console.log('No albums found for this user');
          } else if (err.response?.status === 500) {
            console.log('Server error - albums endpoint might not support public access');
          } else {
            throw err;
          }

          response = [];
        }

        setAlbums(response || []);
      } catch (err) {
        console.error('Unexpected error fetching user albums:', err);

        if (err.response?.status === 403 || err.response?.status === 404 || err.response?.status === 500) {
          setError(null);
        } else {
          setError('Không thể tải danh sách bộ sưu tập.');
        }

        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserAlbums();
    }
  }, [currentUser, isOwnAlbums, userId]);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString('vi-VN');
  };

  const sectionTitle = isOwnAlbums ? 'Bộ sưu tập của tôi' : 'Bộ sưu tập';
  const cardStyle = {
    background: isDark ? 'var(--theme-surface-raised)' : '#ffffff',
    borderColor: isDark ? 'var(--theme-border)' : '#f1f5f9',
  };
  const titleStyle = { color: 'var(--theme-text-primary)' };
  const mutedStyle = { color: 'var(--theme-text-secondary)' };

  if (loading) {
    return (
      <div className="rounded-2xl border p-6 shadow-sm" style={cardStyle}>
        <h3 className="mb-6 text-xl font-extrabold" style={titleStyle}>
          {sectionTitle}
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border p-6 shadow-sm" style={cardStyle}>
        <h3 className="mb-6 text-xl font-extrabold" style={titleStyle}>
          {sectionTitle}
        </h3>
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold" style={titleStyle}>
            Đã xảy ra lỗi
          </h3>
          <p style={mutedStyle}>{error}</p>
        </div>
      </div>
    );
  }

  if (albums.length === 0) {
    const emptyTitle = isOwnAlbums
      ? 'Bạn chưa có bộ sưu tập nào'
      : currentUser
        ? 'Bộ sưu tập đang ở chế độ riêng tư'
        : 'Cần đăng nhập để xem';
    const emptyDescription = isOwnAlbums
      ? 'Hãy tạo bộ sưu tập đầu tiên để lưu những truyện bạn yêu thích.'
      : currentUser
        ? 'Người dùng này đã ẩn danh sách bộ sưu tập khỏi người khác.'
        : 'Đăng nhập để xem bộ sưu tập công khai của người dùng này.';

    return (
      <div className="rounded-2xl border p-6 shadow-sm" style={cardStyle}>
        <h3 className="mb-6 text-xl font-extrabold" style={titleStyle}>
          {sectionTitle}
        </h3>
        <div className="py-8 text-center">
          <BookOpen className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h3 className="mb-2 text-xl font-bold" style={titleStyle}>
            {emptyTitle}
          </h3>
          <p style={mutedStyle}>{emptyDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-6 shadow-sm" style={cardStyle}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-xl font-extrabold" style={titleStyle}>
          {sectionTitle}
        </h3>
        <Link
          to="/library?tab=album"
          className="flex items-center gap-1 text-sm font-bold text-blue-500 hover:underline"
        >
          Xem tất cả <span>→</span>
        </Link>
      </div>

      <div className="library-album-grid">
        {albums.slice(0, 6).map((album) => {
          const previewCoverUrls = Array.isArray(album?.previewCoverUrls)
            ? album.previewCoverUrls.slice(0, 3)
            : Array.isArray(album?.previewCovers)
              ? album.previewCovers.slice(0, 3)
              : [];
          const description = String(album?.description || '').trim();

          return (
            <article key={album.id} className="library-album-card">
              <Link to={`/library/albums/public/${album.id}`} className="library-album-card__link">
                <div className="library-album-card__mosaic">
                  {[0, 1, 2].map((index) => {
                    const coverUrl = previewCoverUrls[index] || '';
                    const isLastTile = index === 2;
                    const showMoreBadge = isLastTile && Number(album.remainingCount || 0) > 0;
                    const tileClass =
                      index === 0
                        ? 'library-album-card__tile library-album-card__tile--primary'
                        : `library-album-card__tile ${
                            showMoreBadge ? 'library-album-card__tile--stacked' : ''
                          }`;

                    return (
                      <div key={`${album.id}-${index}`} className={tileClass}>
                        {coverUrl ? (
                          <img
                            src={coverUrl}
                            alt={album.name}
                            loading="lazy"
                            decoding="async"
                          />
                        ) : (
                          <div className="library-album-card__tile-placeholder" />
                        )}

                        {showMoreBadge && (
                          <span className="library-album-card__more">
                            +{formatNumber(album.remainingCount)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="library-album-card__body">
                  <h3>{album.name}</h3>
                  <p>{description || 'Bộ sưu tập này chưa có mô tả.'}</p>
                  <span className="library-album-card__meta">
                    {formatNumber(album.itemCount || 0)} truyện
                  </span>
                </div>
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default UserPortfolioAlbums;
