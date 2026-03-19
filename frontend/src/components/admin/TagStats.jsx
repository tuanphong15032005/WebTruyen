import React from 'react';
import { TrendingUp, Archive, Tag } from 'lucide-react';

const TagStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tổng số Tags</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Tag className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tags Trending</p>
            <p className="text-2xl font-bold text-gray-900">{stats.trending}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-xl">
            <TrendingUp className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Tags chưa dùng</p>
            <p className="text-2xl font-bold text-gray-900">{stats.unused}</p>
          </div>
          <div className="p-3 bg-orange-100 rounded-xl">
            <Archive className="text-orange-600" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagStats;
