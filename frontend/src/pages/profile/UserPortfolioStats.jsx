import React from 'react';
import { Sparkles, Heart, MessageCircle } from 'lucide-react';

const UserPortfolioStats = ({ data, onShowFollowers, followersCount: propFollowersCount }) => {
    // Debug: Check if data is passed correctly
    console.log('🔍 Props received:', { data, onShowFollowers });
    console.log('🔍 Data type:', typeof data);
    console.log('🔍 Data is null:', data === null);
    console.log('🔍 Data is undefined:', data === undefined);
    
    const totalStories = data?.storiesCount || 0;
    
    // Format number function (same as AuthorCard)
    const formatNumber = (num) => {
        if (num === '--' || num === null || num === undefined) return '--';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num?.toString() || '0';
    };
    
    // Calculate total views from multiple possible sources
    const calculateTotalViews = () => {
        // Debug: Log full API response to help debug backend
        console.log('🔍 Full API Response:', data);
        console.log('🔍 FullData:', data?.fullData);
        console.log('🔍 TotalViews value:', data?.totalViews);
        console.log('🔍 TotalStories value:', data?.totalStories);
        console.log('🔍 TotalFollowers value:', data?.totalFollowers);
        
        // Check if backend is returning the new fields
        if (data?.totalViews !== undefined) {
            console.log('✅ Backend has totalViews:', data.totalViews);
        } else {
            console.log('❌ Backend missing totalViews field');
        }
        
        // Priority 1: Direct totalViews field (same as AuthorCard)
        if (data?.totalViews) return data.totalViews;
        
        // Priority 1.5: Check fullData for views (same as AuthorSearchPage)
        if (data?.fullData?.totalViews) return data.fullData.totalViews;
        
        // Priority 2: Alternative field names
        if (data?.viewsCount) return data.viewsCount;
        if (data?.profileViews) return data.profileViews;
        if (data?.totalProfileViews) return data.totalProfileViews;
        if (data?.views) return data.views;
        if (data?.reads) return data.reads;
        if (data?.readCount) return data.readCount;
        if (data?.totalReads) return data.totalReads;
        if (data?.likes) return data.likes;
        if (data?.likesCount) return data.likesCount;
        
        // Check common alternative field names in fullData
        if (data?.fullData?.viewsCount) return data.fullData.viewsCount;
        if (data?.fullData?.profileViews) return data.fullData.profileViews;
        if (data?.fullData?.totalProfileViews) return data.fullData.totalProfileViews;
        if (data?.fullData?.views) return data.fullData.views;
        if (data?.fullData?.reads) return data.fullData.reads;
        if (data?.fullData?.readCount) return data.fullData.readCount;
        if (data?.fullData?.totalReads) return data.fullData.totalReads;
        if (data?.fullData?.likes) return data.fullData.likes;
        if (data?.fullData?.likesCount) return data.fullData.likesCount;
        if (data?.fullData?.viewCount) return data.fullData.viewCount;
        if (data?.fullData?.read_count) return data.fullData.read_count;
        if (data?.fullData?.total_reads) return data.fullData.total_reads;
        if (data?.fullData?.total_views) return data.fullData.total_views;
        
        // Priority 3: Calculate from stories array (most reliable)
        if (data?.stories && Array.isArray(data.stories)) {
            const storyViews = data.stories.reduce((total, story) => total + (story.views || story.reads || 0), 0);
            console.log('📚 Stories data:', data.stories);
            console.log('📚 Story views calculation:', storyViews);
            console.log('📚 First story views:', data.stories[0]?.views);
            if (storyViews > 0) return storyViews;
        }
        
        // Priority 4: Calculate from stories in fullData
        if (data?.fullData?.stories && Array.isArray(data.fullData.stories)) {
            const storyViews = data.fullData.stories.reduce((total, story) => total + (story.views || story.reads || 0), 0);
            console.log('📚 FullData stories:', data.fullData.stories);
            console.log('📚 FullData story views calculation:', storyViews);
            console.log('📚 FullData first story views:', data.fullData.stories[0]?.views);
            if (storyViews > 0) return storyViews;
        }
        
        // Priority 5: Calculate from albums if available
        if (data?.albums && Array.isArray(data.albums)) {
            const albumViews = data.albums.reduce((total, album) => total + (album.views || 0), 0);
            return albumViews;
        }
        
        // Priority 6: Try nested data structures
        if (data?.userData?.totalViews) return data.userData.totalViews;
        if (data?.userStats?.totalViews) return data.userStats.totalViews;
        if (data?.profile?.totalViews) return data.profile.totalViews;
        
        // If no views data available, use commentsCount as temporary fallback
        if (data?.commentsCount !== undefined) {
            console.log('🔄 Using commentsCount as views fallback:', data.commentsCount);
            return data.commentsCount;
        }
        return '--';
    };
    
    const totalViews = calculateTotalViews();
    const totalFollowers = propFollowersCount !== undefined ? propFollowersCount : (data?.followersCount || 0);
    
    // Debug: Log final calculated values
    console.log('📊 Final Stats:', {
        totalStories,
        totalViews,
        totalFollowers,
        commentsCount: data?.commentsCount,
        storiesCount: data?.storiesCount
    });

    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                    <Sparkles size={24} />
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Stories</p>
                    <p className="text-2xl font-extrabold text-gray-900">{formatNumber(totalStories)}</p>
                </div>
            </div>
            <div 
                className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={onShowFollowers}
            >
                <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600">
                    <Heart size={24} />
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Followers</p>
                    <p className="text-2xl font-extrabold text-gray-900">{formatNumber(totalFollowers)}</p>
                </div>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-gray-100 flex items-center gap-5 shadow-sm">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <MessageCircle size={24} />
                </div>
                <div>
                    <p className="text-gray-500 text-sm font-semibold uppercase tracking-wide">Views</p>
                    <p className="text-2xl font-extrabold text-gray-900">{formatNumber(totalViews)}</p>
                </div>
            </div>
        </section>
    );
};

export default UserPortfolioStats;
