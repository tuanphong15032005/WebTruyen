import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import DocsSidebar from '../components/docs/DocsSidebar';
import DocsToc from '../components/docs/DocsToc';

function DocsLayout() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex pt-16">
        {/* Sidebar - 240px width, sticky */}
        <aside className="w-60 fixed left-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto border-r border-gray-200 bg-white">
          <DocsSidebar />
        </aside>
        
        {/* Main Content - full width with space for TOC */}
        <main className="flex-1 ml-60 mr-64">
          <div className="max-w-4xl mx-auto px-8 py-8">
            <Outlet />
          </div>
        </main>
        
        {/* Table of Contents - 260px width, sticky */}
        <aside className="w-64 fixed right-0 top-16 h-[calc(100vh-4rem)] overflow-y-auto border-l border-gray-200 bg-white">
          <DocsToc />
        </aside>
      </div>
    </div>
  );
}

export default DocsLayout;
