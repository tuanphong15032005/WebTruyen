import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import authorService from '../../services/authorService';
import useNotify from '../../hooks/useNotify';
import '../../styles/author-public-profile.css';

// Minhdq - 26/02/2026
// [Add reader-author-public-profile-page-with-follow - V1 - branch: clone-minhfinal2]
const formatNumber = (value) => Number(value || 0).toLocaleString('vi-VN');

const formatDate = (value) => {
  if (!value) return 'Chưa cập nhật';
  return new Date(value).toLocaleDateString('vi-VN');
};

const getInitial = (name) => {
  const safe = String(name || '').trim();
  if (!safe) return '?';
  return safe.charAt(0).toUpperCase();
};

const AuthorPublicProfile = () => {
  const { authorId } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotify();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const currentUser = useMemo(() => {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authorService.getPublicAuthorProfile(authorId);
      setProfile(data || null);
    } catch (error) {
      console.error('fetch public author profile error', error);
      notify('Không tải được hồ sơ tác giả', 'error');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [authorId, notify]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleToggleFollow = async () => {
    if (!currentUser) {
      notify('Bạn cần đăng nhập để theo dõi tác giả', 'info');
      navigate('/login');
      return;
    }
    try {
      setFollowLoading(true);
      const result = await authorService.toggleFollowAuthor(authorId);
      setProfile((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          followed: Boolean(result?.followed),
          totalFollowers: Number(result?.totalFollowers || 0),
        };
      });
      notify(
        result?.followed ? 'Đã theo dõi tác giả' : 'Đã hủy theo dõi tác giả',
        'success',
      );
    } catch (error) {
      console.error('toggle follow author error', error);
      notify('Không thể cập nhật theo dõi', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const stories = Array.isArray(profile?.stories) ? profile.stories : [];

  return (
    <div className='author-profile-page'>
      <div className='author-profile-page__container'>
        {loading && <p className='author-profile-page__muted'>Đang tải hồ sơ tác giả...</p>}

        {profile && (
          <>
            <section className='author-profile-card'>
              <div className='author-profile-card__left'>
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.penName || 'Author avatar'}
                    className='author-profile-card__avatar'
                  />
                ) : (
                  <div className='author-profile-card__avatar-fallback'>
                    {getInitial(profile.penName)}
                  </div>
                )}
              </div>
              <div className='author-profile-card__main'>
                <h1>{profile.penName || 'Tác giả'}</h1>
                <p>{profile.shortDescription || 'Tác giả chưa thêm mô tả ngắn.'}</p>
                <div className='author-profile-card__stats'>
                  <div className='author-profile-card__stat'>
                    <span>Total views</span>
                    <strong>{formatNumber(profile.totalViews)}</strong>
                  </div>
                  <div className='author-profile-card__stat'>
                    <span>Total followers</span>
                    <strong>{formatNumber(profile.totalFollowers)}</strong>
                  </div>
                </div>
              </div>
              <div className='author-profile-card__actions'>
                <button
                  type='button'
                  className={profile.followed ? 'author-follow-btn active' : 'author-follow-btn'}
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                >
                  {followLoading
                    ? 'Đang xử lý...'
                    : profile.followed
                      ? 'Unfollow'
                      : 'Follow'}
                </button>
              </div>
            </section>

            <section className='author-story-list'>
              <div className='author-story-list__head'>
                <h2>Published stories</h2>
                <span>{formatNumber(stories.length)} truyện</span>
              </div>

              {stories.length === 0 ? (
                <div className='author-story-list__empty'>
                  Tác giả chưa có truyện đã xuất bản.
                </div>
              ) : (
                <div className='author-story-list__grid'>
                  {stories.map((story) => (
                    <Link
                      key={story.id}
                      to={`/stories/${story.id}/metadata`}
                      className='author-story-card'
                    >
                      {story.coverUrl ? (
                        <img src={story.coverUrl} alt={story.title} />
                      ) : (
                        <div className='author-story-card__cover-empty'>No cover</div>
                      )}
                      <div className='author-story-card__body'>
                        <h3>{story.title}</h3>
                        <div className='author-story-card__meta'>
                          <span>{formatNumber(story.viewCount)} lượt xem</span>
                          <span>{formatDate(story.lastUpdatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthorPublicProfile;
