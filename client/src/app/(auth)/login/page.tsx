import type { Metadata } from 'next';
import { GoogleSignInButton } from '@/components/features/auth/google-sign-in-button';

export const metadata: Metadata = {
  title: 'Sign In — Trace',
  description: 'Sign in to Trace to track your personal sheets.',
};

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Heading */}
      <h2 className="text-xl font-semibold text-zinc-50 mb-1.5">
        Welcome to Trace
      </h2>
      <p className="text-sm text-zinc-500 mb-8 max-w-xs leading-relaxed">
        Your personal sheets, organized. Sign in to start tracking tasks across
        all your sheets.
      </p>

      {/* Sign-in button */}
      <GoogleSignInButton />

      {/* Footer note */}
      <p className="mt-6 text-xs text-zinc-600 leading-relaxed">
        By signing in, you agree to our{' '}
        <span className="text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors">
          Terms of Service
        </span>{' '}
        and{' '}
        <span className="text-zinc-500 hover:text-zinc-400 cursor-pointer transition-colors">
          Privacy Policy
        </span>
        .
      </p>
    </div>
  );
}
