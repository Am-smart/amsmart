"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  User, Maintenance, Notification, CourseDTO, EnrollmentDTO, AssignmentDTO, SubmissionDTO, SignupRequestDTO
} from '@/lib/types';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import { Toast, ToastMessage, ToastType } from './ui/Toast';
import * as actions from '@/lib/api-actions';
import { sessionManager } from '@/lib/session-manager';
import { useRouter } from 'next/navigation';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ courses: 0, dueSoon: 0 });
  const [enrollments, setEnrollments] = useState<EnrollmentDTO[]>([]);
  const [courses, setCourses] = useState<CourseDTO[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDTO[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDTO[]>([]);

  const router = useRouter();
  const initialized = useRef(false);
  const initPromise = useRef<Promise<void> | null>(null);

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

    // 2. Clear application state
    setUser(null);
    setNotifications([]);
    setStats({ courses: 0, dueSoon: 0 });
    setEnrollments([]);
    setCourses([]);
    setAssignments([]);
    setSubmissions([]);

    // 3. SPA-friendly redirect
    router.push('/');
  }, [router]);

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

  // Notifications logic
  const fetchNotifications = useCallback(async (userId: string, force = false) => {
    if (!userId || userId === 'undefined' || userId === 'null') return;
    try {
      const cachedNotes = await getCache<Notification[]>('notifications', force ? 0 : 60000);
      if (cachedNotes) {
        setNotifications(cachedNotes);
        if (!force) return;
      }

      if (isOnline) {
        const isConnected = await checkBackend();
        if (!isConnected) return;

        try {
          const n = await actions.getNotifications(userId);
          if (n && Array.isArray(n)) {
            setNotifications(n);
            await setCache('notifications', n);
          }
        } catch (fetchErr) {
          console.error('Failed to fetch notifications:', fetchErr);
        }
      }
    } catch (err) {
      console.error('Notification init error:', err);
    }
  }, [getCache, setCache, isOnline, checkBackend]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (user) {
        fetchNotifications(user.id);
        interval = setInterval(() => {
            if (isOnline) fetchNotifications(user.id);
        }, 5 * 60 * 1000);
    }
    return () => {
        if (interval) clearInterval(interval);
    };
  }, [user, isOnline, fetchNotifications]);

  // Dashboard Data
  const refreshDashboardData = useCallback(async (force = false) => {
    if (!user) return;

    // Caching Strategy: Use IndexedDB even when online if data is fresh (< 2 mins)
    // to prevent redundant fetching on route changes or component re-renders.
    const CACHE_TTL = 2 * 60 * 1000;

    if (!force) {
        const lastRefresh = await getCache<number>('last_dashboard_refresh');
        if (lastRefresh && Date.now() - lastRefresh < CACHE_TTL) {
            // Data is fresh, just load from cache into state
            if (user.role === 'student') {
                const [ce, ca, cs] = await Promise.all([
                    getCache<EnrollmentDTO[]>('my_enrollments'),
                    getCache<AssignmentDTO[]>('active_assignments'),
                    getCache<SubmissionDTO[]>('my_submissions')
                ]);
                if (ce) setEnrollments(ce);
                if (ca) setAssignments(ca);
                if (cs) setSubmissions(cs);
                if (ce && ca) {
                    setStats(prev => ({ ...prev, courses: ce.length, dueSoon: ca.length }));
                }
            } else if (user.role === 'teacher') {
                const [cc, cs] = await Promise.all([
                    getCache<CourseDTO[]>('teacher_courses'),
                    getCache<SubmissionDTO[]>('teacher_submissions')
                ]);
                if (cc) setCourses(cc);
                if (cs) setSubmissions(cs);
                if (cc && cs) {
                    setStats(prev => ({ ...prev, courses: cc.length, pendingGrading: cs.length }));
                }
            }
            // If we have cached data, we can skip network call
            return;
        }
    }

    if (!isOnline) {
        if (user.role === 'student') {
            const cachedEnrollments = await getCache<EnrollmentDTO[]>('my_enrollments');
            const cachedAssignments = await getCache<AssignmentDTO[]>('active_assignments');
            const cachedSubmissions = await getCache<SubmissionDTO[]>('my_submissions');
            if (cachedEnrollments) setEnrollments(cachedEnrollments);
            if (cachedAssignments) setAssignments(cachedAssignments);
            if (cachedSubmissions) setSubmissions(cachedSubmissions);
        } else if (user.role === 'teacher') {
            const cachedCourses = await getCache<CourseDTO[]>('teacher_courses');
            const cachedSubmissions = await getCache<SubmissionDTO[]>('teacher_submissions');
            if (cachedCourses) setCourses(cachedCourses);
            if (cachedSubmissions) setSubmissions(cachedSubmissions);
        }
        return;
    }

    const isConnected = await checkBackend();
    if (!isConnected) return;

    // Use functional update or ref to avoid depending on loadingStatus directly in useCallback
    setLoadingStatus(prev => prev === 'ready' ? 'data' : prev);

    try {
      if (user.role === 'student') {
          const [myEnrollments, allAssignments, mySubmissions] = await Promise.all([
            actions.getEnrollments(user.id),
            actions.getAssignments(),
            actions.getSubmissions({ studentId: user.id })
          ]);

          setEnrollments(myEnrollments);
          setSubmissions(mySubmissions);

          const enrolledIds = myEnrollments.map((e: EnrollmentDTO) => e.course_id);
          const pending = allAssignments.filter((a: AssignmentDTO) =>
            enrolledIds.includes(a.course_id) &&
            new Date(a.due_date) > new Date() &&
            !mySubmissions.some((s: SubmissionDTO) => s.assignment_id === a.id)
          );

          setAssignments(pending);
          setStats({
            courses: myEnrollments.length,
            dueSoon: pending.length
          });

          await Promise.all([
              setCache('my_enrollments', myEnrollments),
              setCache('active_assignments', pending),
              setCache('my_submissions', mySubmissions),
              setCache('last_dashboard_refresh', Date.now())
          ]);
      } else if (user.role === 'teacher') {
          const [myCourses, pendingSubmissions, myLiveClasses] = await Promise.all([
              actions.getCourses(user.id),
              actions.getSubmissions({ status: 'submitted' }),
              actions.getLiveClasses(undefined, user.id)
          ]);

          setCourses(myCourses);
          setSubmissions(pendingSubmissions);
          setStats({
            courses: myCourses.length,
            pendingGrading: pendingSubmissions.length,
            liveClasses: myLiveClasses.length,
            dueSoon: 0
          });

          await Promise.all([
              setCache('teacher_courses', myCourses),
              setCache('teacher_submissions', pendingSubmissions),
              setCache('last_dashboard_refresh', Date.now())
          ]);
      } else if (user.role === 'admin') {
          const [allUsers, systemStats] = await Promise.all([
              actions.getUsers(),
              actions.getSystemStats()
          ]);

          setStats({
            courses: systemStats.courses ?? 0,
            dueSoon: 0,
            totalUsers: systemStats.users ?? allUsers.length,
            activeCourses: systemStats.courses ?? 0,
            flaggedUsers: allUsers.filter(u => u.flagged).length,
            teachers: allUsers.filter(u => u.role === 'teacher').length,
            students: allUsers.filter(u => u.role === 'student').length,
            pendingResets: allUsers.filter(u => !!u.reset_request).length
          });
          await setCache('last_dashboard_refresh', Date.now());
      }
    } catch (err) {
      console.error('Dashboard refresh error:', err);
    } finally {
      setLoadingStatus('ready');
    }
  }, [user, isOnline, getCache, setCache, checkBackend]);

  useEffect(() => {
    if (user) {
        refreshDashboardData();
    }
  }, [user, refreshDashboardData]);

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
    stats,
    enrollments,
    courses,
    assignments,
    submissions,
    login,
    signup,
    logout,
    updateProfile,
    toggleSidebar,
    fetchNotifications,
    addToast,
    refreshDashboardData
  }), [user, loadingStatus, maintenance, isCurrentlyInMaintenance, notifications, isSidebarOpen, isOnline, isBackendConnected, stats, enrollments, courses, assignments, submissions, login, signup, logout, updateProfile, toggleSidebar, fetchNotifications, addToast, refreshDashboardData]);

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
