import { isAxiosError } from 'axios';
import { axiosApi } from '@/lib/axios';

const apiErr = (e: unknown, fallback: string): Error => {
  if (isAxiosError(e)) {
    const d = e.response?.data as { message?: string; detail?: string } | undefined;
    const msg = d?.message ?? d?.detail;
    if (msg) return new Error(msg);
  }
  if (e instanceof Error) return e;
  return new Error(fallback);
};

// Backend wraps /api/ai-email/* responses as { message, status_code, data: <payload> }
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as Record<string, unknown>).data !== undefined) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type PromptParts = {
  role_objective?: string | null;
  language_selection?: string | null;
  hotel_policies?: string | null;
  overrides?: string | null;
  learned_style?: string | null;
};

export type EmailSample = {
  title: string;
  customerEmail: string;
  aiEmailReply: string;
};

export type AiEmailSettings = {
  email_settings_id: string | null;
  prompt?: string | null;
  prompt_parts?: PromptParts | null;
  hotel_policy_urls?: string[] | null;
  insert_font_family?: string | null;
  insert_font_size?: string | null;
  insert_font_color?: string | null;
  examples?: EmailSample[];
};

export type UpdateEmailSettingsPayload = {
  organization_id: string;
  email_settings_id?: string | null;
  prompt_parts?: PromptParts;
  insert_font_family?: string | null;
  insert_font_size?: string | null;
  insert_font_color?: string | null;
  examples?: EmailSample[];
};

export type MailboxSubscription = {
  status: string;
  expiration?: string | null;
  subscriptionId?: string | null;
  needs_reconnect?: boolean;
};

export type MailboxRow = {
  mailbox: string;
  auto_drafts_enabled: boolean;
  subscription?: MailboxSubscription | null;
};

export type MailboxPromptParts = {
  learned_style?: string | null;
  overrides?: string | null;
};

export type MailboxSettings = {
  mailbox_email?: string;
  auto_drafts_enabled?: boolean;
  signature_html?: string | null;
  include_signature_in_auto_drafts?: boolean;
  auto_drafts_blocked_sender_domains?: string[];
  mailbox_prompt_parts?: MailboxPromptParts | null;
  custom_tool_prompt?: string | null;
};

export type UpdateMailboxSettingsPayload = {
  organization_id: string;
  mailbox_email: string;
  auto_drafts_enabled?: boolean;
  signature_html?: string | null;
  include_signature_in_auto_drafts?: boolean;
  auto_drafts_blocked_sender_domains?: string[];
  mailbox_prompt_parts?: MailboxPromptParts;
  custom_tool_prompt?: string | null;
};

export type PromptHistoryEntry = {
  version: number;
  created_at?: string;
  action?: string;
  mailbox_email?: string;
  prompt?: string;
};

export type PromptHistory = {
  history: PromptHistoryEntry[];
  current_prompt?: string;
  current_prompt_version?: number | null;
};

export type ConsentStatus = {
  has_consent: boolean;
  consent_url?: string | null;
  admin_consent_granted?: boolean;
  graph_app_only_verified?: boolean;
  grant_access_link?: string | null;
};

export type InviteItPartnerPayload = {
  organization_id: string;
  it_partner_name: string;
  it_partner_email: string;
  message?: string;
  requested_mailboxes?: string[];
};

export type InviteItPartnerResponse = {
  data?: { grant_access_link?: string | null };
};

export type OnboardingStatus = {
  status: 'queued' | 'running' | 'success' | 'error';
  progress?: number | Record<string, number>;
  message?: string;
  step?: string;
  current_step?: string;
  job_type?: string;
};

export type LatestOnboardingJob = {
  job_id: string;
  status: string;
  job_type: string;
  created_at?: string;
  mailbox_email?: string;
};

export type InboxRecord = {
  id: string;
  organization_id: string;
  receiver_email: string;
  display_name: string | null;
  status: string;
};

export type AnalysisCategory = {
  slug: string;
  name: string;
  description: string;
  prompt: string;
};

export type InquiryCategory = AnalysisCategory & {
  id: string;
  inbox_id: string;
  created_at: string;
  updated_at: string;
};

export type TaxonomyAnalysisStatus = {
  status: 'queued' | 'running' | 'success' | 'error';
  progress: number;
  message: string;
  step: string;
  categories: AnalysisCategory[] | null;
};

// ── Service ────────────────────────────────────────────────────────────────────

export const aiEmailSettingsService = {
  // ── Email Settings ─────────────────────────────────────────────────────────

  getSettings: async (orgId: string): Promise<AiEmailSettings> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/email-settings', {
        params: { organization_id: orgId },
      });
      return unwrap<AiEmailSettings>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch email settings');
    }
  },

  updateSettings: async (payload: UpdateEmailSettingsPayload): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/email-settings/update', payload);
    } catch (e) {
      throw apiErr(e, 'Failed to update email settings');
    }
  },

  // ── Mailboxes ──────────────────────────────────────────────────────────────

  getMailboxes: async (orgId: string): Promise<MailboxRow[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/mailboxes', {
        params: { organization_id: orgId },
      });
      const payload = unwrap<{ items?: MailboxRow[] }>(data);
      return payload.items ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch mailboxes');
    }
  },

  getMailboxSettings: async (orgId: string, mailboxEmail: string): Promise<MailboxSettings> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/mailbox-settings', {
        params: { organization_id: orgId, mailbox_email: mailboxEmail },
      });
      return unwrap<MailboxSettings>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch mailbox settings');
    }
  },

  updateMailboxSettings: async (payload: UpdateMailboxSettingsPayload): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/mailbox-settings/update', payload);
    } catch (e) {
      throw apiErr(e, 'Failed to update mailbox settings');
    }
  },

  // ── Subscriptions ──────────────────────────────────────────────────────────

  createSubscription: async (orgId: string, mailboxEmail: string): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/subscriptions/create', {
        orgId,
        mailboxEmail,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to create subscription');
    }
  },

  recreateSubscription: async (orgId: string, mailboxEmail: string): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/subscriptions/recreate', {
        orgId,
        mailboxEmail,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to reconnect subscription');
    }
  },

  deleteSubscription: async (orgId: string, mailboxEmail: string): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/subscriptions/delete', {
        orgId,
        mailboxEmail,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to delete subscription');
    }
  },

  // ── Prompt History ─────────────────────────────────────────────────────────

  getPromptHistory: async (orgId: string): Promise<PromptHistory> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/email-settings/prompt-history', {
        params: { organization_id: orgId },
      });
      return unwrap<PromptHistory>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch prompt history');
    }
  },

  getPromptSnapshot: async (orgId: string, version: number): Promise<{ prompt: string }> => {
    try {
      const { data } = await axiosApi.get<unknown>(`/api/ai-email/email-settings/prompt-history/${version}`, {
        params: { organization_id: orgId },
      });
      return unwrap<{ prompt: string }>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch prompt snapshot');
    }
  },

  revertPrompt: async (orgId: string, version: number): Promise<void> => {
    try {
      await axiosApi.post('/api/ai-email/email-settings/revert-prompt', {
        organization_id: orgId,
        version,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to revert prompt');
    }
  },

  // ── Consent ────────────────────────────────────────────────────────────────

  inviteItPartner: async (payload: InviteItPartnerPayload): Promise<InviteItPartnerResponse> => {
    try {
      const { data } = await axiosApi.post<InviteItPartnerResponse>(
        '/api/ai-email/onboarding/invite-it-partner',
        payload,
      );
      return data;
    } catch (e) {
      throw apiErr(e, 'Failed to send IT partner invite');
    }
  },

  getConsentStatus: async (orgId: string): Promise<ConsentStatus> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/consent/status', {
        params: { organization_id: orgId },
      });
      return unwrap<ConsentStatus>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch consent status');
    }
  },

  // ── Onboarding / Self-Learning ─────────────────────────────────────────────

  startOnboarding: async (
    orgId: string,
    mailboxEmail: string,
    jobType: 'import_emails' | 'learn_writing_style' | 'learn_kb',
    opts?: { lookback_days?: number },
  ): Promise<{ job_id: string }> => {
    try {
      const { data } = await axiosApi.post<unknown>('/api/ai-email/onboarding/start', {
        organization_id: orgId,
        mailbox_email: mailboxEmail,
        job_type: jobType,
        ...(opts?.lookback_days !== undefined && { lookback_days: opts.lookback_days }),
      });
      return unwrap<{ job_id: string }>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to start onboarding job');
    }
  },

  getOnboardingStatus: async (orgId: string, jobId: string): Promise<OnboardingStatus> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/onboarding/status', {
        params: { organization_id: orgId, job_id: jobId },
      });
      return unwrap<OnboardingStatus>(data);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch onboarding status');
    }
  },

  getLatestJobs: async (orgId: string, mailboxEmail: string): Promise<LatestOnboardingJob[]> => {
    try {
      const { data } = await axiosApi.get<unknown>('/api/ai-email/onboarding/latest-jobs', {
        params: { organization_id: orgId, mailbox_email: mailboxEmail },
      });
      const payload = unwrap<{ jobs?: LatestOnboardingJob[] } | LatestOnboardingJob[]>(data);
      return Array.isArray(payload) ? payload : (payload.jobs ?? []);
    } catch (e) {
      throw apiErr(e, 'Failed to fetch latest jobs');
    }
  },

  // ── Inboxes (agent API via /email-agent proxy) ─────────────────────────────

  getInboxes: async (orgId: string): Promise<InboxRecord[]> => {
    try {
      const { data } = await axiosApi.get<{ inboxes: InboxRecord[] }>('/email-agent/inboxes', {
        params: { organization_id: orgId },
      });
      return data.inboxes ?? [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch inboxes');
    }
  },

  // ── Taxonomy / Categories (agent API via /email-agent proxy) ───────────────

  analyzeTaxonomy: async (
    orgId: string,
    inboxId: string,
    opts?: { months?: number; emails_per_month?: number },
  ): Promise<{ job_id: string }> => {
    try {
      const { data } = await axiosApi.post<{ job_id: string }>('/email-agent/taxonomy/analyze', {
        organization_id: orgId,
        inbox_id: inboxId,
        months: opts?.months ?? 6,
        emails_per_month: opts?.emails_per_month ?? 15,
      });
      return data;
    } catch (e) {
      throw apiErr(e, 'Failed to start taxonomy analysis');
    }
  },

  getAnalysisStatus: async (orgId: string, jobId: string): Promise<TaxonomyAnalysisStatus> => {
    try {
      const { data } = await axiosApi.get<TaxonomyAnalysisStatus>('/email-agent/taxonomy/analyze/status', {
        params: { job_id: jobId, organization_id: orgId },
      });
      return data;
    } catch (e) {
      throw apiErr(e, 'Failed to fetch analysis status');
    }
  },

  getCategories: async (orgId: string, inboxId: string): Promise<InquiryCategory[]> => {
    try {
      const { data } = await axiosApi.get<InquiryCategory[]>('/email-agent/taxonomy/categories', {
        params: { inbox_id: inboxId, organization_id: orgId },
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch categories');
    }
  },

  saveCategories: async (
    orgId: string,
    inboxId: string,
    categories: AnalysisCategory[],
  ): Promise<InquiryCategory[]> => {
    try {
      const { data } = await axiosApi.post<InquiryCategory[]>('/email-agent/taxonomy/categories', {
        organization_id: orgId,
        inbox_id: inboxId,
        categories,
      });
      return Array.isArray(data) ? data : [];
    } catch (e) {
      throw apiErr(e, 'Failed to save categories');
    }
  },

  updateCategory: async (
    orgId: string,
    id: string,
    category: Omit<AnalysisCategory, 'id'>,
  ): Promise<InquiryCategory> => {
    try {
      const { data } = await axiosApi.put<InquiryCategory>(`/email-agent/taxonomy/categories/${id}`, {
        organization_id: orgId,
        ...category,
      });
      return data;
    } catch (e) {
      throw apiErr(e, 'Failed to update category');
    }
  },

  deleteCategory: async (orgId: string, id: string): Promise<void> => {
    try {
      await axiosApi.delete(`/email-agent/taxonomy/categories/${id}`, {
        params: { organization_id: orgId },
      });
    } catch (e) {
      throw apiErr(e, 'Failed to delete category');
    }
  },
};
