import axios from 'axios';

import { CONFIG } from '@/config';

/**
 *  Axios Instances
 */

export const axiosApi = axios.create({
  baseURL: CONFIG.API_URL + '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true
});

export const publicAxios = axios.create({
  baseURL: CONFIG.API_URL + '/api',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
});

/**
 * Axios Response Interceptor for automatic 401 handling
 * This will automatically handle unauthorized responses and trigger logout
 *
 * Separate refresh client to avoid interceptor loops
 */
const refreshClient = axios.create({
  baseURL: axiosApi.defaults.baseURL,
  withCredentials: true
});

let logoutCallback: (() => void) | null = null;
let isRefreshing = false;
let failedQueue: { resolve: () => void; reject: (err: unknown) => void }[] = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve();
  });
  failedQueue = [];
};

export const setupAxiosInterceptors = (logoutHandler: () => void) => {
  logoutCallback = logoutHandler;

  axiosApi.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config || {};

      // Handle 401 errors with token refresh
      if (error?.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // If refresh is already in progress, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: () => resolve(axiosApi(originalRequest)),
              reject
            });
          });
        }

        isRefreshing = true;

        try {
          // Call refresh endpoint using separate client to avoid interceptor loop
          await refreshClient.post('/auth/refresh-token');

          // Process all queued requests
          processQueue(null);

          // Retry the original request with new token
          return axiosApi(originalRequest);
        } catch (err) {
          // Refresh failed, reject all queued requests
          processQueue(err);

          // Trigger logout callback
          if (logoutCallback) logoutCallback();

          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};
