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

export type AiProvider = 'openai' | 'azure';

export type GlobalChatbotSettings = {
  llm_provider: AiProvider;
  visible: boolean;
};

export type OrgPublishedStatus = {
  organization_id: string;
  organization_name: string;
  published: boolean;
};

export type Chatbot = {
  id: string;
  chatbot_name: string;
  system_prompt?: string;
  custom_tool_prompt?: string;
};

export const chatbotsService = {
  getGlobalSettings: async (): Promise<GlobalChatbotSettings> => {
    try {
      const { data } = await axiosApi.get('/api/get-global-chatbot-settings');
      const d = data?.data ?? {};
      return {
        llm_provider: (d.llm_provider ?? 'azure') as AiProvider,
        visible: d.visible ?? true,
      };
    } catch (e) {
      throw err(e, 'Failed to fetch global chatbot settings');
    }
  },

  updateProvider: async (provider: AiProvider): Promise<void> => {
    try {
      await axiosApi.post('/api/update-chatbot-ai-model', { provider });
    } catch (e) {
      throw err(e, 'Failed to update AI provider');
    }
  },

  updateVisibility: async (visible: boolean): Promise<void> => {
    try {
      await axiosApi.post('/api/update-global-chatbots-visibility', { visible });
    } catch (e) {
      throw err(e, 'Failed to update chatbot visibility');
    }
  },

  listOrgPublishedStatus: async (): Promise<OrgPublishedStatus[]> => {
    try {
      const { data } = await axiosApi.get('/api/organizations/chatbots/published-status');
      return (data?.data?.organizations ?? []) as OrgPublishedStatus[];
    } catch (e) {
      throw err(e, 'Failed to fetch organization published status');
    }
  },

  setOrgPublishedStatus: async (organizationId: string, published: boolean): Promise<void> => {
    try {
      await axiosApi.post('/api/organizations/chatbots/set-published-status', {
        organization_id: organizationId,
        published,
      });
    } catch (e) {
      throw err(e, 'Failed to update organization published status');
    }
  },

  listByOrg: async (organizationId: string): Promise<Chatbot[]> => {
    try {
      const { data } = await axiosApi.get('/api/chatbots', {
        params: { organization_id: organizationId },
      });
      return (data?.data?.chatbots ?? []) as Chatbot[];
    } catch (e) {
      throw err(e, 'Failed to fetch chatbots');
    }
  },

  update: async (chatbotId: string, payload: Partial<Pick<Chatbot, 'system_prompt' | 'custom_tool_prompt'>>): Promise<void> => {
    try {
      await axiosApi.patch(`/api/chatbots/${chatbotId}`, payload);
    } catch (e) {
      throw err(e, 'Failed to update chatbot');
    }
  },
};
