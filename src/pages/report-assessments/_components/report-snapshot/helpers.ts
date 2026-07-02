import type { ReportJson, RevenueFinding } from './types';

export function formatHours(minutes: number): string {
  if (minutes < 60) return `${minutes.toFixed(0)} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

export function toLabel(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function toPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function formatPeakHour(peak: string | number | null | undefined): string {
  if (peak === null || peak === undefined) return '—';
  if (typeof peak === 'number') return `${peak}:00`;
  return peak;
}

export function isRevenueFindings(x: unknown): x is RevenueFinding[] {
  return (
    Array.isArray(x) &&
    x.every(
      (row) =>
        row && typeof row === 'object' && typeof (row as RevenueFinding).finding === 'string',
    )
  );
}

export const EMAIL_REPORT_WEEKDAY_ORDER = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export function heatmapColor(
  responseMinutes: number | null,
  inbound: number,
  scaleMax: number,
): string {
  if (inbound === 0) return 'hsl(var(--muted) / 0.22)';
  if (responseMinutes == null || scaleMax <= 0) return 'hsl(48 90% 90%)';
  const t = Math.min(1, Math.max(0, responseMinutes / scaleMax));
  const hue = 142 - t * 142;
  const sat = 52 + t * 28;
  const light = 58 - t * 28;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function formatHeatmapTitle(cell: {
  day: string;
  hour: number;
  inbound: number;
  responseMinutes: number | null;
  avgMinutes: number | null;
}): string {
  const nextHour = cell.hour === 23 ? 0 : cell.hour + 1;
  const span = `${cell.hour}:00–${nextHour}:00`;
  const med =
    cell.responseMinutes != null ? `median ${formatHours(cell.responseMinutes)}` : 'median —';
  return [`${cell.day} ${span}`, `${cell.inbound.toLocaleString()} inbound`, med]
    .filter(Boolean)
    .join(' · ');
}

export function isValidReportJson(data: unknown): data is ReportJson {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return typeof d.executive_summary === 'object' && d.executive_summary !== null;
}
