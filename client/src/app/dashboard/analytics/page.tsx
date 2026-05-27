'use client';

import React from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { Heatmap } from '@/components/features/analytics/heatmap';
import { DifficultyDonut } from '@/components/features/analytics/difficulty-donut';
import { TopicCloud } from '@/components/features/analytics/topic-cloud';
import { RecentActivity } from '@/components/features/analytics/recent-activity';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function AnalyticsPage() {
  const { data, isLoading, error } = useAnalytics();

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-zinc-200">Failed to load analytics</h2>
        <p className="text-zinc-500 mt-2">{error || 'Unknown error occurred'}</p>
      </div>
    );
  }

  const { heatmap, difficulty, topics, recentActivity, totals, streaks } = data;
  
  const completionRate = totals.totalProblems > 0 
    ? Math.round((totals.totalSolved / totals.totalProblems) * 100) 
    : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50">Analytics Overview</h1>
        <p className="text-zinc-400 mt-2">Track your progress, identify weak spots, and stay consistent.</p>
      </div>

      {/* Heatmap Section */}
      <div className="glass-card p-6 mb-8">
        <Heatmap data={heatmap} streaks={streaks} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">Difficulty Distribution</h2>
          <div className="flex-1 flex items-center">
            <DifficultyDonut data={difficulty} totals={totals} />
          </div>
        </div>
        <div className="glass-card p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-zinc-100 mb-6">Topic Mastery</h2>
          <div className="flex-1 overflow-hidden flex items-center">
            <TopicCloud data={topics} />
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="glass-card p-0 overflow-hidden flex flex-col">
        <div className="p-6 pb-4 border-b border-zinc-800/60 bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-100">Recent Solves</h2>
        </div>
        <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
          <RecentActivity activities={recentActivity} />
        </div>
      </div>
      
    </div>
  );
}
