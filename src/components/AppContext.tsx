"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User, Maintenance, Notification, CourseDTO, EnrollmentDTO, AssignmentDTO, SubmissionDTO, SignupRequestDTO
} from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui-legacy/Toast';
import * as actions from '@/lib/api-actions';
import { sessionManager } from '@/lib/session-manager';
import { useRouter } from '@/lib/next-compat';
import { useQueryClient } from '@tanstack/react-query';
import { useDashboardData } from '@/hooks/queries/useDashboard';
import { useNotifications } from '@/hooks/queries/useNotifications';

export type AppLoadingStatus = 'idle' | 'auth' | 'data' | 'ready';

export interface DashboardStats {
  courses: number;
  dueSoon: number;
  pendingGrading?: number;
  liveClasses?: number;
  totalUsers?: number;
  activeCourses?: number;
  flaggedUsers?: number;
  teachers?: number;
  students?: number;
  pendingResets?: number;
}

interface AppState {
  user: User | null;
  loadingStatus: AppLoadingStatus;
  isLoading: boolean; // Keep for backward compatibility
  isAuthLoading: boolean;
  isDataLoading: boolean;
  maintenance: Maintenance;
  notifications: Notification[];
  isSidebarOpen: boolean;
  isOnline: boolean;
  isBackendConnected: boolean;
  stats: DashboardStats;
  enrollments: EnrollmentDTO[];
  courses: CourseDTO[];
  assignments: AssignmentDTO[];
  submissions: SubmissionDTO[];
}

interface AppContextType extends AppState {
  role: string | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (userData: SignupRequestDTO) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  toggleSidebar: () => void;
  fetchNotifications: (userId: string, force?: boolean) => Promise<void>;
  addToast: (message: string, type: ToastType, duration?: number) => void;
  refreshDashboardData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // App State
  const [loadingStatus, setLoadingStatus] = useState<AppLoadingStatus>('idle');
  const [user, setUser] = useState<User | null>(null);

  // App State
  const { setCache, getCache, addToQueue, isOnline, isBackendConnected, checkBackend, pullData } = useIndexedDB();
  const [maintenance, setMaintenance] = useState<Maintenance>({ id: "system-config", enabled: false, schedules: [] });
  const [isCurrentlyInMaintenance, setIsCurrentlyInMaintenance] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const router = useRouter();
  const queryClient = useQueryClient();
  const initialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

  // TanStack Query-backed dashboard + notifications
  const dashboard = useDashboardData(user);
  const notificationsQuery = useNotifications(user?.id, !!user);
  const notifications = (notificationsQuery.data ?? []) as Notification[];

  const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Auth Actions
  const login = useCallback(async (email: string, pass: string) => {
    const result = await actions.login({ email, password: pass });
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    // Force clear old session cache on login
    await setCache('last_dashboard_refresh', 0);
    await setCache(`last_full_pull_${u.id}`, 0);
    setUser(u);
  }, [setCache]);

  const signup = useCallback(async (userData: SignupRequestDTO) => {
    const result = await actions.signup(userData);
    if (!result.success) {
        throw new Error(result.error);
    }

    const u = result.data!.user as User;
    await setCache('current_user', u);
    // Force clear old session cache on signup
    await setCache('last_dashboard_refresh', 0);
    await setCache(`last_full_pull_${u.id}`, 0);
    setUser(u);
  }, [setCache]);

  const logout = useCallback(async () => {
    try {
        const res = await actions.logout();
        if (!res.success && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.error('Logout backend failure:', res.error);
        }
    } catch (err) {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.error('Logout network/server error:', err);
        }
    }

    // 1. Trigger full client-side data purge (Storage + IndexedDB)
    sessionManager.cleanupSession();

    // 2. Clear application state + Query cache
    setUser(null);
    queryClient.clear();

    // 3. SPA-friendly redirect
    router.push('/');
  }, [router, queryClient]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };

    await setCache('current_user', updatedUser);
    setUser(updatedUser);

    if (isOnline) {
        const res = await actions.updateProfile(updates);
        if (!res.success) {
            throw new Error(res.error);
        }
    } else {
        await addToQueue('PROFILE_UPDATE', { id: user.id, ...updates });
    }
  }, [user, isOnline, setCache, addToQueue]);

  // App Initialization
  const initApp = useCallback(async () => {
    if (initialized.current) return;
    if (initPromise.current) return initPromise.current;

    setLoadingStatus('auth');

    initPromise.current = (async () => {
    try {
      // Auth init
      const userDTO = await actions.getMe();
      if (userDTO) {
          const u = userDTO as User;
          await setCache('current_user', u);
          setUser(u);
          pullData(u.id, u.role);
          setLoadingStatus('data');
      } else {
          const cachedUser = await getCache<User>('current_user');
          if (cachedUser) setUser(cachedUser);
          setLoadingStatus('ready');
      }

      // Maintenance init
      const cachedMaint = await getCache<Maintenance>('maintenance', 5 * 60 * 1000);
      if (cachedMaint) {
        setMaintenance(cachedMaint);
      }

      if (isOnline && (!cachedMaint || isBackendConnected)) {
        const isConnected = await checkBackend();
        if (isConnected) {
            const m = await actions.getMaintenance();
            setMaintenance(m as unknown as Maintenance);
            await setCache('maintenance', m);
        }
      }
    } catch (err) {
      console.error('App initialization error:', err);
      setLoadingStatus('ready');
    } finally {
      initialized.current = true;
      initPromise.current = null;
    }
    })();

    return initPromise.current;
  }, [getCache, setCache, isOnline, isBackendConnected, checkBackend, pullData]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  // Sync conflict listener
  useEffect(() => {
    const handleSyncConflict = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        addToast(
            `Sync Issue: ${detail.error || 'A conflict occurred while syncing your offline changes.'}`,
            'error',
            10000
        );
    };

    window.addEventListener('sync-conflict', handleSyncConflict);
    return () => window.removeEventListener('sync-conflict', handleSyncConflict);
  }, [addToast]);

  // Notifications are managed by TanStack Query; expose an imperative
  // refresh handle for legacy callers (header bell, etc.).
  const fetchNotifications = useCallback(async (userId: string, _force?: boolean) => {
    if (!userId || userId === 'undefined' || userId === 'null') return;
    void _force;
    await notificationsQuery.invalidate();
  }, [notificationsQuery]);

  // Dashboard data is sourced from useDashboardData; refresh triggers
  // a Query invalidation so the role-specific hook refetches.
  const refreshDashboardData = useCallback(async () => {
    await dashboard.refresh();
  }, [dashboard]);

  // Drive loading status off the dashboard query for backward-compat consumers.
  useEffect(() => {
    if (!user) return;
    if (dashboard.isFetching && !dashboard.data.courses.length && !dashboard.data.enrollments.length) {
      setLoadingStatus(prev => prev === 'ready' ? 'data' : prev);
    } else {
      setLoadingStatus('ready');
    }
  }, [user, dashboard.isFetching, dashboard.data]);

  // Maintenance sync
  useEffect(() => {
    const checkMaint = () => {
        const now = new Date();
        const isInSchedule = maintenance.schedules?.some(s => {
            const start = new Date(s.start_at);
            const end = new Date(s.end_at);
            return now >= start && now <= end;
        });
        setIsCurrentlyInMaintenance(maintenance.enabled || !!isInSchedule);
    };
    checkMaint();
    const interval = setInterval(checkMaint, 60000);
    return () => clearInterval(interval);
  }, [maintenance]);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const value = useMemo(() => ({
    user,
    loadingStatus,
    isLoading: loadingStatus === 'auth' || loadingStatus === 'data',
    isAuthLoading: loadingStatus === 'auth',
    isDataLoading: loadingStatus === 'data',
    role: user?.role || null,
    maintenance: { ...maintenance, enabled: isCurrentlyInMaintenance },
    notifications,
    isSidebarOpen,
    isOnline,
    isBackendConnected,
    stats: dashboard.data.stats,
    enrollments: dashboard.data.enrollments,
    courses: dashboard.data.courses,
    assignments: dashboard.data.assignments,
    submissions: dashboard.data.submissions,
    login,
    signup,
    logout,
    updateProfile,
    toggleSidebar,
    fetchNotifications,
    addToast,
    refreshDashboardData
  }), [user, loadingStatus, maintenance, isCurrentlyInMaintenance, notifications, isSidebarOpen, isOnline, isBackendConnected, dashboard.data, login, signup, logout, updateProfile, toggleSidebar, fetchNotifications, addToast, refreshDashboardData]);

  return (
    <AppContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} removeToast={removeToast} />
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};

// Unified hooks and providers to avoid breaking existing imports
export const useAuth = useAppContext;
export const AuthProvider = AppProvider;
