import type { ReactNode } from "react";
import { AppProvider } from "@/components/AppContext";
import { TimerProvider } from "@/context/TimerContext";

/**
 * Client-only provider stack. Wraps the app in `TimerProvider` and
 * `AppProvider` (the legacy app's auth + data context). This module is
 * lazy-imported from `__root.tsx` so it never runs during SSR/prerender.
 */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TimerProvider>
      <AppProvider>{children}</AppProvider>
    </TimerProvider>
  );
}