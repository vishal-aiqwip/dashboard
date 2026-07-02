export interface OperationTierBreakdown {
  ai_drafting?: number;
  end_to_end_automation?: number;
  human_required?: number;
}

export interface IntegrationRoadmapStep {
  categories_unlocked: string[];
  cumulative_ai_share: number;
  emails_unlocked: number;
  system: string;
  operation_tier_breakdown?: OperationTierBreakdown;
}

export interface IntegrationRoadmap {
  phase1_by_operation_tier?: OperationTierBreakdown;
  phase1_count?: number;
  phase1_share: number;
  steps: IntegrationRoadmapStep[];
}

export interface AutomationTierCategory {
  category: string;
  email_count: number;
  percentage: number;
  tier: string;
}

export interface AutomationReadiness {
  ai_draft_count?: number;
  automate_now_count?: number;
  ai_drafting_count?: number;
  end_to_end_count?: number;
  human_required_count?: number;
  categories: AutomationTierCategory[];
  integration_roadmap: IntegrationRoadmap;
  narrative: string;
}

export interface CommunicationDimension {
  score: number;
  target?: number;
}

export interface CommunicationProfile {
  completeness: CommunicationDimension;
  formality: CommunicationDimension;
  personalisation: CommunicationDimension;
  structure: CommunicationDimension;
  warmth: CommunicationDimension;
  sample_size: number;
}

export interface BrandVoiceAnalysis {
  communication_profile?: CommunicationProfile;
  narrative: string;
}

export interface ExecutiveSummary {
  guest_email_volume: number;
  mailboxes_analyzed: number;
  noise_filtered: number;
  period_days: number;
  recommended_first_mailbox: string;
  summary_text: string;
  total_inbound_volume: number;
}

export interface ResponseTimeByCategory {
  category: string;
  email_count: number;
  median_minutes: number | null;
  p90_minutes: number | null;
}

export interface ResponseTimeByWeekdayRow {
  day_of_week: string;
  total_inbound: number;
  median_resp_min: number | null;
  p90_resp_min: number | null;
}

export interface ResponseTimeByHourRow {
  hour_of_day: number;
  total_inbound: number;
  median_resp_min: number | null;
  p90_resp_min: number | null;
}

export interface ThreadStats {
  single_touch_rate: number;
}

export interface ServicePerformance {
  median_response_minutes: number;
  p90_response_minutes: number;
  narrative: string;
  response_time_by_category: ResponseTimeByCategory[];
  response_time_by_weekday?: ResponseTimeByWeekdayRow[];
  response_time_by_hour?: ResponseTimeByHourRow[];
  thread_stats: ThreadStats;
}

export interface SpotlightComment {
  detail: string;
  headline: string;
  type: 'warning' | 'opportunity' | 'coaching' | 'insight';
}

export interface VolumeEntry {
  count: number;
  value: string;
}

export interface WorkloadProfile {
  after_hours_pct: number;
  peak_day: string;
  peak_hour: string | number | null;
  volume_by_category: VolumeEntry[];
  volume_by_hour: VolumeEntry[];
  volume_by_mailbox: VolumeEntry[];
  volume_by_weekday: VolumeEntry[];
}

export interface RevenueFinding {
  finding: string;
  email_count: number;
  example_subject: string | null;
  opportunity_type: string | null;
  what_happened: string;
}

export interface RevenueOpportunityType {
  opportunity_type: string;
  count: number;
  slow_response_count: number;
  unanswered_count?: number;
}

export interface RevenueValueBucket {
  value_bucket: string;
  count: number;
  estimated_range: string;
  replied_count: number;
  unanswered_count?: number;
}

export interface RevenueLeakage {
  findings: RevenueFinding[] | unknown[];
  narrative: string;
  slow_response_opportunities: number;
  total_opportunities_found: number;
  unanswered_opportunities?: number;
  revenue_capture_rate?: number;
  answer_coverage_rate?: number;
  estimated_revenue_at_risk?: string;
  revenue_lost_unanswered?: string;
  revenue_at_risk_slow?: string;
  revenue_reply_rate?: number;
  by_opportunity_type?: RevenueOpportunityType[];
  by_value_bucket?: RevenueValueBucket[];
}

export interface HeadlineKpi {
  revenue_capture_rate: number | null;
  sla_minutes: number;
  revenue_intent_total: number;
  revenue_at_risk_display: string;
  revenue_lost_unanswered_display?: string;
  revenue_at_risk_slow_display?: string;
  speed_to_lead_median_min: number | null;
  unanswered_revenue_count: number;
  answer_coverage_rate?: number | null;
  inbox_health_score?: number | null;
  inbox_health_verdict?: string;
  verdict: string;
}

export interface HourlyResponseDataRow {
  day_of_week: string;
  hour_of_day: number;
  inbound_cnt: number;
  avg_resp_min: number | null;
  median_resp_min: number | null;
}

export interface BenchmarkScores {
  brand_voice_avg?: number;
}

export interface RawStats {
  unread_filtered_count?: number;
  actual_days_covered?: number;
  date_range_start?: string;
  date_range_end?: string;
  noise_rate?: number;
  noise_breakdown?: Record<string, number>;
}

export interface RoiModel {
  narrative: string;
}

export interface ReportJson {
  headline_kpi?: HeadlineKpi | null;
  executive_summary: ExecutiveSummary;
  service_performance: ServicePerformance;
  revenue_leakage: RevenueLeakage;
  automation_readiness?: AutomationReadiness;
  brand_voice_analysis?: BrandVoiceAnalysis;
  benchmark_scores?: BenchmarkScores;
  spotlight_comments?: SpotlightComment[];
  workload_profile?: WorkloadProfile;
  hourly_response_data?: HourlyResponseDataRow[];
  raw_stats?: RawStats;
  roi_model?: RoiModel;
}

export interface EmailReportSnapshot {
  report_id: string;
  hotel_id: string;
  hotel_name: string | null;
  period_days: number;
  generated_at: string;
  report_json: ReportJson;
}
