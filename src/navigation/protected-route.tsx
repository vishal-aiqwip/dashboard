import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { authService } from '@/services/auth/auth';
import { loadingStart, useAppDispatch, useAppSelector } from '@/redux';
import { loadingStop, login, logout, setPermissions, setRole } from '@/redux/reducer/sessionReducer';


export default function ProtectedRoute() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { userSession } = useAppSelector((state:any) => state.session);

  // ----------------- Single query to fetch user/session ----------------- //
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => authService.me(),
    retry: false,
  });

  // console.log(me,"me")

  // ----------------- Effect: store session, roles, permissions ----------------- //
  useEffect(() => {
    if (isLoading) {
      dispatch(loadingStart('screen'));
    } else if (isError) {
      dispatch(logout());
    } else if (me?.user) {
      dispatch(login(me));
      dispatch(setRole(me?.role));
      dispatch(setPermissions(me?.permissions));
      dispatch(loadingStop());
    }
  }, [me, isLoading, isError, dispatch]);

  
    // console.log(userSession,"---------usersession-------")

  // ----------------- Redirect if unauthorized ----------------- //
  if (isError || (!isLoading && !me?.user)) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/?tab=signin&from=${encodeURIComponent(from)}`} replace />;
  }

  // ----------------- Loader: wait for /me AND for Redux to be populated ----------------- //
  if (isLoading || !userSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // ----------------- Redirect if profile incomplete ----------------- //
  const isProfileRoute = location.pathname === '/dashboard/profile';
  const isProfileCompleted = (userSession as Record<string, unknown>)?.is_profile_completed;

  if (!isProfileCompleted && !isProfileRoute) {
    return <Navigate to="/dashboard/profile?edit=true" replace />;
  }

  return <Outlet />;
}