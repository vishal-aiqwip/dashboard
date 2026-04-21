  /**
 * Logger utility for development and production
 * Replaces console statements with environment-aware logging
 */
import { CONFIG } from '@/config';

const isDevelopment = CONFIG.IS_DEV;

export const logger = {
  /**
   * Log information (development only)
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Log warnings (development only)
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

 /**
 * Log errors (development only, can be extended to send to error tracking service)
 */
  error: (...args: unknown[]) => {
    if (isDevelopment) {
      console.error(...args);
    }
    // TODO: In production, send to error tracking service (e.g., Sentry)
    // if (errorTrackingService) {
    //   errorTrackingService.captureException(...args);
    // }
  },

  /**
   * Debug logs (development only)
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Info logs (development only)
   */
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  }
};
