import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import UserPortfolioHeader from './UserPortfolioHeader';
import UserPortfolioSidebar from './UserPortfolioSidebar';
import UserPortfolioStats from './UserPortfolioStats';
import UserPortfolioAlbums from './UserPortfolioAlbums';
import AuthorStories from './AuthorStories';
import FollowersModal from '../../components/FollowersModal';
import { getFollowersList, toggleFollow, getFollowStatus } from '../../api/userApi';
import { Share, Lock } from 'lucide-react';
import { getStoredUser } from '../../utils/helpers';

const UserPortfolioPage = () => {
    const { userId, username } = useParams();
    const navigate = useNavigate();
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

    useEffect(() => {
        const fetchPortfolioData = async () => {
            try {
                setLoading(true);
                
                let response;
                if (username) {
                    response = await api.get(`/users/username/${username}/portfolio`);
                } else if (userId) {
                    response = await api.get(`/users/${userId}/portfolio`);
                } else {
                    throw new Error('No userId or username provided');
                }
                
                // Fix: Use response directly instead of response.data
                const portfolioData = response.data || response;
                setPortfolioData(portfolioData);
                
                // Set initial followers count
                if (portfolioData.followersCount !== undefined) {
                    setCurrentFollowersCount(portfolioData.followersCount);
                }
                
                // Set initial privacy state
                if (portfolioData.isPrivate !== undefined) {
                    setIsPrivate(portfolioData.isPrivate);
                } else {
                    // Fallback for localhost - check localStorage
                    if (window.location.hostname === 'localhost') {
                        const savedPrivacy = localStorage.getItem(`privacy_${userId}`);
                        if (savedPrivacy !== null) {
                            setIsPrivate(savedPrivacy === 'true');
                        }
                    }
                }

                // Check follow status if not viewing own portfolio
                const user = getStoredUser();
                if (user && user.userId && user.userId !== userId.toString()) {
                    try {
                        const followStatus = await getFollowStatus(userId, parseInt(user.userId));
                        setIsFollowing(followStatus.isFollowing);
                    } catch (error) {
                        console.error('Error checking follow status:', error);
                    }
                }
            } catch (err) {
                setError(err.response?.data?.message || 'Không thể tải dữ liệu trang cá nhân');
            } finally {
                setLoading(false);
            }
        };

        if (userId || username) {
            fetchPortfolioData();
        }
    }, [userId, username]);

    // Listen for follow status changes
    useEffect(() => {
        const handleFollowStatusChanged = (event) => {
            const { authorId, isFollowing, followersCount } = event.detail;
            
            // Update followers count if this is the same author
            if (authorId === userId) {
                setCurrentFollowersCount(followersCount);
            }
        };

        // Add event listener
        window.addEventListener('followStatusChanged', handleFollowStatusChanged);

        // Cleanup on unmount
        return () => {
            window.removeEventListener('followStatusChanged', handleFollowStatusChanged);
        };
    }, [userId]);

    // Update followers count when data changes
    useEffect(() => {
        if (portfolioData && portfolioData.followersCount !== undefined) {
            setCurrentFollowersCount(portfolioData.followersCount);
        }
    }, [portfolioData]);

    const handleDonateClick = () => {
        // Check if user is authenticated
        const user = getStoredUser();
        if (!user || !user.userId) {
            // Redirect to login page
            navigate('/login');
            return;
        }
        
        // Check if viewing own portfolio
        if (user.userId === userId.toString()) {
            return; // Can't donate to yourself
        }
        
        const targetUserId = portfolioData?.userId || userId;
        navigate(`/donate/${targetUserId}`);
    };

    const handleToggleFollow = async () => {
        // Check if user is authenticated
        const user = getStoredUser();
        if (!user || !user.userId) {
            // Redirect to login page
            navigate('/login');
            return;
        }
        
        const currentUserId = user.userId;
        if (currentUserId === userId.toString()) {
            return; // Can't follow yourself
        }

        setFollowLoading(true);
        try {
            const response = await toggleFollow(userId, parseInt(currentUserId));
            setIsFollowing(response.isFollowing);
            setCurrentFollowersCount(response.followersCount);

            // Dispatch event to update other components
            window.dispatchEvent(new CustomEvent('followStatusChanged', {
                detail: {
                    authorId: userId,
                    isFollowing: response.isFollowing,
                    followersCount: response.followersCount
                }
            }));
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert('Không thể thực hiện thao tác theo dõi');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleTogglePrivacy = async (e) => {
        const newPrivacyState = e.target.checked;
        setIsPrivate(newPrivacyState);
        
        try {
            // Update privacy state in database
            await api.put(`/users/${userId}/privacy`, { isPrivate: newPrivacyState });
        } catch (error) {
            console.error('Error updating privacy settings:', error);
            
            // Fallback for localhost development - save to localStorage
            if (window.location.hostname === 'localhost') {
                localStorage.setItem(`privacy_${userId}`, newPrivacyState.toString());
                console.log('Privacy setting saved to localStorage for development');
                return;
            }
            
            // Revert on error for production
            setIsPrivate(!newPrivacyState);
            alert('Không thể cập nhật cài đặt riêng tư');
        }
    };

    // Check if current user is viewing their own portfolio
    const user = getStoredUser();
    
    // Convert all to numbers for comparison - add null checks
    const userIdNum = parseInt(userId);
    const userUserIdNum = user ? parseInt(user.userId) : null;
    const portfolioUserIdNum = portfolioData ? parseInt(portfolioData?.userId) : null;
    
    const isOwnPortfolio1 = portfolioData && userId && userUserIdNum !== null && userUserIdNum === userIdNum;
    const isOwnPortfolio2 = portfolioData && user && userUserIdNum !== null && portfolioUserIdNum !== null && userUserIdNum === portfolioUserIdNum;
    const isOwnPortfolio = isOwnPortfolio1 || isOwnPortfolio2;
    
    // Check if portfolio is private and viewer is not owner
    const getPrivacyState = () => {
        // First check database state
        if (portfolioData?.isPrivate !== undefined) {
            return portfolioData.isPrivate;
        }
        // Fallback to localStorage for localhost
        if (window.location.hostname === 'localhost') {
            const savedPrivacy = localStorage.getItem(`privacy_${userId}`);
            return savedPrivacy === 'true';
        }
        return false;
    };
    
    const isPrivateAndNotOwner = getPrivacyState() && !isOwnPortfolio;

    const handleShowFollowers = async () => {
        setShowFollowersModal(true);
        setFollowersLoading(true);
        try {
            const followers = await getFollowersList(userId);
            setFollowersList(Array.isArray(followers) ? followers : []);
        } catch (error) {
            console.error('Error fetching followers:', error);
            setFollowersList([]);
        } finally {
            setFollowersLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                {/* Profile Header Skeleton */}
                <section className="relative w-full">
                    <div className="h-64 w-full rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                    </div>
                    <div className="px-8 -mt-16 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
                            </div>
                            <div className="pb-2">
                                <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse mb-2"></div>
                                <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                        <div className="flex gap-3 pb-2">
                            <div className="w-11 h-11 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </section>

                {/* Stats Skeleton */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm">
                            <div className="w-14 h-14 bg-gray-200 rounded-xl animate-pulse"></div>
                            <div>
                                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                                <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Content Skeleton */}
                <section className="mt-8">
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
                </section>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <section className="relative w-full">
                    <div className="h-64 w-full rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                    </div>
                    <div className="px-8 -mt-16 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-gray-400" />
                            </div>
                            <div className="pb-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portfolio</h1>
                                <p className="text-gray-500 font-medium">Error loading portfolio</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h3>
                    <p className="text-gray-500">{error}</p>
                </section>
            </div>
        );
    }

    if (!portfolioData) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <section className="relative w-full">
                    <div className="h-64 w-full rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 relative overflow-hidden shadow-sm">
                        <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                    </div>
                    <div className="px-8 -mt-16 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
                        <div className="flex items-end gap-6">
                            <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                                <BookOpen className="w-16 h-16 text-gray-400" />
                            </div>
                            <div className="pb-2">
                                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Portfolio</h1>
                                <p className="text-gray-500 font-medium">No data available</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <section className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Dữ liệu không khả dụng</h3>
                    <p className="text-gray-500">Dữ liệu trang cá nhân không khả dụng</p>
                </section>
            </div>
        );
    }

    // Calculate stats from existing data - using DB data like UserPortfolioStats
    const totalStories = portfolioData?.storiesCount || 0;
    const totalFollowers = currentFollowersCount;

    // If portfolio is private and viewer is not owner, show privacy message
    if (isPrivateAndNotOwner) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8">
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-6">
                        <Lock size={40} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Người dùng này đã khóa trang cá nhân
                    </h2>
                    <p className="text-gray-600 max-w-md">
                        Trang cá nhân này đã được đặt ở chế độ riêng tư. Chỉ chủ sở hữu mới có thể xem nội dung này.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            {/* UserPortfolioHeader - Cover Image, Avatar, User Info, Follow/Donate/Share Buttons */}
            <UserPortfolioHeader 
                data={portfolioData} 
                onShare={() => {
                    // Handle share functionality
                    if (navigator.share) {
                        navigator.share({
                            title: `${portfolioData?.displayName || portfolioData?.username}'s Portfolio`,
                            text: portfolioData?.bio || 'Check out my portfolio!',
                            url: window.location.href
                        });
                    } else {
                        // Fallback: copy to clipboard
                        navigator.clipboard.writeText(window.location.href);
                        alert('Đã sao chép đường dẫn portfolio!');
                    }
                }}
                onFollow={handleToggleFollow}
                onDonate={handleDonateClick}
                isFollowing={isFollowing}
                followLoading={followLoading}
                isOwnPortfolio={isOwnPortfolio}
            />

            {/* UserPortfolioStats - 3 Stats Cards */}
            <UserPortfolioStats 
                data={portfolioData} 
                onShowFollowers={handleShowFollowers}
                followersCount={currentFollowersCount}
            />

            {/* UserPortfolioSidebar - Privacy Toggle - Only show on own portfolio */}
            {isOwnPortfolio && (
                <UserPortfolioSidebar 
                    data={portfolioData}
                    isPrivate={isPrivate}
                    onTogglePrivacy={handleTogglePrivacy}
                />
            )}

            {/* UserPortfolioAlbums - Albums and Favorite Albums */}
            <UserPortfolioAlbums userId={userId} />
            
            {/* Author Stories - Only show if user is author */}
            {portfolioData?.author && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mt-8">
                    <AuthorStories userId={userId} />
                </div>
            )}

            {/* Followers Modal */}
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
