'use client';

import React from 'react';
import { format, parseISO } from 'date-fns';
import { CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface RecentActivityProps {
  activities: Array<{
    id: string;
    name: string;
    difficulty: string;
    solvedAt: string;
    sheetName: string;
  }>;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 text-sm">
        No recent activity found.
      </div>
    );
  }

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'text-emerald-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-zinc-400';
    }
  };

  return (
    <div className="flex flex-col">
      {activities.map((activity, index) => (
        <div 
          key={activity.id} 
          className={clsx(
            "flex items-start gap-4 p-4 hover:bg-zinc-800/30 transition-colors",
            index !== activities.length - 1 && "border-b border-zinc-800/50"
          )}
        >
          <div className="mt-1 bg-emerald-500/10 p-1.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-zinc-200 truncate" title={activity.name}>
                {activity.name}
              </h4>
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                {format(parseISO(activity.solvedAt), 'MMM d, h:mm a')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx("text-xs font-semibold capitalize", getDifficultyColor(activity.difficulty))}>
                {activity.difficulty || 'Unrated'}
              </span>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-xs text-zinc-400 truncate">
                {activity.sheetName}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
