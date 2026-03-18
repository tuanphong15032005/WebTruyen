import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Eye, Star, Plus } from 'lucide-react';
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
                    <Link to="#" className="text-blue-500 font-bold text-sm flex items-center gap-1 hover:underline">
                        View All <span>→</span>
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {albums.slice(0, 6).map((album) => {
                        const previewCoverUrls = Array.isArray(album?.previewCovers)
                            ? album.previewCovers.slice(0, 1)
                            : [];
                        const description = String(album?.description || '').trim();

                        return (
                            <div key={album.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm transition-all cursor-pointer hover:shadow-lg" onClick={() => openAlbumModal(album.id)}>
                                <div className="h-48 overflow-hidden relative">
                                    {previewCoverUrls[0] ? (
                                        <img
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            src={previewCoverUrls[0]}
                                            alt={album.name}
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                                            <BookOpen className="w-12 h-12 text-white/50" />
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-900">
                                        Album
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h4 className="font-bold text-lg text-gray-900 mb-2 leading-tight">{album.name}</h4>
                                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                                        {description || 'Chưa có mô tả cho bộ sưu tập này.'}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-400">
                                            {formatNumber(album.itemCount || 0)} stories
                                        </span>
                                        <div className="flex items-center gap-3 text-gray-400">
                                            <span className="flex items-center gap-1 text-xs">
                                                <Eye size={12} />
                                                {formatNumber(album.views || 0)}
                                            </span>
                                            <span className="flex items-center gap-1 text-xs">
                                                <Star size={12} />
                                                {album.averageRating ? album.averageRating.toFixed(1) : '0.0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
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
