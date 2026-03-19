// frontend/src/components/Author/AuthorPagination.jsx
import React from 'react';

const AuthorPagination = ({ 
  currentPage = 0, 
  totalPages = 0, 
  onPageChange, 
  className = ''
}) => {
  const handlePageClick = (page) => {
    if (page >= 0 && page < totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      handlePageClick(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      handlePageClick(currentPage + 1);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than or equal to max visible
      for (let i = 0; i < totalPages; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageClick(i)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              i === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        );
      }
    } else {
      // Show ellipsis for large page counts
      let startPage = Math.max(0, currentPage - 2);
      let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(0, endPage - maxVisiblePages + 1);
      }
      
      // First page
      if (startPage > 0) {
        pages.push(
          <button
            key={0}
            onClick={() => handlePageClick(0)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            1
          </button>
        );
        
        if (startPage > 1) {
          pages.push(
            <span key="ellipsis-start" className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
          );
        }
      }
      
      // Middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <button
            key={i}
            onClick={() => handlePageClick(i)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
              i === currentPage
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        );
      }
      
      // Last page
      if (endPage < totalPages - 1) {
        if (endPage < totalPages - 2) {
          pages.push(
            <span key="ellipsis-end" className="px-3 py-2 text-sm text-gray-500">
              ...
            </span>
          );
        }
        
        pages.push(
          <button
            key={totalPages - 1}
            onClick={() => handlePageClick(totalPages - 1)}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
          >
            {totalPages}
          </button>
        );
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 0}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          currentPage === 0
            ? 'text-gray-400 bg-gray-100 border border-gray-300 cursor-not-allowed'
            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Page Numbers */}
      <div className="flex space-x-1">
        {renderPageNumbers()}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages - 1}
        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
          currentPage === totalPages - 1
            ? 'text-gray-400 bg-gray-100 border border-gray-300 cursor-not-allowed'
            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default AuthorPagination;
