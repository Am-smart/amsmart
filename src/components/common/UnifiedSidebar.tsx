import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import type { UserRole } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';
import { visibleNavItems, ROLE_TITLES, navItemPath } from '@/config/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

interface UnifiedSidebarProps {
  role: UserRole;
}

/**
 * Config-driven sidebar built on the shadcn `ui/sidebar` primitive.
 * - Items sourced from `src/config/navigation.ts` (single source of truth).
 * - RBAC-filtered via `visibleNavItems(role, user)`.
 * - Native TanStack `<Link>` for preloading + accessibility.
 * - Collapsible=icon on desktop, mobile becomes an offcanvas sheet.
 *
 * Wrap in `<SidebarProvider>` (see `BaseDashboardLayout`).
 */
export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({ role }) => {
  const { user } = useAuth();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === 'collapsed' && !isMobile;
  const items = visibleNavItems(role, user);
  const title = ROLE_TITLES[role] ?? 'SmartLMS';

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split('/').filter(Boolean);
  const activeId = segments.length <= 1 ? 'dashboard' : segments[1];

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-800 bg-[#1e293b] text-white">
      <SidebarHeader className="bg-[#1e293b]">
        <div className="flex items-center px-2 py-1">
          <span className={`text-xl font-black text-[#3b82f6] tracking-tighter truncate transition-opacity ${collapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
            {title}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-[#1e293b]">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={
                        isActive
                          ? 'bg-[#3b82f6] text-white hover:bg-[#3b82f6] hover:text-white data-[active=true]:bg-[#3b82f6] data-[active=true]:text-white'
                          : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'
                      }
                    >
                      <Link
                        to={navItemPath(role, item.id) as string}
                        preload="intent"
                        onClick={() => setOpenMobile(false)}
                      >
                        <span className="flex h-5 w-5 items-center justify-center">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
};