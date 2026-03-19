import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Eye, Star } from 'lucide-react';
import SkeletonBlock from '../components/SkeletonBlock';
import libraryAlbumService from '../services/libraryAlbumService';
import '../styles/library-stories.css';

const PublicAlbumDetail = () => {
    const { albumId } = useParams();
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    console.log('🎯 PublicAlbumDetail mounted, albumId:', albumId);

    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('🔍 Fetching public album with ID:', albumId);
                const response = await libraryAlbumService.getPublicAlbumDetail(albumId);
                console.log('📡 Public album API response:', response);
                console.log('📚 Stories in album:', response?.stories);
                console.log('🖼️ First story cover:', response?.stories?.[0]?.coverUrl);
                setAlbum(response);
            } catch (err) {
                console.error('❌ Error fetching public album:', err);
                setError('Không tìm thấy bộ sưu tập công khai này');
            } finally {
                setLoading(false);
            }
        };

        if (albumId) {
            fetchAlbum();
        }
    }, [albumId]);

    if (loading) {
        return (
            <section className='library-shell'>
                <div className='library-shell__hero'>
                    <div className='library-page library-page--hero'>
                        <header className='library-page__top'>
                            <Link to="/" className='library-page__back'>
                                <ArrowLeft size={28} />
                            </Link>
                            <h1 className='library-page__title'>Đang tải bộ sưu tập...</h1>
                        </header>
                    </div>
                </div>
                <div className='library-shell__band'>
                    <div className='library-page library-page--content'>
                        <div className='library-cover-grid' aria-hidden='true'>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <article
                                    key={`library-story-skeleton-${i}`}
                                    className='library-cover-card library-cover-card--skeleton'
                                >
                                    <div className='library-cover-card__media'>
                                        <div className='library-cover-card__placeholder library-cover-card__placeholder--skeleton' />
                                        <div className='library-cover-card__overlay'>
                                            <div className='library-cover-card__line-skeleton library-cover-card__line-skeleton--title' />
                                            <div className='library-cover-card__line-skeleton' />
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (error || !album) {
        console.log('❌ PublicAlbumDetail error state:', error, 'album:', album);
        return (
            <section className='library-shell'>
                <div className='library-shell__hero'>
                    <div className='library-page library-page--hero'>
                        <header className='library-page__top'>
                            <Link to="/" className='library-page__back'>
                                <ArrowLeft size={28} />
                            </Link>
                        </header>
                    </div>
                </div>
                <div className='library-shell__band'>
                    <div className='library-page library-page--content'>
                        <div className='library-page__empty'>
                            <h2 className='library-page__empty-title'>
                                {error || 'Không tìm thấy bộ sưu tập'}
                            </h2>
                            <p className='library-page__empty-desc'>
                                Bộ sưu tập này không tồn tại hoặc không được chia sẻ công khai.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    console.log('✅ PublicAlbumDetail rendering album:', album?.name, 'stories count:', album?.stories?.length);

    try {
        return (
            <section className='library-shell'>
                <div className='library-shell__hero'>
                    <div className='library-page library-page--hero'>
                        <header className='library-page__top'>
                            <Link to="/" className='library-page__back'>
                                <ArrowLeft size={28} />
                            </Link>
                            <h1 className='library-page__title'>{album.name}</h1>
                        </header>
                        
                        {album.description && (
                            <p className='library-page__subtitle'>{album.description}</p>
                        )}
                    </div>
                </div>

                <div className='library-shell__band'>
                    <div className='library-page library-page--content'>
                        {/* Album Info */}
                        <div className="library-stories__album-info">
                            <div className="library-stories__album-stats">
                                <div className="library-stories__album-stat">
                                    <BookOpen size={16} />
                                    <span>{album.stories?.length || 0} truyện</span>
                                </div>
                                <div className="library-stories__album-stat">
                                    <Eye size={16} />
                                    <span>Công khai</span>
                                </div>
                            </div>
                        </div>

                        {/* Stories Grid */}
                        {album.stories && album.stories.length > 0 ? (
                            <div className="library-cover-grid">
                                {album.stories.map((story) => (
                                    <article key={story.id} className="library-cover-card">
                                        <Link to={`/stories/${story.id}/metadata`} className="library-cover-card__link">
                                            <div className="library-cover-card__media">
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
                                            {story.isCompleted && (
                                                <div className="library-cover-card__badge">
                                                    Hoàn thành
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="library-cover-card__overlay">
                                            <h3 className="library-cover-card__title">{story.title}</h3>
                                            <div className="library-cover-card__author">
                                                bởi <span>{story.authorName || 'Tác giả'}</span>
                                            </div>
                                            
                                            <div className="library-cover-card__stats">
                                                <div className="library-cover-card__stat">
                                                    <Eye size={14} />
                                                    <span>{story.views || 0}</span>
                                                </div>
                                                <div className="library-cover-card__stat">
                                                    <Star size={14} />
                                                    <span>{story.averageRating ? story.averageRating.toFixed(1) : '0.0'}</span>
                                                </div>
                                            </div>
                                            
                                            {story.genres && story.genres.length > 0 && (
                                                <div className="library-cover-card__genres">
                                                    {story.genres.slice(0, 2).map((genre, index) => (
                                                        <span key={index} className="library-cover-card__genre">
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            
                                            {story.lastChapterTitle && (
                                                <div className="library-cover-card__last-chapter">
                                                    Chương mới: {story.lastChapterTitle}
                                                </div>
                                            )}
                                        </div>
                                    </Link>
                                </article>
                                ))}
                            </div>
                        ) : (
                            <div className="library-page__empty">
                                <BookOpen className="library-page__empty-icon" />
                                <h2 className="library-page__empty-title">Chưa có truyện nào</h2>
                                <p className="library-page__empty-desc">
                                    Bộ sưu tập này chưa có truyện nào.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        );
    } catch (renderError) {
        console.error('❌ PublicAlbumDetail render error:', renderError);
        return (
            <section className='library-shell'>
                <div className='library-shell__hero'>
                    <div className='library-page library-page--hero'>
                        <header className='library-page__top'>
                            <Link to="/" className='library-page__back'>
                                <ArrowLeft size={28} />
                            </Link>
                        </header>
                    </div>
                </div>
                <div className='library-shell__band'>
                    <div className='library-page library-page--content'>
                        <div className='library-page__empty'>
                            <h2 className='library-page__empty-title'>Lỗi hiển thị</h2>
                            <p className='library-page__empty-desc'>
                                Đã xảy ra lỗi khi hiển thị bộ sưu tập.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
};

export default PublicAlbumDetail;
