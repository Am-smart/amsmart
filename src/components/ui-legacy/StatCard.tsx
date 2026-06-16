import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'default' | 'blue' | 'green' | 'red' | 'amber';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  color = 'default',
  className = ''
}) => {
  const colorClasses = {
    default: 'text-slate-900',
    blue: 'text-blue-600',
    green: 'text-green-600',
    red: 'text-red-600',
    amber: 'text-amber-600'
  };

  return (
    <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${className}`}>
      <h4 className="text-slate-500 text-sm font-bold uppercase mb-2 tracking-widest">{label}</h4>
      <div className={`text-3xl font-bold ${colorClasses[color]}`}>{value}</div>
      {subtext && (
        <div className="text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-tighter">
          {subtext}
        </div>
      )}
    </div>
  );
};
