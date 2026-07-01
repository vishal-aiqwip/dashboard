import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import GuestRoute from './guest-route';
import ProtectedRoute from './protected-route';
import DashboardPage from '@/pages/dashboard/dashboard';

const DashboardLayout = lazy(() => import('@/layouts/dashboard-layout'));
const AuthPage = lazy(() => import('@/pages/Auth'));
const EmailPerformancePage = lazy(() => import('@/pages/email-performance'));
const ProfilePage = lazy(() => import('@/pages/Profile'));

const ManageHotelsPage = lazy(() => import('@/pages/manage-hotels'));
const ManageUsersPage = lazy(() => import('@/pages/manage-users'));
const HotelUsersPage = lazy(() => import('@/pages/manage-hotels/hotel-users'));
const AiEmailAccessPage = lazy(() => import('@/pages/manage-hotels/ai-email-access'));
const BetaFeaturesPage = lazy(() => import('@/pages/manage-hotels/beta-features'));
const ChatbotsPage = lazy(() => import('@/pages/manage-hotels/chatbots'));
const SecurityPage = lazy(() => import('@/pages/manage-hotels/security'));
const ChatbotTestPage = lazy(() => import('@/pages/chatbot-test'));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center min-h-[90vh]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <GuestRoute>
        <LazyPage>
          <AuthPage />
        </LazyPage>
      </GuestRoute>
    ),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: (
          <LazyPage>
            <DashboardLayout />
          </LazyPage>
        ),
        children: [
          {
            index: true,
            element: (
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            ),
          },
          {
            path: 'email-performance',
            element: (
              <LazyPage>
                <EmailPerformancePage />
              </LazyPage>
            ),
          },
          {
            path: 'profile',
            element: (
              <LazyPage>
                <ProfilePage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels',
            element: (
              <LazyPage>
                <ManageHotelsPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/organizations',
            element: (
              <LazyPage>
                <ManageHotelsPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/ai-email-access',
            element: (
              <LazyPage>
                <AiEmailAccessPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/beta-features',
            element: (
              <LazyPage>
                <BetaFeaturesPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/chatbots',
            element: (
              <LazyPage>
                <ChatbotsPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/security',
            element: (
              <LazyPage>
                <SecurityPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-users',
            element: (
              <LazyPage>
                <ManageUsersPage />
              </LazyPage>
            ),
          },
          {
            path: 'chatbot-test',
            element: (
              <LazyPage>
                <ChatbotTestPage />
              </LazyPage>
            ),
          },
          {
            path: 'manage-hotels/organizations/:orgId/users',
            element: (
              <LazyPage>
                <HotelUsersPage />
              </LazyPage>
            ),
          },
        ],
      },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
