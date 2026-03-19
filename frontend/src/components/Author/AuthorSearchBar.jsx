// frontend/src/components/Author/AuthorSearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchAuthors } from '../../services/authorService';

const AuthorSearchBar = ({ 
  value = '', 
  onChange, 
  onSearch, 
  placeholder = 'Search by pen name or display name...',
  className = ''
}) => {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const searchRef = useRef(null);
  const searchRequestRef = useRef(0);

  // Search for authors with suggestions
  useEffect(() => {
    const keyword = value.trim();
    if (keyword.length < 1) {
      setSuggestions([]);
      setIsLoading(false);
      return undefined;
    }

    const requestId = searchRequestRef.current + 1;
    searchRequestRef.current = requestId;
    setIsLoading(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await searchAuthors({
          keyword: keyword,
          page: 0,
          size: 6,
          sort: 'follower_count',
        });
        if (searchRequestRef.current !== requestId) return;
        setSuggestions(Array.isArray(response.content) ? response.content : []);
      } catch {
        if (searchRequestRef.current !== requestId) return;
        setSuggestions([]);
      } finally {
        if (searchRequestRef.current === requestId) {
          setIsLoading(false);
        }
      }
    }, 200);

    return () => window.clearTimeout(timer);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSearchTouched(true);
    setShowSuggestions(newValue.trim().length >= 1);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearch = () => {
    setShowSuggestions(false);
    onSearch(value.trim());
  };

  const handleSuggestionClick = (suggestion) => {
    setShowSuggestions(false);
    // Navigate to author portfolio
    if (suggestion.authorId || suggestion.id) {
      navigate(`/portfolio/${suggestion.authorId || suggestion.id}`);
    }
  };

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => {
              if (searchTouched && value.trim().length >= 1) {
                setShowSuggestions(true);
              }
            }}
          placeholder={placeholder}
          className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center">
          <button
            onClick={handleSearch}
            className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.authorId || suggestion.id || index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {suggestion.avatarUrl ? (
                    <img
                      src={suggestion.avatarUrl}
                      alt={suggestion.penName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-semibold">
                        {suggestion.penName?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Author Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {suggestion.penName}
                    </span>
                  </div>
                  {suggestion.displayName && (
                    <span className="text-sm text-gray-600 truncate">
                      {suggestion.displayName}
                    </span>
                  )}
                  {suggestion.primaryGenre && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      {suggestion.primaryGenre}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No suggestions message */}
      {showSuggestions && !isLoading && suggestions.length === 0 && value.trim().length >= 1 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            Không có tác giả nào phù hợp.
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorSearchBar;
