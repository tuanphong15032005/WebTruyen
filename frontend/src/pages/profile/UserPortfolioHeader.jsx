import React from 'react';
import { Share, Heart, DollarSign } from 'lucide-react';
import { getStoredUser } from '../../utils/helpers';

const UserPortfolioHeader = ({ data, onShare, onFollow, onDonate, isFollowing, followLoading, isOwnPortfolio }) => {
    // Check if user is authenticated
    const user = getStoredUser();
    const isAuthenticated = user && user.userId;
    return (
        <section className="relative w-full">
            <div className="h-64 w-full rounded-3xl bg-gradient-to-r from-purple-100 via-cyan-100 to-blue-100 relative overflow-hidden shadow-sm">
                {data.coverUrl ? (
                    <img
                        src={data.coverUrl}
                        alt={`${data.displayName || data.username}'s cover`}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 opacity-30 bg-gradient-to-br from-white/40 via-transparent to-transparent"></div>
                )}
            </div>
            <div className="px-8 -mt-16 flex flex-col md:flex-row items-end justify-between gap-6 relative z-10">
                <div className="flex items-end gap-6">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white">
                        <img 
                            className="w-full h-full object-cover" 
                            src={data.avatar || data.avatarUrl || data.coverUrl || "https://via.placeholder.com/150x150"} 
                            alt="User avatar" 
                        />
                    </div>
                    <div className="pb-2">
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                            {data.displayName || data.username}
                        </h1>
                        <p className="text-gray-500 font-medium">
                            {data.author ? (data.author_bio || data.bio) : (data.bio || data.description || '')}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 pb-2">
                    {/* Follow Button - Only show when not viewing own portfolio */}
                    {!isOwnPortfolio && (
                        <button 
                            onClick={onFollow}
                            disabled={followLoading}
                            className={`px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all ${
                                !isAuthenticated
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                    : isFollowing 
                                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                                        : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
                            } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <Heart size={18} fill={isFollowing ? 'currentColor' : 'none'} />
                            {followLoading ? 'Đang xử lý...' : 
                             !isAuthenticated ? 'Đăng nhập để theo dõi' :
                             isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </button>
                    )}
                    
                    {/* Donate Button - Only show for authors and when not viewing own portfolio */}
                    {data?.author && !isOwnPortfolio && (
                        <button 
                            onClick={onDonate}
                            className={`px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-all ${
                                !isAuthenticated
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-green-500 text-white rounded-full shadow-lg shadow-green-500/20 hover:bg-green-600'
                            }`}
                        >
                            <DollarSign size={18} />
                            {!isAuthenticated ? 'Đăng nhập để ủng hộ' : 'Ủng hộ'}
                        </button>
                    )}
                    
                    {/* Share Button */}
                    <button 
                        onClick={onShare}
                        className="p-2.5 bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/20 flex items-center justify-center hover:bg-blue-600 transition-all"
                    >
                        <Share size={20} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default UserPortfolioHeader;
