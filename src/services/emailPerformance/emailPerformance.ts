import { isAxiosError } from 'axios';

import { axiosApi } from '@/lib/axios';

const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (isAxiosError(error)) {
    const d = error.response?.data as { message?: string } | undefined;
    if (d?.message) return d.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

// ── Shared params ─────────────────────────────────────────────────────────────

export type EABaseParams = {
  from_date: string;
  to_date: string;
  organization_id?: string;
  mailbox_email?: string;
};

// ── KPIs ──────────────────────────────────────────────────────────────────────

export type EAPeriodMetrics = {
  total_emails: number;
  accepted_count: number;
  edited_count: number;
  acceptance_rate_pct: number;
  avg_edit_distance: number;
  median_edit_distance: number;
  avg_jaccard_distance: number;
  avg_semantic_similarity: number;
  avg_draft_tokens: number;
  avg_final_tokens: number;
  unique_senders: number;
  total_drafts_created: number;
  send_rate_pct: number;
};

export type EAKpisResponse = {
  date_range: { current: string; previous: string };
  organization_id: string | null;
  current: EAPeriodMetrics;
  previous: EAPeriodMetrics;
  deltas: {
    total_emails: number;
    acceptance_rate_pct: number;
    avg_edit_distance: number;
    avg_semantic_similarity: number;
    unique_senders: number;
    total_drafts_created: number;
    send_rate_pct: number;
  };
};

// ── Timeseries ─────────────────────────────────────────────────────────────────

// Actual BQ columns from ea_edit_distance_over_time
export type EAEditDistanceRow = {
  date: string;
  avg_edit_distance: number | null;
  median_edit_distance: number | null;
  email_count: number | null;
  acceptance_rate_pct: number | null;
};

// Actual BQ columns from ea_edit_class_distribution_over_time (unpivoted)
export type EAEditClassRow = {
  date: string;
  edit_class: string;
  count: number;
};

export type EAHistogramRow = { bucket: string; count: number };

export type EATimeseriesResponse = {
  date_range: { from_date: string; to_date: string };
  organization_id: string | null;
  charts: {
    edit_distance_over_time: EAEditDistanceRow[];
    edit_class_over_time: EAEditClassRow[];
    edit_distance_histogram: EAHistogramRow[];
  };
};

// ── Emails ─────────────────────────────────────────────────────────────────────

export type EAEmailRow = {
  interaction_id: string;
  sent_at: string;
  mailbox_email: string;
  category: string | null;
  trip_type: string | null;
  edit_class: string | null;
  edit_distance_ratio: number; // BQ alias: ROUND(COALESCE(edit_distance_ratio, 0), 4) AS edit_distance_ratio
  jaccard_distance: number;
  semantic_similarity: number;
  verdict: string | null;
  primary_failure: string | null;
  subject: string | null;
  guest_from: string | null;
  guest_email: string | null;
  ai_draft: string | null;
  final_sent: string | null;
  tool_calls?: {
    tool: string;
    status: 'success' | 'error';
    provider?: string;
    args: Record<string, unknown>;
    output: string;
  }[];
};

export type EAEmailListParams = EABaseParams & {
  page?: number;
  page_size?: number;
  include_body?: boolean;
  category?: string;
  edit_class?: string;
  trip_type?: string;
  verdict?: string;
  primary_failure?: string;
  min_edit_distance?: number;
  max_edit_distance?: number;
  search_text?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
};

export type EAEmailListResponse = {
  rows: EAEmailRow[];
  total_count: number;
  page: number;
  page_size: number;
};

// ── Category Analysis ──────────────────────────────────────────────────────────

export type EACategoryAggRow = {
  category: string;
  email_count: number; // BQ alias: COUNT(*) AS email_count
  avg_edit_distance: number;
  median_edit_distance: number;
  acceptance_rate_pct: number;
};

// Flat BQ row from ea_category_week_heatmap — grouped into cells in the transform
export type EACategoryHeatmapRow = {
  category: string;
  week: string;
  avg_edit_distance: number;
  email_count: number;
};

export type EACategoryAnalysisResponse = {
  date_range: { from_date: string; to_date: string };
  organization_id: string | null;
  charts: {
    edit_distance_by_category_over_time: Array<{ date: string } & Record<string, number | string>>;
    category_aggregates: EACategoryAggRow[];
    category_week_heatmap: EACategoryHeatmapRow[];
  };
};

// ── Hotel Overview ─────────────────────────────────────────────────────────────

export type EAHotelOverviewRow = {
  organization_id: string;
  organization_name: string;
  mailbox_email: string;
  total_drafts_created: number;
  total_drafts: number;
  drafts_last_7d: number;
  send_rate_pct: number | null;
  acceptance_rate_pct: number;
  avg_edit_distance: number;
  avg_semantic_similarity: number;
  last_draft_at: string | null;
  auto_drafts_enabled: boolean;
  status: 'active' | 'inactive' | 'never_used';
  needs_attention?: boolean;
};

export type EAHotelOverviewResponse = {
  kpis: {
    total_hotels: number;
    active_hotels: number;
    inactive_hotels: number;
    never_used_hotels: number;
    auto_drafts_on_count: number;
    needs_attention_count: number;
  };
  hotels: EAHotelOverviewRow[];
};

// ── Judge Breakdown ────────────────────────────────────────────────────────────

export type EABreakdownEntry = {
  label: string;
  count: number;
};

export type EAJudgeBreakdownResponse = {
  date_range: { from_date: string; to_date: string };
  organization_id: string | null;
  breakdown: {
    by_verdict: EABreakdownEntry[];
    by_primary_failure: EABreakdownEntry[];
    by_root_cause: EABreakdownEntry[];
    by_fix_layer: EABreakdownEntry[];
    by_fact_status: EABreakdownEntry[];
    by_could_be_fixed_without_new_systems: EABreakdownEntry[];
  };
};

// ── Service helpers ────────────────────────────────────────────────────────────

// The backend may wrap responses as { status, message, data: <payload> }.
// This unwraps to the inner payload when present, falling back to the raw body.
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && 'data' in body && (body as Record<string, unknown>).data) {
    return (body as { data: T }).data;
  }
  return body as T;
}

// ── Service ────────────────────────────────────────────────────────────────────

export const emailPerformanceService = {
  getKpis: async (params: EABaseParams): Promise<EAKpisResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/kpis', { params });
      return unwrap<EAKpisResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch KPIs'));
    }
  },

  getTimeseries: async (params: EABaseParams): Promise<EATimeseriesResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/timeseries', { params });
      return unwrap<EATimeseriesResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch timeseries'));
    }
  },

  getEmails: async (params: EAEmailListParams): Promise<EAEmailListResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/emails', { params });
      return unwrap<EAEmailListResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch emails'));
    }
  },

  getCategoryAnalysis: async (params: EABaseParams): Promise<EACategoryAnalysisResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/category-analysis', {
        params,
      });
      return unwrap<EACategoryAnalysisResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch category analysis'));
    }
  },

  getHotelOverview: async (params: {
    from_date: string;
    to_date: string;
  }): Promise<EAHotelOverviewResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/hotel-overview', {
        params,
      });
      return unwrap<EAHotelOverviewResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch hotel overview'));
    }
  },

  getJudgeBreakdown: async (params: EABaseParams): Promise<EAJudgeBreakdownResponse> => {
    try {
      const { data } = await axiosApi.get<unknown>('/email-assistant-stats/judge-breakdown', {
        params,
      });
      return unwrap<EAJudgeBreakdownResponse>(data);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Failed to fetch judge breakdown'));
    }
  },
};
