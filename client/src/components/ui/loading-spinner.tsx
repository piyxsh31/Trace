import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, { svg: string; stroke: number }> = {
  sm: { svg: '16', stroke: 2.5 },
  md: { svg: '24', stroke: 2 },
  lg: { svg: '40', stroke: 2 },
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = 'text-indigo-500',
}) => {
  const { svg, stroke } = sizeMap[size];

  return (
    <svg
      width={svg}
      height={svg}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeOpacity={0.25}
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  );
};
