import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function PolicyNavigation({ previous, next, current }) {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        {/* Previous */}
        {previous && (
          <Link
            to={previous.href}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
            <div className="text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">Trước</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {previous.name}
              </p>
            </div>
          </Link>
        )}

        {/* Current */}
        <div className="hidden md:block">
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">Đang xem</p>
            <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
              {current}
            </p>
          </div>
        </div>

        {/* Next */}
        {next && (
          <Link
            to={next.href}
            className="flex items-center space-x-2 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group ml-auto"
          >
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Kế tiếp</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {next.name}
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
