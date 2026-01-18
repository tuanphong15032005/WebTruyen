import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

function MainLayout({ children }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            {/* Phần nội dung thay đổi sẽ nằm ở đây */}
            <main style={{ flex: 1, padding: '20px', backgroundColor: '#242424', color: 'white' }}>
                {children}
            </main>
            <Footer />
        </div>
    );
}

export default MainLayout;