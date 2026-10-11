import React, { useEffect, useState } from 'react';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'table';

/** Grid/table preference persisted per page key in localStorage (read after hydration). */
export function useViewMode(key: string, initial: ViewMode = 'grid') {
  const storageKey = `view-mode:${key}`;
  const [mode, setMode] = useState<ViewMode>(initial);
  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === 'grid' || saved === 'table') setMode(saved);
  }, [storageKey]);
  const update = (next: ViewMode) => {
    setMode(next);
    window.localStorage.setItem(storageKey, next);
  };
  return [mode, update] as const;
}

export const ViewToggle: React.FC<{ mode: ViewMode; onChange: (m: ViewMode) => void }> = ({ mode, onChange }) => (
  <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="View mode">
    {(['grid', 'table'] as const).map((m) => (
      <button
        key={m}
        type="button"
        aria-pressed={mode === m}
        aria-label={m === 'grid' ? 'Grid view' : 'Table view'}
        onClick={() => onChange(m)}
        className={`rounded-md p-1.5 ${mode === m ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
      >
        {m === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
      </button>
    ))}
  </div>
);
