import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, setAuthCookie, clearAuthCookie } from '@/lib/firebase';

interface FirebaseAuthContextValue {
  currentUser: User | null;
  loading: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  currentUser: null,
  loading: true,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setAuthCookie(token);
      } else {
        clearAuthCookie();
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <FirebaseAuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export const useFirebaseAuth = () => useContext(FirebaseAuthContext);
