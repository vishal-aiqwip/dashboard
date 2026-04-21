import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { Navigate } from 'react-router';

import { authService } from '@/services/auth/auth';

/**
 * Wraps public/auth pages so that already-authenticated users
 * are redirected to the dashboard instead of seeing login/signup.
 */
export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // User is authenticated — redirect to dashboard
  if (!isError && me?.user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated — show the auth page
  return <>{children}</>;
}
