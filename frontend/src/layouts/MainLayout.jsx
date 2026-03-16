import React from 'react';
import { useLocation } from 'react-router-dom';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {!isReadingPage && <Header />}
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
      {!isReadingPage && <Footer />}
    </div>
  );
}

export default MainLayout;
