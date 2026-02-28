import React from 'react';

const UserPortfolioSidebar = ({ data }) => {
    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Giới thiệu</h2>
            
            {/* Bio */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tiểu sử</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                    {data.bio || 'Chưa có tiểu sử'}
                </p>
                
                {/* Pen Name - Display next to bio for authors */}
                {data.author && data.authorPenName && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Bút danh</h3>
                        <p className="text-blue-600 font-medium italic">
                            "{data.authorPenName}"
                        </p>
                    </div>
                )}
            </div>
            
            {/* Join Date */}
            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ngày tham gia</h3>
                <p className="text-gray-600 text-sm">
                    {new Date(data.joinDate).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </p>
            </div>
            
            {/* Author Badge */}
            {data.isAuthor && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-600">Tác giả đã xác thực</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserPortfolioSidebar;
