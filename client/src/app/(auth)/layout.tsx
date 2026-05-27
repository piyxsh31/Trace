'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AuthLayout } from '@/components/layout/auth-layout';
import { SplashScreen } from '@/components/ui/splash-screen';

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <SplashScreen />;
  }

  if (isAuthenticated) {
    return <SplashScreen />;
  }

  return <AuthLayout>{children}</AuthLayout>;
}
