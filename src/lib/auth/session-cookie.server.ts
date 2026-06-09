/**
 * Cookie helpers for the project's custom session (replaces Next.js
 * `cookies()` from `next/headers`). TanStack Start cookies are server-only.
 */
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import { SESSION } from "../constants";

const COOKIE_NAME = (SESSION as { COOKIE_NAME?: string }).COOKIE_NAME ?? "smartlms_session";
const COOKIE_MAX_AGE = (SESSION as { COOKIE_MAX_AGE_S?: number }).COOKIE_MAX_AGE_S ?? 60 * 60 * 24 * 7;

export function readSessionId(): string | null {
  return getCookie(COOKIE_NAME) ?? null;
}

export function writeSessionId(sessionId: string): void {
  setCookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export function clearSessionCookie(): void {
  deleteCookie(COOKIE_NAME, { path: "/" });
}