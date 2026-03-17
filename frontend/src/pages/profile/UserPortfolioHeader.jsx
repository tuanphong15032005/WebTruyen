import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';
import { uploadCover } from '../../api/userApi';

const UserPortfolioHeader = ({ data, onDonateClick }) => {
    console.log('🎯 UserPortfolioHeader data:', data); // Debug log
    console.log('🎯 data.isAuthor:', data.isAuthor); // Debug log
    console.log('🎯 data.author:', data.author); // Debug log
    console.log('🎯 isAuthor boolean:', Boolean(data.isAuthor || data.author)); // Debug log
    
    // Cover upload states
    const [coverFile, setCoverFile] = useState(null);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [coverMessage, setCoverMessage] = useState('');
    const coverInputRef = useRef(null);
    
    // Avatar logic - same as User Profile page
    const getInitial = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    // ISSUE 3: Follow state
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(data.followersCount || 0);
    const currentUserId = localStorage.getItem('userId'); // Get current logged-in user

    useEffect(() => {
        // Check follow status when component mounts
        if (currentUserId && data.userId) {
            checkFollowStatus();
        }
    }, [currentUserId, data.userId]);

    const checkFollowStatus = async () => {
        try {
            const response = await fetch(`http://localhost:8081/api/users/${data.userId}/follow-status?currentUserId=${currentUserId}`);
            const result = await response.json();
            setIsFollowing(result.isFollowing);
        } catch (error) {
            console.error('Error checking follow status:', error);
        }
    };

    const handleFollowClick = async () => {
        console.log('🔗 Follow clicked - currentUserId:', currentUserId);
        console.log('🔗 Follow clicked - targetUserId:', data.userId);
        
        if (!currentUserId) {
            alert('Vui lòng đăng nhập để theo dõi tác giả');
            return;
        }

        try {
            console.log('🔗 Calling follow API...');
            const response = await fetch(`http://localhost:8081/api/users/${data.userId}/follow?currentUserId=${currentUserId}`, {
                method: 'POST'
            });
            const result = await response.json();
            console.log('🔗 Follow API response:', result);
            setIsFollowing(result.isFollowing);
            setFollowersCount(result.followersCount);
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    // Cover upload handlers
    const handleCoverChange = (event) => {
        const selected = event.target.files?.[0];
        if (!selected) return;

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const maxSize = 5 * 1024 * 1024;

        if (!allowedTypes.includes(selected.type)) {
            setCoverMessage('Chỉ chấp nhận các định dạng: JPEG, PNG, GIF, WebP');
            setTimeout(() => setCoverMessage(''), 3000);
            return;
        }

        if (selected.size > maxSize) {
            setCoverMessage('Kích thước file không được vượt quá 5MB');
            setTimeout(() => setCoverMessage(''), 3000);
            return;
        }

        setCoverFile(selected);
        setCoverMessage('');
    };

    const handleCoverUpload = async () => {
        if (!coverFile) return;

        setUploadingCover(true);
        setCoverMessage('');

        try {
            const formData = new FormData();
            formData.append('cover', coverFile);

            const userId = currentUserId;
            const response = await uploadCover(userId, formData);
            const newCoverUrl = response.coverUrl || response.url;

            // Update the data object to trigger re-render
            data.coverUrl = newCoverUrl;

            setCoverFile(null);
            setCoverMessage('Cập nhật ảnh bìa thành công!');
            setTimeout(() => setCoverMessage(''), 3000);
        } catch (error) {
            console.error('Error uploading cover:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Tải ảnh bìa lên thất bại, vui lòng thử lại!';
            setCoverMessage(errorMessage);
            setTimeout(() => setCoverMessage(''), 3000);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleCancelCoverUpload = () => {
        setCoverFile(null);
        setCoverMessage('');
    };

    // Check if current user is viewing their own portfolio
    const isOwnPortfolio = currentUserId && data.userId && currentUserId === data.userId.toString();
    
    // Debug logs
    console.log('🔍 Debug portfolio ownership:');
    console.log('- currentUserId:', currentUserId, typeof currentUserId);
    console.log('- data.userId:', data.userId, typeof data.userId);
    console.log('- isOwnPortfolio:', isOwnPortfolio);
    
    return (
        <div className="relative">
            {/* Cover Image */}
            <div className="h-48 bg-gray-300 relative">
                {data.coverUrl ? (
                    <img
                        src={data.coverUrl}
                        alt={`${data.displayName || data.username}'s cover`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-300"></div>
                )}
                
                {/* Cover Upload Button - Only show on own portfolio */}
                {isOwnPortfolio && (
                    <div className="absolute top-4 left-4">
                        <button 
                            className="flex items-center gap-2 text-white px-4 py-2 rounded-lg transition-all duration-300 hover:bg-opacity-80"
                            style={{backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'}}
                            onClick={() => coverInputRef.current?.click()}
                            title="Thay đổi ảnh bìa"
                            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
                        >
                            <Camera className="w-4 h-4" />
                            <span>Thay đổi ảnh bìa</span>
                        </button>
                        <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleCoverChange}
                            className="hidden"
                        />
                    </div>
                )}
            </div>
            
            {/* Profile Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative -mt-16">
                    {/* Avatar */}
                    <div className="flex items-end space-x-6">
                        <div className="relative">
                            {data.avatarUrl ? (
                                <img
                                    src={data.avatarUrl}
                                    alt={data.displayName}
                                    className="h-32 w-32 rounded-full border-4 border-white shadow-lg object-cover"
                                />
                            ) : (
                                <div className="h-32 w-32 rounded-full border-4 border-white shadow-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #17a2b8, #138496)'}}>
                                    <span className="text-2xl font-bold text-white">
                                        {data.displayName?.charAt(0)?.toUpperCase() || data.username?.charAt(0)?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* User Info and Actions */}
                        <div className="flex-1 pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {data.displayName || data.username}
                                    </h1>
                                    <p className="text-gray-600">@{data.username}</p>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex space-x-3">
                                    {/* Follow Button */}
                                    {currentUserId && currentUserId !== data.userId.toString() && (
                                        <button
                                            onClick={handleFollowClick}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                                isFollowing
                                                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                            }`}
                                        >
                                            {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                                        </button>
                                    )}
                                    
                                    {/* Donate Button */}
                                    {currentUserId && currentUserId !== data.userId.toString() && (
                                        <button
                                            onClick={onDonateClick}
                                            disabled={!data.author}
                                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                                data.author
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            }`}
                                        >
                                            {data.author ? (
                                                'Ủng hộ tác giả'
                                            ) : (
                                                <span className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Ủng hộ tác giả (khóa)
                                                </span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Stats Row */}
                    <div className="mt-6 grid grid-cols-3 gap-8 pb-6 border-b border-gray-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{data.storiesCount}</div>
                            <div className="text-sm text-gray-600">Truyện</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{followersCount}</div>
                            <div className="text-sm text-gray-600">Người theo dõi</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{data.commentsCount}</div>
                            <div className="text-sm text-gray-600">Bình luận</div>
                        </div>
                    </div>

                    {/* Cover Upload Preview & Messages - Only show on own portfolio */}
                    {isOwnPortfolio && (
                        <>
                            {coverFile && (
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <span className="text-blue-800 flex-shrink-0">Ảnh bìa mới đã chọn</span>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <button
                                                onClick={handleCoverUpload}
                                                disabled={uploadingCover}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                {uploadingCover ? 'Đang tải...' : 'Lưu ảnh bìa'}
                                            </button>
                                            <button
                                                onClick={handleCancelCoverUpload}
                                                disabled={uploadingCover}
                                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            >
                                                Hủy
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {coverMessage && (
                                <div className={`mt-4 p-4 rounded-lg ${
                                    coverMessage.includes('thành công') 
                                        ? 'bg-green-50 text-green-800 border border-green-200' 
                                        : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                    {coverMessage}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserPortfolioHeader;
