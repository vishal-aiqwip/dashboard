import { Fragment, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronRight,
  Clock3,
  Filter,
  Inbox,
  Layers3,
  Mail,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHours(minutes: number) {
  if (minutes < 60) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function toLabel(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function toPercent(value: number, digits = 0) {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatPeakHour(peak: string | number | null | undefined): string {
  if (peak === null || peak === undefined) return '—';
  if (typeof peak === 'number') return `${peak}:00`;
  return peak;
}

function isRevenueFindings(x: unknown): x is RevenueFinding[] {
  return (
    Array.isArray(x) &&
    x.every((row) => row && typeof row === 'object' && typeof (row as RevenueFinding).finding === 'string')
  );
}

const EMAIL_REPORT_WEEKDAY_ORDER = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

function heatmapColor(responseMinutes: number | null, inbound: number, scaleMax: number): string {
  if (inbound === 0) return 'hsl(var(--muted) / 0.22)';
  if (responseMinutes == null || scaleMax <= 0) return 'hsl(48 90% 90%)';
  const t = Math.min(1, Math.max(0, responseMinutes / scaleMax));
  const hue = 142 - t * 142;
  const sat = 52 + t * 28;
  const light = 58 - t * 28;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

function formatHeatmapTitle(cell: {
  day: string;
  hour: number;
  inbound: number;
  responseMinutes: number | null;
  avgMinutes: number | null;
}): string {
  const nextHour = cell.hour === 23 ? 0 : cell.hour + 1;
  const span = `${cell.hour}:00–${nextHour}:00`;
  const med = cell.responseMinutes != null ? `median ${formatHours(cell.responseMinutes)}` : 'median —';
  return [`${cell.day} ${span}`, `${cell.inbound.toLocaleString()} inbound`, med]
    .filter(Boolean)
    .join(' · ');
}

// ── Roadmap helpers ───────────────────────────────────────────────────────────

interface RoadmapStep {
  system: string;
  unlocked: number;
  cumulative: number;
  note: string;
  categoriesUnlocked: string[];
  isPhaseOne: boolean;
  operationTierBreakdown?: { drafting: number; automation: number; human: number };
}

function sumOpTier(b: OperationTierBreakdown | undefined): number {
  if (!b) return 0;
  return (b.ai_drafting ?? 0) + (b.end_to_end_automation ?? 0) + (b.human_required ?? 0);
}

function mapApiTier(b: OperationTierBreakdown | undefined) {
  if (!b) return undefined;
  const d = b.ai_drafting ?? 0;
  const a = b.end_to_end_automation ?? 0;
  const h = b.human_required ?? 0;
  if (d + a + h === 0) return undefined;
  return { drafting: d, automation: a, human: h };
}

function deriveRoadmap(rj: ReportJson): RoadmapStep[] {
  const ar = rj.automation_readiness;
  if (!ar?.integration_roadmap) return [];
  const ir = ar.integration_roadmap;
  const p1Tier = ir.phase1_by_operation_tier;
  const legacyPhase1 = (ar.automate_now_count ?? 0) + (ar.ai_draft_count ?? 0);
  const phase1FromTiers = sumOpTier(p1Tier);
  const phase1 =
    ir.phase1_count ?? (phase1FromTiers > 0 ? phase1FromTiers : undefined) ?? legacyPhase1;

  const legacyDrafting = ar.ai_draft_count ?? 0;
  const legacyAutomation = ar.automate_now_count ?? 0;
  const phase1OpBreakdown =
    mapApiTier(p1Tier) ??
    (legacyDrafting + legacyAutomation > 0
      ? { drafting: legacyDrafting, automation: legacyAutomation, human: 0 }
      : phase1 > 0
        ? { drafting: phase1, automation: 0, human: 0 }
        : undefined);

  let phase1Note: string;
  if (p1Tier && phase1FromTiers > 0) {
    const d = p1Tier.ai_drafting ?? 0;
    const e = p1Tier.end_to_end_automation ?? 0;
    const h = p1Tier.human_required ?? 0;
    phase1Note = `${d} AI drafting + ${e} end-to-end + ${h} human-required`;
  } else if (legacyDrafting + legacyAutomation > 0) {
    phase1Note = `${legacyAutomation} automate-now + ${legacyDrafting} AI draft`;
  } else if (phase1 > 0) {
    phase1Note = `${phase1} emails at day 1`;
  } else {
    phase1Note = 'No automatable-without-integration volume in this sample';
  }

  const noIntegrationStep: RoadmapStep = {
    system: 'No integration',
    unlocked: phase1,
    cumulative: ir.phase1_share,
    note: phase1Note,
    categoriesUnlocked: [],
    isPhaseOne: true,
    operationTierBreakdown: phase1OpBreakdown,
  };

  const apiSteps: RoadmapStep[] = ir.steps.map((s) => ({
    system: s.system,
    unlocked: s.emails_unlocked,
    cumulative: s.cumulative_ai_share,
    note: s.categories_unlocked?.map(toLabel).join(', ') || '',
    categoriesUnlocked: s.categories_unlocked ?? [],
    isPhaseOne: false,
    operationTierBreakdown: mapApiTier(s.operation_tier_breakdown),
  }));

  return [noIntegrationStep, ...apiSteps];
}

function roadmapStepTierBreakdown(
  step: RoadmapStep,
  ar: AutomationReadiness | null,
): { drafting: number; automation: number; human: number } {
  if (step.operationTierBreakdown) return step.operationTierBreakdown;
  if (step.isPhaseOne) {
    const d = ar?.ai_draft_count ?? 0;
    const a = ar?.automate_now_count ?? 0;
    if (d + a > 0) return { drafting: d, automation: a, human: 0 };
    if (step.unlocked > 0) return { drafting: step.unlocked, automation: 0, human: 0 };
    return { drafting: 0, automation: 0, human: 0 };
  }
  const cats = step.categoriesUnlocked;
  if (!cats.length) return { drafting: 0, automation: 0, human: 0 };
  const rows = (ar?.categories ?? []).filter(
    (c) => c.category !== 'all' && cats.includes(c.category),
  );
  const sumTier = (tier: string) =>
    rows.filter((r) => r.tier === tier).reduce((acc, r) => acc + r.email_count, 0);
  return {
    drafting: sumTier('ai_drafting'),
    automation: sumTier('end_to_end_automation'),
    human: sumTier('human_required'),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const spotlightStyles: Record<string, string> = {
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  opportunity: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  coaching: 'border-violet-300 bg-violet-50 text-violet-800',
  insight: 'border-sky-300 bg-sky-50 text-sky-900',
};

function NarrativeText({ source, className }: { source: string; className?: string }) {
  if (!source?.trim()) return null;
  return (
    <p className={cn('whitespace-pre-line text-sm leading-relaxed text-foreground', className)}>
      {source.trim()}
    </p>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-base font-semibold tracking-tight text-grey-900">{title}</h3>
      {description ? (
        <p className="text-xs leading-relaxed text-grey-600">{description}</p>
      ) : null}
    </div>
  );
}

function TierMiniBar({
  drafting, automation, human,
  showDrafting, showAutomation, showHuman,
}: {
  drafting: number; automation: number; human: number;
  showDrafting: boolean; showAutomation: boolean; showHuman: boolean;
}) {
  const d = showDrafting ? drafting : 0;
  const a = showAutomation ? automation : 0;
  const h = showHuman ? human : 0;
  const total = d + a + h;
  if (total <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-grey-200 px-3 py-2 text-xs text-grey-500">
        No emails in the selected tier view for this step.
      </div>
    );
  }
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-lg border border-grey-200">
      {d > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-blue-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: d, flexShrink: 1, flexBasis: 0 }}
          title={`AI drafting: ${d}`}
        >
          {d}
        </div>
      )}
      {a > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-emerald-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: a, flexShrink: 1, flexBasis: 0 }}
          title={`Automation: ${a}`}
        >
          {a}
        </div>
      )}
      {h > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-amber-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: h, flexShrink: 1, flexBasis: 0 }}
          title={`Human: ${h}`}
        >
          {h}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function EmailReportSnapshotView({
  snapshot,
  className,
}: {
  snapshot: EmailReportSnapshot;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState('executive');
  const [roadmapFilterDrafting, setRoadmapFilterDrafting] = useState(true);
  const [roadmapFilterAutomation, setRoadmapFilterAutomation] = useState(true);
  const [roadmapFilterHuman, setRoadmapFilterHuman] = useState(true);

  const rj = snapshot.report_json;
  const exec = rj.executive_summary;
  const perf = rj.service_performance;
  const rev = rj.revenue_leakage;
  const auto = rj.automation_readiness ?? null;
  const brandVoice = rj.brand_voice_analysis ?? null;
  const bench = rj.benchmark_scores ?? null;
  const profile = brandVoice?.communication_profile ?? null;
  const workload = rj.workload_profile ?? null;
  const revenueFindings: RevenueFinding[] =
    rev && isRevenueFindings(rev.findings) ? rev.findings : [];

  const integrationRoadmap = deriveRoadmap(rj);

  const roadmapTierFilter = useMemo(() => {
    const none = !roadmapFilterDrafting && !roadmapFilterAutomation && !roadmapFilterHuman;
    if (none) return { drafting: true, automation: true, human: true };
    return { drafting: roadmapFilterDrafting, automation: roadmapFilterAutomation, human: roadmapFilterHuman };
  }, [roadmapFilterDrafting, roadmapFilterAutomation, roadmapFilterHuman]);

  const integrationRoadmapFiltered = useMemo(() => {
    const f = roadmapTierFilter;
    if (f.drafting && f.automation && f.human) return integrationRoadmap;
    return integrationRoadmap.filter((step) => {
      const b = roadmapStepTierBreakdown(step, auto);
      return (f.drafting && b.drafting > 0) || (f.automation && b.automation > 0) || (f.human && b.human > 0);
    });
  }, [integrationRoadmap, auto, roadmapTierFilter]);

  const primaryMailbox = workload?.volume_by_mailbox?.[0];

  // KPI tiles
  const rawStats = rj.raw_stats;
  const singleTouchZero = (perf?.thread_stats?.single_touch_rate ?? 0) === 0;
  const replacementKpi =
    rawStats?.unread_filtered_count != null
      ? { label: 'Unread filtered', value: String(rawStats.unread_filtered_count), sub: 'Excluded from sample', icon: <Filter className="h-5 w-5" /> }
      : rawStats?.actual_days_covered != null
        ? { label: 'Sample span', value: `${rawStats.actual_days_covered} days`, sub: rawStats.date_range_start && rawStats.date_range_end ? `${rawStats.date_range_start} – ${rawStats.date_range_end}` : undefined, icon: <Calendar className="h-5 w-5" /> }
        : null;

  const kpis = [
    { label: 'Guest emails', value: String(exec.guest_email_volume), sub: exec.mailboxes_analyzed > 1 ? `${exec.mailboxes_analyzed} mailboxes` : exec.noise_filtered > 0 ? `${exec.noise_filtered} noise filtered` : undefined, icon: <Inbox className="h-5 w-5" /> },
    { label: 'Noise filtered', value: String(exec.noise_filtered), sub: rawStats?.noise_rate ? `${(rawStats.noise_rate * 100).toFixed(1)}% of inbox` : undefined, icon: <Mail className="h-5 w-5" /> },
    ...(replacementKpi ? [replacementKpi] : []),
    { label: 'Median → p90', value: `${formatHours(perf?.median_response_minutes ?? 0)} → ${formatHours(perf?.p90_response_minutes ?? 0)}`, icon: <Clock3 className="h-5 w-5" /> },
    { label: 'After-hours', value: `${((workload?.after_hours_pct ?? 0) <= 1 ? (workload?.after_hours_pct ?? 0) * 100 : workload?.after_hours_pct ?? 0).toFixed(1)}%`, sub: `Peak: ${workload?.peak_day ?? '—'} at ${formatPeakHour(workload?.peak_hour)}`, icon: <Calendar className="h-5 w-5" /> },
    { label: singleTouchZero ? 'Single-touch threads' : 'Single-touch rate', value: singleTouchZero ? '0%' : `${((perf?.thread_stats?.single_touch_rate ?? 0) * 100).toFixed(1)}%`, sub: singleTouchZero ? 'No threads closed with one reply' : 'threads resolved in one reply', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  // Automation tier totals
  const automationAggregateTiers = (auto?.categories ?? []).filter((c) => c.category === 'all');
  const tierDrafting = automationAggregateTiers.find((c) => c.tier === 'ai_drafting');
  const tierE2e = automationAggregateTiers.find((c) => c.tier === 'end_to_end_automation');
  const tierHuman = automationAggregateTiers.find((c) => c.tier === 'human_required');
  const automationDraftingEmails = tierDrafting?.email_count ?? auto?.ai_drafting_count ?? auto?.ai_draft_count ?? 0;
  const automationE2eEmails = tierE2e?.email_count ?? auto?.end_to_end_count ?? 0;
  const automationHumanEmails = tierHuman?.email_count ?? auto?.human_required_count ?? 0;
  const automationTierTotal = Math.max(1, automationDraftingEmails + automationE2eEmails + automationHumanEmails);
  const automationDraftingPct = tierDrafting?.percentage ?? (automationDraftingEmails / automationTierTotal) * 100;
  const automationE2ePct = tierE2e?.percentage ?? (automationE2eEmails / automationTierTotal) * 100;
  const automationHumanPct = tierHuman?.percentage ?? (automationHumanEmails / automationTierTotal) * 100;

  // Chart data
  const volumeByCategory = (workload?.volume_by_category ?? []).slice(0, 10).map((v) => ({
    category: toLabel(v.value),
    count: v.count,
  }));

  const guestVol = exec.guest_email_volume || 1;
  const responseTimeByCategory = (perf?.response_time_by_category ?? [])
    .filter((r) => r.median_minutes != null || r.p90_minutes != null)
    .map((r) => ({
      category: toLabel(r.category),
      median: r.median_minutes ?? 0,
      p90: r.p90_minutes ?? 0,
      count: r.email_count,
      percentage: r.email_count > 0 ? +((r.email_count / guestVol) * 100).toFixed(1) : 0,
    }));

  const responseTimeByWeekdayChart = useMemo(() => {
    const rows = perf?.response_time_by_weekday;
    if (!rows?.length) return [];
    const order = new Map<string, number>(EMAIL_REPORT_WEEKDAY_ORDER.map((d, i) => [d, i]));
    return [...rows]
      .sort((a, b) => (order.get(a.day_of_week) ?? 99) - (order.get(b.day_of_week) ?? 99))
      .map((r) => ({ day: r.day_of_week, median: r.median_resp_min ?? 0, p90: r.p90_resp_min ?? 0, inbound: r.total_inbound }));
  }, [perf?.response_time_by_weekday]);

  const responseTimeByHourChart = useMemo(() => {
    const rows = perf?.response_time_by_hour;
    if (!rows?.length) return [];
    const byHour = new Map(rows.map((r) => [r.hour_of_day, r]));
    return Array.from({ length: 24 }, (_, h) => {
      const r = byHour.get(h);
      return { hourLabel: `${h}:00`, median: r?.median_resp_min ?? 0, p90: r?.p90_resp_min ?? 0, inbound: r?.total_inbound ?? 0 };
    });
  }, [perf?.response_time_by_hour]);

  const dayOrder = [...EMAIL_REPORT_WEEKDAY_ORDER];
  const weekdayCountMap = new Map((workload?.volume_by_weekday ?? []).map((v) => [v.value, v.count]));
  const volumeByDay = dayOrder.map((day) => ({ day, count: weekdayCountMap.get(day) ?? 0 }));

  const hourCountMap = new Map<number, number>();
  for (const v of workload?.volume_by_hour ?? []) {
    const h = parseInt(String(v.value).split(':')[0] ?? '0', 10);
    if (!Number.isNaN(h)) hourCountMap.set(h, v.count);
  }
  const volumeByHourFull = Array.from({ length: 24 }, (_, h) => ({
    hourLabel: `${h}:00`,
    count: hourCountMap.get(h) ?? 0,
  }));

  const responseHeatmapModel = useMemo(() => {
    const rows = rj.hourly_response_data;
    if (!rows?.length) return null;
    type Agg = { inbound: number; medNum: number; medDen: number; avgNum: number; avgDen: number };
    const map = new Map<string, Agg>();
    for (const row of rows) {
      const key = `${row.day_of_week} ${row.hour_of_day}`;
      let a = map.get(key);
      if (!a) { a = { inbound: 0, medNum: 0, medDen: 0, avgNum: 0, avgDen: 0 }; map.set(key, a); }
      a.inbound += row.inbound_cnt;
      if (row.median_resp_min != null && row.inbound_cnt > 0) { a.medNum += row.median_resp_min * row.inbound_cnt; a.medDen += row.inbound_cnt; }
      if (row.avg_resp_min != null && row.inbound_cnt > 0) { a.avgNum += row.avg_resp_min * row.inbound_cnt; a.avgDen += row.inbound_cnt; }
    }
    const medians: number[] = [];
    const grid = EMAIL_REPORT_WEEKDAY_ORDER.map((day) =>
      Array.from({ length: 24 }, (_, hour) => {
        const a = map.get(`${day} ${hour}`);
        const inbound = a?.inbound ?? 0;
        const responseMinutes = a && a.medDen > 0 ? a.medNum / a.medDen : null;
        const avgMinutes = a && a.avgDen > 0 ? a.avgNum / a.avgDen : null;
        if (responseMinutes != null) medians.push(responseMinutes);
        return { day, hour, inbound, responseMinutes, avgMinutes };
      }),
    );
    medians.sort((x, y) => x - y);
    const colorScaleMax = medians.length > 0 ? medians[Math.min(medians.length - 1, Math.floor(medians.length * 0.95))]! : 1;
    return { grid, colorScaleMax };
  }, [rj.hourly_response_data]);

  const brandVoiceChartData = profile
    ? [
        { dimension: 'Warmth', score: profile.warmth?.score ?? 0, target: profile.warmth?.target ?? 3 },
        { dimension: 'Personalisation', score: profile.personalisation?.score ?? 0, target: profile.personalisation?.target ?? 3 },
        { dimension: 'Structure', score: profile.structure?.score ?? 0, target: profile.structure?.target ?? 3 },
        { dimension: 'Completeness', score: profile.completeness?.score ?? 0, target: profile.completeness?.target ?? 3 },
        { dimension: 'Formality', score: profile.formality?.score ?? 0, target: profile.formality?.target ?? 3 },
      ]
    : [];

  return (
    <div className={cn('w-full text-left', className)}>
      {/* Hero */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-grey-100 bg-card shadow-sm">
        <div className="grid gap-6 p-6 md:grid-cols-[1fr_1.2fr] md:gap-8">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="rounded-full border-grey-200 px-3 py-1">
                Consultant view
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                {snapshot.period_days}-day inbox assessment
              </Badge>
              {exec.mailboxes_analyzed > 1 && (
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {exec.mailboxes_analyzed} mailboxes
                </Badge>
              )}
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Inbox Operations Assessment</h2>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {snapshot.hotel_name ?? primaryMailbox?.value ?? exec.recommended_first_mailbox ?? '—'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <Mail className="h-3.5 w-3.5" />
                {primaryMailbox?.value ?? exec.recommended_first_mailbox}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5">
                <Layers3 className="h-3.5 w-3.5" /> {snapshot.period_days} days
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {kpis.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3">
                <div className="rounded-lg border bg-background p-2 text-muted-foreground shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="mt-0.5 text-sm font-semibold">{item.value}</p>
                  {item.sub && <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
        {exec.summary_text && (
          <div className="border-t border-grey-100 px-6 py-5">
            <NarrativeText source={exec.summary_text} />
          </div>
        )}
      </div>

      {/* Flagship KPIs */}
      {(() => {
        const hk = rj.headline_kpi;
        const rcr = hk?.revenue_capture_rate ?? rev?.revenue_capture_rate ?? null;
        if (!hk && rcr === null) return null;
        const rcrPct = rcr !== null && rcr !== undefined ? `${Math.round(rcr * 1000) / 10}%` : '—';
        const atRisk = hk?.revenue_at_risk_display ?? rev?.estimated_revenue_at_risk ?? '—';
        const speed = hk?.speed_to_lead_median_min ?? null;
        const speedStr = speed === null || speed === undefined ? '—' : speed < 60 ? `${Math.round(speed)} min` : `${(speed / 60).toFixed(1)} h`;
        const healthStr = hk?.inbox_health_score !== null && hk?.inbox_health_score !== undefined ? `${hk.inbox_health_score}/100` : '—';
        const acr = hk?.answer_coverage_rate ?? rev?.answer_coverage_rate ?? null;
        const acrPct = acr !== null && acr !== undefined ? `${Math.round(acr * 1000) / 10}%` : '—';
        const lostUnanswered = hk?.revenue_lost_unanswered_display ?? rev?.revenue_lost_unanswered ?? atRisk;
        const atRiskSlow = hk?.revenue_at_risk_slow_display ?? rev?.revenue_at_risk_slow ?? '—';
        const sla = hk?.sla_minutes ?? 60;
        const tiles = [
          { label: 'Inbox Health Score', value: healthStr, sub: 'Demand answered at all' },
          { label: 'Revenue Capture Rate', value: rcrPct, sub: `Answered within ${sla} min` },
          { label: 'Answer coverage', value: acrPct, sub: 'Revenue intent with any reply' },
          { label: 'Money lost (unanswered)', value: lostUnanswered, sub: `${hk?.unanswered_revenue_count ?? '?'} revenue emails never answered` },
          { label: 'Money at risk (slow)', value: atRiskSlow, sub: 'Answered, but slower than SLA' },
          { label: 'Speed-to-lead (median)', value: speedStr, sub: 'Median reply on revenue intent' },
        ];
        return (
          <div className="mb-6 overflow-hidden rounded-2xl border border-emerald-200/60 bg-emerald-50/30 p-6 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-full bg-emerald-700 px-3 py-1 text-white">Flagship metrics</Badge>
              <span className="text-sm text-muted-foreground">
                Inbox Health vs Revenue Capture — email-derived, estimated.
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {tiles.map((t) => (
                <div key={t.label} className="rounded-xl border bg-background p-4">
                  <p className="text-xs text-muted-foreground">{t.label}</p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight">{t.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.sub}</p>
                </div>
              ))}
            </div>
            {hk?.inbox_health_verdict && <p className="mt-4 text-sm font-medium">{hk.inbox_health_verdict}</p>}
            {hk?.verdict && <p className="mt-1 text-sm text-muted-foreground">{hk.verdict}</p>}
          </div>
        );
      })()}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="flex w-full flex-wrap gap-1.5 h-auto rounded-xl border bg-muted/60 p-1.5">
          {(['executive', 'revenue', 'categories', 'automation', 'quality'] as const).map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tab === 'executive' ? 'Executive' : tab === 'revenue' ? 'Lost Revenue' : tab === 'categories' ? 'Categories' : tab === 'automation' ? 'Automation' : 'Quality'}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Executive */}
        <TabsContent value="executive" className="mt-6 space-y-6">
          {(rj.spotlight_comments ?? []).length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(rj.spotlight_comments ?? []).map((comment, si) => (
                <Card key={`${comment.headline}-${si}`} className="rounded-xl border border-grey-100 bg-white shadow-sm">
                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', spotlightStyles[comment.type] ?? 'border-slate-300 bg-slate-100 text-slate-800')}>
                        {comment.type}
                      </span>
                      <ChevronRight className="h-4 w-4 text-grey-400" />
                    </div>
                    <p className="text-sm font-semibold text-grey-900">{comment.headline}</p>
                    <p className="mt-1 text-xs leading-relaxed text-grey-600">{comment.detail}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Volume by day" description="All weekdays — zero when no messages on that day." />
              </CardHeader>
              <CardContent className="h-80 px-4 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByDay} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={50} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Volume by hour" description="Full 24-hour clock — zero for hours with no messages." />
              </CardHeader>
              <CardContent className="h-80 px-4 pb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={volumeByHourFull} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hourLabel" tick={{ fontSize: 9 }} angle={-65} textAnchor="end" height={50} interval={0} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Response time by weekday" description="Median and p90 reply time (minutes) by day." />
              </CardHeader>
              <CardContent className="h-80 px-4 pb-4">
                {responseTimeByWeekdayChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeByWeekdayChart} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={50} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatHours(v as number)} />
                      <Tooltip formatter={(value: number, name: string) => [formatHours(value), name]} />
                      <Legend />
                      <Bar dataKey="median" name="Median" fill="hsl(221 83% 53%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="p90" name="p90" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Not available for this report</div>
                )}
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Response time by hour" description="Median and p90 reply time across each hour (0–23)." />
              </CardHeader>
              <CardContent className="h-80 px-4 pb-4">
                {responseTimeByHourChart.some((r) => r.inbound > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responseTimeByHourChart} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="hourLabel" tick={{ fontSize: 9 }} angle={-65} textAnchor="end" height={50} interval={0} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatHours(v as number)} />
                      <Tooltip formatter={(value: number, name: string) => [formatHours(value), name]} />
                      <Legend />
                      <Bar dataKey="median" name="Median" fill="hsl(221 83% 53%)" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="p90" name="p90" fill="hsl(142 71% 45%)" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Not available for this report</div>
                )}
              </CardContent>
            </Card>
          </div>

          {responseHeatmapModel && (
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Reply-time load map" description="Each cell is weekday × hour. Color = inbound-weighted median reply time. Hover for details." />
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-5">
                <div className="overflow-x-auto rounded-xl border border-grey-100 bg-muted/20 p-3">
                  <div className="min-w-[640px]" style={{ display: 'grid', gridTemplateColumns: '3.25rem repeat(24, minmax(0, 1fr))', gap: '3px' }}>
                    <div />
                    {Array.from({ length: 24 }, (_, h) => (
                      <div key={h} className="text-center text-[10px] font-medium text-muted-foreground">{h}</div>
                    ))}
                    {responseHeatmapModel.grid.map((row) => (
                      <Fragment key={row[0]?.day ?? ''}>
                        <div className="flex items-center pr-1 text-[11px] font-medium text-grey-700">
                          {(row[0]?.day ?? '').slice(0, 3)}
                        </div>
                        {row.map((cell) => (
                          <div
                            key={`${cell.day}-${cell.hour}`}
                            className="aspect-square min-h-[10px] rounded-sm border border-background/60"
                            style={{ backgroundColor: heatmapColor(cell.responseMinutes, cell.inbound, responseHeatmapModel.colorScaleMax) }}
                            title={formatHeatmapTitle(cell)}
                          />
                        ))}
                      </Fragment>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-grey-600">
                  <span className="font-medium text-grey-800">Legend:</span> Greener = faster median replies; redder = slower. Empty slots had no inbound mail. Amber = inbound but no median reply time.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lost Revenue */}
        <TabsContent value="revenue" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-grey-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-grey-900">Revenue risk</CardTitle>
              {rev?.narrative ? (
                <NarrativeText source={rev.narrative} className="mt-3" />
              ) : (
                <p className="mt-3 text-sm text-foreground">
                  {(rev?.total_opportunities_found ?? 0).toLocaleString()} spend-intent signals in{' '}
                  {exec.guest_email_volume.toLocaleString()} guest emails
                  {typeof rev?.slow_response_opportunities === 'number' ? `; ${rev.slow_response_opportunities.toLocaleString()} with slow response.` : '.'}
                </p>
              )}
              <p className="mt-2 text-xs text-grey-600">Directional estimates from inbox signals — not audited financials.</p>
              {(rev?.revenue_lost_unanswered ?? rev?.estimated_revenue_at_risk) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-sm font-medium text-red-800">Money lost — unanswered (est.)</p>
                    <p className="mt-1 text-xl font-bold text-red-900">{rev?.revenue_lost_unanswered ?? rev?.estimated_revenue_at_risk}</p>
                    <p className="mt-1 text-xs text-red-700/80">Revenue intent that never got a reply.</p>
                  </div>
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-sm font-medium text-amber-800">Money at risk — slow (est.)</p>
                    <p className="mt-1 text-xl font-bold text-amber-900">{rev?.revenue_at_risk_slow ?? '—'}</p>
                    <p className="mt-1 text-xs text-amber-700/80">Answered, but slower than SLA.</p>
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Revenue opportunities found', value: String(rev?.total_opportunities_found ?? '—') },
                  rev?.unanswered_opportunities != null ? { label: 'Unanswered with spend intent', value: String(rev.unanswered_opportunities) } : null,
                  { label: 'Slow-response opportunities', value: String(rev?.slow_response_opportunities ?? '—') },
                  { label: 'Revenue capture rate', value: (() => { const r = rj.headline_kpi?.revenue_capture_rate ?? rev?.revenue_capture_rate ?? null; return r != null ? `${Math.round(r * 1000) / 10}%` : '—'; })() },
                ].filter(Boolean).map((item) => (
                  <div key={item!.label} className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm text-muted-foreground">{item!.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{item!.value}</p>
                  </div>
                ))}
              </div>

              {(rev?.by_opportunity_type?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-grey-900">By opportunity type</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {(rev.by_opportunity_type ?? []).map((o) => (
                      <div key={o.opportunity_type} className="rounded-xl border bg-muted/30 p-3">
                        <p className="text-sm font-medium">{toLabel(o.opportunity_type)}</p>
                        <p className="mt-1 text-xl font-semibold">{o.count}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {o.unanswered_count != null ? `${o.unanswered_count} unanswered · ` : ''}{o.slow_response_count} slow
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(rev?.by_value_bucket?.length ?? 0) > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-grey-900">By value bucket</p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(rev.by_value_bucket ?? []).map((b) => (
                      <div key={b.value_bucket} className="rounded-xl border border-grey-100 bg-surface/50 p-3">
                        <p className="text-sm font-medium text-grey-700">{toLabel(b.value_bucket)}</p>
                        <p className="mt-0.5 text-xs text-grey-500">{b.estimated_range}</p>
                        <p className="mt-2 text-2xl font-semibold text-grey-900">{b.count.toLocaleString()}</p>
                        <p className="mt-1 text-xs text-grey-600">
                          {b.unanswered_count != null ? `${b.unanswered_count} unanswered · ` : ''}{b.replied_count} replied
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {revenueFindings.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold text-grey-900">Findings</p>
                  <div className="overflow-x-auto rounded-xl border border-grey-100">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-grey-100 hover:bg-transparent">
                          <TableHead>What</TableHead>
                          <TableHead className="text-right">Emails</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Outcome</TableHead>
                          <TableHead>Example subject</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {revenueFindings.map((f, fi) => (
                          <TableRow key={`${f.finding}-${fi}`} className="border-grey-100">
                            <TableCell className="max-w-[220px] text-sm text-grey-800 align-top">{f.finding}</TableCell>
                            <TableCell className="text-right tabular-nums">{f.email_count}</TableCell>
                            <TableCell className="text-sm">{f.opportunity_type ? toLabel(f.opportunity_type) : '—'}</TableCell>
                            <TableCell>
                              <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', f.what_happened === 'missed' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-950')}>
                                {f.what_happened}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-grey-600" title={f.example_subject ?? undefined}>
                              {f.example_subject || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories */}
        <TabsContent value="categories" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-grey-100 shadow-sm">
            <CardHeader className="pb-2">
              <SectionHeader title="Category mix" description="Where demand clusters in the guest inbox." />
            </CardHeader>
            <CardContent className="h-[480px] px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByCategory} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" width={140} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-grey-100 shadow-sm">
            <CardHeader className="pb-2">
              <SectionHeader title="Response time by category" description="Median vs p90 — each on its own axis." />
            </CardHeader>
            <CardContent className="h-[480px] px-4 pb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseTimeByCategory} margin={{ top: 8, right: 48, left: 48, bottom: 72 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={72} interval={0} />
                  <YAxis yAxisId="median" orientation="left" tickFormatter={(v) => formatHours(v)} width={48} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="p90" orientation="right" tickFormatter={(v) => formatHours(v)} width={48} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatHours(v)} />
                  <Legend verticalAlign="bottom" />
                  <Line yAxisId="median" type="monotone" dataKey="median" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: '#2563eb' }} name="Median" />
                  <Line yAxisId="p90" type="monotone" dataKey="p90" stroke="#059669" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 4, fill: '#059669' }} name="p90" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Automation */}
        <TabsContent value="automation" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-grey-100 shadow-sm">
            <CardHeader className="pb-2">
              <SectionHeader title="Guest inbox by automation tier" description="Three buckets: AI drafts with human review, automation once systems are connected, and cases that stay with staff." />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border-l-4 border-l-blue-600 border border-grey-100 bg-blue-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">AI drafting</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-blue-950">{automationDraftingEmails.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-blue-900/80">emails · {automationDraftingPct.toFixed(1)}% of guest volume</p>
                  <p className="mt-2 text-xs leading-relaxed text-blue-950/90">Suggested replies, lookups — human sends.</p>
                </div>
                <div className="rounded-xl border-l-4 border-l-emerald-600 border border-grey-100 bg-emerald-50/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">Automation</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">{automationE2eEmails.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-emerald-900/80">emails · {automationE2ePct.toFixed(1)}% of guest volume</p>
                  <p className="mt-2 text-xs leading-relaxed text-emerald-950/90">Needs integrations to complete actions in your systems.</p>
                </div>
                <div className="rounded-xl border-l-4 border-l-amber-600 border border-grey-100 bg-amber-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">Human required</p>
                  <p className="mt-2 text-2xl font-bold tabular-nums text-amber-950">{automationHumanEmails.toLocaleString()}</p>
                  <p className="mt-1 text-xs text-amber-900/85">emails · {automationHumanPct.toFixed(1)}% of guest volume</p>
                  <p className="mt-2 text-xs leading-relaxed text-amber-950/90">Judgment, exceptions, or sensitive threads.</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-grey-700">Share of assessed guest emails (width ∝ email count)</p>
                <div className="flex h-14 w-full overflow-hidden rounded-xl border border-grey-200">
                  {automationDraftingEmails > 0 && (
                    <div className="flex min-w-[3rem] flex-col justify-center bg-blue-600 px-2 text-center text-xs font-semibold text-white" style={{ flexGrow: automationDraftingEmails, flexShrink: 1, flexBasis: 0 }}>
                      <span>Draft</span><span>{automationDraftingPct.toFixed(0)}%</span>
                    </div>
                  )}
                  {automationE2eEmails > 0 && (
                    <div className="flex min-w-[3rem] flex-col justify-center bg-emerald-600 px-2 text-center text-xs font-semibold text-white" style={{ flexGrow: automationE2eEmails, flexShrink: 1, flexBasis: 0 }}>
                      <span>Auto</span><span>{automationE2ePct.toFixed(0)}%</span>
                    </div>
                  )}
                  {automationHumanEmails > 0 && (
                    <div className="flex min-w-[3rem] flex-col justify-center bg-amber-600 px-2 text-center text-xs font-semibold text-white" style={{ flexGrow: automationHumanEmails, flexShrink: 1, flexBasis: 0 }}>
                      <span>Human</span><span>{automationHumanPct.toFixed(0)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {rj.roi_model?.narrative && (
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="ROI estimate" description="Directional time impact from observed volume — not a staffing guarantee." />
              </CardHeader>
              <CardContent>
                <NarrativeText source={rj.roi_model.narrative} />
              </CardContent>
            </Card>
          )}

          {integrationRoadmap.length > 0 && (
            <Card className="rounded-2xl border-grey-100 shadow-sm">
              <CardHeader className="pb-2">
                <SectionHeader title="Integration roadmap" description="Filter which tiers appear in each step." />
              </CardHeader>
              <CardContent className="space-y-5">
                {auto?.narrative && <NarrativeText source={auto.narrative} />}
                <div className="flex flex-col gap-2 rounded-xl border border-grey-100 bg-muted/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
                  <span className="text-sm font-medium text-grey-800">Tiers in steps</span>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    {[
                      { id: 'drafting', label: 'AI drafting', checked: roadmapFilterDrafting, set: setRoadmapFilterDrafting, color: 'text-blue-900' },
                      { id: 'automation', label: 'Automation', checked: roadmapFilterAutomation, set: setRoadmapFilterAutomation, color: 'text-emerald-900' },
                      { id: 'human', label: 'Human required', checked: roadmapFilterHuman, set: setRoadmapFilterHuman, color: 'text-amber-950' },
                    ].map(({ id, label, checked, set, color }) => (
                      <div key={id} className="flex items-center gap-2">
                        <Checkbox id={`roadmap-tier-${id}`} checked={checked} onCheckedChange={(v) => set(v === true)} />
                        <Label htmlFor={`roadmap-tier-${id}`} className={cn('cursor-pointer text-sm font-normal', color)}>{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                {integrationRoadmapFiltered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No roadmap steps match the selected tiers for this report.</p>
                ) : (
                  integrationRoadmapFiltered.map((step) => {
                    const stepIdx = integrationRoadmap.indexOf(step);
                    const tierB = roadmapStepTierBreakdown(step, auto);
                    const f = roadmapTierFilter;
                    return (
                      <div key={`${stepIdx}-${step.system}`} className="rounded-xl border border-grey-100 bg-background p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Step {stepIdx + 1}</Badge>
                              <p className="text-sm font-medium">{toLabel(step.system)}</p>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">{step.note}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xl font-semibold">+{step.unlocked}</p>
                            <p className="text-xs text-muted-foreground">emails unlocked</p>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-grey-600">By tier</p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                            {f.drafting && <span className="text-blue-900"><span className="font-medium">AI drafting</span> {tierB.drafting.toLocaleString()}</span>}
                            {f.automation && <span className="text-emerald-900"><span className="font-medium">Automation</span> {tierB.automation.toLocaleString()}</span>}
                            {f.human && <span className="text-amber-950"><span className="font-medium">Human</span> {tierB.human.toLocaleString()}</span>}
                          </div>
                          <TierMiniBar drafting={tierB.drafting} automation={tierB.automation} human={tierB.human} showDrafting={f.drafting} showAutomation={f.automation} showHuman={f.human} />
                        </div>
                        <div className="mt-3">
                          <div className="mb-1 flex justify-end text-xs font-medium">{toPercent(step.cumulative, 1)}</div>
                          <Progress value={step.cumulative * 100} className="h-2" />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Quality */}
        <TabsContent value="quality" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-grey-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-grey-900">Brand voice</CardTitle>
              <p className="text-xs text-grey-600">How replies scored across key dimensions (sample of assessed messages).</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {brandVoice?.narrative && <NarrativeText source={brandVoice.narrative} />}

              {(profile || bench?.brand_voice_avg != null) ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  <div className="rounded-xl border border-grey-100 bg-surface/50 p-3">
                    <p className="text-xs text-grey-600">Brand voice avg</p>
                    <p className="mt-0.5 text-lg font-semibold text-grey-900">
                      {bench?.brand_voice_avg != null ? `${bench.brand_voice_avg.toFixed(2)} / 4` : '—'}
                    </p>
                  </div>
                  {profile ? (
                    <>
                      {([['Warmth', 'warmth'], ['Personalisation', 'personalisation'], ['Structure', 'structure'], ['Completeness', 'completeness'], ['Formality', 'formality']] as const).map(([label, key]) => (
                        <div key={key} className="rounded-xl border border-grey-100 bg-surface/50 p-3">
                          <p className="text-xs text-grey-600">{label}</p>
                          <p className="mt-0.5 text-lg font-semibold text-grey-900">{(profile[key]?.score ?? 0).toFixed(2)} / 4</p>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="col-span-full rounded-xl border border-dashed border-grey-200 bg-surface/40 p-4 text-xs text-grey-600 sm:col-span-2 lg:col-span-5">
                      Per-dimension brand voice scores were not included in this export.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-grey-600">Brand voice metrics were not included in this report.</p>
              )}

              {brandVoiceChartData.length > 0 && (
                <div className="mx-auto h-96 max-w-2xl">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={brandVoiceChartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fontSize: 10 }} />
                      <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2} />
                      <Tooltip formatter={(value: number) => [`${value.toFixed(2)} / 4`, 'Score']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function isValidReportJson(data: unknown): data is ReportJson {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return typeof d.executive_summary === 'object' && d.executive_summary !== null;
}
