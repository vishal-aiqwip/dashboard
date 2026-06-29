import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

const err = (e: unknown, fallback: string) => {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message;
    if (msg) return new Error(msg);
  }
  if (e instanceof Error) return e;
  return new Error(fallback);
};

export type MFASettings = {
  require_2fa: boolean;
};

export type MFAUpdateResult = {
  require_2fa: boolean;
  users_updated: number;
};

export const securityService = {
  getMFASettings: async (orgId: string): Promise<MFASettings> => {
    try {
      const { data } = await axiosApi.get(`/api/organizations/${orgId}/mfa-settings`);
      return { require_2fa: data?.data?.require_2fa ?? false };
    } catch (e) {
      throw err(e, 'Failed to fetch MFA settings');
    }
  },

  updateMFASettings: async (orgId: string, require_2fa: boolean): Promise<MFAUpdateResult> => {
    try {
      const { data } = await axiosApi.put(`/api/organizations/${orgId}/mfa-settings`, { require_2fa });
      return {
        require_2fa: data?.data?.require_2fa ?? require_2fa,
        users_updated: data?.data?.users_updated ?? 0,
      };
    } catch (e) {
      throw err(e, 'Failed to update MFA settings');
    }
  },
};
