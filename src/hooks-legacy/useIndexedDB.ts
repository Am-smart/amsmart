import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Submission, QuizSubmission, Course, User, PlannerItem, Discussion, AssignmentDTO, QuizDTO } from '@/lib/types';
import * as actions from '@/lib/api-actions';

const DB_NAME = 'smartlms-offline-v4';
const DB_VERSION = 6;
const STORE_SYNC = 'sync-queue';
const STORE_CACHE = 'lms-cache';
const STORE_ERRORS = 'sync-errors';

export interface QueueItem {
  id?: number;
  type: 'ENROLL' | 'SUBMISSION' | 'QUIZ_SUBMISSION' | 'PROFILE_UPDATE' | 'COURSE_SAVE' | 'ASSIGNMENT_SAVE' | 'QUIZ_SAVE' | 'DISCUSSION_POST' | 'PLANNER_UPDATE' | 'SETTING_UPDATE' | 'LESSON_COMPLETE' | 'ATTENDANCE';
  payload: unknown;
  sessionId?: string;
  timestamp: number;
  retry_count?: number;
}

export const useIndexedDB = () => {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const isSyncing = useRef(false);

  const checkBackend = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setIsBackendConnected(false);
        return false;
    }

    const reachable = await actions.apiClient.checkHealth();
    setIsBackendConnected(reachable);

    // Notify other instances
    window.dispatchEvent(new CustomEvent('backend-connectivity-changed', {
        detail: { connected: reachable }
    }));

    return reachable;
  }, []);

  const getSyncErrors = useCallback(async () => {
    if (!db) return [];
    return new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(STORE_ERRORS, 'readonly');
      const store = tx.objectStore(STORE_ERRORS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;

      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log(`IndexedDB Upgrade: ${oldVersion} -> ${DB_VERSION}`);
      }

      // Basic stores creation and migration
      if (!db.objectStoreNames.contains(STORE_SYNC)) {
        const store = db.createObjectStore(STORE_SYNC, { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      } else if (oldVersion < 5) {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) {
              const store = tx.objectStore(STORE_SYNC);
              if (!store.indexNames.contains('timestamp')) {
                  store.createIndex('timestamp', 'timestamp', { unique: false });
              }
          }
      }

      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        const store = db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      } else if (oldVersion < 5) {
          const tx = (event.target as IDBOpenDBRequest).transaction;
          if (tx) {
              const store = tx.objectStore(STORE_CACHE);
              if (!store.indexNames.contains('timestamp')) {
                  store.createIndex('timestamp', 'timestamp', { unique: false });
              }
          }
      }

      if (!db.objectStoreNames.contains(STORE_ERRORS)) {
        db.createObjectStore(STORE_ERRORS, { keyPath: 'id', autoIncrement: true });
      }

      // Migration logic for clearing old cache on major version changes
      if (oldVersion > 0 && oldVersion < 4) {
          if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            console.log(`Migrating to v4+: clearing old cache`);
          }
          if (db.objectStoreNames.contains(STORE_CACHE)) {
              db.deleteObjectStore(STORE_CACHE);
              const store = db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
              store.createIndex('timestamp', 'timestamp', { unique: false });
          }
      }
    };

    request.onsuccess = (event: Event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      setDb(database);
      dbRef.current = database;

      // Scalable cleanup using timestamp indices - non-blocking
      setTimeout(() => {
          if (!database) return;
          try {
              const now = Date.now();
              const tx = database.transaction([STORE_SYNC, STORE_CACHE], 'readwrite');

              // Cleanup sync queue (items > 7 days)
              const syncStore = tx.objectStore(STORE_SYNC);
              const syncIndex = syncStore.index('timestamp');
              const syncRange = IDBKeyRange.upperBound(now - (7 * 24 * 60 * 60 * 1000));
              syncIndex.openCursor(syncRange).onsuccess = (e) => {
                  const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                  if (cursor) {
                      cursor.delete();
                      cursor.continue();
                  }
              };

              // Cleanup cache (items > 30 days)
              const cacheStore = tx.objectStore(STORE_CACHE);
              const cacheIndex = cacheStore.index('timestamp');
              const cacheRange = IDBKeyRange.upperBound(now - (30 * 24 * 60 * 60 * 1000));
              cacheIndex.openCursor(cacheRange).onsuccess = (e) => {
                  const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
                  if (cursor) {
                      cursor.delete();
                      cursor.continue();
                  }
              };
          } catch (err) {
              console.warn('Deferred cleanup failed:', err);
          }
      }, 1000);
    };

    request.onerror = (event: Event) => {
      console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Sync initial online status to avoid hydration mismatch - wrapped to avoid render loop if it differs
    const currentOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(prev => prev !== currentOnline ? currentOnline : prev);

    const handleConnectivityChange = (event: Event) => {
        const detail = (event as CustomEvent).detail;
        if (detail && typeof detail.connected === 'boolean') {
            setIsBackendConnected(detail.connected);
        }
    };

    const handleClearData = async () => {
      const database = dbRef.current;
      if (!database) return;
      const stores = [STORE_SYNC, STORE_CACHE, STORE_ERRORS];
      const tx = database.transaction(stores, 'readwrite');
      stores.forEach(store => tx.objectStore(store).clear());
      console.log('IndexedDB cleared');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('backend-connectivity-changed', handleConnectivityChange);
    window.addEventListener('clear-offline-data', handleClearData);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('backend-connectivity-changed', handleConnectivityChange);
      window.removeEventListener('clear-offline-data', handleClearData);
    };
  }, []);

  const getQueue = useCallback(async (): Promise<QueueItem[]> => {
    if (!db) return [];
    return new Promise<QueueItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_SYNC, 'readonly');
      const store = tx.objectStore(STORE_SYNC);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as QueueItem[]);
      request.onerror = () => reject(request.error);
    });
  }, [db]);

  const removeFromQueue = useCallback(async (id: number) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const addToQueue = useCallback(async (type: QueueItem['type'], payload: unknown, sessionId?: string) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const request = store.add({ type, payload, sessionId, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const setCache = useCallback(async (key: string, data: unknown) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const request = store.put({ key, data, timestamp: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const getCache = useCallback(async <T>(key: string, maxAge?: number): Promise<T | null> => {
    if (!db) return null;
    return new Promise<T | null>((resolve) => {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const request = store.get(key);
        request.onsuccess = () => {
            if (!request.result) return resolve(null);
            if (maxAge && Date.now() - request.result.timestamp > maxAge) {
                return resolve(null);
            }
            resolve(request.result.data as T);
        };
        request.onerror = () => resolve(null);
    });
  }, [db]);

  const logSyncError = useCallback(async (item: QueueItem, error: string) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_ERRORS, 'readwrite');
        const store = tx.objectStore(STORE_ERRORS);
        const request = store.add({ ...item, error, failedAt: Date.now() });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  }, [db]);

  const updateQueueItem = useCallback(async (id: number, updates: Partial<QueueItem>) => {
    if (!db) return;
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SYNC, 'readwrite');
        const store = tx.objectStore(STORE_SYNC);
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const data = getRequest.result;
            if (data) {
                const updateRequest = store.put({ ...data, ...updates });
                updateRequest.onsuccess = () => resolve();
                updateRequest.onerror = () => reject(updateRequest.error);
            } else {
                resolve();
            }
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
  }, [db]);

  const processSync = useCallback(async () => {
    if (!isOnline || !db || isSyncing.current) return;

    // Verify backend connectivity before processing sync queue
    const isConnected = await checkBackend();
    if (!isConnected) return;

    isSyncing.current = true;
    try {
      const queue = await getQueue();
      if (queue.length === 0) return;

      console.log(`Processing sync queue: ${queue.length} items`);

      for (const item of queue) {
        try {
          let success = false;
          switch (item.type) {
            case 'ENROLL': {
              const payload = item.payload as { course_id: string; enrollmentCode?: string };
              const { course_id, enrollmentCode } = payload;
              console.log('Syncing enrollment:', course_id, enrollmentCode);
              const enrollRes = await actions.enrollInCourse(course_id, enrollmentCode);
              if (enrollRes.success) success = true;
              break;
            }
            case 'SUBMISSION': {
              const payload = item.payload as Partial<Submission> & { assignment_id: string };
              const { assignment_id, ...subContent } = payload;
              const subRes = await actions.submitAssignment(assignment_id, subContent);
              if (subRes.success) success = true;
              break;
            }
            case 'QUIZ_SUBMISSION': {
              const payload = item.payload as Partial<QuizSubmission> & { quiz_id: string };
              const { quiz_id, ...quizContent } = payload;
              const quizRes = await actions.submitQuiz(quiz_id, quizContent);
              if (quizRes.success) success = true;
              break;
            }
            case 'PROFILE_UPDATE': {
              const payload = item.payload as Partial<User>;
              const profRes = await actions.saveUser(payload);
              if (profRes.success) success = true;
              break;
            }
            case 'COURSE_SAVE': {
              const payload = item.payload as Partial<Course>;
              const courseRes = await actions.saveCourse(payload);
              if (courseRes.success) success = true;
              break;
            }
            case 'ASSIGNMENT_SAVE': {
              const payload = item.payload as Omit<AssignmentDTO, 'course' | 'metadata'>;
              const assignRes = await actions.saveAssignment(payload);
              if (assignRes.success) success = true;
              break;
            }
            case 'QUIZ_SAVE': {
              const payload = item.payload as Omit<QuizDTO, 'course' | 'metadata'>;
              const qRes = await actions.saveQuiz(payload);
              if (qRes.success) success = true;
              break;
            }
            case 'DISCUSSION_POST': {
              const payload = item.payload as Partial<Discussion>;
              const dRes = await actions.saveDiscussionPost(payload);
              if (dRes.success) success = true;
              break;
            }
            case 'PLANNER_UPDATE': {
              const payload = item.payload as Partial<PlannerItem>;
              const pRes = await actions.savePlannerItem(payload);
              if (pRes.success) success = true;
              break;
            }
            case 'SETTING_UPDATE': {
              const payload = item.payload as { p_key: string; p_value: unknown };
              const { p_key, p_value } = payload;
              const sRes = await actions.updateSetting(p_key, p_value);
              if (sRes.success) success = true;
              break;
            }
            case 'LESSON_COMPLETE': {
              const payload = item.payload as { lesson_id: string; course_id: string };
              const { lesson_id, course_id: l_course_id } = payload;
              const lcRes = await actions.markLessonComplete(lesson_id, l_course_id);
              if (lcRes.success) success = true;
              break;
            }
            case 'ATTENDANCE': {
              const payload = item.payload as { live_class_id: string };
              const { live_class_id } = payload;
              const attRes = await actions.recordAttendance(live_class_id);
              if (attRes.success) success = true;
              break;
            }
          }

          if (success && item.id) {
            await removeFromQueue(item.id);
          } else if (!success && item.id) {
              const retryCount = (item.retry_count || 0) + 1;
              if (retryCount >= 5) {
                  await logSyncError(item, 'Max retry attempts reached');
                  await removeFromQueue(item.id);
                  window.dispatchEvent(new CustomEvent('sync-conflict', {
                    detail: { item, error: 'Max retry attempts reached. Data might be inconsistent.' }
                  }));
              } else {
                  await updateQueueItem(item.id, { retry_count: retryCount });
              }
          }
        } catch (err: unknown) {
          console.error('Sync failed for item:', item, err);
          const error = err as Error;
          const message = error.message || 'Unknown error';

          // Conflict Resolution: Check for version mismatch or conflict errors
          const isConflict = message.includes('Conflict') || message.includes('version mismatch') || message.includes('already exists');
          const terminalErrors = ['Forbidden', 'Unauthorized', 'Invalid enrollment code', 'Course not found', 'User not found'];
          const isTerminal = terminalErrors.some(msg => message.includes(msg));

          if (item.id) {
            if (isConflict) {
                // Strategy: Last-Write-Wins (User notified, but item discarded or moved to errors)
                console.warn('Conflict detected during sync:', item, message);
                await logSyncError(item, `Sync Conflict: ${message}. The server has a newer version or a duplicate exists.`);
                await removeFromQueue(item.id);
                window.dispatchEvent(new CustomEvent('sync-conflict', { detail: { item, error: message } }));
            } else if (isTerminal) {
              console.warn('Terminal error during sync, moving to error store:', item, message);
              await logSyncError(item, message);
              await removeFromQueue(item.id);
            } else {
                const retryCount = (item.retry_count || 0) + 1;
                if (retryCount >= 5) {
                    await logSyncError(item, error.message || 'Max retry attempts reached');
                    await removeFromQueue(item.id);
                } else {
                    await updateQueueItem(item.id, { retry_count: retryCount });
                }
            }
          }
        }
      }
    } finally {
      isSyncing.current = false;
    }
  }, [isOnline, db, getQueue, removeFromQueue, logSyncError, updateQueueItem, checkBackend]);

  const pullData = useCallback(async (userId: string, role: string, force = false) => {
    if (!isOnline) return;

    // Throttle full data pulls (TTL: 10 minutes) to prevent aggressive background fetching
    const PULL_TTL = 10 * 60 * 1000;
    if (!force) {
        const lastPull = await getCache<number>(`last_full_pull_${userId}`);
        if (lastPull && Date.now() - lastPull < PULL_TTL) {
            return;
        }
    }

    // Verify backend connectivity before fetching fresh data
    const isConnected = await checkBackend();
    if (!isConnected) return;

    try {
        if (role === 'student') {
            const [courses, enrollments, assignments, quizzes, materials, planner, liveClasses, discussions, completions] = await Promise.all([
                actions.getCourses(),
                actions.getEnrollments(userId),
                actions.getAssignments(),
                actions.getQuizzes(),
                actions.getMaterials(),
                actions.getPlannerItems(userId),
                actions.getLiveClasses(),
                actions.getDiscussions('global'),
                actions.getLessonCompletions(userId)
            ]);

            await Promise.all([
                courses && setCache('all_courses', courses),
                enrollments && setCache('my_enrollments', enrollments),
                assignments && setCache('all_assignments', assignments),
                quizzes && setCache('all_quizzes', quizzes),
                materials && setCache('all_materials', materials),
                planner && setCache('planner_items', planner),
                liveClasses && setCache('all_live_classes', liveClasses),
                discussions && setCache('recent_discussions', discussions),
                completions && setCache('lesson_completions', completions),
                setCache(`last_full_pull_${userId}`, Date.now())
            ]);
        } else if (role === 'teacher') {
             const [courses, assignments, quizzes, materials, submissions, liveClasses] = await Promise.all([
                actions.getCourses(userId),
                actions.getAssignments(userId),
                actions.getQuizzes(undefined, userId),
                actions.getMaterials(),
                actions.getSubmissions(),
                actions.getLiveClasses(undefined, userId)
            ]);

            await Promise.all([
                courses && setCache('teacher_courses', courses),
                assignments && setCache('teacher_assignments', assignments),
                quizzes && setCache('teacher_quizzes', quizzes),
                materials && setCache('teacher_materials', materials),
                submissions && setCache('teacher_submissions', submissions),
                liveClasses && setCache('teacher_live_classes', liveClasses),
                setCache(`last_full_pull_${userId}`, Date.now())
            ]);
        } else if (role === 'admin') {
            const [users, courses, logs, settings] = await Promise.all([
                actions.getUsers(),
                actions.getCourses(),
                actions.getSystemLogs(100),
                actions.getSettings()
            ]);

            await Promise.all([
                users && setCache('admin_users', users),
                courses && setCache('admin_courses', courses),
                logs && setCache('admin_logs', logs),
                settings && setCache('admin_settings', settings),
                setCache(`last_full_pull_${userId}`, Date.now())
            ]);
        }
    } catch (err) {
        console.error('Data pull failed:', err);
    }
  }, [isOnline, setCache, getCache, checkBackend]);

  useEffect(() => {
    if (isOnline && db) {
      processSync();
    }
  }, [isOnline, db, processSync]);

  return useMemo(() => ({
    addToQueue,
    getQueue,
    removeFromQueue,
    setCache,
    getCache,
    processSync,
    pullData,
    isOnline,
    isBackendConnected,
    checkBackend,
    getSyncErrors
  }), [addToQueue, getQueue, removeFromQueue, setCache, getCache, processSync, pullData, isOnline, isBackendConnected, checkBackend, getSyncErrors]);
};
