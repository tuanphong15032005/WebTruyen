// frontend/src/components/Author/AuthorGrid.jsx
import React from 'react';
import AuthorCard from './AuthorCard';

const AuthorGrid = ({ 
  authors = [], 
  loading = false, 
  onFollowChange = () => {},
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <AuthorCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (authors.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="max-w-md mx-auto">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No authors found</h3>
          <p className="text-gray-600">
            Try adjusting your search terms or browse all authors to discover storytellers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {authors.map((author) => (
        <AuthorCard
          key={author.authorId}
          author={author}
          onFollowChange={onFollowChange}
        />
      ))}
    </div>
  );
};

// Skeleton component for loading state
const AuthorCardSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 animate-pulse">
      {/* Author Header */}
      <div className="flex items-start space-x-4 mb-4">
        {/* Avatar Skeleton */}
        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
        
        {/* Author Info Skeleton */}
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      {/* Bio Skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="text-center p-2 bg-gray-50 rounded">
            <div className="h-6 bg-gray-200 rounded mx-auto mb-1 w-12"></div>
            <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
          </div>
        ))}
      </div>

      {/* Action Buttons Skeleton */}
      <div className="flex space-x-2">
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 h-10 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
};

export default AuthorGrid;
