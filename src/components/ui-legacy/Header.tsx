import React, { useState, useEffect } from 'react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onMenuClick, 
  rightContent, 
  centerContent, 
  className = '' 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Detect scroll position to add subtle shadow for depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 4);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMenuToggle = () => {
    setIsMenuOpen(prev => !prev);
    onMenuClick?.();
  };

  return (
    <header 
      className={`h-[60px] md:h-[70px] bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-3 sm:px-4 md:px-8 flex justify-between items-center fixed top-0 left-0 right-0 z-[900] transition-all duration-300 ${isScrolled ? 'shadow-sm' : 'shadow-none'} ${className}`}
      role="banner"
    >
      <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
        {/* Hamburger Menu - Enterprise Grade */}
        <button 
          onClick={handleMenuToggle}
          className="p-2 rounded-lg transition-colors hover:bg-slate-100 active:bg-slate-200 shrink-0 text-slate-700 hover:text-slate-900"
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          aria-controls="navbar-menu"
          type="button"
          title="Toggle Menu"
        >
          {/* Animated hamburger icon */}
          <svg 
            className="w-6 h-6 transition-transform duration-300"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Title with proper truncation */}
        <h1 
          className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate max-w-xs md:max-w-md"
          title={title}
        >
          {title}
        </h1>
      </div>

      {/* Center content - hidden on mobile */}
      <div className="hidden lg:block flex-1 px-4 md:px-8">
        {centerContent}
      </div>

      {/* Right content with proper spacing */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {rightContent}
      </div>
    </header>
  );
};
