import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Shield, BookOpen } from 'lucide-react';
import { sitePageService } from '../../services/sitePageService';
import { inferPolicyCategory } from '../../utils/policyPages';

function DocsSidebar() {
  const location = useLocation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const allPages = await sitePageService.getAllPages();
        const policyPages = allPages
          .map((page) => ({
            ...page,
            policyCategory: inferPolicyCategory(page),
          }))
          .filter((page) => page.policyCategory)
          .sort((a, b) => {
            const order = ['terms', 'privacy', 'author-rules'];
            return (
              order.indexOf(a.policyCategory) - order.indexOf(b.policyCategory)
            );
          });

        const uniquePages = [];
        const seen = new Set();

        for (const page of policyPages) {
          const normalizedCode = page.policyCategory;

          if (!seen.has(normalizedCode)) {
            seen.add(normalizedCode);
            uniquePages.push({
              ...page,
              code: normalizedCode,
              title:
                normalizedCode === 'terms'
                  ? 'Điều khoản dịch vụ'
                  : normalizedCode === 'privacy'
                    ? 'Chính sách bảo mật'
                    : normalizedCode === 'author-rules'
                      ? 'Rule đăng truyện'
                      : page.title,
            });
          }
        }

        setPages(uniquePages);
      } catch (error) {
        console.error('Failed to fetch pages:', error);
        setPages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // Icon mapping dựa trên code
  const getIcon = (code) => {
    switch (code) {
      case 'terms': return FileText;
      case 'privacy': return Shield;
      case 'author-rules': return BookOpen;
      default: return FileText;
    }
  };

  // Route mapping
  const getRoute = (code) => {
    switch (code) {
      case 'terms': return '/policy/terms-of-service';
      case 'privacy': return '/policy/privacy-policy';
      case 'author-rules': return '/policy/upload-rule';
      default: return `/policy/${code}`;
    }
  };

  if (loading) {
    return (
      <nav className="p-4">
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 rounded-lg mb-2 bg-[var(--theme-surface-subtle)] border border-[var(--theme-border-subtle)]"></div>
            </div>
          ))}
        </div>
      </nav>
    );
  }

  return (
    <nav className="p-4">
      <div className="space-y-1">
        {pages.map((page) => {
          const Icon = getIcon(page.code);
          const href = getRoute(page.code);
          const isActive = location.pathname === href;
          
          return (
            <Link
              key={page.id || page.code}
              to={href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-[var(--theme-accent-soft)] text-[var(--theme-accent-text)] border-l-4 border-[var(--theme-accent)]'
                  : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{page.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default DocsSidebar;
