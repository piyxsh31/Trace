import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, trend, className }) => {
  return (
    <div className={twMerge('glass-card p-6 flex flex-col gap-4 relative overflow-hidden group', className)}>
      <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors" />
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-text-muted">{title}</h3>
        <div className="w-8 h-8 rounded-md bg-surface flex items-center justify-center border border-border">
          <Icon className="w-4 h-4 text-indigo-400" />
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-text-primary">{value}</span>
        {trend && (
          <span className={clsx('text-xs font-medium', trend.startsWith('+') ? 'text-success' : 'text-text-muted')}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
