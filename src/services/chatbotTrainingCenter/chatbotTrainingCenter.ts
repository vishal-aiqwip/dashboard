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

// ── Types ──────────────────────────────────────────────────────────────────────

export type ChatbotColorConfig = {
  bg_color?: string;
  bot_bg_color?: string;
  bot_text_color?: string;
  user_bg_color?: string;
  user_text_color?: string;
  close_icon_color?: string;
  header_bg_color?: string;
  header_text_color?: string;
  bubble_bg_color?: string;
  send_icon_color?: string;
};

export type ChatbotLauncher = {
  match_all?: boolean;
  phone: { x_percent: number; y_percent: number; diameter_px: number };
  desktop: { x_percent: number; y_percent: number; diameter_px: number };
};

export type ChatbotDetail = {
  id: string;
  chatbot_name: string;
  knowledge_base_id?: string | null;
  header_text?: string | null;
  welcome_message?: string | null;
  floating_message?: string | null;
  placeholder_text?: string | null;
  prompt?: string | null;
  initial_suggested_prompts?: string[];
  ai_policy_message?: string | null;
  color_config?: ChatbotColorConfig;
  corner_style?: string;
  bubble_diameter?: string;
  bubble_shadow?: boolean;
  launcher?: ChatbotLauncher;
  show_on_phone?: boolean;
  header_logo?: string | null;
  avatar_icon?: string | null;
  bubble_icon?: string | null;
  // Typography
  font_family?: string | null;
  font_family_header?: string | null;
  font_size_header?: string | null;
  font_weight_header?: string | null;
  font_size_chat?: string | null;
  // Bubble launcher label (text mode)
  use_bubble_text?: boolean | null;
  bubble_label_text?: string | null;
  bubble_label_text_color?: string | null;
  bubble_label_font_family?: string | null;
  bubble_label_font_weight?: string | null;
  bubble_label_font_size?: string | null;
  published?: boolean | null;
};

export type KbDocument = {
  id: string;
  title: string;
  filename: string;
  content?: string | null;
  original_extension?: string | null;
  upload_date?: string | null;
  last_trained?: string | null;
  pinecone_id?: string;
};

export type KbUrl = {
  id: string;
  url: string;
  title?: string | null;
  upload_date?: string | null;
  last_trained?: string | null;
  pinecone_id?: string;
};

export type UnansweredQuestion = {
  document_id: string;
  bot_message?: string | null;
  original_question: string;
  message_id?: string;
  bot_message_id?: string;
  human_timestamp?: string | null;
};

export type ChatMessage = {
  id?: string;
  message_content: string;
  sender: 'human' | 'bot' | string;
  timestamp?: string;
  feedback?: { rating: 'positive' | 'negative' | null; timestamp?: string } | null;
  tool_logs?: unknown[];
};

export type ChatConversation = {
  id: string;
  chatbot_id: string;
  organization_id?: string;
  created_at: string;
  updated_at?: string | null;
  messages: ChatMessage[];
  is_transferred_to_agent?: boolean;
  channel?: 'messenger' | 'instagram' | 'web' | null;
  is_error?: boolean | null;
  error_note?: string | null;
};

export type KnowledgeBaseBrief = {
  id: string;
  knowledge_base_name: string;
};

// ── Service ────────────────────────────────────────────────────────────────────

export const chatbotTrainingCenterService = {
  // ── Chatbots ───────────────────────────────────────────────────────────────

  listChatbots: async (orgId: string): Promise<ChatbotDetail[]> => {
    try {
      const { data } = await axiosApi.get('/api/chatbots', {
        params: { organization_id: orgId },
      });
      return (data?.data?.chatbots ?? []) as ChatbotDetail[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch chatbots');
    }
  },

  updateChatbot: async (chatbotId: string, payload: Partial<ChatbotDetail>, orgId?: string): Promise<void> => {
    try {
      await axiosApi.patch(`/api/chatbots/${chatbotId}`, payload, {
        params: orgId ? { organization_id: orgId } : undefined,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to update chatbot');
    }
  },

  // ── Knowledge bases ────────────────────────────────────────────────────────

  listKnowledgeBases: async (orgId: string): Promise<KnowledgeBaseBrief[]> => {
    try {
      const { data } = await axiosApi.get('/api/knowledge-bases', {
        params: { organization_id: orgId },
      });
      return (data?.data?.knowledge_bases ?? []) as KnowledgeBaseBrief[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch knowledge bases');
    }
  },

  // ── Documents ──────────────────────────────────────────────────────────────

  listDocuments: async (kbId: string, orgId: string): Promise<KbDocument[]> => {
    try {
      const { data } = await axiosApi.get(`/api/knowledge-bases/${kbId}/documents`, {
        params: { organization_id: orgId },
      });
      return (data?.data?.documents ?? []) as KbDocument[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch documents');
    }
  },

  // ── URLs ───────────────────────────────────────────────────────────────────

  listUrls: async (kbId: string, orgId: string): Promise<KbUrl[]> => {
    try {
      const { data } = await axiosApi.get(`/api/knowledge-bases/${kbId}/single-urls`, {
        params: { organization_id: orgId },
      });
      return (data?.data?.single_urls ?? []) as KbUrl[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch URLs');
    }
  },

  // ── Unanswered questions ───────────────────────────────────────────────────

  listUnanswered: async (kbId: string, orgId: string): Promise<UnansweredQuestion[]> => {
    try {
      const { data } = await axiosApi.get(`/api/knowledge-bases/${kbId}/unanswered-questions`, {
        params: { organization_id: orgId },
      });
      return (data?.data?.unanswered_questions ?? []) as UnansweredQuestion[];
    } catch (e) {
      throw apiErr(e, 'Failed to fetch unanswered questions');
    }
  },

  dismissQuestion: async (
    kbId: string,
    orgId: string,
    documentId: string,
    updatedQuestion: string,
  ): Promise<void> => {
    try {
      await axiosApi.put(
        `/api/knowledge-bases/${kbId}/unanswered-questions/`,
        {},
        { params: { organization_id: orgId, document_id: documentId, updated_question: updatedQuestion } },
      );
    } catch (e) {
      throw apiErr(e, 'Failed to dismiss question');
    }
  },

  dismissAllQuestions: async (kbId: string, orgId: string, documentIds: string[]): Promise<void> => {
    try {
      await axiosApi.put(
        `/api/knowledge-bases/${kbId}/unanswered-questions/bulk-update`,
        { document_ids: documentIds },
        { params: { organization_id: orgId } },
      );
    } catch (e) {
      throw apiErr(e, 'Failed to dismiss all questions');
    }
  },

  // ── Documents (create / update) ───────────────────────────────────────────

  createDocument: async (
    orgId: string,
    kbId: string,
    payload: { title: string; content: string },
  ): Promise<void> => {
    try {
      await axiosApi.post(`/api/documents/${orgId}/${kbId}`, {
        title: payload.title,
        filename: `${payload.title}.txt`,
        content: payload.content,
        organization_id: orgId,
        knowledge_base_id: kbId,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to create document');
    }
  },

  updateDocument: async (
    orgId: string,
    kbId: string,
    docId: string,
    payload: { title: string; content: string },
  ): Promise<void> => {
    try {
      await axiosApi.put(`/api/documents/${orgId}/${kbId}/${docId}`, {
        title: payload.title,
        content: payload.content,
        content_changed: true,
        organization_id: orgId,
        knowledge_base_id: kbId,
      });
    } catch (e) {
      throw apiErr(e, 'Failed to update document');
    }
  },

  // ── Knowledge base creation + linking ─────────────────────────────────────

  createKnowledgeBase: async (
    orgId: string,
    language: string,
  ): Promise<{ id: string; knowledge_base_name: string }> => {
    try {
      const randomStr = Math.random().toString(36).substring(2, 8);
      const { data } = await axiosApi.post(
        '/api/knowledge-bases',
        {
          knowledge_base_name: `org_${orgId}_knowledge_base`,
          pinecone_index: 'chatbot-index',
          pinecone_namespace: `org_${orgId}_${randomStr}`,
          knowledge_base_language: language,
          url_loader: 'unstructured',
        },
        { params: { organization_id: orgId } },
      );
      return data?.data?.knowledge_base as { id: string; knowledge_base_name: string };
    } catch (e) {
      throw apiErr(e, 'Failed to create knowledge base');
    }
  },

  linkChatbotToKnowledgeBase: async (
    chatbotId: string,
    kbId: string,
    orgId: string,
  ): Promise<void> => {
    try {
      await axiosApi.put(
        `/api/chatbots/${chatbotId}/knowledge-base`,
        { knowledge_base_id: kbId },
        { params: { organization_id: orgId } },
      );
    } catch (e) {
      throw apiErr(e, 'Failed to link knowledge base to chatbot');
    }
  },

  // ── Conversations ──────────────────────────────────────────────────────────

  updateConversation: async (
    chatbotId: string,
    convId: string,
    payload: { error_note?: string | null; is_error?: boolean },
  ): Promise<void> => {
    try {
      await axiosApi.patch(`/api/chatbots/${chatbotId}/conversations/${convId}`, payload);
    } catch (e) {
      throw apiErr(e, 'Failed to update conversation');
    }
  },

  listConversations: async (
    chatbotId: string,
    orgId: string,
    opts?: {
      limit?: number;
      cursor?: string;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<{ conversations: ChatConversation[]; has_more: boolean; next_cursor?: string }> => {
    try {
      const params: Record<string, unknown> = { organization_id: orgId };
      if (opts?.from_date) params.from_date = opts.from_date;
      if (opts?.to_date) params.to_date = opts.to_date;
      if (opts?.cursor) params.cursor = opts.cursor;
      params.limit = opts?.limit ?? 40;
      const { data } = await axiosApi.get(`/api/chatbots/${chatbotId}/conversations`, { params });
      const d = (data?.data ?? data ?? {}) as {
        conversations?: ChatConversation[];
        has_more?: boolean;
        next_cursor?: string;
      };
      return {
        conversations: d.conversations ?? [],
        has_more: d.has_more ?? false,
        next_cursor: d.next_cursor,
      };
    } catch (e) {
      throw apiErr(e, 'Failed to fetch conversations');
    }
  },
};
