import { useEffect } from 'react';
import { Loader } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useFirebaseAuth } from '@/context/firebase-auth-context';
import { useAppDispatch } from '@/redux/hooks';
import { login, logout } from '@/redux/reducer/sessionReducer';

export default function ProtectedRoute() {
  const location = useLocation();
  const { currentUser, loading } = useFirebaseAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (currentUser) {
      currentUser.getIdTokenResult().then((result) => {
        const globalRole = result.claims.global_role as 'admin' | 'user' | null | undefined;
        dispatch(
          login({
            user: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              emailVerified: currentUser.emailVerified,
            },
            role: globalRole ?? null,
            permissions: [],
          })
        );
      }).catch(() => {
        dispatch(
          login({
            user: {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              emailVerified: currentUser.emailVerified,
            },
            role: null,
            permissions: [],
          })
        );
      });
    } else if (!loading) {
      dispatch(logout());
    }
  }, [currentUser, loading, dispatch]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/?tab=signin&from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet />;
}
