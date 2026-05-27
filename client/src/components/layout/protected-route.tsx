'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { SplashScreen } from '@/components/ui/splash-screen';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    // Show splash while the redirect effect fires
    return <SplashScreen />;
  }

  return <>{children}</>;
};
