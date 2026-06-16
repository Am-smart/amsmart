import React, { useState } from 'react';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  onSignIn: () => void;
  onGetStarted: () => void;
}

export const LandingHeader: React.FC<HeaderProps> = ({ onSignIn, onGetStarted }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (callback?: () => void) => {
    setMobileMenuOpen(false);
    if (callback) callback();
  };

  const { isOnline } = useIndexedDB();

  return (
    <header className="fixed top-0 left-0 right-0 h-auto min-h-[60px] sm:h-[70px] bg-white flex justify-between items-center px-3 sm:px-[5%] py-3 sm:py-0 z-[1000] shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center gap-2 sm:gap-4">
        <a href="#" className="text-sm sm:text-[1.5rem] font-extrabold text-[#2563eb] flex items-center gap-1 sm:gap-2 whitespace-nowrap">
          <span className="text-lg sm:text-2xl">🎓</span>
          <span className="xs:inline">SmartLMS</span>
        </a>
        {!isOnline && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] sm:text-xs font-bold animate-pulse border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Offline
          </span>
        )}
      </div>
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-8">
        <a href="#features" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Features</a>
        <a href="#about" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">About</a>
        <a href="/help" className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Help</a>
        <button onClick={onSignIn} className="text-[#64748b] font-medium transition-colors hover:text-[#2563eb]">Sign In</button>
      </div>

      {/* Mobile Menu Button */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-slate-100 transition-colors text-[#64748b]"
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Get Started Button */}
      <button 
        onClick={onGetStarted}
        className="hidden xs:block bg-[#2563eb] text-white px-3 sm:px-4 md:px-6 py-2 sm:py-[0.6rem] rounded-lg font-semibold transition-all hover:bg-[#1d4ed8] hover:-translate-y-0.5 active:translate-y-0 text-xs sm:text-sm md:text-base whitespace-nowrap"
      >
        Get Started
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-t border-slate-100 md:hidden shadow-xl animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-0">
            <a 
              href="#features" 
              onClick={() => handleNavClick()}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100"
            >
              Features
            </a>
            <a 
              href="#about"
              onClick={() => handleNavClick()}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100"
            >
              About
            </a>
            <a
              href="/help"
              onClick={() => handleNavClick()}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100"
            >
              Help Center
            </a>
            <button 
              onClick={() => handleNavClick(onSignIn)}
              className="px-4 py-3 text-[#64748b] font-medium transition-colors hover:text-[#2563eb] hover:bg-slate-50 border-b border-slate-100 text-left"
            >
              Sign In
            </button>
            <button 
              onClick={() => handleNavClick(onGetStarted)}
              className="bg-[#2563eb] text-white px-4 py-3 font-semibold transition-all hover:bg-[#1d4ed8] text-left text-sm"
            >
              Get Started
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
