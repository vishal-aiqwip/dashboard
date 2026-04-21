import { type UseQueryResult } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QueryStateWrapperProps<TData = unknown, TError = unknown> = {
  query: Pick<UseQueryResult<TData, TError>, 'isLoading' | 'isError' | 'error' | 'refetch'>;
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
  fallback?: React.ReactNode;
  errorFallback?:
    | React.ReactNode
    | ((args: { errorMessage: string; onRetry: () => void }) => React.ReactNode);
  loadingMessage?: string;
  fallbackErrorMessage?: string;
  loadingClassName?: string;
  errorClassName?: string;
};

export function QueryStateWrapper<TData = unknown, TError = unknown>({
  query,
  children,
  loadingFallback,
  fallback,
  errorFallback,
  loadingMessage = 'Loading...',
  fallbackErrorMessage = 'Something went wrong',
  loadingClassName,
  errorClassName
}: QueryStateWrapperProps<TData, TError>) {
  const resolvedLoadingFallback = loadingFallback ?? fallback;

  if (query.isLoading) {
    if (resolvedLoadingFallback) {
      return <>{resolvedLoadingFallback}</>;
    }

    return (
      <div
        className={cn(
          'text-muted-foreground flex h-40 items-center justify-center gap-2 text-sm',
          loadingClassName
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {loadingMessage}
      </div>
    );
  }

  if (query.isError) {
    const errorMessage = query.error instanceof Error ? query.error.message : fallbackErrorMessage;
    const onRetry = () => {
      void query.refetch();
    };

    if (errorFallback) {
      if (typeof errorFallback === 'function') {
        return <>{errorFallback({ errorMessage, onRetry })}</>;
      }
      return <>{errorFallback}</>;
    }

    return (
      <div className={cn('flex h-40 flex-col items-center justify-center gap-3', errorClassName)}>
        <p className="text-destructive text-center text-sm">{errorMessage}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
