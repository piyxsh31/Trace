import React from 'react';

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
}

export function Progress({ value, className = '' }: ProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-zinc-800 ${className}`}>
      <div
        className="h-full bg-indigo-500 transition-all duration-500 ease-out"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
