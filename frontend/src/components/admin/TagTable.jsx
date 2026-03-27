import React from 'react';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';

const TagTable = ({ tags, loading, onEdit, onDelete }) => {
  const getBadgeColor = (tag) => {
    if (tag.usageCount === 0) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (tag.usageCount > 10) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getBadgeText = (tag) => {
    if (tag.usageCount === 0) return 'Chưa dùng';
    if (tag.usageCount > 10) return 'Phổ biến';
    return 'Bình thường';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy tag nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 font-semibold text-gray-900">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Tên Tag</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Số lần dùng</th>
            <th className="text-left py-3 px-4 font-semibold text-gray-900">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="py-3 px-4 text-sm text-gray-600">#{tag.id}</td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{tag.name}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getBadgeColor(tag)}`}>
                    {getBadgeText(tag)}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded">
                  {tag.usageCount}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(tag)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(tag.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TagTable;
