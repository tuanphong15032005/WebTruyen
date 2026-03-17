import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import '../styles/scroll-top-button.css';

function ScrollTopButton({ showAfter = 0.08 }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateScrollProgress = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollableHeight <= 0) {
        setScrollProgress(0);
        return;
      }

      setScrollProgress(Math.min(1, Math.max(0, scrollTop / scrollableHeight)));
    };

    updateScrollProgress();
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    window.addEventListener('resize', updateScrollProgress);

    return () => {
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('resize', updateScrollProgress);
    };
  }, []);

  const handleScrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <button
      type='button'
      className={`scroll-top-button ${scrollProgress > showAfter ? 'is-visible' : ''}`}
      style={{ '--scroll-progress': scrollProgress }}
      onClick={handleScrollToTop}
      aria-label='Quay lại đầu trang'
    >
      <ArrowUp className='scroll-top-button__icon' aria-hidden='true' />
    </button>
  );
}

export default ScrollTopButton;
