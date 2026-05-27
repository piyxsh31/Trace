import React from 'react';
import { LoadingSpinner } from './loading-spinner';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Logo */}
      <div
        className="relative flex flex-col items-center gap-6"
        style={{ animation: 'fade-in 0.4s ease-out' }}
      >
        {/* Wordmark */}
        <div className="flex items-center gap-3">
          {/* Icon mark */}
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M4 11 C4 7.13 7.13 4 11 4 C14.87 4 18 7.13 18 11"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M11 4 L11 18"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle cx="11" cy="11" r="2" fill="white" />
            </svg>
          </div>
          <span className="text-3xl font-bold text-zinc-50 tracking-tight">
            Trace
          </span>
        </div>

        <p className="text-sm text-zinc-500 font-medium tracking-wide uppercase">
          DSA Progress Tracker
        </p>

        {/* Spinner */}
        <LoadingSpinner size="md" className="text-indigo-500/70" />
      </div>
    </div>
  );
};
