// ─── Shared ───────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: T[];
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface UserData {
  id: string;
  username: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_password_changed: boolean;
  role: 'admin' | 'user' | null;
  created_at: string;
  updated_at: string;
}

export interface UserListResponse {
  users: UserData[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateUserPayload {
  username: string;
  password: string;
}

export interface UpdateUserPayload {
  username?: string;
  password?: string;
  is_active?: boolean;
  is_email_verified?: boolean;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: string;
  user_id: string;
  fname: string | null;
  lname: string | null;
  phone: string | null;
  company: string | null;
  department: string | null;
  designation: string | null;
  company_role: string | null;
  location: string | null;
  photo: string | null;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: UserData;
  profile: ProfileData | null;
  is_profile_completed: boolean;
  role: 'admin' | 'user' | null;
  permissions: string[];
}

export interface MeResponse {
  user: UserData;
  profile: ProfileData | null;
  is_profile_completed: boolean;
  role: 'admin' | 'user' | null;
  permissions: string[];
}

// ─── AI Providers ─────────────────────────────────────────────────────────────

export interface AIProviderParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  [key: string]: unknown;
}

export interface AIProvider {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  provider_type: string;
  base_url: string | null;
  api_key: string | null;
  is_active: boolean;
  is_support_streaming: boolean;
  supports_tools: string[] | null;
  parameters: AIProviderParameters | null;
  created_at: string;
  updated_at: string;
}

export interface AIProviderListResponse {
  providers: AIProvider[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateProviderPayload {
  name: string;
  description?: string;
  provider_type: string;
  base_url?: string;
  api_key?: string;
  is_active?: boolean;
  is_support_streaming?: boolean;
  supports_tools?: string[];
  parameters?: AIProviderParameters;
}

export type UpdateProviderPayload = Partial<CreateProviderPayload>;

// ─── Agents ──────────────────────────────────────────────────────────────────

export interface Agent {
  id: string;
  user_id: string;
  ai_provider_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  system_prompt: string | null;
  personality: string | null;
  tone: string | null;
  model_name: string | null;
  temperature: number;
  max_tokens: number | null;
  top_p: number | null;
  status: string;
  is_public: boolean;
  welcome_message: string | null;
  access_level?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  ai_provider_id?: string;
  avatar_url?: string;
  system_prompt?: string;
  personality?: string;
  tone?: string;
  model_name?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  status?: string;
  is_public?: boolean;
  welcome_message?: string;
  metadata?: Record<string, unknown>;
}

export type UpdateAgentPayload = Partial<CreateAgentPayload>;

// ─── Agent Sharing ───────────────────────────────────────────────────────────

export type ShareRole = 'viewer' | 'editor';

export interface AgentInvitation {
  id: string;
  agent_id: string;
  email: string;
  role: ShareRole;
  status: string;
  invited_by_user_id: string;
  created_at: string;
}

export interface AgentShareMember {
  id: string;
  agent_id: string;
  shared_with_user_id: string;
  shared_with_email: string;
  shared_with_name: string | null;
  role: ShareRole;
  shared_by_user_id: string;
  created_at: string;
}

export interface InvitationPayload {
  email: string;
  role: ShareRole;
}

export interface BulkInvitationPayload {
  invitations: InvitationPayload[];
}

// ─── Token Quota ─────────────────────────────────────────────────────────────

export interface TokenQuota {
  id: string;
  user_id: string;
  total_tokens: number;
  used_tokens: number;
  remaining_tokens: number;
}

// ─── Knowledge Base ──────────────────────────────────────────────────────────

export interface KnowledgeBase {
  id: string;
  agent_id: string;
  name: string;
  description: string | null;
  status: string;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  embedding_dimensions: number;
  total_documents: number;
  total_chunks: number;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeBasePayload {
  name: string;
  description?: string;
  chunk_size?: number;
  chunk_overlap?: number;
}

export type UpdateKnowledgeBasePayload = Partial<CreateKnowledgeBasePayload & { status?: string }>;

export interface KBDocument {
  id: string;
  knowledge_base_id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  file_path: string | null;
  source_url: string | null;
  status: string;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number | null;
  metadata: Record<string, unknown> | null;
  chunk_type?: string;
  original_content?: string | null;
  ai_analysis?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  content: string;
  score: number;
  document_name: string;
  chunk_index: number;
  metadata: Record<string, unknown> | null;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  total: number;
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

export type PromptCategory =
  | 'COMPLIANCE'
  | 'SALES'
  | 'MARKETING'
  | 'CUSTOMER_SUPPORT'
  | 'PRODUCTIVITY'
  | 'EDUCATION'
  | 'ENTERTAINMENT'
  | 'HEALTHCARE'
  | 'FINANCE'
  | 'LEGAL'
  | 'AIROLEPLAY'
  | 'AIROLEPLAY_GENERATION'
  | 'AIROLEPLAY_EVALUATION'
  | 'OTHER';

export interface PromptVersion {
  id: string;
  prompt_id: string;
  user_id: string;
  version_number: number;
  version_label: string | null;
  default_prompts: Record<string, unknown> | null;
  prompts: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: string;
  user_id: string;
  name: string;
  category: PromptCategory;
  is_active: boolean;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptDetail extends Prompt {
  current_version: PromptVersion | null;
  versions: PromptVersion[];
}

export interface PromptListResponse {
  prompts: Prompt[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CreatePromptPayload {
  name: string;
  category: PromptCategory;
  version_label?: string;
  default_prompts?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

export interface UpdatePromptPayload {
  name?: string;
  category?: PromptCategory;
  is_active?: boolean;
}

export interface CreateVersionPayload {
  version_label?: string;
  default_prompts?: Record<string, unknown>;
  prompts?: Record<string, unknown>;
}

// ─── Agent Insights ──────────────────────────────────────────────────────────

export interface DailyDataPoint {
  date: string;
  value: number;
}

export interface DailyTokenDataPoint {
  date: string;
  input_tokens: number;
  output_tokens: number;
}

export interface InsightTopConversation {
  id: string;
  title: string | null;
  message_count: number;
  total_tokens: number;
  status: string;
  channel: string;
  last_message_at: string | null;
  created_at: string;
}

export interface InsightKnowledgeBaseStats {
  total_knowledge_bases: number;
  total_documents: number;
  total_chunks: number;
  file_type_breakdown: Record<string, number>;
}

export interface AgentInsights {
  total_conversations: number;
  total_messages: number;
  total_tokens_input: number;
  total_tokens_output: number;
  avg_latency_ms: number | null;
  messages_over_time: DailyDataPoint[];
  tokens_over_time: DailyTokenDataPoint[];
  latency_over_time: DailyDataPoint[];
  top_conversations: InsightTopConversation[];
  knowledge_base: InsightKnowledgeBaseStats;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_agents: number;
  total_conversations: number;
  total_messages: number;
  total_tokens_input: number;
  total_tokens_output: number;
  messages_over_time: DailyDataPoint[];
  tokens_over_time: DailyTokenDataPoint[];
}
