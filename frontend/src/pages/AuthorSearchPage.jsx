// frontend/src/pages/AuthorSearchPage.jsx
import React, { useState, useEffect } from 'react';
import { searchAuthors } from '../services/authorService';
import AuthorSearchBar from '../components/Author/AuthorSearchBar';
import AuthorGrid from '../components/Author/AuthorGrid';
import AuthorPagination from '../components/Author/AuthorPagination';

const AuthorSearchPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [sortBy, setSortBy] = useState('follower_count');
  const [totalElements, setTotalElements] = useState(0);

  // Load authors on initial render and when page/sort changes
  useEffect(() => {
    loadAuthors();
  }, [currentPage, sortBy]);

  const loadAuthors = async (query = searchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await searchAuthors({
        keyword: query,
        page: currentPage,
        size: 12,
        sort: sortBy,
      });
      
      setAuthors(result.content || []);
      setTotalPages(result.totalPages || 0);
      setTotalElements(result.totalElements || 0);
    } catch (error) {
      console.error('Error loading authors:', error);
      setError('Failed to load authors. Please try again.');
      setAuthors([]);
      setTotalPages(0);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reset to first page when searching
    loadAuthors(query);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // loadAuthors will be called by useEffect
  };

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
    setCurrentPage(0); // Reset to first page when sorting
    // loadAuthors will be called by useEffect
  };

  const handleFollowChange = async (authorId, isFollowing) => {
    // After follow/unfollow, reload the authors data from database to get updated follower count
    setLoading(true);
    try {
      await loadAuthors();
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { value: 'followers', label: 'Được theo dõi nhiều nhất' },
    { value: 'totalStories', label: 'Nhiều truyện nhất' },
    { value: 'totalViews', label: 'Nhiều lượt xem nhất' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Khám phá Tác giả
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Tìm kiếm và theo dõi các tác giả tài năng từ cộng đồng của chúng tôi. Tìm kiếm theo bút danh hoặc tên hiển thị để khám phá tác giả yêu thích tiếp theo của bạn.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <AuthorSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                placeholder="Tìm kiếm theo bút danh hoặc tên hiển thị..."
              />
            </div>
            
            {/* Sort Options */}
            <div className="flex flex-wrap justify-center gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    sortBy === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="mb-6">
          {searchQuery && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Kết quả tìm kiếm cho "{searchQuery}"
                </h2>
                <p className="text-gray-600 mt-1">
                  Tìm thấy {totalElements} tác giả
                </p>
              </div>
              <button
                onClick={() => handleSearch('')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}
          
          {!searchQuery && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Tất cả Tác giả
              </h2>
              <p className="text-gray-600 mt-1">
                Khám phá cộng đồng {totalElements} tác giả tài năng của chúng tôi
              </p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Author Grid */}
        <AuthorGrid
          authors={authors}
          loading={loading}
          onFollowChange={handleFollowChange}
          className="mb-8"
        />

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center">
            <AuthorPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorSearchPage;
