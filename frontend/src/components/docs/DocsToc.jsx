import React from 'react';

function DocsToc() {
  const [activeSection, setActiveSection] = React.useState('');
  const [storageKey, setStorageKey] = React.useState(Date.now());
  const [isScrolling, setIsScrolling] = React.useState(false);

  const extractNumber = (title) => {
    const match = title.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  const pageBlocks = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('currentPageBlocks');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error parsing localStorage:', error);
      return [];
    }
  }, [storageKey]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (localStorage.getItem('currentPageBlocks')) {
        setStorageKey(Date.now());
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const sections = React.useMemo(() => {
    if (!pageBlocks || pageBlocks.length === 0) return [];

    return pageBlocks
      .map((block, index) => ({
        id:
          block.code ||
          block.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-'),
        title: block.title,
        level: 2,
        index,
        number: extractNumber(block.title),
      }))
      .sort((a, b) => a.number - b.number);
  }, [pageBlocks]);

  React.useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return;

      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const element = document.getElementById(section.id);

        if (element && element.offsetTop <= scrollPosition) {
          setActiveSection(section.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections, isScrolling]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) return;

    const headerHeight = 64;
    const offset = 100;
    const elementPosition = element.offsetTop - headerHeight - offset;

    setIsScrolling(true);
    setActiveSection(sectionId);

    window.scrollTo({
      top: elementPosition,
      behavior: 'smooth',
    });

    window.setTimeout(() => {
      setIsScrolling(false);
    }, 1000);
  };

  if (sections.length === 0) {
    return (
      <div className='p-3'>
        <h3 className='text-xs font-semibold text-[var(--theme-text-primary)] mb-3'>
          Mục lục
        </h3>
        <p className='text-xs text-[var(--theme-text-muted)]'>Không có mục lục</p>
      </div>
    );
  }

  return (
    <div className='p-3'>
      <h3 className='text-xs font-semibold text-[var(--theme-text-primary)] mb-3'>
        Mục lục
      </h3>
      <nav className='space-y-0.5'>
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`block w-full text-left px-2 py-1.5 text-xs rounded-md transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-gray-100 text-[var(--theme-accent-text)] font-medium border-l-2 border-[var(--theme-accent)]'
                : 'text-[var(--theme-text-secondary)] hover:bg-[var(--theme-surface-hover)] hover:text-[var(--theme-text-primary)]'
            }`}
          >
            {section.title}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default DocsToc;
