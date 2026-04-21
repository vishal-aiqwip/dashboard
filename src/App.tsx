import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import '@/styles/index.css';

import ErrorBoundary from './components/error-boundary';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import Navigation from './navigation';
import { Provider } from 'react-redux';
import { store } from './redux';
import { setupAxiosInterceptors } from './lib/axios';
import { logout } from './redux/reducer/sessionReducer';

// Setup axios 401 interceptor with Redux logout
setupAxiosInterceptors(() => {
  store.dispatch(logout());
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true
    },
    mutations: {
      retry: 1
    }
  }
});

function App() {
  return (
    <Provider store={store}>

      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <TooltipProvider>
            <Navigation />
            <Toaster position="bottom-right" richColors />
          </TooltipProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
