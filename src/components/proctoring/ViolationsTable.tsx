import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ViolationDTO, ViolationSeverity } from '@/lib/types';
import { EmptyState } from '@/components/ui-legacy';

const SEVERITY_STYLES: Record<ViolationSeverity, string> = {
  INFO: 'bg-slate-100 text-slate-700',
  LOW: 'bg-sky-100 text-sky-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const SeverityBadge: React.FC<{ severity: ViolationSeverity }> = ({ severity }) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${SEVERITY_STYLES[severity] ?? SEVERITY_STYLES.INFO}`}>
    {severity}
  </span>
);

interface ViolationsTableProps {
  violations: ViolationDTO[];
}

export const ViolationsTable: React.FC<ViolationsTableProps> = ({ violations }) => {
  if (violations.length === 0) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No violations recorded"
        description="Anti-cheat events captured during proctored assessments will appear here."
      />
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <ul className="space-y-3 md:hidden">
        {violations.map((v) => (
          <li key={v.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{v.user_name}</p>
                <p className="truncate text-sm text-muted-foreground">{v.assessment_title}</p>
              </div>
              <SeverityBadge severity={v.severity} />
            </div>
            <p className="mt-2 text-sm text-foreground">{v.message || v.kind}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(v.timestamp).toLocaleString()}</p>
          </li>
        ))}
      </ul>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">Assessment</th>
              <th className="px-4 py-2 font-medium">Event</th>
              <th className="px-4 py-2 font-medium">Severity</th>
              <th className="px-4 py-2 font-medium">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {violations.map((v) => (
              <tr key={v.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-medium text-foreground">{v.user_name}</td>
                <td className="px-4 py-2 text-muted-foreground">{v.assessment_title}</td>
                <td className="px-4 py-2 text-foreground">{v.message || v.kind}</td>
                <td className="px-4 py-2"><SeverityBadge severity={v.severity} /></td>
                <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                  {new Date(v.timestamp).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
