import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <main className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
      {/* Background gradient blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '500px',
          background:
            'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-10%',
          right: '-10%',
          width: '400px',
          height: '400px',
          background:
            'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Glassmorphism card */}
      <div
        className="glass-card relative w-full max-w-md rounded-2xl p-8 sm:p-10"
        style={{ animation: 'slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
            <svg
              width="26"
              height="26"
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
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Trace</h1>
          <p className="text-xs text-zinc-500 font-medium tracking-widest uppercase mt-1">
            DSA Progress Tracker
          </p>
        </div>

        {/* Page content */}
        {children}
      </div>
    </main>
  );
};
