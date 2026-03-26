import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppSidebar from '../components/AppSidebar';
import Header from '../components/Header';
import DocsSidebar from '../components/docs/DocsSidebar';
import DocsToc from '../components/docs/DocsToc';
import Footer from '../components/Footer';

function DocsLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className={`app-shell app-shell--with-sidebar app-shell--sidebar-overlay ${isSidebarOpen ? 'app-shell--sidebar-open' : ''}`}>
      <Header
        onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
      />
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        overlayMode={true}
      />
      <div className="app-shell__content">
        <div className="min-h-screen bg-[var(--theme-page-bg)] text-[var(--theme-text-primary)] flex flex-col">
          <div className="app-shell__push-target">
            <div className="flex flex-1 pt-16">
              {/* Sidebar - 240px width, sticky */}
              <aside className="w-60 fixed left-0 top-16 h-[calc(100vh-4rem-210px)] overflow-y-auto border-r border-[var(--theme-border)] bg-[var(--theme-page-bg)] z-10">
                <DocsSidebar />
              </aside>

              {/* Main Content - full width with space for TOC */}
              <main className="flex-1 ml-60 mr-64">
                <div className="max-w-4xl mx-auto px-8 py-8 pb-24">
                  <Outlet />
                </div>
              </main>

              {/* Table of Contents - 260px width, sticky */}
              <aside className="w-64 fixed right-0 top-16 h-[calc(100vh-4rem-210px)] overflow-y-auto border-l border-[var(--theme-border)] bg-[var(--theme-page-bg)] z-10">
                <DocsToc />
              </aside>
            </div>
          </div>
          <Footer className="relative z-20" />
        </div>
      </div>
    </div>
  );
}

export default DocsLayout;
