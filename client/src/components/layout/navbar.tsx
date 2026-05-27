'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <svg width="18" height="18" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                <path
                  d="M4 11 C4 7.13 7.13 4 11 4 C14.87 4 18 7.13 18 11"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path d="M11 4 L11 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="11" cy="11" r="2" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">Trace</span>
          </div>

          {/* Navigation links */}
          {user && (
            <div className="hidden sm:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/dashboard' ? 'text-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Sheets
              </Link>
              <Link
                href="/dashboard/analytics"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/dashboard/analytics' ? 'text-accent' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Analytics
              </Link>
            </div>
          )}

          {/* User section */}
          {user && (
            <div className="flex items-center gap-3">
              {/* Avatar + name */}
              <div className="flex items-center gap-2.5">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-zinc-700"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <span className="text-xs font-semibold text-indigo-400">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-text-primary">
                  {user.name}
                </span>
              </div>

              {/* Sign out */}
              <Button
                id="navbar-sign-out"
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-text-muted hover:text-text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
