
import React, { useState, useEffect } from 'react';
import { sitePageService } from '../../services/sitePageService';
import { getAllTerms, getTermDetail } from '../../api/termApi';
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
        
        let pageData;
        
        // Use terms API for author-rules
        if (code === 'author-rules') {
          console.log('DynamicPage - using terms API for author-rules');
          const allTerms = await getAllTerms();
          // Filter only terms with code starting with 'author-rules'
          pageData = allTerms.filter(term => term.code && term.code.startsWith('author-rules'));
          console.log('DynamicPage - filtered author-rules data:', pageData);
        } else {
          pageData = await sitePageService.getPageByCode(code);
          console.log('DynamicPage - received pageData:', pageData);
        }
        
        console.log('DynamicPage - pageData type:', typeof pageData);
        console.log('DynamicPage - is pageData array?', Array.isArray(pageData));
        
        // Set the page data
        if (code === 'author-rules') {
          // Check if pageData exists and has content
          if (!pageData || pageData.length === 0) {
            throw new Error('No author rules data found');
          }
          // Sort by code to maintain order (author-rules1, author-rules2, etc.)
          pageData.sort((a, b) => {
            const extractNumber = (code) => {
              const match = code.match(/author-rules(\d+)/);
              return match ? parseInt(match[1]) : 0;
            };
            return extractNumber(a.code) - extractNumber(b.code);
          });
          setPage(pageData);
        } else {
          setPage(pageData);
        }
        
        // Debug: Log order of received data
        console.log('=== DEBUG: Page order received ===');
        pageData.forEach((item, index) => {
          console.log(`${index}: ${item.code} - ${item.title}`);
        });
        
        // Save to localStorage for DocsToc
        localStorage.setItem('currentPageBlocks', JSON.stringify(pageData));
      } catch (err) {
        console.error('DynamicPage - error:', err);
        console.error('DynamicPage - error response:', err.response);
        console.error('DynamicPage - error status:', err.response?.status);
        
        if (code === 'author-rules') {
          setError('Không tìm thấy quy định đăng truyện. Vui lòng liên hệ quản trị viên.');
        } else {
          setError('Không tìm thấy trang này');
        }
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

  const pageTitle = code === 'author-rules' 
    ? 'Quy định đăng truyện' 
    : (page[0]?.title || 'Trang thông tin');
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
          const sectionId = block.code || block.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
          
          // Remove title from content if it exists to avoid duplication
          let cleanContent = block.content;
          if (block.title) {
            // Create a regex to match the title in various HTML formats
            const titleRegex = new RegExp(
              `<h[1-6][^>]*>${block.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/h[1-6]>`,
              'gi'
            );
            cleanContent = block.content.replace(titleRegex, '');
          }
          
          return (
            <div key={index} id={sectionId} className="mb-8">
              {/* Show title for each section */}
              {block.title && (
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {block.title}
                </h2>
              )}
              <div dangerouslySetInnerHTML={{ __html: cleanContent }} />
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
