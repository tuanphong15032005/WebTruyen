import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Shield, BookOpen } from 'lucide-react';
import { sitePageService } from '../../services/sitePageService';

function DocsSidebar() {
  const location = useLocation();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const allPages = await sitePageService.getAllPages();
        console.log('Raw API response:', allPages);
        
        // Filter chỉ các trang policy và sắp xếp theo thứ tự
        const policyPages = allPages.filter(page => {
          const code = page.code;
          return code.startsWith('term') || code.startsWith('privacy') || code.startsWith('author-rules');
        }).sort((a, b) => {
          // Group by base type and sort by number
          const getBaseCode = (code) => {
            if (code.startsWith('term')) return 'terms';
            if (code.startsWith('privacy')) return 'privacy';
            if (code.startsWith('author-rules')) return 'author-rules';
            return code;
          };
          
          const getNumber = (code) => {
            const match = code.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
          };
          
          const aBase = getBaseCode(a.code);
          const bBase = getBaseCode(b.code);
          
          if (aBase !== bBase) {
            const order = ['terms', 'privacy', 'author-rules'];
            return order.indexOf(aBase) - order.indexOf(bBase);
          }
          
          return getNumber(a.code) - getNumber(b.code);
        });
        
        // Group by base code and get only the first item of each group for sidebar
        const uniquePages = [];
        const seen = new Set();
        
        for (const page of policyPages) {
          const baseCode = page.code.replace(/\d+/, '');
          // Fix: ensure proper base code mapping
          const normalizedCode = baseCode === 'term' ? 'terms' : 
                                 baseCode === 'privacy' ? 'privacy' : 
                                 baseCode === 'author-rule' ? 'author-rules' : baseCode;
          
          if (!seen.has(normalizedCode)) {
            seen.add(normalizedCode);
            uniquePages.push({
              ...page,
              code: normalizedCode, // Use normalized code for routing
              title: normalizedCode === 'terms' ? 'Điều khoản dịch vụ' :
                     normalizedCode === 'privacy' ? 'Chính sách bảo mật' :
                     normalizedCode === 'author-rules' ? 'Rule đăng truyện' : page.title
            });
          }
        }
        
        setPages(uniquePages);
      } catch (error) {
        console.error('Failed to fetch pages:', error);
        // Fallback to hardcoded menu if API fails
        setPages([
          { code: 'terms', title: 'Điều khoản dịch vụ' },
          { code: 'privacy', title: 'Chính sách bảo mật' },
          { code: 'author-rules', title: 'Rule đăng truyện' }
        ]);
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
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2"></div>
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
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
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
