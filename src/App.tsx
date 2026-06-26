import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';

import '@/styles/index.css';

import ErrorBoundary from './components/error-boundary';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { FirebaseAuthProvider } from './context/firebase-auth-context';
import Navigation from './navigation';
import { store } from './redux';
import { setupAxiosInterceptors } from './lib/axios';
import { logout } from './redux/reducer/sessionReducer';

setupAxiosInterceptors(() => {
  store.dispatch(logout());
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  return (
    <Provider store={store}>
      <FirebaseAuthProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <TooltipProvider>
              <Navigation />
              <Toaster position="bottom-right" richColors />
            </TooltipProvider>
          </ErrorBoundary>
        </QueryClientProvider>
      </FirebaseAuthProvider>
    </Provider>
  );
}

export default App;
