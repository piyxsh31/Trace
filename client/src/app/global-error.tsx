'use client';

import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full antialiased bg-black flex items-center justify-center">
        <div className="glass-card p-10 max-w-lg w-full text-center rounded-2xl border border-zinc-800/60 bg-zinc-900/50">
          <div className="text-4xl mb-4">💥</div>
          <h1 className="text-2xl font-bold text-white mb-2">Fatal Error</h1>
          <p className="text-zinc-400 mb-8">
            Trace encountered a critical error. Please try reloading the page.
          </p>
          <Button onClick={() => reset()} variant="primary" size="lg">
            Reload Application
          </Button>
        </div>
      </body>
    </html>
  );
}
