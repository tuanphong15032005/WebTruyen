import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sitePageService } from '../../services/sitePageService';

// Static navigation order
const PAGE_ORDER = ['terms', 'privacy', 'author-rules'];

const getRoute = (code) => {
  switch (code) {
    case 'terms': return '/policy/terms-of-service';
    case 'privacy': return '/policy/privacy-policy';
    case 'author-rules': return '/policy/upload-rule';
    default: return `/policy/${code}`;
  }
};

function PolicyNavigation({ currentPageCode }) {
  const [navigationData, setNavigationData] = useState({
    previous: null,
    next: null,
    current: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildNavigation = async () => {
      try {
        const allPages = await sitePageService.getAllPages();
        
        // Filter and group pages by base code
        const groupedPages = {};
        allPages.forEach(page => {
          const baseCode = page.code.replace(/\d+/, '');
          if (!groupedPages[baseCode]) {
            groupedPages[baseCode] = [];
          }
          groupedPages[baseCode].push(page);
        });
        
        const currentIndex = PAGE_ORDER.indexOf(currentPageCode);
        
        const previous = currentIndex > 0 
          ? { code: PAGE_ORDER[currentIndex - 1], title: getDisplayName(PAGE_ORDER[currentIndex - 1]) }
          : null;
          
        const next = currentIndex < PAGE_ORDER.length - 1
          ? { code: PAGE_ORDER[currentIndex + 1], title: getDisplayName(PAGE_ORDER[currentIndex + 1]) }
          : null;
          
        const current = { code: currentPageCode, title: getDisplayName(currentPageCode) };

        setNavigationData({
          previous: previous ? {
            name: previous.title,
            href: getRoute(previous.code)
          } : null,
          next: next ? {
            name: next.title,
            href: getRoute(next.code)
          } : null,
          current: current.title
        });
      } catch (error) {
        console.error('Failed to build navigation:', error);
        // Fallback to hardcoded navigation
        const fallbackData = {
          terms: { previous: null, next: { name: 'Chính sách bảo mật', href: '/policy/privacy-policy' }, current: 'Điều khoản dịch vụ' },
          privacy: { previous: { name: 'Điều khoản dịch vụ', href: '/policy/terms-of-service' }, next: { name: 'Rule đăng truyện', href: '/policy/upload-rule' }, current: 'Chính sách bảo mật' },
          'author-rules': { previous: { name: 'Chính sách bảo mật', href: '/policy/privacy-policy' }, next: null, current: 'Rule đăng truyện' }
        };
        setNavigationData(fallbackData[currentPageCode] || { previous: null, next: null, current: '' });
      } finally {
        setLoading(false);
      }
    };

    const getDisplayName = (code) => {
      switch (code) {
        case 'terms': return 'Điều khoản dịch vụ';
        case 'privacy': return 'Chính sách bảo mật';
        case 'author-rules': return 'Rule đăng truyện';
        default: return code;
      }
    };

    if (currentPageCode) {
      buildNavigation();
    }
  }, [currentPageCode]);

  if (loading) {
    return (
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-16 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-16 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        {/* Previous */}
        {navigationData.previous && (
          <Link
            to={navigationData.previous.href}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Trước</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {navigationData.previous.name}
              </p>
            </div>
          </Link>
        )}

        {/* Current */}
        <div className="hidden md:block">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Đang xem</p>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {navigationData.current}
            </p>
          </div>
        </div>

        {/* Next */}
        {navigationData.next && (
          <Link
            to={navigationData.next.href}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ml-auto"
          >
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Kế tiếp</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {navigationData.next.name}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default PolicyNavigation;
