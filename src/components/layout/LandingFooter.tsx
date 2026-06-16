import React from 'react';

interface FooterProps {
  onRoleSelect: (role: 'student' | 'teacher' | 'admin') => void;
}

export const LandingFooter: React.FC<FooterProps> = ({ onRoleSelect }) => {
  return (
    <footer className="bg-[#0f172a] text-white py-8 sm:py-16 px-3 sm:px-[5%]">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-6 sm:gap-8 md:gap-12 border-b border-[#1e293b] pb-8 sm:pb-12">
        <div>
          <h4 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-6 text-[#3b82f6]">SmartLMS</h4>
          <p className="text-xs sm:text-sm text-[#94a3b8] leading-relaxed max-w-sm">Making education accessible and interactive for everyone, everywhere. Start your journey today.</p>
          <div className="flex gap-3 sm:gap-4 mt-4 sm:mt-8">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6] text-sm sm:text-base">𝕏</a>
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6] text-sm sm:text-base">𝑓</a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">📷</a>
            <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-[#1e293b] flex items-center justify-center transition-colors hover:bg-[#3b82f6]">💼</a>
          </div>
        </div>
        <div>
          <h5 className="font-bold text-base sm:text-lg mb-3 sm:mb-6">Platform</h5>
          <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base">
            <li><button onClick={() => onRoleSelect('student')} className="text-[#94a3b8] hover:text-white transition-colors">Sign Up</button></li>
            <li><a href="#features" className="text-[#94a3b8] hover:text-white transition-colors">Features</a></li>
            <li><a href="#about" className="text-[#94a3b8] hover:text-white transition-colors">About</a></li>
          </ul>
        </div>
        <div>
          <h5 className="font-bold text-base sm:text-lg mb-3 sm:mb-6">Company</h5>
          <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base">
            <li><a href="#about" className="text-[#94a3b8] hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="text-[#94a3b8] hover:text-white transition-colors">Terms of Service</a></li>
            <li><a href="/help" className="text-[#94a3b8] hover:text-white transition-colors">Support & Help</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-6 sm:pt-8 text-center text-[#64748b] text-xs sm:text-sm">
        &copy; 2024 SmartLMS Platform. All rights reserved.
      </div>
    </footer>
  );
};
