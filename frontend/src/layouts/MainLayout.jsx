import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';

function MainLayout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isLibraryPage =
    location.pathname === '/library' || location.pathname.startsWith('/library/');
  const isReadingPage = /^\/stories\/[^/]+\/chapters\/[^/]+$/.test(
    location.pathname,
  ) || location.pathname === '/reader' || /^\/bookmarks\/story\/[^/]+$/.test(location.pathname);
  const isAuthPage = [
    '/login',
    '/register',
    '/verify',
    '/forgot-password',
    '/reset-password',
  ].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith('/admin');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const shouldRenderShellSidebar = !isReadingPage;
  const sidebarModeClass = 'app-shell--sidebar-overlay';

  return (
    <div
      className={`app-shell ${shouldRenderShellSidebar ? 'app-shell--with-sidebar' : ''} ${shouldRenderShellSidebar ? sidebarModeClass : ''} ${isSidebarOpen ? 'app-shell--sidebar-open' : ''}`}
    >
      {!isReadingPage && (
        <Header
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />
      )}
      {shouldRenderShellSidebar && (
        <AppSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          overlayMode={true}
        />
      )}
      <div className="app-shell__content">
        <div className="app-shell__push-target">
          <main
            className={`main-content ${
              isAdminPage
                ? 'main-content--admin'
                : isReadingPage
                ? ''
                : isHomePage
                ? 'main-content--home'
                : isAuthPage
                  ? 'main-content--auth'
                  : isLibraryPage
                    ? 'main-content--library'
                    : 'main-content--spaced'
            }`}
          >
            {children}
          </main>
        </div>
        {!isReadingPage && <Footer />}
      </div>
    </div>
  );
}

export default MainLayout;
