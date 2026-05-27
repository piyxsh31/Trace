'use client';

import React, { useMemo } from 'react';
import { subDays, format } from 'date-fns';
import { clsx } from 'clsx';
import { Zap, Trophy } from 'lucide-react';

interface HeatmapProps {
  data: Array<{ date: string; count: number }>;
  streaks: {
    current: number;
    longest: number;
  };
}

export const Heatmap: React.FC<HeatmapProps> = ({ data, streaks }) => {
  const DAYS_TO_SHOW = 365;

  const { monthsData, maxCount } = useMemo(() => {
    const today = new Date();
    const dataMap = new Map(data.map(d => [d.date, d.count]));
    let max = 1;

    // We want the last 365 days
    const days = Array.from({ length: DAYS_TO_SHOW }).map((_, i) => {
      const d = subDays(today, DAYS_TO_SHOW - 1 - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = dataMap.get(dateStr) || 0;
      if (count > max) max = count;
      return {
        date: dateStr,
        count,
        label: format(d, 'MMM d, yyyy'),
        monthKey: format(d, 'yyyy-MM'),
        monthStr: format(d, 'MMM'),
        dayOfWeek: d.getDay() // 0 = Sun, 6 = Sat
      };
    });

    const monthsMap = new Map<string, any>();
    days.forEach(day => {
      if (!monthsMap.has(day.monthKey)) {
        monthsMap.set(day.monthKey, { 
          label: day.monthStr, 
          days: [] 
        });
      }
      monthsMap.get(day.monthKey).days.push(day);
    });

    const processedMonths = Array.from(monthsMap.values()).map(month => {
      const firstDay = month.days[0].dayOfWeek;
      const paddedDays = [
        ...Array(firstDay).fill(null),
        ...month.days
      ];

      const weeks = [];
      for (let i = 0; i < paddedDays.length; i += 7) {
        // Pad the end of the last week if necessary to maintain grid height of 7
        const week = paddedDays.slice(i, i + 7);
        while (week.length < 7) {
          week.push(null);
        }
        weeks.push(week);
      }
      return { ...month, weeks };
    });

    return { monthsData: processedMonths, maxCount: max };
  }, [data]);

  const getColorClass = (count: number, max: number) => {
    if (count === 0) return 'bg-surface-raised';
    const ratio = count / max;
    if (ratio <= 0.25) return 'bg-indigo-900/50';
    if (ratio <= 0.5) return 'bg-indigo-700/60';
    if (ratio <= 0.75) return 'bg-indigo-500/80';
    return 'bg-indigo-400';
  };

  return (
    <div className="flex flex-col">
      {/* Header section with Streaks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Activity Heatmap</h2>
          <span className="text-xs text-text-muted">Last 365 days</span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 bg-surface px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-border">
            <Zap className="w-5 h-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Current Streak</span>
              <span className="text-sm font-bold text-text-primary">{streaks.current} Days</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-surface px-3 py-2 sm:px-4 sm:py-2 rounded-lg border border-border">
            <Trophy className="w-5 h-5 text-accent" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-muted">Longest Streak</span>
              <span className="text-sm font-bold text-text-primary">{streaks.longest} Days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 custom-scrollbar">
        <div className="min-w-max flex gap-4"> {/* Gap-4 provides the LeetCode-style separation between months */}
          {monthsData.map((month, mIndex) => (
            <div key={mIndex} className="flex flex-col gap-2">
              <div className="text-xs text-text-muted font-medium h-4">
                {month.label}
              </div>
              <div className="flex gap-1">
                {month.weeks.map((week: any[], wIndex: number) => (
                  <div key={wIndex} className="flex flex-col gap-1">
                    {week.map((day, dIndex) => {
                      if (!day) {
                        // Render empty space for padding to ensure days of week align horizontally
                        return <div key={`empty-${dIndex}`} className="w-3.5 h-3.5" />;
                      }
                      return (
                        <div
                          key={`${day.date}`}
                          className={clsx(
                            "w-3.5 h-3.5 rounded-sm transition-colors duration-200 cursor-default group relative",
                            getColorClass(day.count, maxCount)
                          )}
                        >
                          {/* Tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-surface-raised border border-border text-xs text-text-primary shadow-sm rounded whitespace-nowrap pointer-events-none z-10">
                            {day.count} {day.count === 1 ? 'problem' : 'problems'} on {day.label}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 text-xs text-text-muted">
          <span>Less</span>
          <div className="w-3.5 h-3.5 rounded-sm bg-surface-raised" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-900/50" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-700/60" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-500/80" />
          <div className="w-3.5 h-3.5 rounded-sm bg-indigo-400" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
};
