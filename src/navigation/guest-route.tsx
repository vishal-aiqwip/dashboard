import { Loader } from 'lucide-react';
import { Navigate } from 'react-router';
import { useFirebaseAuth } from '@/context/firebase-auth-context';

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { currentUser, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
