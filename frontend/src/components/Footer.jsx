import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Share2 } from 'lucide-react';
import '../styles/site-shell.css';

function Footer() {
  return (
    <footer className='site-footer'>
      <div className='site-footer__inner'>
        <div className='site-footer__col'>
          <div className='site-footer__brand'>
            <span className='site-footer__brand-logo'>
              <BookOpen size={18} />
            </span>
            <strong>Trạm đọc</strong>
          </div>
          <p>
            Nền tảng đọc truyện chữ hàng đầu Việt Nam. Cập nhật chương mới mỗi
            ngày.
          </p>
        </div>

        <div className='site-footer__col'>
          <h4>Khám phá</h4>
          <Link to='/'>Truyện mới</Link>
          <Link to='/'>Truyện HOT</Link>
          <Link to='/'>Truyện hoàn thành</Link>
          <Link to='/'>Thể loại</Link>
        </div>

        <div className='site-footer__col'>
          <h4>Hỗ trợ</h4>
          <Link to='/policy/terms-of-service'>Điều khoản dịch vụ</Link>
          <Link to='/policy/privacy-policy'>Chính sách bảo mật</Link>
          <Link to='/policy/upload-rule'>Quy định diễn đàn</Link>
          <Link to='/'>Báo lỗi / Góp ý</Link>
        </div>

        <div className='site-footer__col'>
          <h4>Kết nối</h4>
          <div className='site-footer__social'>
            <button type='button' aria-label='Share'>
              <Share2 size={16} />
            </button>
            <button type='button' aria-label='Mail'>
              <Mail size={16} />
            </button>
          </div>
          <small>© 2026 WebTruyen - Made for Story Lovers</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
