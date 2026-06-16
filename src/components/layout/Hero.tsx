import React from 'react';

interface HeroProps {
  onRoleSelect: (role: 'student' | 'teacher' | 'admin') => void;
}

export const Hero: React.FC<HeroProps> = ({ onRoleSelect }) => {
  return (
    <section className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-[5%] text-center bg-gradient-to-b from-[#f8fafc] to-white overflow-hidden">
      <div id="maintBanner" className="hidden bg-[#fff7ed] text-[#9a3412] border border-[#ffedd5] rounded-full px-6 py-3 mb-8 mx-auto text-sm max-w-2xl"></div>
      <h1 className="text-2xl sm:text-4xl md:text-6xl font-[900] text-[#0f172a] mb-4 sm:mb-6 leading-tight max-w-4xl mx-auto">Modern Learning for Everyone</h1>
      <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#64748b] max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed">Empower your education with our all-in-one learning management system. Collaborative, interactive, and built for results.</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-24">
        <button
          onClick={() => onRoleSelect('student')}
          className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary-hover transition-all shadow-lg hover:shadow-primary/25"
        >
          Get Started
        </button>
      </div>

      <div id="features" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 text-left mt-8 sm:mt-16">
        <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#eff6ff] w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 text-[#2563eb]">📈</div>
          <h3 className="text-base sm:text-xl font-bold text-[#1e293b] mb-2 sm:mb-4">Progress Tracking</h3>
          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">Monitor your learning journey with advanced analytics and visual progress reports.</p>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#f0fdf4] w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 text-[#22c55e]">💬</div>
          <h3 className="text-base sm:text-xl font-bold text-[#1e293b] mb-2 sm:mb-4">Interactive Discussions</h3>
          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">Engage with peers and teachers in real-time through course-specific discussion boards.</p>
        </div>
        <div className="bg-white p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-[#f1f5f9] transition-all hover:border-[#cbd5e1]">
          <div className="bg-[#fff7ed] w-10 sm:w-12 h-10 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl mb-4 sm:mb-6 text-[#f59e0b]">📚</div>
          <h3 className="text-base sm:text-xl font-bold text-[#1e293b] mb-2 sm:mb-4">Resource Library</h3>
          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">Access a wide range of study materials, lecture notes, and supplementary resources.</p>
        </div>
      </div>
    </section>
  );
};
