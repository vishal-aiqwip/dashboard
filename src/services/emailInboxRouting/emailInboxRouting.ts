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

export type HotelEmailRouting = {
  organization_id: string;
  organization_name: string | null;
  processing_version: 'v1' | 'v2';
  has_email_settings: boolean;
};

export type ReadinessReport = {
  organization_id: string;
  ready: boolean;
  unavailable?: boolean;
  checks?: {
    email_settings: { ok: boolean; detail?: string };
    knowledge_base: { ok: boolean; namespace?: string | null; detail?: string };
    pms_tools: { ok: boolean; systems?: string[]; detail?: string };
    taxonomy: {
      status: 'ready' | 'generating' | 'empty' | 'error';
      count: number;
      detail?: string;
    };
  };
};

export const emailInboxRoutingService = {
  list: async (): Promise<HotelEmailRouting[]> => {
    try {
      const { data } = await axiosApi.get('/api/email-inbox-routing');
      return (data?.data?.hotels ?? []) as HotelEmailRouting[];
    } catch (e) {
      throw err(e, 'Failed to fetch email inbox routing');
    }
  },

  setVersion: async (organizationId: string, enabled: boolean): Promise<void> => {
    try {
      await axiosApi.post('/api/email-inbox-routing', {
        organization_id: organizationId,
        enabled,
      });
    } catch (e) {
      throw err(e, 'Failed to update email inbox routing');
    }
  },

  getReadiness: async (organizationId: string): Promise<ReadinessReport> => {
    try {
      const { data } = await axiosApi.get(
        `/api/email-inbox-routing/readiness?organization_id=${encodeURIComponent(organizationId)}`,
      );
      return data.data as ReadinessReport;
    } catch (e) {
      throw err(e, 'Failed to fetch readiness report');
    }
  },
};
