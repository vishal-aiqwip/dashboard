import type { ReactNode } from 'react';
import { Navigate } from 'react-router';

import { useAppSelector } from '@/redux/hooks';

/**
 * @file admin-route.tsx
 * @description Wraps admin-only pages. Redirects users without admin permissions to /dashboard.
 * Uses the permissions array from Redux (populated from /me) for fine-grained checks.
 */
export default function AdminRoute({
  children,
  permission = 'users.read',
}: {
  children: ReactNode;
  permission?: string;
}) {
  const permissions = useAppSelector(
    (state: { session: { permissions: string[] } }) => state.session.permissions
  );
  const role = useAppSelector(
    (state: { session: { role: string | null } }) => state.session.role
  );

  // Still loading — render nothing to avoid flash redirect
  if (role === null && permissions.length === 0) {
    return null;
  }

  if (!permissions.includes(permission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
