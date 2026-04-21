/**
 * Custom ErrorLog hook to handle UI errors in prod
 */
import { useCallback } from 'react';

import { logger } from '@/lib/logger';

export const useErrorLog = (fileLocation: string) => {
  /**
   * Log error with file location context
   * @param error - Error object or error-like object
   */
  const handleError = useCallback(
    (error: unknown) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      const errorLogString = `Date: ${new Date().toISOString()} \nFile: ${fileLocation} \nError: ${errorObj.message || 'Unknown error'}`;
      logger.error('------------------------');
      logger.error(errorLogString);
      logger.error('**** Stack Trace ****');
      logger.error(errorObj.stack || 'No stack trace available');
      logger.error('------------------------');
    },
    [fileLocation]
  );

  return handleError;
};
