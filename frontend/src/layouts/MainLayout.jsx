import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../App.css';

function MainLayout({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            {/* Phần nội dung thay đổi sẽ nằm ở đây */}
            <main className="main-content">
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default MainLayout;