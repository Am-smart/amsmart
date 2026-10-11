import React, { useEffect, useState } from 'react';

/** App-wide connection indicator: shows when offline and briefly when back online. */
export const NetworkStatusBanner: React.FC = () => {
  const [online, setOnline] = useState(true);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    let t: number | undefined;
    const up = () => { setOnline(true); setJustReconnected(true); t = window.setTimeout(() => setJustReconnected(false), 3000); };
    const down = () => { setOnline(false); setJustReconnected(false); };
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); window.clearTimeout(t); };
  }, []);

  if (online && !justReconnected) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${
        online ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-slate-900'
      }`}
    >
      {online ? 'Back online' : 'You are offline — changes will not save until the connection returns'}
    </div>
  );
};
