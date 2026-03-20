import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import libraryAlbumService from '../../services/libraryAlbumService';
import '../../styles/library-stories.css';

const UserPortfolioAlbums = ({ userId }) => {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">Bộ sưu tập của tôi</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => (
                        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                            <div className="h-48 bg-gray-200 animate-pulse"></div>
                            <div className="p-5">
                                <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-4"></div>
                                <div className="flex items-center justify-between">
                                    <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="flex gap-3">
                                        <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
                                        <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">Bộ sưu tập của tôi</h3>
                <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    if (albums.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-xl font-extrabold text-gray-900 mb-6">Bộ sưu tập của tôi</h3>
                <div className="text-center py-8">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có bộ sưu tập nào</h3>
                    <p className="text-gray-500">Bắt đầu tạo bộ sưu tập đầu tiên của bạn</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Published Albums Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-extrabold text-gray-900">Bộ sưu tập của tôi</h3>
                    <Link to="/library?tab=album" className="text-blue-500 font-bold text-sm flex items-center gap-1 hover:underline">
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
                            <article key={album.id} className='library-album-card'>
                                <Link
                                    to={`/library/albums/public/${album.id}`}
                                    className='library-album-card__link'
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
                                </Link>
                            </article>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default UserPortfolioAlbums;
