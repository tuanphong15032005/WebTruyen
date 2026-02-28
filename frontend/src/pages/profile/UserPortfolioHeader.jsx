import React, { useState, useEffect } from 'react';

const UserPortfolioHeader = ({ data, onDonateClick }) => {
    console.log('🎯 UserPortfolioHeader data:', data); // Debug log
    console.log('🎯 data.isAuthor:', data.isAuthor); // Debug log
    console.log('🎯 data.author:', data.author); // Debug log
    console.log('🎯 isAuthor boolean:', Boolean(data.isAuthor || data.author)); // Debug log
    
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
    
    return (
        <div className="relative">
            {/* Cover Image (Gray placeholder) */}
            <div className="h-48 bg-gray-300"></div>
            
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
                </div>
            </div>
        </div>
    );
};

export default UserPortfolioHeader;
