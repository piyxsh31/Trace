'use client';

import React, { useMemo } from 'react';
import { clsx } from 'clsx';

interface TopicCloudProps {
  data: Array<{ topic: string; count: number }>;
}

export const TopicCloud: React.FC<TopicCloudProps> = ({ data }) => {
  const { maxCount } = useMemo(() => {
    let max = 1;
    data.forEach(d => {
      if (d.count > max) max = d.count;
    });
    return { maxCount: max };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-zinc-500 text-sm">
        No topics tracked yet
      </div>
    );
  }

  // Shuffle topics so it looks like an organic cloud rather than a sorted list
  const shuffledData = useMemo(() => {
    return [...data].sort(() => Math.random() - 0.5);
  }, [data]);

  const getStyles = (count: number, max: number) => {
    const ratio = count / max;
    
    // Font size ranges from 0.75rem to 1.5rem
    const fontSize = 0.75 + ratio * 0.75 + 'rem';
    
    // Color thresholds
    let colorClass = 'text-zinc-500 bg-zinc-800/40 border-zinc-800/60';
    if (ratio > 0.7) {
      colorClass = 'text-indigo-200 bg-indigo-900/40 border-indigo-700/50 shadow-[0_0_15px_rgba(99,102,241,0.2)] font-semibold';
    } else if (ratio > 0.4) {
      colorClass = 'text-indigo-300 bg-indigo-900/20 border-indigo-800/50 font-medium';
    } else if (ratio > 0.2) {
      colorClass = 'text-zinc-300 bg-zinc-800/60 border-zinc-700/50';
    }

    return { fontSize, colorClass };
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 w-full h-full content-center p-2">
      {shuffledData.map((item, index) => {
        const { fontSize, colorClass } = getStyles(item.count, maxCount);
        return (
          <div
            key={`${item.topic}-${index}`}
            className={clsx(
              "px-3 py-1.5 rounded-full border transition-all duration-300 cursor-default hover:scale-105 group relative",
              colorClass
            )}
            style={{ fontSize }}
          >
            {item.topic}
            {/* The count indicator scaled slightly smaller than the text */}
            <span className="ml-2 opacity-50 text-[0.7em] relative -top-1 font-normal group-hover:opacity-100 transition-opacity">
              {item.count}
            </span>
          </div>
        );
      })}
    </div>
  );
};
