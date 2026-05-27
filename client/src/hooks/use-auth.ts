import { useContext } from 'react';
import { AuthContext } from '@/contexts/auth-context';
import type { AuthContextType } from '@/types/auth';

/**
 * Hook to access the auth context.
 * Must be used within an `AuthProvider`.
 * @throws {Error} if used outside of AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
