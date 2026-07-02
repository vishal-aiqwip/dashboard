export type BenchmarkRow = Record<string, unknown>;

export type MetricDirection = 'lower_better' | 'higher_better';

export interface CohortMetricDefinition {
  key: string;
  label: string;
  hint: string;
  direction: MetricDirection;
  format: 'minutes' | 'percent01' | 'decimal1' | 'decimal2';
}

export const COHORT_METRICS: CohortMetricDefinition[] = [
  { key: 'median_response_min', label: 'Median response time', hint: 'Typical time to first reply.', direction: 'lower_better', format: 'minutes' },
  { key: 'p90_response_min', label: 'P90 response time', hint: 'Slow tail of response times.', direction: 'lower_better', format: 'minutes' },
  { key: 'sla_under_1h_rate', label: 'Replies within 1 hour', hint: 'Share of replies under 60 minutes.', direction: 'higher_better', format: 'percent01' },
  { key: 'noise_rate', label: 'Noise in inbox', hint: 'Share filtered as non-guest / system noise.', direction: 'lower_better', format: 'percent01' },
  { key: 'reply_rate', label: 'Reply rate', hint: 'Inbound messages that got a reply.', direction: 'higher_better', format: 'percent01' },
  { key: 'single_touch_rate', label: 'Single-touch threads', hint: 'Threads closed with one outbound reply.', direction: 'higher_better', format: 'percent01' },
  { key: 'revenue_reply_rate', label: 'Revenue thread reply rate', hint: 'Commercial-intent emails that were answered.', direction: 'higher_better', format: 'percent01' },
  { key: 'commercial_miss_rate', label: 'Commercial miss rate', hint: 'Coaching signal: possible revenue leakage.', direction: 'lower_better', format: 'percent01' },
  { key: 'ai_addressable_share', label: 'AI-addressable (long term)', hint: 'Estimated share that could be assisted with tooling.', direction: 'higher_better', format: 'percent01' },
  { key: 'pms_dependency_rate', label: 'PMS-dependent share', hint: 'Automation blocked on reservation-system access.', direction: 'lower_better', format: 'percent01' },
  { key: 'brand_voice_avg', label: 'Brand voice score', hint: 'Sample quality average (scale varies by pipeline).', direction: 'higher_better', format: 'decimal2' },
  { key: 'reply_quality_avg', label: 'Reply quality score', hint: 'Average reply quality in sample.', direction: 'higher_better', format: 'decimal2' },
];

export function benchmarkNumber(row: BenchmarkRow, key: string): number | null {
  const v = row[key];
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export function dedupeLatestPerHotel(rows: BenchmarkRow[]): BenchmarkRow[] {
  const seen = new Set<string>();
  const out: BenchmarkRow[] = [];
  for (const r of rows) {
    const hid = r.hotel_id;
    if (typeof hid !== 'string' || hid.length === 0) continue;
    if (seen.has(hid)) continue;
    seen.add(hid);
    out.push(r);
  }
  return out;
}

export function medianSorted(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function cohortValuesForMetric(rows: BenchmarkRow[], key: string): number[] {
  const vals: number[] = [];
  for (const r of rows) {
    const n = benchmarkNumber(r, key);
    if (n != null) vals.push(n);
  }
  vals.sort((a, b) => a - b);
  return vals;
}

export function percentAheadOfPeers(value: number, others: number[], direction: MetricDirection): number | null {
  if (others.length === 0) return null;
  const wins = direction === 'lower_better'
    ? others.filter((o) => o > value).length
    : others.filter((o) => o < value).length;
  return (wins / others.length) * 100;
}

export function formatMetricValue(value: number, format: CohortMetricDefinition['format']): string {
  switch (format) {
    case 'minutes':
      return value >= 60 ? `${(value / 60).toFixed(1)} h` : `${Math.round(value)} min`;
    case 'percent01':
      return `${(value <= 1 ? value * 100 : value).toFixed(1)}%`;
    case 'decimal1':
      return value.toFixed(1);
    case 'decimal2':
      return value.toFixed(2);
    default:
      return String(value);
  }
}

export function isBetterThanMedian(value: number, med: number, direction: MetricDirection): boolean {
  return direction === 'lower_better' ? value < med : value > med;
}
