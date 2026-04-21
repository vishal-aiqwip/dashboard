import { isAxiosError } from 'axios';

import { axiosApi } from '@/lib/axios';
import type { CreateUserPayload, LoginResponse, MeResponse, } from '@/types/api';

type ApiResponse<T> = {
  status: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};





const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string; errors?: unknown } | undefined;

    if (responseData?.message) {
      return responseData.message;
    }

    if (typeof responseData?.errors === 'string') {
      return responseData.errors;
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
      const firstError = responseData.errors[0];
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
};

const assertSuccess = <T>(payload: ApiResponse<T>, fallbackMessage: string): ApiResponse<T> => {
  if (!payload?.status) {
    throw new Error(payload?.message || fallbackMessage);
  }

  return payload;
};

const requireData = <T>(payload: ApiResponse<T>, fallbackMessage: string): T => {
  if (payload.data === undefined || payload.data === null) {
    throw new Error(payload.message || fallbackMessage);
  }

  return payload.data;
};

export const authService = {
  signup: async (payload: CreateUserPayload): Promise<void> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<unknown>>('/auth/signup/', payload);
      assertSuccess(data, 'Failed to create account');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create account'));
    }
  },

  login: async (payload: CreateUserPayload): Promise<LoginResponse> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<LoginResponse>>('/auth/login/', payload);
      return requireData(
        assertSuccess(data, 'Invalid email or password'),
        'Invalid email or password'
      );
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Invalid email or password'));
    }
  },

  logout: async (payload: { refresh_token?: string } = {}): Promise<void> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<null>>('/auth/logout/', payload);
      assertSuccess(data, 'Logout failed');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Logout failed'));
    }
  },

  forgotPassword: async (username: string): Promise<void> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<unknown>>('/auth/forgot-password/', { username });
      assertSuccess(data, 'Failed to send reset email');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to send reset email'));
    }
  },

  resetPasswordWithToken: async (payload: { token: string; new_password: string; confirm_password: string }): Promise<void> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<unknown>>('/auth/reset-password-with-token/', payload);
      assertSuccess(data, 'Failed to reset password');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to reset password'));
    }
  },

  me: async (): Promise<MeResponse> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<MeResponse>>('/auth/me/');
      return requireData(
        assertSuccess(data, 'Unable to fetch current user'),
        'Unable to fetch current user'
      );
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to fetch current user'));
    }
  },
}


 


 

 
