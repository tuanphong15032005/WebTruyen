import React from 'react';
import { BookOpen } from 'lucide-react';
import '../styles/site-shell.css';

function FacebookIcon(props) {
  return (
    <svg viewBox='0 0 24 24' fill='currentColor' aria-hidden='true' {...props}>
      <path d='M13.5 22v-8.2h2.8l.42-3.2H13.5V8.56c0-.93.26-1.56 1.59-1.56H16.9V4.14c-.32-.04-1.4-.14-2.67-.14-2.64 0-4.45 1.61-4.45 4.58v2.02H7v3.2h2.78V22h3.72Z' />
    </svg>
  );
}

function GoogleIcon(props) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path
        fill='#EA4335'
        d='M12 10.2v3.9h5.42c-.24 1.26-.96 2.33-2.04 3.05l3.3 2.56c1.92-1.77 3.02-4.37 3.02-7.46 0-.72-.06-1.4-.18-2.05H12Z'
      />
      <path
        fill='#34A853'
        d='M12 22c2.7 0 4.96-.89 6.61-2.41l-3.3-2.56c-.92.61-2.09.98-3.31.98-2.54 0-4.69-1.71-5.46-4.01l-3.41 2.63A9.99 9.99 0 0 0 12 22Z'
      />
      <path
        fill='#4A90E2'
        d='M6.54 14c-.2-.61-.31-1.26-.31-1.94s.11-1.33.31-1.94l-3.41-2.63A9.99 9.99 0 0 0 2 12.06c0 1.61.38 3.14 1.13 4.57L6.54 14Z'
      />
      <path
        fill='#FBBC05'
        d='M12 6.11c1.47 0 2.79.51 3.83 1.5l2.87-2.87C16.95 3.1 14.69 2 12 2A9.99 9.99 0 0 0 3.13 7.49l3.41 2.63C7.31 7.82 9.46 6.11 12 6.11Z'
      />
    </svg>
  );
}

function Footer() {
  return (
    <footer className='site-footer'>
      <div className='site-footer__inner'>
        <div className='site-footer__col'>
          <div className='site-footer__brand'>
            <span className='site-footer__brand-logo'>
              <BookOpen size={18} />
            </span>
            <strong>Tram Doc</strong>
          </div>
          <p>
            Nền tảng đọc truyện chữ hàng đầu cho người yêu truyện. Cập nhật
            chương mới mỗi ngày.
          </p>
        </div>

        <div className='site-footer__col'>
          <h4>Khám phá</h4>
          <a href='/'>Truyện mới</a>
          <a href='/'>Truyện HOT</a>
          <a href='/'>Truyện hoàn thành</a>
          <a href='/'>Thể loại</a>
        </div>

        <div className='site-footer__col'>
          <h4>Hỗ trợ</h4>
          <a href='/'>Điều khoản dịch vụ</a>
          <a href='/'>Chính sách bảo mật</a>
          <a href='/'>Quy định diễn đàn</a>
          <a href='/'>Báo lỗi / Góp ý</a>
        </div>

        <div className='site-footer__col'>
          <h4>Kết nối</h4>
          <div className='site-footer__social'>
            <a
              href='https://www.facebook.com/back.jack.18847876/'
              target='_blank'
              rel='noreferrer'
              aria-label='Facebook'
              title='Facebook'
            >
              <FacebookIcon className='site-footer__social-icon site-footer__social-icon--facebook' />
            </a>
            <a
              href='https://www.google.com/'
              target='_blank'
              rel='noreferrer'
              aria-label='Google'
              title='Google'
            >
              <GoogleIcon className='site-footer__social-icon site-footer__social-icon--google' />
            </a>
          </div>
          <small>© 2026 TramDoc - Made for Story Lovers</small>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
