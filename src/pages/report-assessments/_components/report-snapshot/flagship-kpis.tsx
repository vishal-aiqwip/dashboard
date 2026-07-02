import { Badge } from '@/components/ui/badge';

import type { HeadlineKpi, RevenueLeakage } from './types';

interface FlagshipKpisProps {
  headlineKpi: HeadlineKpi | null | undefined;
  rev: RevenueLeakage;
}

export function FlagshipKpis({ headlineKpi: hk, rev }: FlagshipKpisProps) {
  const rcr = hk?.revenue_capture_rate ?? rev?.revenue_capture_rate ?? null;
  if (!hk && rcr === null) return null;

  const rcrPct =
    rcr !== null && rcr !== undefined ? `${Math.round(rcr * 1000) / 10}%` : '—';
  const atRisk = hk?.revenue_at_risk_display ?? rev?.estimated_revenue_at_risk ?? '—';
  const speed = hk?.speed_to_lead_median_min ?? null;
  const speedStr =
    speed === null || speed === undefined
      ? '—'
      : speed < 60
        ? `${Math.round(speed)} min`
        : `${(speed / 60).toFixed(1)} h`;
  const healthStr =
    hk?.inbox_health_score !== null && hk?.inbox_health_score !== undefined
      ? `${hk.inbox_health_score}/100`
      : '—';
  const acr = hk?.answer_coverage_rate ?? rev?.answer_coverage_rate ?? null;
  const acrPct =
    acr !== null && acr !== undefined ? `${Math.round(acr * 1000) / 10}%` : '—';
  const lostUnanswered =
    hk?.revenue_lost_unanswered_display ?? rev?.revenue_lost_unanswered ?? atRisk;
  const atRiskSlow = hk?.revenue_at_risk_slow_display ?? rev?.revenue_at_risk_slow ?? '—';
  const sla = hk?.sla_minutes ?? 60;

  const tiles = [
    { label: 'Inbox Health Score', value: healthStr, sub: 'Demand answered at all' },
    { label: 'Revenue Capture Rate', value: rcrPct, sub: `Answered within ${sla} min` },
    { label: 'Answer coverage', value: acrPct, sub: 'Revenue intent with any reply' },
    {
      label: 'Money lost (unanswered)',
      value: lostUnanswered,
      sub: `${hk?.unanswered_revenue_count ?? '?'} revenue emails never answered`,
    },
    { label: 'Money at risk (slow)', value: atRiskSlow, sub: 'Answered, but slower than SLA' },
    {
      label: 'Speed-to-lead (median)',
      value: speedStr,
      sub: 'Median reply on revenue intent',
    },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/60 bg-primary/10 p-6 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="">
          Flagship metrics
        </Badge>
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
      {hk?.inbox_health_verdict && (
        <p className="mt-4 text-sm font-medium">{hk.inbox_health_verdict}</p>
      )}
      {hk?.verdict && <p className="mt-1 text-sm text-muted-foreground">{hk.verdict}</p>}
    </div>
  );
}
