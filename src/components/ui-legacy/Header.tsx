import React from 'react';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick, rightContent, centerContent, className = '' }) => {
  return (
    <header className={`h-[60px] md:h-[70px] bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-8 flex justify-between items-center fixed top-0 left-0 right-0 z-[900] transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        <button onClick={onMenuClick} className="text-xl p-1.5 rounded-lg transition-colors hover:bg-slate-100 shrink-0" aria-label="Toggle Menu">☰</button>
        <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 truncate">{title}</h1>
      </div>

      <div className="hidden lg:block flex-1 px-8">
        {centerContent}
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {rightContent}
      </div>
    </header>
  );
};
