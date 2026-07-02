import { Fragment, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChevronRight } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

import {
  EMAIL_REPORT_WEEKDAY_ORDER,
  formatHours,
  heatmapColor,
  formatHeatmapTitle,
} from './helpers';
import { ChartCard } from './chart-card';
import { SectionHeader } from './section-header';
import type { HourlyResponseDataRow, ServicePerformance, SpotlightComment, WorkloadProfile } from './types';

const spotlightStyles: Record<string, string> = {
  warning: 'border-amber-300 bg-amber-50 text-amber-800',
  opportunity: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  coaching: 'border-violet-300 bg-violet-50 text-violet-800',
  insight: 'border-sky-300 bg-sky-50 text-sky-900',
};

function responseTimeTooltipFormatter(
  value: number | string | Array<number | string>,
  name: string,
  item: { dataKey?: string | number },
) {
  return (
    <>
      <div
        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
        style={{ backgroundColor: `var(--color-${item.dataKey})` }}
      />
      <div className="flex flex-1 items-center justify-between leading-none">
        <span className="text-muted-foreground">{name}</span>
        <span className="text-foreground font-mono font-medium tabular-nums">
          {formatHours(Number(value))}
        </span>
      </div>
    </>
  );
}

interface ExecutiveTabProps {
  spotlightComments: SpotlightComment[];
  workload: WorkloadProfile | null;
  perf: ServicePerformance;
  hourlyResponseData: HourlyResponseDataRow[] | undefined;
}

export function ExecutiveTab({
  spotlightComments,
  workload,
  perf,
  hourlyResponseData,
}: ExecutiveTabProps) {
  const responseTimeByWeekdayChart = useMemo(() => {
    const rows = perf?.response_time_by_weekday;
    if (!rows?.length) return [];
    const order = new Map<string, number>(
      EMAIL_REPORT_WEEKDAY_ORDER.map((d, i) => [d, i]),
    );
    return [...rows]
      .sort((a, b) => (order.get(a.day_of_week) ?? 99) - (order.get(b.day_of_week) ?? 99))
      .map((r) => ({
        day: r.day_of_week,
        median: r.median_resp_min ?? 0,
        p90: r.p90_resp_min ?? 0,
        inbound: r.total_inbound,
      }));
  }, [perf?.response_time_by_weekday]);

  const responseTimeByHourChart = useMemo(() => {
    const rows = perf?.response_time_by_hour;
    if (!rows?.length) return [];
    const byHour = new Map(rows.map((r) => [r.hour_of_day, r]));
    return Array.from({ length: 24 }, (_, h) => {
      const r = byHour.get(h);
      return {
        hourLabel: `${h}:00`,
        median: r?.median_resp_min ?? 0,
        p90: r?.p90_resp_min ?? 0,
        inbound: r?.total_inbound ?? 0,
      };
    });
  }, [perf?.response_time_by_hour]);

  const dayOrder = [...EMAIL_REPORT_WEEKDAY_ORDER];
  const weekdayCountMap = new Map(
    (workload?.volume_by_weekday ?? []).map((v) => [v.value, v.count]),
  );
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

  const volumeChartConfig = {
    count: { label: 'Messages', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const responseTimeChartConfig = {
    median: { label: 'Median', color: 'var(--chart-2)' },
    p90: { label: 'p90', color: 'var(--chart-2)' },
  } satisfies ChartConfig;

  const responseHeatmapModel = useMemo(() => {
    const rows = hourlyResponseData;
    if (!rows?.length) return null;
    type Agg = { inbound: number; medNum: number; medDen: number; avgNum: number; avgDen: number };
    const map = new Map<string, Agg>();
    for (const row of rows) {
      const key = `${row.day_of_week} ${row.hour_of_day}`;
      let a = map.get(key);
      if (!a) {
        a = { inbound: 0, medNum: 0, medDen: 0, avgNum: 0, avgDen: 0 };
        map.set(key, a);
      }
      a.inbound += row.inbound_cnt;
      if (row.median_resp_min != null && row.inbound_cnt > 0) {
        a.medNum += row.median_resp_min * row.inbound_cnt;
        a.medDen += row.inbound_cnt;
      }
      if (row.avg_resp_min != null && row.inbound_cnt > 0) {
        a.avgNum += row.avg_resp_min * row.inbound_cnt;
        a.avgDen += row.inbound_cnt;
      }
    }
    const medians: number[] = [];
    const grid = EMAIL_REPORT_WEEKDAY_ORDER.map((day) =>
      Array.from({ length: 24 }, (_, hour) => {
        const a = map.get(`${day} ${hour}`);
        const inbound = a?.inbound ?? 0;
        const responseMinutes = a && a.medDen > 0 ? a.medNum / a.medDen : null;
        const avgMinutes = a && a.avgDen > 0 ? a.avgNum / a.avgDen : null;
        if (responseMinutes != null) medians.push(responseMinutes);
        return { day, hour, inbound, responseMinutes, avgMinutes };
      }),
    );
    medians.sort((x, y) => x - y);
    const colorScaleMax =
      medians.length > 0
        ? medians[Math.min(medians.length - 1, Math.floor(medians.length * 0.95))]!
        : 1;
    return { grid, colorScaleMax };
  }, [hourlyResponseData]);

  return (
    <div className="space-y-6">
      {spotlightComments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {spotlightComments.map((comment, si) => (
            <Card
              key={`${comment.headline}-${si}`}
              className=""
            >
              <CardContent>

                <div className="">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                        spotlightStyles[comment.type] ??
                        'border-slate-300 bg-slate-100 text-slate-800',
                      )}
                    >
                      {comment.type}
                    </span>
                    <ChevronRight className="h-4 w-4 text-grey-400" />
                  </div>
                  <p className="text-sm font-semibold text-grey-900">{comment.headline}</p>
                  <p className="mt-1 text-xs leading-relaxed text-grey-600">{comment.detail}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Volume by day"
          description="All weekdays — zero when no messages on that day."
          config={volumeChartConfig}
        >
          <BarChart data={volumeByDay} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={50} interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="var(--color-count)" />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Volume by hour"
          description="Full 24-hour clock — zero for hours with no messages."
          config={volumeChartConfig}
        >
          <BarChart data={volumeByHourFull} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hourLabel" tick={{ fontSize: 9 }} angle={-65} textAnchor="end" height={50} interval={0} />
            <YAxis tick={{ fontSize: 11 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[2, 2, 0, 0]} fill="var(--color-count)" />
          </BarChart>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Response time by weekday"
          description="Median and p90 reply time (minutes) by day."
          config={responseTimeChartConfig}
          hasData={responseTimeByWeekdayChart.length > 0}
        >
          <BarChart data={responseTimeByWeekdayChart} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={50} interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatHours(v as number)} />
            <ChartTooltip content={<ChartTooltipContent formatter={responseTimeTooltipFormatter} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="median" name="Median" fill="var(--color-median)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="p90" name="p90" fill="var(--color-p90)" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Response time by hour"
          description="Median and p90 reply time across each hour (0–23)."
          config={responseTimeChartConfig}
          hasData={responseTimeByHourChart.some((r) => r.inbound > 0)}
        >
          <BarChart data={responseTimeByHourChart} margin={{ top: 8, right: 8, left: 8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hourLabel" tick={{ fontSize: 9 }} angle={-65} textAnchor="end" height={50} interval={0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatHours(v as number)} />
            <ChartTooltip content={<ChartTooltipContent formatter={responseTimeTooltipFormatter} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="median" name="Median" fill="var(--color-median)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="p90" name="p90" fill="var(--color-p90)" fillOpacity={0.4} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      {responseHeatmapModel && (
        <Card className="rounded-2xl border-grey-100 shadow-sm">
          <CardHeader className="pb-2">
            <SectionHeader
              title="Reply-time load map"
              description="Each cell is weekday × hour. Color = inbound-weighted median reply time. Hover for details."
            />
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-5">
            <div className="overflow-x-auto rounded-xl border border-grey-100 bg-muted/20 p-3">
              <div
                className="min-w-[640px]"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3.25rem repeat(24, minmax(0, 1fr))',
                  gap: '3px',
                }}
              >
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    className="text-center text-[10px] font-medium text-muted-foreground"
                  >
                    {h}
                  </div>
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
                        style={{
                          backgroundColor: heatmapColor(
                            cell.responseMinutes,
                            cell.inbound,
                            responseHeatmapModel.colorScaleMax,
                          ),
                        }}
                        title={formatHeatmapTitle(cell)}
                      />
                    ))}
                  </Fragment>
                ))}
              </div>
            </div>
            <p className="text-xs text-grey-600">
              <span className="font-medium text-grey-800">Legend:</span> Greener = faster median
              replies; redder = slower. Empty slots had no inbound mail. Amber = inbound but no
              median reply time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
