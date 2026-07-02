import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { isRevenueFindings, toLabel } from './helpers';
import { NarrativeText } from './narrative-text';
import type {
  ExecutiveSummary,
  HeadlineKpi,
  RevenueLeakage,
} from './types';

interface RevenueTabProps {
  rev: RevenueLeakage;
  exec: ExecutiveSummary;
  headlineKpi: HeadlineKpi | null | undefined;
}

export function RevenueTab({ rev, exec, headlineKpi }: RevenueTabProps) {
  const revenueFindings = rev && isRevenueFindings(rev.findings) ? rev.findings : [];

  const captureRate =
    headlineKpi?.revenue_capture_rate ?? rev?.revenue_capture_rate ?? null;

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-grey-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-grey-900">Revenue risk</CardTitle>
          {rev?.narrative ? (
            <NarrativeText source={rev.narrative} className="mt-3" />
          ) : (
            <p className="mt-3 text-sm text-foreground">
              {(rev?.total_opportunities_found ?? 0).toLocaleString()} spend-intent signals in{' '}
              {exec.guest_email_volume.toLocaleString()} guest emails
              {typeof rev?.slow_response_opportunities === 'number'
                ? `; ${rev.slow_response_opportunities.toLocaleString()} with slow response.`
                : '.'}
            </p>
          )}
          <p className="mt-2 text-xs text-grey-600">
            Directional estimates from inbox signals — not audited financials.
          </p>
          {(rev?.revenue_lost_unanswered ?? rev?.estimated_revenue_at_risk) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  Money lost — unanswered (est.)
                </p>
                <p className="mt-1 text-xl font-bold text-red-900">
                  {rev?.revenue_lost_unanswered ?? rev?.estimated_revenue_at_risk}
                </p>
                <p className="mt-1 text-xs text-red-700/80">
                  Revenue intent that never got a reply.
                </p>
              </div>
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-sm font-medium text-amber-800">
                  Money at risk — slow (est.)
                </p>
                <p className="mt-1 text-xl font-bold text-amber-900">
                  {rev?.revenue_at_risk_slow ?? '—'}
                </p>
                <p className="mt-1 text-xs text-amber-700/80">Answered, but slower than SLA.</p>
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Revenue opportunities found',
                value: String(rev?.total_opportunities_found ?? '—'),
              },
              rev?.unanswered_opportunities != null
                ? {
                    label: 'Unanswered with spend intent',
                    value: String(rev.unanswered_opportunities),
                  }
                : null,
              {
                label: 'Slow-response opportunities',
                value: String(rev?.slow_response_opportunities ?? '—'),
              },
              {
                label: 'Revenue capture rate',
                value:
                  captureRate != null ? `${Math.round(captureRate * 1000) / 10}%` : '—',
              },
            ]
              .filter(Boolean)
              .map((item) => (
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
                      {o.unanswered_count != null ? `${o.unanswered_count} unanswered · ` : ''}
                      {o.slow_response_count} slow
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
                  <div
                    key={b.value_bucket}
                    className="rounded-xl border border-grey-100 bg-surface/50 p-3"
                  >
                    <p className="text-sm font-medium text-grey-700">
                      {toLabel(b.value_bucket)}
                    </p>
                    <p className="mt-0.5 text-xs text-grey-500">{b.estimated_range}</p>
                    <p className="mt-2 text-2xl font-semibold text-grey-900">
                      {b.count.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-grey-600">
                      {b.unanswered_count != null
                        ? `${b.unanswered_count} unanswered · `
                        : ''}
                      {b.replied_count} replied
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
                        <TableCell className="max-w-[220px] align-top text-sm text-grey-800">
                          {f.finding}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {f.email_count}
                        </TableCell>
                        <TableCell className="text-sm">
                          {f.opportunity_type ? toLabel(f.opportunity_type) : '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                              f.what_happened === 'missed'
                                ? 'border-red-200 bg-red-50 text-red-900'
                                : 'border-amber-200 bg-amber-50 text-amber-950',
                            )}
                          >
                            {f.what_happened}
                          </span>
                        </TableCell>
                        <TableCell
                          className="max-w-[200px] truncate text-xs text-grey-600"
                          title={f.example_subject ?? undefined}
                        >
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
    </div>
  );
}
