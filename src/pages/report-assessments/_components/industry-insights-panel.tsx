import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Legend,
} from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BenchmarkRow } from '@/lib/benchmark-cohort';
import {
  aggregateCategoryDistribution,
  aggregateResponseProfiles,
  aggregateVolumeProfiles,
  peakHourFromVolumeHourly,
  peakWeekdayFromVolume,
  slowestResponseHour,
  slowestResponseWeekday,
} from '@/lib/industry-benchmark-aggregates';

const volumeHourlyConfig: ChartConfig = {
  meanShare: { label: 'Avg. share (equal weight / hotel)', color: 'var(--chart-2)' },
};
const volumeWeekdayConfig: ChartConfig = {
  meanShare: { label: 'Avg. share', color: 'var(--chart-2)' },
};
const responseHourlyConfig: ChartConfig = {
  medianMinutes: { label: 'Median response (min)', color: 'var(--chart-4)' },
};
const categoryBarConfig: ChartConfig = {
  meanPct: { label: 'Mean share', color: 'var(--chart-1)' },
};

function formatPct01(x: number): string {
  return `${(x <= 1 ? x * 100 : x).toFixed(1)}%`;
}
function formatMinutes(m: number | null): string {
  if (m == null || !Number.isFinite(m)) return '—';
  return m >= 60 ? `${(m / 60).toFixed(1)} h` : `${Math.round(m)} min`;
}

interface IndustryInsightsPanelProps {
  rows: BenchmarkRow[];
  periodDays: number | null;
  excludedByPeriodCount: number;
}

export function IndustryInsightsPanel({ rows, periodDays, excludedByPeriodCount }: IndustryInsightsPanelProps) {
  const volumeAgg = useMemo(() => aggregateVolumeProfiles(rows), [rows]);
  const responseAgg = useMemo(() => aggregateResponseProfiles(rows), [rows]);
  const categories = useMemo(() => aggregateCategoryDistribution(rows), [rows]);

  const volumeHourlyChart = useMemo(
    () => volumeAgg?.hourly.map((p) => ({ ...p, meanPct: p.meanShare <= 1 ? p.meanShare * 100 : p.meanShare })) ?? [],
    [volumeAgg],
  );
  const volumeWeekdayChart = useMemo(
    () => volumeAgg?.weekday.map((p) => ({ ...p, meanPct: p.meanShare <= 1 ? p.meanShare * 100 : p.meanShare })) ?? [],
    [volumeAgg],
  );
  const responseHourlyChart = useMemo(
    () => responseAgg?.hourly.map((p) => ({ ...p, medianM: p.medianMinutes })) ?? [],
    [responseAgg],
  );
  const responseWeekdayChart = useMemo(
    () => responseAgg?.weekday.map((p) => ({ ...p, medianM: p.medianMinutes })) ?? [],
    [responseAgg],
  );
  const categoryChartData = useMemo(
    () => categories.slice(0, 12).map((c) => ({ name: c.category.replace(/_/g, ' '), meanPct: c.meanShare <= 1 ? c.meanShare * 100 : c.meanShare, key: c.category })),
    [categories],
  );
  const insights = useMemo(() => ({
    peakHour: peakHourFromVolumeHourly(volumeAgg?.hourly ?? []),
    peakDay: peakWeekdayFromVolume(volumeAgg?.weekday ?? []),
    slowHour: slowestResponseHour(responseAgg?.hourly ?? []),
    slowDay: slowestResponseWeekday(responseAgg?.weekday ?? []),
  }), [volumeAgg, responseAgg]);

  const n = rows.length;

  if (n < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Need at least two properties (after de-duplication) to show industry aggregates. Currently {n}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className=" text-left">
            <p className="text-sm font-medium text-grey-900">Cohort</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-grey-700">
              <li><span className="font-medium">{n}</span> properties (newest row per hotel, equal weight in aggregates).</li>
              {periodDays != null ? (
                <li>Window: <span className="font-medium">{periodDays} days</span> (most common <code className="rounded bg-muted px-1">period_days</code> in this cohort).</li>
              ) : (
                <li>Mixed or missing assessment windows — compare trends directionally only.</li>
              )}
              {excludedByPeriodCount > 0 && (
                <li>Excluded <span className="font-medium">{excludedByPeriodCount}</span> {excludedByPeriodCount === 1 ? 'property' : 'properties'} with a different window.</li>
              )}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Volume curves: <span className="font-medium">mean</span> of each hotel's hourly / weekday shares.
              Response curves: <span className="font-medium">median</span> of per-hotel minutes per bucket.
            </p>
          </div>
        </CardContent>
      </Card>

      {(insights.peakHour || insights.peakDay || insights.slowHour || insights.slowDay) && (
        <Card className="">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Headline signals</CardTitle>
            <CardDescription className="text-xs">Derived from aggregated profiles (directional, not a statistical benchmark).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-grey-800">
              {insights.peakHour && <li>Busiest email hour: <span className="font-medium">{insights.peakHour.label} ({formatPct01(insights.peakHour.meanShare)} of volume)</span></li>}
              {insights.peakDay && <li>Busiest weekday: <span className="font-medium">{insights.peakDay.day} ({formatPct01(insights.peakDay.meanShare)})</span></li>}
              {insights.slowHour && <li>Slowest median response by hour: <span className="font-medium">{insights.slowHour.label} ({formatMinutes(insights.slowHour.medianMinutes)})</span></li>}
              {insights.slowDay && <li>Slowest median response by weekday: <span className="font-medium">{insights.slowDay.day} ({formatMinutes(insights.slowDay.medianMinutes)})</span></li>}
            </ul>
          </CardContent>
        </Card>
      )}

      {!volumeAgg && !responseAgg && (
        <p className="text-sm text-muted-foreground">
          No parseable <code className="rounded bg-muted px-1">volume_profile_*</code> or <code className="rounded bg-muted px-1">response_profile_*</code> fields in this cohort.
        </p>
      )}

      {volumeAgg && volumeHourlyChart.length > 0 && (
        <Card className="">
          <CardHeader>
            <CardTitle className="text-base">Inbound volume by hour</CardTitle>
            <CardDescription className="text-xs">{volumeAgg.hotelsWithHourly} hotels · y = average share (%).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeHourlyConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeHourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="meanPct" stroke="var(--color-meanShare)" strokeWidth={2} dot={false} name="Avg. share %" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {volumeAgg && volumeWeekdayChart.length > 0 && (
        <Card className="">
          <CardHeader>
            <CardTitle className="text-base">Inbound volume by weekday</CardTitle>
            <CardDescription className="text-xs">{volumeAgg.hotelsWithWeekday} hotels with weekday volume profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={volumeWeekdayConfig} className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeWeekdayChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="meanPct" fill="var(--color-meanShare)" radius={[4, 4, 0, 0]} name="Avg. share %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {responseAgg && responseHourlyChart.some((d) => d.medianM != null) && (
        <Card className="">
          <CardHeader>
            <CardTitle className="text-base">Median response time by hour</CardTitle>
            <CardDescription className="text-xs">{responseAgg.hotelsWithHourly} hotels · minutes (sparse hours omitted in median).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={responseHourlyConfig} className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={responseHourlyChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={6} tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line type="monotone" dataKey="medianM" stroke="var(--color-medianMinutes)" strokeWidth={2} dot={false} name="Median min" />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {responseAgg && responseWeekdayChart.some((d) => d.medianM != null) && (
        <Card className="">
          <CardHeader>
            <CardTitle className="text-base">Median response time by weekday</CardTitle>
            <CardDescription className="text-xs">{responseAgg.hotelsWithWeekday} hotels with weekday response profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={responseHourlyConfig} className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={responseWeekdayChart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="medianM" fill="var(--color-medianMinutes)" radius={[4, 4, 0, 0]} name="Median min" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {categories.length > 0 && (
        <Card className="">
          <CardHeader>
            <CardTitle className="text-base">Category mix (mean share)</CardTitle>
            <CardDescription className="text-xs">Average of each category's share across hotels that report it (top 12 shown).</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={categoryBarConfig} className="h-[min(360px,50vh)] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="meanPct" fill="var(--color-meanPct)" radius={[0, 4, 4, 0]} name="Mean %" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            {categories.length > 12 && (
              <ScrollArea className="mt-4 max-h-40">
                <p className="text-xs text-muted-foreground">
                  Other categories:{' '}
                  {categories.slice(12).map((c) => `${c.category} (${formatPct01(c.meanShare)})`).join(' · ')}
                </p>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>

  );
}
