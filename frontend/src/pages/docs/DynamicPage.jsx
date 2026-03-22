import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import PolicyNavigation from '../../components/docs/PolicyNavigation';
import { sitePageService } from '../../services/sitePageService';
import { inferPolicyCategory, sortPolicyBlocks } from '../../utils/policyPages';

const POLICY_CODES = ['terms', 'privacy', 'author-rules'];

const getPageTitle = (code, page) => {
  if (code === 'terms') return 'Điều khoản dịch vụ';
  if (code === 'privacy') return 'Chính sách bảo mật';
  if (code === 'author-rules') return 'Quy định đăng truyện';
  return page?.[0]?.title || 'Trang thông tin';
};

const getErrorMessage = (code) => {
  if (code === 'terms') return 'Không tìm thấy điều khoản dịch vụ.';
  if (code === 'privacy') return 'Không tìm thấy chính sách bảo mật.';
  if (code === 'author-rules') {
    return 'Không tìm thấy quy định đăng truyện. Vui lòng liên hệ quản trị viên.';
  }
  return 'Không tìm thấy trang này.';
};

function DynamicPage({ code }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        setError(null);

        let pageData;

        if (POLICY_CODES.includes(code)) {
          const allPages = await sitePageService.getAllPages();
          pageData = sortPolicyBlocks(
            allPages.filter((entry) => inferPolicyCategory(entry) === code),
          );
        } else {
          const response = await sitePageService.getPageByCode(code);
          pageData = Array.isArray(response) ? response : response ? [response] : [];
        }

        if (!Array.isArray(pageData) || pageData.length === 0) {
          throw new Error(`No page blocks found for code: ${code}`);
        }

        setPage(pageData);
        localStorage.setItem('currentPageBlocks', JSON.stringify(pageData));
      } catch (err) {
        console.error('DynamicPage error:', err);
        setPage(null);
        localStorage.removeItem('currentPageBlocks');
        setError(getErrorMessage(code));
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchPage();
    } else {
      setLoading(false);
      setPage(null);
      setError('Không tìm thấy trang.');
      localStorage.removeItem('currentPageBlocks');
    }
  }, [code]);

  if (!code) {
    return (
      <div className='text-center py-12'>
        <div className='text-[var(--theme-text-secondary)] text-xl mb-4'>
          Không tìm thấy trang
        </div>
        <p className='text-[var(--theme-text-muted)]'>Đường dẫn không hợp lệ.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--theme-accent)]' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-12'>
        <div className='text-[var(--theme-danger-text)] text-xl mb-4'>{error}</div>
        <p className='text-[var(--theme-text-secondary)]'>
          Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
        </p>
      </div>
    );
  }

  if (!page || page.length === 0) {
    return (
      <div className='text-center py-12'>
        <div className='text-[var(--theme-text-secondary)] text-xl mb-4'>
          Trang không tồn tại
        </div>
        <p className='text-[var(--theme-text-muted)]'>
          Trang bạn tìm kiếm không có trên hệ thống.
        </p>
      </div>
    );
  }

  const pageTitle = getPageTitle(code, page);
  const lastUpdated = page[0]?.updatedAt;

  return (
    <div className='max-w-none text-[var(--theme-text-secondary)] leading-7'>
      <nav className='flex items-center space-x-2 text-sm text-[var(--theme-text-secondary)] mb-6'>
        <Home className='w-4 h-4' />
        <span className='text-[var(--theme-text-muted)]'>{'>'}</span>
        <span>{pageTitle}</span>
      </nav>

      <div className='flex items-center space-x-3 mb-6'>
        <span className='text-4xl'>📖</span>
        <h1 className='text-4xl font-bold text-[var(--theme-text-primary)]'>
          {pageTitle}
        </h1>
      </div>

      {lastUpdated && (
        <p className='text-sm text-[var(--theme-text-muted)] mb-8'>
          Cập nhật lần cuối: {new Date(lastUpdated).toLocaleDateString('vi-VN')}
        </p>
      )}

      <div className='page-content space-y-8'>
        {page.map((block, index) => {
          const sectionId =
            block.code ||
            String(block.title || '')
              .toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-');

          let cleanContent = block.content || '';
          if (block.title) {
            const escapedTitle = block.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const titleRegex = new RegExp(
              `<h[1-6][^>]*>${escapedTitle}<\\/h[1-6]>`,
              'gi',
            );
            cleanContent = cleanContent.replace(titleRegex, '');
          }

          return (
            <section key={`${block.code || index}-${index}`} id={sectionId} className='mb-8'>
              {block.title && (
                <h2 className='text-2xl font-bold text-[var(--theme-text-primary)] mb-4'>
                  {block.title}
                </h2>
              )}
              <div
                className='[&_a]:text-[var(--theme-accent-text)] [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--theme-border)] [&_blockquote]:pl-4 [&_blockquote]:text-[var(--theme-text-secondary)] [&_h1]:text-[var(--theme-text-primary)] [&_h2]:text-[var(--theme-text-primary)] [&_h3]:text-[var(--theme-text-primary)] [&_h4]:text-[var(--theme-text-primary)] [&_li]:text-[var(--theme-text-secondary)] [&_ol]:pl-5 [&_p]:text-[var(--theme-text-secondary)] [&_strong]:text-[var(--theme-text-primary)] [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--theme-border)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--theme-border)] [&_th]:bg-[var(--theme-surface-subtle)] [&_th]:px-3 [&_th]:py-2 [&_ul]:pl-5'
                dangerouslySetInnerHTML={{ __html: cleanContent }}
              />
            </section>
          );
        })}
      </div>

      <PolicyNavigation currentPageCode={code} />
    </div>
  );
}

export default DynamicPage;
