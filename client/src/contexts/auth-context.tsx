'use client';

import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { User, AuthContextType } from '@/types/auth';
import type { ApiResponse, AuthResponse } from '@/types/api';
import { signInWithGoogle as firebaseSignIn, firebaseSignOut } from '@/lib/firebase';
import { api, setAccessToken } from '@/lib/api';

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const initialized = useRef(false);

  // ─── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const restoreSession = async () => {
      try {
        // Use raw axios (NOT the api instance) to bypass the 401 interceptor.
        // If there's no valid session the interceptor would call window.location.href,
        // causing an infinite full-page reload loop.
        const { data } = await axios.post<ApiResponse<AuthResponse>>(
          '/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        );
        if (data.success && data.data) {
          setAccessToken(data.data.accessToken);
          setUser(data.data.user ?? null);
        }
      } catch {
        // No valid session — user needs to sign in
        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  // ─── Sign in with Google ──────────────────────────────────────────────────
  const signInWithGoogle = useCallback(async (): Promise<void> => {
    try {
      // 1. Firebase popup → get ID token
      const idToken = await firebaseSignIn();

      // 2. Exchange ID token for our JWT session
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/google', { idToken });

      if (!data.success || !data.data) {
        throw new Error(data.message || 'Authentication failed');
      }

      // 3. Store access token in memory, update state
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);

      toast.success(`Welcome back, ${data.data.user.name.split(' ')[0]}! 👋`);
      router.replace('/dashboard');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Sign in failed. Please try again.';

      // Don't show error if user just closed the popup
      if (message.includes('popup-closed-by-user') || message.includes('cancelled')) {
        return;
      }

      toast.error(message);
      throw error;
    }
  }, [router]);

  // ─── Sign out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with local sign-out even if server call fails
    }

    try {
      await firebaseSignOut();
    } catch {
      // Ignore Firebase sign-out errors
    }

    setAccessToken(null);
    setUser(null);
    toast.success('You have been signed out');
    router.replace('/login');
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
