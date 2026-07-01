import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

const apiErr = (e: unknown, fallback: string): Error => {
  if (isAxiosError(e)) {
    const msg = (e.response?.data as { message?: string } | undefined)?.message;
    if (msg) return new Error(msg);
  }
  if (e instanceof Error) return e;
  return new Error(fallback);
};

// ── Types ──────────────────────────────────────────────────────────────────────

export type PromptParts = {
  role_objective?: string;
  language_selection?: string;
  hotel_policies?: string | string[];
  learned_style?: string;
  overrides?: string;
};

export type MailboxPromptParts = {
  learned_style?: string;
  overrides?: string;
};

export type EmailSettings = {
  prompt_parts: PromptParts;
};

export type MailboxSettings = {
  mailbox_prompt_parts?: MailboxPromptParts;
  custom_tool_prompt?: string;
};

export type ToolCallDetail = {
  name: string;
  arguments: Record<string, unknown>;
  output: Record<string, unknown>;
};

export type ReplayEmailResult = {
  interaction_id: string;
  subject: string;
  original_edit_class: string;
  original_edit_distance: number;
  new_edit_class: string;
  new_edit_distance: number;
  improvement: number;
  original_draft: string;
  new_draft: string;
  final_sent: string;
  tool_calls?: ToolCallDetail[];
};

export type ReplaySummary = {
  total_emails: number;
  avg_original_score: number;
  avg_new_score: number;
  avg_improvement: number;
  improved_count: number;
  worsened_count: number;
  unchanged_count: number;
};

export type ReplayResponse = {
  summary: ReplaySummary;
  results: ReplayEmailResult[];
};

export type ReplayRequest = {
  org_id: string;
  mailbox: string;
  interaction_ids: string[];
  role_objective_override?: string | null;
  hotel_policies_override?: string | null;
  learned_style_override?: string | null;
  custom_tool_prompt_override?: string | null;
  language_selection_override?: string | null;
  overrides_override?: string | null;
};

export type SavePromptRequest = {
  org_id: string;
  mailbox: string;
  role_objective?: string | null;
  hotel_policies?: string | null;
  learned_style?: string | null;
  custom_tool_prompt?: string | null;
  language_selection?: string | null;
  overrides?: string | null;
};

export type ThreadMessage = {
  sender: string;
  recipients: string[];
  date: string;
  subject: string;
  body: string;
};

export type FetchThreadParams = {
  org_id: string;
  mailbox: string;
  conversation_id: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

// Backend wraps /api/ai-email/* responses as { message, status_code, data: <payload> }.
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as Record<string, unknown>).data) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const emailTrainingCenterService = {
  getMailboxes: async (orgId: string): Promise<string[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/mailboxes', {
        params: { organization_id: orgId },
      });
      const payload = unwrap<{ items?: { mailbox: string }[] }>(data);
      return (payload.items ?? []).map((m) => m.mailbox);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch mailboxes');
    }
  },

  getEmailSettings: async (orgId: string): Promise<EmailSettings> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/email-settings', {
        params: { organization_id: orgId },
      });
      return unwrap<EmailSettings>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch email settings');
    }
  },

  getMailboxSettings: async (mailbox: string, orgId: string): Promise<MailboxSettings> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/mailbox-settings', {
        params: { mailbox, organization_id: orgId },
      });
      return unwrap<MailboxSettings>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch mailbox settings');
    }
  },

  replayEmails: async (payload: ReplayRequest): Promise<ReplayResponse> => {
    try {
      const { data } = await axiosApi.post('/email-training-center/replay', payload);
      return data as ReplayResponse;
    } catch (e) {
      throw apiErr(e, 'Replay failed');
    }
  },

  savePrompt: async (payload: SavePromptRequest): Promise<{ status: string }> => {
    try {
      const { data } = await axiosApi.post('/email-training-center/save-prompt', payload);
      return data as { status: string };
    } catch (e) {
      throw apiErr(e, 'Failed to save prompt');
    }
  },

  fetchThread: async (params: FetchThreadParams): Promise<ThreadMessage[]> => {
    try {
      const { data } = await axiosApi.get('/email-training-center/thread', { params });
      return data as ThreadMessage[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch thread');
    }
  },
};
