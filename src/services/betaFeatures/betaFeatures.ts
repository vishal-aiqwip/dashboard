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

export type BetaFeature = {
  id: string;
  name: string;
  organizations: string[];
};

export type SetFeatureAccessPayload = {
  featureName: string;
  organizationId: string;
  enabled: boolean;
};

export const betaFeaturesService = {
  list: async (): Promise<BetaFeature[]> => {
    try {
      const { data } = await axiosApi.get('/api/beta-features');
      return (data?.data?.features ?? []) as BetaFeature[];
    } catch (e) {
      throw err(e, 'Failed to fetch beta features');
    }
  },

  setAccess: async (payload: SetFeatureAccessPayload): Promise<void> => {
    try {
      await axiosApi.post('/api/beta-features/access', payload);
    } catch (e) {
      throw err(e, 'Failed to update feature access');
    }
  },
};
