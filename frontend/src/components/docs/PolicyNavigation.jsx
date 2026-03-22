import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { sitePageService } from '../../services/sitePageService';

const PAGE_ORDER = ['terms', 'privacy', 'author-rules'];

const getRoute = (code) => {
  switch (code) {
    case 'terms':
      return '/policy/terms-of-service';
    case 'privacy':
      return '/policy/privacy-policy';
    case 'author-rules':
      return '/policy/upload-rule';
    default:
      return `/policy/${code}`;
  }
};

const getDisplayName = (code) => {
  switch (code) {
    case 'terms':
      return 'Điều khoản dịch vụ';
    case 'privacy':
      return 'Chính sách bảo mật';
    case 'author-rules':
      return 'Rule đăng truyện';
    default:
      return code;
  }
};

function PolicyNavigation({ currentPageCode }) {
  const [navigationData, setNavigationData] = useState({
    previous: null,
    next: null,
    current: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildNavigation = async () => {
      try {
        await sitePageService.getAllPages();

        const currentIndex = PAGE_ORDER.indexOf(currentPageCode);
        const previous =
          currentIndex > 0
            ? { code: PAGE_ORDER[currentIndex - 1], title: getDisplayName(PAGE_ORDER[currentIndex - 1]) }
            : null;
        const next =
          currentIndex < PAGE_ORDER.length - 1
            ? { code: PAGE_ORDER[currentIndex + 1], title: getDisplayName(PAGE_ORDER[currentIndex + 1]) }
            : null;

        setNavigationData({
          previous: previous
            ? { name: previous.title, href: getRoute(previous.code) }
            : null,
          next: next ? { name: next.title, href: getRoute(next.code) } : null,
          current: getDisplayName(currentPageCode),
        });
      } catch (error) {
        console.error('Failed to build navigation:', error);

        const fallbackData = {
          terms: {
            previous: null,
            next: { name: 'Chính sách bảo mật', href: '/policy/privacy-policy' },
            current: 'Điều khoản dịch vụ',
          },
          privacy: {
            previous: { name: 'Điều khoản dịch vụ', href: '/policy/terms-of-service' },
            next: { name: 'Rule đăng truyện', href: '/policy/upload-rule' },
            current: 'Chính sách bảo mật',
          },
          'author-rules': {
            previous: { name: 'Chính sách bảo mật', href: '/policy/privacy-policy' },
            next: null,
            current: 'Rule đăng truyện',
          },
        };

        setNavigationData(
          fallbackData[currentPageCode] || {
            previous: null,
            next: null,
            current: '',
          },
        );
      } finally {
        setLoading(false);
      }
    };

    if (currentPageCode) {
      buildNavigation();
    }
  }, [currentPageCode]);

  if (loading) {
    return (
      <div className='mt-12 pt-8 border-t border-[var(--theme-divider)]'>
        <div className='flex items-center justify-between'>
          <div className='animate-pulse'>
            <div className='h-16 w-32 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-surface-subtle)]' />
          </div>
          <div className='animate-pulse'>
            <div className='h-12 w-40 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-surface-subtle)]' />
          </div>
          <div className='animate-pulse'>
            <div className='h-16 w-32 rounded-lg border border-[var(--theme-border-subtle)] bg-[var(--theme-surface-subtle)]' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mt-12 pt-8 border-t border-[var(--theme-divider)]'>
      <div className='flex items-center justify-between'>
        {navigationData.previous && (
          <Link
            to={navigationData.previous.href}
            className='flex items-center space-x-2 px-4 py-3 bg-[var(--theme-surface-raised)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors group'
          >
            <ChevronLeft className='w-4 h-4 text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)]' />
            <div className='text-left'>
              <p className='text-xs text-[var(--theme-text-muted)]'>Trước</p>
              <p className='text-sm font-medium text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent-text)]'>
                {navigationData.previous.name}
              </p>
            </div>
          </Link>
        )}

        <div className='hidden md:block'>
          <div className='px-4 py-2 bg-[var(--theme-accent-soft)] border border-[var(--theme-accent-border)] rounded-lg'>
            <p className='text-xs text-[var(--theme-accent-text)]'>Đang xem</p>
            <p className='text-sm font-medium text-[var(--theme-accent-strong)]'>
              {navigationData.current}
            </p>
          </div>
        </div>

        {navigationData.next && (
          <Link
            to={navigationData.next.href}
            className='flex items-center space-x-2 px-4 py-3 bg-[var(--theme-surface-raised)] border border-[var(--theme-border)] rounded-lg hover:bg-[var(--theme-surface-hover)] transition-colors group ml-auto'
          >
            <div className='text-right'>
              <p className='text-xs text-[var(--theme-text-muted)]'>Kế tiếp</p>
              <p className='text-sm font-medium text-[var(--theme-text-primary)] group-hover:text-[var(--theme-accent-text)]'>
                {navigationData.next.name}
              </p>
            </div>
            <ChevronRight className='w-4 h-4 text-[var(--theme-text-muted)] group-hover:text-[var(--theme-text-primary)]' />
          </Link>
        )}
      </div>
    </div>
  );
}

export default PolicyNavigation;
