import React from 'react';
import { Link } from '@tanstack/react-router';
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';
import { visibleNavItems, ROLE_TITLES, navItemPath } from '@/config/navigation';

interface UnifiedSidebarProps {
  role: UserRole;
  activePage: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Config-driven sidebar. Items come from `src/config/navigation.ts`,
 * filtered by RBAC against the current user. Links use native TanStack
 * `<Link>` for preloading, active-state styling, and middle-click support.
 */
export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  role, activePage, isOpen, onClose,
}) => {
  const { user } = useAuth();
  const items = visibleNavItems(role, user);
  const title = ROLE_TITLES[role] ?? 'SmartLMS';
  const normalizedActive = !activePage || activePage === role ? 'dashboard' : activePage;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/50 z-[1000] md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      <aside className={`fixed left-0 top-0 bottom-0 w-[240px] max-w-[85vw] bg-[#1e293b] text-white p-4 sm:p-6 z-[1001] overflow-y-auto transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <div className="text-xl font-black text-[#3b82f6] tracking-tighter truncate pr-4">{title}</div>
          <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors" aria-label="Close sidebar">✕</button>
        </div>
        <nav className="space-y-1">
          {items.map((item) => {
            const isActive = normalizedActive === item.id;
            return (
              <Link
                key={item.id}
                to={navItemPath(role, item.id)}
                onClick={onClose}
                preload="intent"
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all duration-200 group ${isActive ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'}`}
              >
                <span className={`w-5 h-5 flex items-center justify-center transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{item.icon}</span>
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};