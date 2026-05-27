import React from 'react';

type Status = 'unsolved' | 'attempted' | 'solved';

interface StatusBadgeProps {
  status: Status;
  onClick?: () => void;
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  let baseClasses =
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none';
  let colorClasses = '';
  let label = '';

  switch (status) {
    case 'solved':
      colorClasses = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      label = 'Solved';
      break;
    case 'attempted':
      colorClasses = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      label = 'Attempted';
      break;
    case 'unsolved':
    default:
      colorClasses = 'bg-zinc-800 text-zinc-400 border border-zinc-700';
      label = 'Unsolved';
      break;
  }

  const clickableClasses = onClick ? 'cursor-pointer hover:bg-opacity-20' : '';

  return (
    <span
      onClick={onClick}
      className={`${baseClasses} ${colorClasses} ${clickableClasses}`}
    >
      {label}
    </span>
  );
}
