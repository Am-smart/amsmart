import type { UserDTO } from "../types";
import { SESSION } from "../constants";

interface CachedSession {
  user: UserDTO;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();

export const serverSessionCache = {
  get(sessionId: string): UserDTO | null {
    const cached = sessionCache.get(sessionId);
    if (!cached) return null;
    if (Date.now() > cached.expiresAt) {
      sessionCache.delete(sessionId);
      return null;
    }
    return cached.user;
  },
  set(sessionId: string, user: UserDTO): void {
    sessionCache.set(sessionId, { user, expiresAt: Date.now() + SESSION.CACHE_EXPIRY_MS });
  },
  invalidate(sessionId: string): void {
    sessionCache.delete(sessionId);
  },
  invalidateAllForUser(userId: string): void {
    const toDelete: string[] = [];
    sessionCache.forEach((value, key) => {
      if (value.user.id === userId) toDelete.push(key);
    });
    toDelete.forEach((key) => sessionCache.delete(key));
  },
  clear(): void {
    sessionCache.clear();
  },
};