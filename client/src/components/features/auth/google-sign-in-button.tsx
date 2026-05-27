'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

/** Google "G" logo SVG */
const GoogleIcon: React.FC = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

export const GoogleSignInButton: React.FC = () => {
  const { signInWithGoogle, isLoading } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsSigningIn(false);
    }
  };

  const isPending = isSigningIn || isLoading;

  return (
    <button
      id="google-sign-in-btn"
      onClick={handleSignIn}
      disabled={isPending}
      className={[
        'w-full flex items-center justify-center gap-3',
        'h-12 px-6 rounded-xl',
        'bg-white/[0.06] border border-zinc-700/80',
        'text-zinc-200 text-sm font-medium',
        'transition-all duration-200',
        'hover:bg-white/[0.10] hover:border-zinc-600',
        'hover:shadow-lg hover:shadow-indigo-500/10',
        'hover:-translate-y-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'active:scale-[0.98]',
      ].join(' ')}
      aria-label="Continue with Google"
    >
      {isPending ? (
        <svg
          className="animate-spin text-zinc-400"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity={0.25} />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ) : (
        <GoogleIcon />
      )}
      <span>{isPending ? 'Signing in...' : 'Continue with Google'}</span>
    </button>
  );
};
