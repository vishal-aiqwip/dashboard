import { BarChart3, Building2, Calendar, Clock3, Filter, Inbox, Layers3, Mail } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

import { formatHours, formatPeakHour } from './helpers';
import { NarrativeText } from './narrative-text';
import type {
  EmailReportSnapshot,
  ExecutiveSummary,
  RawStats,
  ServicePerformance,
  WorkloadProfile,
} from './types';

interface HeroSectionProps {
  snapshot: Pick<EmailReportSnapshot, 'period_days' | 'hotel_name'>;
  exec: ExecutiveSummary;
  perf: ServicePerformance;
  workload: WorkloadProfile | null;
  rawStats: RawStats | undefined;
}

export function HeroSection({ snapshot, exec, perf, workload, rawStats }: HeroSectionProps) {
  const primaryMailbox = workload?.volume_by_mailbox?.[0];
  const singleTouchZero = (perf?.thread_stats?.single_touch_rate ?? 0) === 0;

  const replacementKpi =
    rawStats?.unread_filtered_count != null
      ? {
          label: 'Unread filtered',
          value: String(rawStats.unread_filtered_count),
          sub: 'Excluded from sample',
          icon: <Filter className="h-5 w-5" />,
        }
      : rawStats?.actual_days_covered != null
        ? {
            label: 'Sample span',
            value: `${rawStats.actual_days_covered} days`,
            sub:
              rawStats.date_range_start && rawStats.date_range_end
                ? `${rawStats.date_range_start} – ${rawStats.date_range_end}`
                : undefined,
            icon: <Calendar className="h-5 w-5" />,
          }
        : null;

  const kpis = [
    {
      label: 'Guest emails',
      value: String(exec.guest_email_volume),
      sub:
        exec.mailboxes_analyzed > 1
          ? `${exec.mailboxes_analyzed} mailboxes`
          : exec.noise_filtered > 0
            ? `${exec.noise_filtered} noise filtered`
            : undefined,
      icon: <Inbox className="h-5 w-5" />,
    },
    {
      label: 'Noise filtered',
      value: String(exec.noise_filtered),
      sub: rawStats?.noise_rate
        ? `${(rawStats.noise_rate * 100).toFixed(1)}% of inbox`
        : undefined,
      icon: <Mail className="h-5 w-5" />,
    },
    ...(replacementKpi ? [replacementKpi] : []),
    {
      label: 'Median → p90',
      value: `${formatHours(perf?.median_response_minutes ?? 0)} → ${formatHours(perf?.p90_response_minutes ?? 0)}`,
      icon: <Clock3 className="h-5 w-5" />,
    },
    {
      label: 'After-hours',
      value: `${(
        (workload?.after_hours_pct ?? 0) <= 1
          ? (workload?.after_hours_pct ?? 0) * 100
          : (workload?.after_hours_pct ?? 0)
      ).toFixed(1)}%`,
      sub: `Peak: ${workload?.peak_day ?? '—'} at ${formatPeakHour(workload?.peak_hour)}`,
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      label: singleTouchZero ? 'Single-touch threads' : 'Single-touch rate',
      value: singleTouchZero
        ? '0%'
        : `${((perf?.thread_stats?.single_touch_rate ?? 0) * 100).toFixed(1)}%`,
      sub: singleTouchZero
        ? 'No threads closed with one reply'
        : 'threads resolved in one reply',
      icon: <BarChart3 className="h-5 w-5" />,
    },
  ];

  return (
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
              {snapshot.hotel_name ??
                primaryMailbox?.value ??
                exec.recommended_first_mailbox ??
                '—'}
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
            <div
              key={item.label}
              className="flex items-start gap-3 rounded-xl border bg-muted/30 p-3"
            >
              <div className="shrink-0 rounded-lg border bg-background p-2 text-muted-foreground">
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold">{item.value}</p>
                {item.sub && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
                )}
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
  );
}
