import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Shield, BookOpen } from 'lucide-react';

function DocsSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      name: 'Điều khoản dịch vụ',
      href: '/policy/terms-of-service',
      icon: FileText,
    },
    {
      name: 'Chính sách bảo mật',
      href: '/policy/privacy-policy',
      icon: Shield,
    },
    {
      name: 'Rule đăng truyện',
      href: '/policy/upload-rule',
      icon: BookOpen,
    },
  ];

  return (
    <nav className="p-4">
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-600 dark:border-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default DocsSidebar;
