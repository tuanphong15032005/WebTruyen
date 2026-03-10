import React, { useState, useEffect } from 'react';

function DocsToc() {
  const [activeSection, setActiveSection] = useState('');
  const [sections, setSections] = useState([]);

  useEffect(() => {
    // Function to extract sections
    const extractSections = () => {
      const headingElements = document.querySelectorAll('h2[id], h3[id]');
      const extractedSections = Array.from(headingElements).map((heading) => ({
        id: heading.id,
        title: heading.textContent,
        level: parseInt(heading.tagName.charAt(1)),
      }));
      
      setSections(extractedSections);
      
      // Set initial active section
      if (extractedSections.length > 0) {
        setActiveSection(extractedSections[0].id);
      }
    };

    // Initial extraction
    extractSections();

    // Retry after a short delay if no sections found
    if (sections.length === 0) {
      const timer = setTimeout(extractSections, 100);
      return () => clearTimeout(timer);
    }

    // Scroll spy
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
  }, []);

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
            } ${section.level === 3 ? 'pl-6' : ''}`}
          >
            {section.title}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default DocsToc;
