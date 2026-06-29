import axios from 'axios';
import { CONFIG } from '@/config';
import { getAuthCookie, setAuthCookie, auth } from '@/lib/firebase';

export const axiosApi = axios.create({
  baseURL: CONFIG.API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

export const publicAxios = axios.create({
  baseURL: CONFIG.API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: true,
});

// Attach Bearer token from cookie on every request
axiosApi.interceptors.request.use((config) => {
  const token = getAuthCookie();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

let logoutCallback: (() => void) | null = null;

export const setupAxiosInterceptors = (logoutHandler: () => void) => {
  logoutCallback = logoutHandler;

  axiosApi.interceptors.response.use(
    (res) => res,
    async (error) => {
      const originalRequest = error.config || {};

      if (error?.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const user = auth.currentUser;
          if (user) {
            const token = await user.getIdToken(true);
            setAuthCookie(token);
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosApi(originalRequest);
          }
        } catch {
          // token refresh failed — fall through to logout
        }

        if (logoutCallback) logoutCallback();
      }

      return Promise.reject(error);
    }
  );
};
