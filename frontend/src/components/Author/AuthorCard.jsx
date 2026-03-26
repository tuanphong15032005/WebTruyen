import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { followAuthor, unfollowAuthor, getFollowStatus } from '../../services/authorService';
import { getStoredUser } from '../../utils/helpers';

// Helper function to get current user ID from stored user data
const getCurrentUserId = () => {
  const user = getStoredUser();
  // User data has userId field (not id)
  return user?.userId || null;
};

const AuthorCard = ({ author, onFollowChange = () => {} }) => {
  const [isFollowing, setIsFollowing] = useState(author.isFollowing || false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Check if this is the current user's own profile
  const currentUserId = getCurrentUserId();
  const isOwnProfile = author.authorId === currentUserId;
  
  // Check if user is authenticated
  const user = getStoredUser();
  const isAuthenticated = user && user.userId;

  // Check follow status when component mounts or author changes
  useEffect(() => {
    // Don't check follow status for own profile
    if (isOwnProfile) {
      setIsFollowing(false);
      return;
    }

    const checkFollowStatus = async () => {
      if (author.authorId) {
        try {
          const response = await getFollowStatus(author.authorId);
          if (response.success) {
            setIsFollowing(response.isFollowing);
          }
        } catch (error) {
          console.error('Error checking follow status:', error);
          // Fall back to prop if available
          if (author.isFollowing !== undefined) {
            setIsFollowing(author.isFollowing);
          }
        }
      }
    };

    checkFollowStatus();
  }, [author.authorId, isOwnProfile, currentUserId]);

  // Listen for follow status changes from other components
  useEffect(() => {
    const handleFollowStatusChange = (event) => {
      const { authorId, isFollowing, followersCount } = event.detail;
      if (authorId === author.authorId) {
        setIsFollowing(isFollowing);
        // Update parent component if needed
        onFollowChange(authorId, isFollowing);
      }
    };

    window.addEventListener('followStatusChanged', handleFollowStatusChange);
    return () => {
      window.removeEventListener('followStatusChanged', handleFollowStatusChange);
    };
  }, [author.authorId, onFollowChange]);

  // Handle own profile state changes
  useEffect(() => {
    if (isOwnProfile) {
      setIsFollowing(false);
    }
  }, [isOwnProfile]);

  const handleFollowToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    // Check if user is authenticated
    const user = getStoredUser();
    if (!user || !user.userId) {
      // Redirect to login page
      navigate('/login');
      return;
    }
    
    setIsLoading(true);
    try {
      let response;
      if (isFollowing) {
        response = await unfollowAuthor(author.authorId);
        if (response.success) {
          setIsFollowing(false);
          onFollowChange(author.authorId, false);
        }
      } else {
        response = await followAuthor(author.authorId);
        if (response.success) {
          setIsFollowing(true);
          onFollowChange(author.authorId, true);
        }
      }
      
      // Handle error response
      if (!response.success) {
        console.error('Follow/unfollow failed:', response.message);
        // You could show a toast notification here
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // You could show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toString() || '0';
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-sm">
      {/* Avatar Section */}
      <div className="relative pt-6 pb-4 px-6">
        <div className="relative w-24 h-24 mx-auto">
          {/* Outer ring with peach/pink color */}
          <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
          
          {/* Avatar container */}
          <div className="relative w-full h-full rounded-full overflow-hidden bg-sage-200">
            {/* Real avatar or placeholder */}
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.penName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-sage-300 flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-sage-600">AUTHOR</div>
                <div className="text-xs text-sage-700 mt-1">
                  {author.penName?.charAt(0)?.toUpperCase() || 'A'}
                </div>
              </div>
            )}
          </div>
          
          {/* Green status indicator dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Typography Section */}
      <div className="px-6 pb-3">
        {/* Username */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-blue-900">
            {author.penName || 'Mystic_Scribe'}
          </h3>
        </div>
        
        {/* Full Name */}
        <div className="text-center mt-1">
          <p className="text-sm text-gray-600">
            {author.displayName || 'Pham Van Duc'}
          </p>
        </div>
        
        {/* Bio */}
        <div className="text-center mt-3">
          <p className="text-xs text-blue-400 leading-relaxed px-2">
            {author.bio || 'Ancient myths brought to life in the modern world. Folklore...'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="border-t border-b border-gray-100">
        <div className="flex justify-around py-3">
          {/* Stories */}
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(author.totalStories || 0)}
            </div>
            <div className="text-xs text-blue-400 uppercase tracking-wide">Stories</div>
          </div>
          
          {/* Views */}
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(author.totalViews || 0)}
            </div>
            <div className="text-xs text-blue-400 uppercase tracking-wide">Views</div>
          </div>
          
          {/* Followers */}
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {formatNumber(author.followers || 0)}
            </div>
            <div className="text-xs text-blue-400 uppercase tracking-wide">Followers</div>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Follow Button */}
          <button
            onClick={handleFollowToggle}
            disabled={isLoading || isOwnProfile}
            className={`flex-1 font-bold py-3 px-6 rounded-xl transition-colors duration-200 ${
              isOwnProfile
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : !isAuthenticated
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : isFollowing
                    ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isFollowing ? 'Đang bỏ theo dõi...' : 'Đang theo dõi...'}
              </span>
            ) : (
              isOwnProfile ? 'Hồ sơ của bạn' : 
              !isAuthenticated ? 'Đăng nhập để theo dõi' :
              isFollowing ? 'Đang theo dõi' : 'Theo dõi'
            )}
          </button>
          
          {/* Quick View Button */}
          <button
            className="ml-3 flex items-center text-orange-500 hover:text-orange-600 transition-colors duration-200"
            onClick={() => {
              // Navigate to user profile (always works, even for own profile)
              navigate(`/portfolio/${author.authorId}`);
            }}
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="text-sm font-medium">XEM HỒ SƠ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthorCard;
