import React from 'react';

function Footer() {
    return (
        <footer style={{ 
            backgroundColor: '#1a1a1a', 
            color: '#888', 
            textAlign: 'center', 
            padding: '20px',
            marginTop: 'auto', // Đẩy xuống đáy nếu nội dung ngắn
            borderTop: '1px solid #333'
        }}>
            <p>&copy; 2026 WebTruyen - Nền tảng đọc truyện hàng đầu</p>
        </footer>
    );
}

export default Footer;