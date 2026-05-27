import React, { useState, useEffect } from 'react';

interface ProblemTimerProps {
  resetTrigger: number; // A value that changes when we should reset the timer
}

export function ProblemTimer({ resetTrigger }: ProblemTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // Reset timer when trigger changes (e.g., when problem index changes)
    setSeconds(0);
    
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resetTrigger]);

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-zinc-400 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-800">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="font-mono text-sm tracking-wider">{formatTime(seconds)}</span>
    </div>
  );
}
