import type { BenchmarkRow } from '@/lib/benchmark-cohort';

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function tryParseJsonObject<T extends Record<string, unknown>>(value: unknown): T | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value as T;
  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const p = JSON.parse(value) as unknown;
      if (p && typeof p === 'object' && !Array.isArray(p)) return p as T;
    } catch { return null; }
  }
  return null;
}

function hourKeyToIndex(k: string): number | null {
  const s = k.trim().padStart(2, '0');
  if (!/^\d{2}$/.test(s)) return null;
  const n = Number.parseInt(s, 10);
  if (n < 0 || n > 23) return null;
  return n;
}

function normalizeWeekdayKey(key: string): (typeof WEEKDAY_ORDER)[number] | null {
  const k = key.trim();
  for (const d of WEEKDAY_ORDER) {
    if (d.toLowerCase() === k.toLowerCase()) return d;
  }
  return null;
}

function medianNumbers(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) return s[mid]!;
  return (s[mid - 1]! + s[mid]!) / 2;
}

function hourLabel(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

export function extractVolumeHourly24(row: BenchmarkRow): number[] | null {
  const obj = tryParseJsonObject<Record<string, unknown>>(row.volume_profile_hourly);
  if (!obj) return null;
  const arr = new Array<number>(24).fill(0);
  let any = false;
  for (const [k, v] of Object.entries(obj)) {
    const idx = hourKeyToIndex(k);
    if (idx == null) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) { arr[idx] = n; any = true; }
  }
  return any ? arr : null;
}

export function extractVolumeWeekday7(row: BenchmarkRow): number[] | null {
  const obj = tryParseJsonObject<Record<string, unknown>>(row.volume_profile_weekday);
  if (!obj) return null;
  const arr = new Array<number>(7).fill(0);
  let any = false;
  for (const [k, v] of Object.entries(obj)) {
    const day = normalizeWeekdayKey(k);
    if (!day) continue;
    const idx = WEEKDAY_ORDER.indexOf(day);
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) { arr[idx] = n; any = true; }
  }
  return any ? arr : null;
}

export function extractResponseHourly24(row: BenchmarkRow): (number | null)[] | null {
  const obj = tryParseJsonObject<Record<string, unknown>>(row.response_profile_hourly);
  if (!obj) return null;
  const arr: (number | null)[] = new Array<number | null>(24).fill(null);
  let any = false;
  for (const [k, v] of Object.entries(obj)) {
    const idx = hourKeyToIndex(k);
    if (idx == null) continue;
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) { arr[idx] = n; any = true; }
  }
  return any ? arr : null;
}

export function extractResponseWeekday7(row: BenchmarkRow): (number | null)[] | null {
  const obj = tryParseJsonObject<Record<string, unknown>>(row.response_profile_weekday);
  if (!obj) return null;
  const arr: (number | null)[] = new Array<number | null>(7).fill(null);
  let any = false;
  for (const [k, v] of Object.entries(obj)) {
    const day = normalizeWeekdayKey(k);
    if (!day) continue;
    const idx = WEEKDAY_ORDER.indexOf(day);
    const n = typeof v === 'number' ? v : Number(v);
    if (Number.isFinite(n)) { arr[idx] = n; any = true; }
  }
  return any ? arr : null;
}

export type IndustryVolumeHourlyPoint = { hour: number; label: string; meanShare: number };
export type IndustryVolumeWeekdayPoint = { day: string; meanShare: number };
export type IndustryResponseHourlyPoint = { hour: number; label: string; medianMinutes: number | null };
export type IndustryResponseWeekdayPoint = { day: string; medianMinutes: number | null };

export function aggregateVolumeProfiles(rows: BenchmarkRow[]): {
  hourly: IndustryVolumeHourlyPoint[];
  weekday: IndustryVolumeWeekdayPoint[];
  hotelsWithHourly: number;
  hotelsWithWeekday: number;
} | null {
  const hourlyRows: number[][] = [];
  const weekdayRows: number[][] = [];
  for (const row of rows) {
    const h = extractVolumeHourly24(row);
    if (h) hourlyRows.push(h);
    const w = extractVolumeWeekday7(row);
    if (w) weekdayRows.push(w);
  }
  if (hourlyRows.length === 0 && weekdayRows.length === 0) return null;

  const hourly: IndustryVolumeHourlyPoint[] = hourlyRows.length > 0
    ? Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label: hourLabel(hour),
        meanShare: hourlyRows.reduce((acc, r) => acc + r[hour]!, 0) / hourlyRows.length,
      }))
    : [];

  const weekday: IndustryVolumeWeekdayPoint[] = weekdayRows.length > 0
    ? Array.from({ length: 7 }, (_, i) => ({
        day: WEEKDAY_ORDER[i]!,
        meanShare: weekdayRows.reduce((acc, r) => acc + r[i]!, 0) / weekdayRows.length,
      }))
    : [];

  return { hourly, weekday, hotelsWithHourly: hourlyRows.length, hotelsWithWeekday: weekdayRows.length };
}

export function aggregateResponseProfiles(rows: BenchmarkRow[]): {
  hourly: IndustryResponseHourlyPoint[];
  weekday: IndustryResponseWeekdayPoint[];
  hotelsWithHourly: number;
  hotelsWithWeekday: number;
} | null {
  const hourlyRows: (number | null)[][] = [];
  const weekdayRows: (number | null)[][] = [];
  for (const row of rows) {
    const h = extractResponseHourly24(row);
    if (h) hourlyRows.push(h);
    const w = extractResponseWeekday7(row);
    if (w) weekdayRows.push(w);
  }
  if (hourlyRows.length === 0 && weekdayRows.length === 0) return null;

  const hourly: IndustryResponseHourlyPoint[] = hourlyRows.length > 0
    ? Array.from({ length: 24 }, (_, hour) => {
        const vals = hourlyRows.map((r) => r[hour]).filter((v): v is number => v != null && Number.isFinite(v));
        return { hour, label: hourLabel(hour), medianMinutes: medianNumbers(vals) };
      })
    : [];

  const weekday: IndustryResponseWeekdayPoint[] = weekdayRows.length > 0
    ? Array.from({ length: 7 }, (_, i) => {
        const vals = weekdayRows.map((r) => r[i]).filter((v): v is number => v != null && Number.isFinite(v));
        return { day: WEEKDAY_ORDER[i]!, medianMinutes: medianNumbers(vals) };
      })
    : [];

  return { hourly, weekday, hotelsWithHourly: hourlyRows.length, hotelsWithWeekday: weekdayRows.length };
}

export function aggregateCategoryDistribution(rows: BenchmarkRow[]): { category: string; meanShare: number; hotelCount: number }[] {
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    const obj = tryParseJsonObject<Record<string, unknown>>(row.category_distribution);
    if (!obj) continue;
    for (const [k, v] of Object.entries(obj)) {
      const n = typeof v === 'number' ? v : Number(v);
      if (!Number.isFinite(n)) continue;
      sums.set(k, (sums.get(k) ?? 0) + n);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  const out: { category: string; meanShare: number; hotelCount: number }[] = [];
  for (const [k, sum] of sums) {
    out.push({ category: k, meanShare: sum / (counts.get(k) ?? 1), hotelCount: counts.get(k) ?? 1 });
  }
  return out.sort((a, b) => b.meanShare - a.meanShare);
}

export function peakHourFromVolumeHourly(hourly: IndustryVolumeHourlyPoint[]): IndustryVolumeHourlyPoint | null {
  if (hourly.length === 0) return null;
  return hourly.reduce((best, p) => (p.meanShare > best.meanShare ? p : best), hourly[0]!);
}

export function peakWeekdayFromVolume(weekday: IndustryVolumeWeekdayPoint[]): IndustryVolumeWeekdayPoint | null {
  if (weekday.length === 0) return null;
  return weekday.reduce((best, p) => (p.meanShare > best.meanShare ? p : best), weekday[0]!);
}

export function slowestResponseHour(hourly: IndustryResponseHourlyPoint[]): IndustryResponseHourlyPoint | null {
  const valid = hourly.filter((p) => p.medianMinutes != null) as (IndustryResponseHourlyPoint & { medianMinutes: number })[];
  if (valid.length === 0) return null;
  return valid.reduce((worst, p) => (p.medianMinutes > worst.medianMinutes ? p : worst), valid[0]!);
}

export function slowestResponseWeekday(weekday: IndustryResponseWeekdayPoint[]): IndustryResponseWeekdayPoint | null {
  const valid = weekday.filter((p) => p.medianMinutes != null) as (IndustryResponseWeekdayPoint & { medianMinutes: number })[];
  if (valid.length === 0) return null;
  return valid.reduce((worst, p) => (p.medianMinutes > worst.medianMinutes ? p : worst), valid[0]!);
}

export function filterToDominantPeriodDays(rows: BenchmarkRow[]): {
  filtered: BenchmarkRow[];
  periodDays: number | null;
  excludedCount: number;
} {
  if (rows.length === 0) return { filtered: [], periodDays: null, excludedCount: 0 };
  const counts = new Map<number, number>();
  for (const r of rows) {
    const p = r.period_days;
    if (typeof p === 'number' && Number.isFinite(p)) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  if (counts.size === 0) return { filtered: rows, periodDays: null, excludedCount: 0 };
  const bestPeriod = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  const filtered = rows.filter((r) => r.period_days === bestPeriod);
  return { filtered, periodDays: bestPeriod, excludedCount: rows.length - filtered.length };
}
