import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';
import type {
  UserData,
  UserListResponse,
  CreateUserPayload,
  UpdateUserPayload,
} from '@/types/api';

type ApiResponse<T> = {
  status: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const responseData = error.response?.data as { message?: string } | undefined;
    if (responseData?.message) return responseData.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

const requireData = <T>(payload: ApiResponse<T>, fallbackMessage: string): T => {
  if (payload.data === undefined || payload.data === null) {
    throw new Error(payload.message || fallbackMessage);
  }
  return payload.data;
};

export const userService = {
  getUsers: async (params?: {
    page?: number;
    page_size?: number;
    is_active?: boolean;
  }): Promise<UserListResponse> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<UserListResponse>>('/user/', { params });
      return requireData(data, 'Failed to fetch users');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch users'));
    }
  },

  createUser: async (payload: CreateUserPayload): Promise<UserData> => {
    try {
      const { data } = await axiosApi.post<ApiResponse<UserData>>('/user/', payload);
      return requireData(data, 'Failed to create user');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to create user'));
    }
  },

  getUser: async (userId: string): Promise<UserData> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<UserData>>(`/user/${userId}`);
      return requireData(data, 'Failed to fetch user');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch user'));
    }
  },

  updateUser: async (userId: string, payload: UpdateUserPayload): Promise<UserData> => {
    try {
      const { data } = await axiosApi.put<ApiResponse<UserData>>(`/user/${userId}`, payload);
      return requireData(data, 'Failed to update user');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update user'));
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await axiosApi.delete(`/user/${userId}`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to delete user'));
    }
  },

  getUserRole: async (userId: string): Promise<{ user_id: string; role: string | null }> => {
    try {
      const { data } = await axiosApi.get<ApiResponse<{ user_id: string; role: string | null }>>(
        `/user/${userId}/role`
      );
      return requireData(data, 'Failed to fetch user role');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch user role'));
    }
  },

  updateProfile: async (userId: string, payload: Record<string, unknown>) => {
    try {
      const { data } = await axiosApi.put<ApiResponse<unknown>>(`/profile/${userId}`, payload);
      return requireData(data, 'Failed to update profile');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update profile'));
    }
  },

  getProfile: async (): Promise<{
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string | null;
    photoURL: string | null;
  }> => {
    try {
      const { data } = await axiosApi.get('/user/profile');
      return data;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch profile'));
    }
  },

  updateUserProfile: async (payload: {
    first_name: string;
    last_name: string;
    phone_number?: string;
  }): Promise<void> => {
    try {
      await axiosApi.put('/user/profile', payload);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update profile'));
    }
  },

  setUserRole: async (
    userId: string,
    role: 'admin' | 'user'
  ): Promise<{ user_id: string; role: string }> => {
    try {
      const { data } = await axiosApi.put<ApiResponse<{ user_id: string; role: string }>>(
        `/user/${userId}/role`,
        { role }
      );
      return requireData(data, 'Failed to update user role');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to update user role'));
    }
  },
};
