import React, { useState, useEffect } from 'react';
import { sitePageService } from '../../services/sitePageService';
import { Home } from 'lucide-react';
import PolicyNavigation from '../../components/docs/PolicyNavigation';
import DocsToc from '../../components/docs/DocsToc';

function DynamicPage({ code }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        console.log('DynamicPage - fetching page with code:', code);
        const pageData = await sitePageService.getPageByCode(code);
        console.log('DynamicPage - received pageData:', pageData);
        console.log('DynamicPage - pageData type:', typeof pageData);
        console.log('DynamicPage - is pageData array?', Array.isArray(pageData));
        
        // Set the array of blocks for this page
        setPage(pageData);
        
        // Debug: Log order of received data
        console.log('=== DEBUG: Page order received ===');
        pageData.forEach((item, index) => {
          console.log(`${index}: ${item.code} - ${item.title}`);
        });
        
        // Save to localStorage for DocsToc
        localStorage.setItem('currentPageBlocks', JSON.stringify(pageData));
      } catch (err) {
        console.error('DynamicPage - error:', err);
        setError('Không tìm thấy trang này');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchPage();
    }
  }, [code]);

  if (!code) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-xl mb-4">Không tìm thấy trang</div>
        <p className="text-gray-500">Đường dẫn không hợp lệ.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-xl mb-4">{error}</div>
        <p className="text-gray-600">Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.</p>
      </div>
    );
  }

  if (!page || page.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 text-xl mb-4">Trang không tồn tại</div>
        <p className="text-gray-500">Trang bạn tìm kiếm không có trên hệ thống.</p>
      </div>
    );
  }

  const pageTitle = page[0]?.title || 'Trang thông tin';
  const lastUpdated = page[0]?.updatedAt;
  
  console.log('DynamicPage - pageTitle:', pageTitle);
  console.log('DynamicPage - page length:', page?.length);
  console.log('DynamicPage - page data:', page);

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Home className="w-4 h-4" />
        <span className="text-gray-500">{'>'}</span>
        <span>{pageTitle}</span>
      </nav>

      {/* Title */}
      <div className="flex items-center space-x-3 mb-6">
        <span className="text-4xl">📖</span>
        <h1 className="text-4xl font-bold text-gray-900">
          {pageTitle}
        </h1>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-600 mb-8">
        Cập nhật lần cuối: {new Date(lastUpdated).toLocaleDateString('vi-VN')}
      </p>

      {/* Content - Render all blocks */}
      <div className="page-content">
        {page.map((block, index) => {
          const sectionId = block.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          return (
            <div key={index} id={sectionId}>
              <div dangerouslySetInnerHTML={{ __html: block.content }} />
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <PolicyNavigation currentPageCode={code} />
    </div>
  );
}

export default DynamicPage;
