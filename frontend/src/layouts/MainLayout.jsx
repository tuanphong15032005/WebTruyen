import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';

function MainLayout({ children }) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <main
        className={`main-content ${isHomePage ? 'main-content--home' : 'main-content--spaced'}`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
