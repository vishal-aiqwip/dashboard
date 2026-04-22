import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import GuestRoute from './guest-route';
import ProtectedRoute from './protected-route';
import DashboardPage from '@/pages/dashboard/dashboard';

// Lazy-loaded page components
const DashboardLayout = lazy(() => import('@/layouts/dashboard-layout'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const EmailPerformancePage = lazy(() => import('@/pages/email-performance'));


function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="flex h-full items-center justify-center min-h-[90vh]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
      {children}
    </Suspense>
  );
}

/**
 * Routes configuration
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <GuestRoute><LazyPage><AuthPage /></LazyPage></GuestRoute>
  },
  {
    // element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <LazyPage><DashboardLayout /></LazyPage>,
        children: [
          {
            index: true,
            element: <LazyPage><DashboardPage /></LazyPage>
          },
          {
            path: 'email-performance',
            element: <LazyPage><EmailPerformancePage /></LazyPage>
          },
        ]
      },
      
    ]
  }
]);

/**
 * @file index.tsx
 * @description Main router
 */
export default function AppRouter() {
  return <RouterProvider router={router} />;
}
