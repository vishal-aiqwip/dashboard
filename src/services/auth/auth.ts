import {
  firebaseSignIn,
  firebaseSignOut,
  firebaseSendPasswordReset,
  setAuthCookie,
  clearAuthCookie,
} from '@/lib/firebase';

function getFirebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    switch ((error as { code: string }).code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      default:
        return 'Authentication failed. Please try again';
    }
  }
  return 'Authentication failed. Please try again';
}

export const authService = {
  login: async (email: string, password: string): Promise<void> => {
    try {
      const credential = await firebaseSignIn(email, password);
      const token = await credential.user.getIdToken();
      setAuthCookie(token);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },

  logout: async (): Promise<void> => {
    await firebaseSignOut();
    clearAuthCookie();
  },

  forgotPassword: async (email: string): Promise<void> => {
    try {
      await firebaseSendPasswordReset(email);
    } catch (error) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  },
};
