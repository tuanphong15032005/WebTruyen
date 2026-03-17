import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, Star } from 'lucide-react';
import libraryAlbumService from '../../services/libraryAlbumService';
import '../../styles/library-stories.css';

const UserPortfolioAlbums = ({ userId }) => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAlbum, setSelectedAlbum] = useState(null);
    const [albumStories, setAlbumStories] = useState([]);
    const [loadingStories, setLoadingStories] = useState(false);

    useEffect(() => {
        const fetchUserAlbums = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await libraryAlbumService.getUserAlbums(userId);
                setAlbums(response || []);
            } catch (err) {
                console.error('Error fetching user albums:', err);
                setError('Không thể tải danh sách album');
                setAlbums([]);
            } finally {
                setLoading(false);
            }
        };

        if (userId) {
            fetchUserAlbums();
        }
    }, [userId]);

    const formatNumber = (num) => {
        if (!num) return '0';
        return num.toLocaleString('vi-VN');
    };

    const openAlbumModal = async (albumId) => {
        try {
            setLoadingStories(true);
            const response = await libraryAlbumService.getPublicAlbumDetail(albumId);
            setSelectedAlbum(response);
            setAlbumStories(response.stories || []);
        } catch (err) {
            console.error('Error fetching album stories:', err);
        } finally {
            setLoadingStories(false);
        }
    };

    const closeModal = () => {
        setSelectedAlbum(null);
        setAlbumStories([]);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Bộ sưu tập</h2>
                <div className='library-album-grid' aria-hidden='true'>
                    {Array.from({ length: 6 }, (_, index) => (
                        <article
                            key={`library-album-skeleton-${index}`}
                            className='library-album-card library-album-card--skeleton'
                        >
                            <div className='library-album-card__mosaic'>
                                <div className='library-album-card__tile library-album-card__tile--primary' />
                                <div className='library-album-card__tile' />
                                <div className='library-album-card__tile' />
                            </div>
                            <div className='library-album-card__body'>
                                <div className='library-album-card__line-skeleton library-album-card__line-skeleton--title' />
                                <div className='library-album-card__line-skeleton' />
                                <div className='library-album-card__line-skeleton library-album-card__line-skeleton--short' />
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Bộ sưu tập</h2>
                <div className="text-center py-8">
                    <p className="text-red-600">{error}</p>
                </div>
            </div>
        );
    }

    if (albums.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Bộ sưu tập</h2>
                <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Chưa có bộ sưu tập nào</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-lg shadow p-6">
                <div className="library-count mb-6">
                    <strong>{formatNumber(albums.length)}</strong>
                    <span>bộ sưu tập</span>
                </div>

                {albums.length === 0 ? (
                    <div className='library-page__empty'>
                        <p>Chưa có bộ sưu tập công khai nào.</p>
                    </div>
                ) : (
                    <div className='library-album-grid'>
                        {albums.map((album) => {
                            const previewCoverUrls = Array.isArray(album?.previewCovers)
                                ? album.previewCovers.slice(0, 3)
                                : [];
                            const description = String(album?.description || '').trim();

                            return (
                                <article key={album.id} className='library-album-card'>
                                    <div
                                        className='library-album-card__link'
                                        onClick={() => openAlbumModal(album.id)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className='library-album-card__mosaic'>
                                            {[0, 1, 2].map((index) => {
                                                const coverUrl = previewCoverUrls[index] || '';
                                                const isLastTile = index === 2;
                                                const showMoreBadge =
                                                    isLastTile && Number(album.remainingCount || 0) > 0;
                                                const tileClass =
                                                    index === 0
                                                        ? 'library-album-card__tile library-album-card__tile--primary'
                                                        : `library-album-card__tile ${
                                                            showMoreBadge
                                                                ? 'library-album-card__tile--stacked'
                                                                : ''
                                                        }`;

                                                return (
                                                    <div key={`${album.id}-${index}`} className={tileClass}>
                                                        {coverUrl ? (
                                                            <img
                                                                src={coverUrl}
                                                                alt={album.name}
                                                                loading='lazy'
                                                                decoding='async'
                                                            />
                                                        ) : (
                                                            <div className='library-album-card__tile-placeholder' />
                                                        )}

                                                        {showMoreBadge && (
                                                            <span className='library-album-card__more'>
                                                                +{formatNumber(album.remainingCount)}
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className='library-album-card__body'>
                                            <h3>{album.name}</h3>
                                            <p>
                                                {description || 'Chưa có mô tả cho bộ sưu tập này.'}
                                            </p>
                                            <span className='library-album-card__meta'>
                                                {formatNumber(album.itemCount || 0)} truyện
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Album Stories Modal */}
            {selectedAlbum && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={closeModal}
                >
                    <div 
                        className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[80vh] w-full mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{selectedAlbum.name}</h2>
                                {selectedAlbum.description && (
                                    <p className="text-sm text-gray-600 mt-1">{selectedAlbum.description}</p>
                                )}
                            </div>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            {loadingStories ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                                            <div className="h-32 bg-gray-200 rounded mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            ) : albumStories.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {albumStories.map((story) => (
                                        <div key={story.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <Link 
                                                to={`/stories/${story.id}/metadata`}
                                                onClick={closeModal}
                                                className="block"
                                            >
                                                {story.coverUrl ? (
                                                    <img
                                                        src={story.coverUrl}
                                                        alt={story.title}
                                                        className="w-full h-32 object-cover rounded mb-3"
                                                        onError={(e) => {
                                                            e.target.src = '/placeholder-book.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-400">
                                                        No cover
                                                    </div>
                                                )}
                                                <h3 className="font-medium text-gray-900 truncate mb-1" title={story.title}>
                                                    {story.title}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    bởi {story.authorName || 'Tác giả'}
                                                </p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" />
                                                        <span>{story.views || 0}</span>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3 h-3" />
                                                        <span>{story.averageRating ? story.averageRating.toFixed(1) : '0.0'}</span>
                                                    </span>
                                                </div>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">Bộ sưu tập này chưa có truyện nào.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserPortfolioAlbums;
