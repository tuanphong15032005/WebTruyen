import React from 'react';

function DocsToc() {
  const [activeSection, setActiveSection] = React.useState('');
  const [storageKey, setStorageKey] = React.useState(Date.now()); // Force re-render

  // Helper function to extract number from title
  const extractNumber = (title) => {
    const match = title.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  };

  // Get page blocks from localStorage
  const pageBlocks = React.useMemo(() => {
    try {
      const stored = localStorage.getItem('currentPageBlocks');
      const blocks = stored ? JSON.parse(stored) : [];
      console.log('DocsToc - reading localStorage, blocks:', blocks);
      return blocks;
    } catch (error) {
      console.error('Error parsing localStorage:', error);
      return [];
    }
  }, [storageKey]); // Re-read when storageKey changes

  // Check for localStorage changes periodically
  React.useEffect(() => {
    const interval = setInterval(() => {
      const currentStorage = localStorage.getItem('currentPageBlocks');
      if (currentStorage) {
        setStorageKey(Date.now()); // Trigger re-render
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, []);

  // Extract sections from page blocks
  const sections = React.useMemo(() => {
    console.log('DocsToc - pageBlocks:', pageBlocks);
    console.log('DocsToc - pageBlocks length:', pageBlocks?.length);
    
    if (!pageBlocks || pageBlocks.length === 0) return [];
    
    const sections = pageBlocks.map((block, index) => ({
      id: block.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
      title: block.title,
      level: 2, // All blocks are h2 level
      index: index,
      // Extract number for sorting
      number: extractNumber(block.title)
    }));
    
    // Sort sections by extracted number
    const sortedSections = sections.sort((a, b) => {
      return a.number - b.number;
    });
    
    console.log('DocsToc - sorted sections:', sortedSections);
    return sortedSections;
  }, [pageBlocks]);

  // Scroll spy
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      
      for (let i = sections.length - 1; i >= 0; i--) {
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
  }, [sections]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (sections.length === 0) {
    return (
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Mục lục
        </h3>
        <p className="text-sm text-gray-500">
          Không có mục lục
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Mục lục
      </h3>
      <nav className="space-y-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            className={`block w-full text-left px-3 py-2 text-sm rounded-md transition-all duration-200 ${
              activeSection === section.id
                ? 'bg-blue-50 text-blue-600 font-medium border-l-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
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
