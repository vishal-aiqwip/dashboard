import type {
  EACategoryAnalysisResponse,
  EAEmailRow,
  EAHotelOverviewResponse,
  EAJudgeBreakdownResponse,
  EAKpisResponse,
  EATimeseriesResponse,
} from '@/services/emailPerformance/emailPerformance';

import type {
  CategoryKey,
  CategoryRow,
  EditClass,
  EmailPerformanceData,
  EmailRow,
  HotelPerfRow,
  HotelStats,
  MetricValue,
  SecondaryMetric,
} from './mock';

// ── KPIs ──────────────────────────────────────────────────────────────────────

function metric(value: number, deltaPct: number | null | undefined, hint: MetricValue['hint'], note: string): MetricValue {
  // Convert null → undefined so component's `!== undefined` guard works correctly
  return { value: value ?? 0, deltaPct: deltaPct ?? undefined, hint, note };
}

function secondary(value: number, previous: number): SecondaryMetric {
  return { value: value ?? 0, previous: previous ?? 0 };
}

export function transformKpis(raw: EAKpisResponse): EmailPerformanceData['kpis'] {
  const current = raw?.current;
  const previous = raw?.previous;
  const deltas = raw?.deltas;

  const curDraftTokens = current?.avg_draft_tokens ?? 0;
  const curFinalTokens = current?.avg_final_tokens ?? 0;
  const prevDraftTokens = previous?.avg_draft_tokens ?? 0;
  const prevFinalTokens = previous?.avg_final_tokens ?? 0;

  return {
    draftsCreated: metric(current?.total_drafts_created ?? 0, deltas?.total_drafts_created, 'neutral', 'all AI drafts generated'),
    draftsSent: metric(current?.total_emails ?? 0, deltas?.total_emails, 'higher-is-better', 'vs. last period'),
    sendRate: metric(current?.send_rate_pct ?? 0, deltas?.send_rate_pct, 'ratio', 'sent ÷ created'),
    acceptanceRate: metric(current?.acceptance_rate_pct ?? 0, deltas?.acceptance_rate_pct, 'higher-is-better', 'vs. last period'),
    avgEditDistance: metric(current?.avg_edit_distance ?? 0, deltas?.avg_edit_distance, 'lower-is-better', 'lower is better'),
    avgSemanticSimilarity: metric(current?.avg_semantic_similarity ?? 0, deltas?.avg_semantic_similarity, 'higher-is-better', 'higher is better'),
    uniqueGuestSenders: metric(current?.unique_senders ?? 0, deltas?.unique_senders, 'higher-is-better', 'vs. last period'),
    avgDraftTokens: secondary(curDraftTokens, prevDraftTokens),
    avgFinalTokens: secondary(curFinalTokens, prevFinalTokens),
    draftFinalRatio: secondary(
      curDraftTokens > 0 ? curFinalTokens / curDraftTokens : 0,
      prevDraftTokens > 0 ? prevFinalTokens / prevDraftTokens : 0,
    ),
  };
}

// ── Timeseries ─────────────────────────────────────────────────────────────────

export function transformTimeseries(raw: EATimeseriesResponse): Pick<
  EmailPerformanceData,
  | 'editDistanceOverTime'
  | 'acceptanceRateOverTime'
  | 'editClassOverTime'
  | 'overallSplit'
  | 'editDistanceHistogram'
> {
  // BQ columns: date, avg_edit_distance, median_edit_distance, email_count, acceptance_rate_pct
  const editDistRows = raw?.charts?.edit_distance_over_time ?? [];
  // BQ columns: date, edit_class, count  (one row per date+class — unpivoted)
  const editClassRows = raw?.charts?.edit_class_over_time ?? [];
  const editDistanceHistogram = raw?.charts?.edit_distance_histogram ?? [];

  // Rename backend fields to the shape EditDistanceChart expects: {date, avg, median}
  const editDistanceOverTime = editDistRows.map((row) => ({
    date: row.date,
    avg: row.avg_edit_distance ?? 0,
    median: row.median_edit_distance ?? 0,
  }));

  // AcceptanceRateChart expects {date, rate, sent} — both fields live in the edit-distance rows
  const acceptanceRateOverTime = editDistRows.map((row) => ({
    date: row.date,
    rate: row.acceptance_rate_pct ?? 0,
    sent: row.email_count ?? 0,
  }));

  // Pivot unpivoted edit_class rows into {date, accepted, light, medium, heavy, rewritten}
  // for EditClassBar which expects stacked bars per date
  const zero = () => ({ accepted: 0, light: 0, medium: 0, heavy: 0, rewritten: 0 });
  const dateMap = new Map<string, ReturnType<typeof zero>>();

  // Seed every date from edit_dist rows so days with 0 emails still appear
  for (const row of editDistRows) {
    if (!dateMap.has(row.date)) dateMap.set(row.date, zero());
  }
  // Fill counts from the unpivoted rows
  for (const row of editClassRows) {
    if (!dateMap.has(row.date)) dateMap.set(row.date, zero());
    const entry = dateMap.get(row.date)!;
    const cls = row.edit_class as keyof ReturnType<typeof zero>;
    if (cls in entry) entry[cls] = row.count ?? 0;
  }

  const editClassOverTime = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // OverallSplitPie: sum across all dates from the unpivoted rows
  const classTotals = { accepted: 0, light: 0, medium: 0, heavy: 0, rewritten: 0 };
  for (const row of editClassRows) {
    const cls = row.edit_class as keyof typeof classTotals;
    if (cls in classTotals) classTotals[cls] += row.count ?? 0;
  }
  const overallSplit = (Object.entries(classTotals) as [EditClass, number][]).map(
    ([cls, count]) => ({ class: cls, count }),
  );

  return { editDistanceOverTime, acceptanceRateOverTime, editClassOverTime, overallSplit, editDistanceHistogram };
}

// ── Category Analysis ──────────────────────────────────────────────────────────

function categoryLabel(key: string): string {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('_');
}

export function transformCategoryAnalysis(raw: EACategoryAnalysisResponse): Pick<
  EmailPerformanceData,
  'categorySummary' | 'editDistanceByCategory' | 'editDistanceHeatmap'
> {
  const categoryAggregates = raw?.charts?.category_aggregates ?? [];
  const editDistanceByCategoryOverTime = raw?.charts?.edit_distance_by_category_over_time ?? [];
  const categoryWeekHeatmap = raw?.charts?.category_week_heatmap ?? [];

  const categorySummary: CategoryRow[] = categoryAggregates.map((agg) => ({
    key: agg.category as CategoryKey,
    label: categoryLabel(agg.category),
    emails: agg.email_count ?? 0, // BQ returns email_count (not count)
    avgEditDistance: agg.avg_edit_distance ?? 0,
    median: agg.median_edit_distance ?? 0,
    acceptance: agg.acceptance_rate_pct ?? 0,
  }));

  const editDistanceByCategory =
    editDistanceByCategoryOverTime as unknown as EmailPerformanceData['editDistanceByCategory'];

  // BQ returns flat {category, week, avg_edit_distance, email_count} rows — group by category
  const heatmapByCat = new Map<string, { week: string; value: number }[]>();
  for (const row of categoryWeekHeatmap) {
    if (!heatmapByCat.has(row.category)) heatmapByCat.set(row.category, []);
    heatmapByCat.get(row.category)!.push({ week: row.week, value: row.avg_edit_distance ?? 0 });
  }

  const allWeeks = Array.from(new Set(categoryWeekHeatmap.map((r) => r.week))).sort();

  const editDistanceHeatmap = {
    weeks: allWeeks,
    rows: Array.from(heatmapByCat.entries()).map(([category, cells]) => ({
      label: categoryLabel(category),
      cells,
    })),
  };

  return { categorySummary, editDistanceByCategory, editDistanceHeatmap };
}

// ── Hotel Overview ─────────────────────────────────────────────────────────────

export function transformHotelOverview(raw: EAHotelOverviewResponse): Pick<
  EmailPerformanceData,
  'hotels' | 'hotelStats'
> {
  const hotels: HotelPerfRow[] = (raw?.hotels ?? []).map((h) => ({
    id: h.organization_id,
    hotel: h.organization_name,
    mailbox: h.mailbox_email,
    draftsCreated: h.total_drafts_created ?? 0,
    draftsSent: h.total_drafts ?? 0,
    sendRate: h.send_rate_pct ?? null,
    sent7d: h.drafts_last_7d ?? 0,
    lastSent: h.last_draft_at ?? null,
    acceptanceRate: h.acceptance_rate_pct ?? 0,
    autoDrafts: h.auto_drafts_enabled ?? false,
    status: h.status === 'never_used' ? 'never-used' : (h.status ?? 'never-used'),
    needsAttention: h.needs_attention,
  }));

  const kpis = raw?.kpis;
  const hotelStats: HotelStats = {
    total: kpis?.total_hotels ?? 0,
    active7d: kpis?.active_hotels ?? 0,
    inactive7d: kpis?.inactive_hotels ?? 0,
    needsAttention: kpis?.needs_attention_count ?? 0,
    autoDraftsOn: kpis?.auto_drafts_on_count ?? 0,
  };

  return { hotels, hotelStats };
}

// ── Judge Breakdown ────────────────────────────────────────────────────────────

export type JudgeBreakdown = {
  by_verdict: { label: string; count: number }[];
  by_primary_failure: { label: string; count: number }[];
  by_root_cause: { label: string; count: number }[];
  by_fix_layer: { label: string; count: number }[];
  by_fact_status: { label: string; count: number }[];
  by_could_be_fixed_without_new_systems: { label: string; count: number }[];
};

export function transformJudgeBreakdown(raw: EAJudgeBreakdownResponse): JudgeBreakdown {
  const b = raw?.breakdown ?? {};
  return {
    by_verdict: b.by_verdict ?? [],
    by_primary_failure: b.by_primary_failure ?? [],
    by_root_cause: b.by_root_cause ?? [],
    by_fix_layer: b.by_fix_layer ?? [],
    by_fact_status: b.by_fact_status ?? [],
    by_could_be_fixed_without_new_systems: b.by_could_be_fixed_without_new_systems ?? [],
  };
}

// ── Emails ─────────────────────────────────────────────────────────────────────

function toTripType(t: string | null): 'Leisure' | 'Business' | 'Group' {
  if (t === 'Business') return 'Business';
  if (t === 'Group') return 'Group';
  return 'Leisure';
}

function toEditClass(c: string | null): EditClass {
  if (c === 'light') return 'light';
  if (c === 'medium') return 'medium';
  if (c === 'heavy') return 'heavy';
  if (c === 'rewritten') return 'rewritten';
  return 'accepted';
}

export function transformEmails(rows: EAEmailRow[]): EmailRow[] {
  return (rows ?? []).map((r) => ({
    id: r.interaction_id,
    sentAt: r.sent_at,
    mailbox: r.mailbox_email,
    category: r.category ?? '',
    trip: toTripType(r.trip_type),
    editClass: toEditClass(r.edit_class),
    editDist: r.edit_distance_ratio ?? 0,
    jaccard: r.jaccard_distance ?? 0,
    semantic: r.semantic_similarity ?? 0,
    verdict: r.verdict,
    failure: r.primary_failure,
    subject: r.subject ?? '',
    guestFrom: r.guest_from ?? '',
    guestEmail: r.guest_email ?? '',
    aiDraft: r.ai_draft ?? '',
    finalSent: r.final_sent ?? '',
    toolCalls: r.tool_calls,
  }));
}
