import { useMutation } from '@tanstack/react-query';
import { Outlet, useNavigate } from 'react-router';

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useErrorLog } from '@/hooks/use-error-log';
import { AppSidebar } from '@/layouts/_components/app-sidebar';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/reducer/sessionReducer';

import { authService } from '@/services/auth/auth';
import { SiteHeader } from './_components/site-header';

/**
 * @file dashboard-layout.tsx
 * @description Shared layout wrapper for all dashboard routes.
 */
export default function DashboardLayout() {
  const navigate = useNavigate();
  const handleError = useErrorLog('/dashboard-layout');
  const dispatch = useAppDispatch();

  const { userSession } = useAppSelector((state: any) => state.session);

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      navigate('/?tab=signin', { replace: true });
      dispatch(logout());
    },
    onError: (error) => {
      handleError(error);
      navigate('/?tab=signin', { replace: true });
    }
  });

  const sidebarUser = {
    full_name: userSession?.user?.displayName ?? null,
    email: userSession?.user?.email ?? null,
    avatar_url: null,
  };

  return (
    <SidebarProvider>
      <AppSidebar
        user={sidebarUser}
        role={userSession?.role ?? null}
        onLogout={() => logoutMutation.mutate()}
        isLoggingOut={logoutMutation.isPending}
      />
      <SidebarInset>
        <SiteHeader />
        <div className="@container/main flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto md:gap-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
