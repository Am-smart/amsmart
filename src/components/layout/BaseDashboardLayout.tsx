"use client";

import React, { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/components/auth/AuthContext';
import { UnifiedSidebar } from "@/components/common/UnifiedSidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { UserRole, User } from "@/lib/types";
import { ForcePasswordChange } from "@/components/auth/ForcePasswordChange";
import { useAppContext } from '../AppContext';
import { MaintenanceOverlay } from './MaintenanceOverlay';

interface HeaderComponentProps {
  className?: string;
  user: User | null;
  onLogout: () => Promise<void>;
  onMenuClick: () => void;
  [key: string]: unknown;
}

interface BaseDashboardLayoutProps {
  children: React.ReactNode;
  requiredRole: UserRole;
  HeaderComponent: React.ComponentType<HeaderComponentProps>;
  headerProps?: Record<string, unknown>;
}

export const BaseDashboardLayout: React.FC<BaseDashboardLayoutProps> = ({
  children,
  requiredRole,
  HeaderComponent,
  headerProps = {}
}) => {
  const { user, role, logout, updateProfile } = useAuth();
  const { isSidebarOpen, toggleSidebar, maintenance, loadingStatus } = useAppContext();
  const navigate = useNavigate();

  // Redirect only after initialization is complete and if authentication fails
  const isInitializing = loadingStatus === 'idle' || loadingStatus === 'auth';
  const isAuthenticated = user && role === requiredRole;

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      navigate({ to: '/' });
    }
  }, [isInitializing, isAuthenticated, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/' });
  };

  // Only show the full-screen loading state during initial app boot
  // Subsequent dashboard navigations will use background loading to keep UI responsive
  if ((isInitializing && !user) || !isAuthenticated) {
    return <div className="flex items-center justify-center min-h-screen font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading...</div>;
  }

  const resetStatus = (user.reset_request as Record<string, unknown> | null)?.status;
  const isResetApproved = resetStatus === 'approved' || resetStatus === 'approved_used';

  return (
    <SidebarProvider
      open={isSidebarOpen}
      onOpenChange={(next) => { if (next !== isSidebarOpen) toggleSidebar(); }}
      className={`${requiredRole}-dashboard`}
    >
      {maintenance.enabled && role !== 'admin' && (
          <MaintenanceOverlay
            message={maintenance.message}
            onLogout={handleLogout}
          />
      )}

      {isResetApproved && (
          <ForcePasswordChange onSuccess={() => updateProfile({ reset_request: null })} />
      )}

      <UnifiedSidebar role={role as UserRole} />
      <SidebarInset className="bg-[#f8fafc]">
        <HeaderComponent
          {...headerProps}
          user={user}
          onLogout={handleLogout}
          onMenuClick={toggleSidebar}
        />
        <div className="content-area p-3 sm:p-4 md:p-8 pt-[75px] md:pt-[90px] min-h-screen overflow-x-hidden">
          <div className="mx-auto flex max-w-[1600px] items-start gap-2">
            <SidebarTrigger className="hidden md:inline-flex text-slate-600" />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
