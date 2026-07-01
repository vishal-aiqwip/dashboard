import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { JudgeBreakdown } from '@/pages/email-performance/_data/transform';

// ── Verdict colours ────────────────────────────────────────────────────────────

const VERDICT_COLOR: Record<string, string> = {
  good: '#22c55e',
  acceptable: '#86efac',
  poor: '#f59e0b',
  wrong: '#ef4444',
  missed_outcome: '#f97316',
};

const CHART_COLORS = [
  '#6366f1',
  '#22d3ee',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#a78bfa',
];

// ── Stat cards ─────────────────────────────────────────────────────────────────

type VerdictCardProps = {
  label: string;
  count: number;
  pct: string;
  color: string;
  subtitle?: string;
};

function VerdictCard({ label, count, pct, color, subtitle }: VerdictCardProps) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <div className="flex items-center gap-1.5">
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs text-muted-foreground">{subtitle ?? `${pct}%`}</p>
    </Card>
  );
}

function JudgedEmailsCard({ judged, total }: { judged: number; total: number }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <p className="text-xs font-medium text-muted-foreground">Judged Emails</p>
      <p className="text-2xl font-bold">{judged}</p>
      <p className="text-xs text-muted-foreground">of {total} total</p>
    </Card>
  );
}

// ── Donut chart ────────────────────────────────────────────────────────────────

function DonutChart({
  title,
  description,
  data,
  colors,
}: {
  title: string;
  description?: string;
  data: { label: string; count: number }[];
  colors: Record<string, string> | string[];
}) {
  if (!data.length) return null;
  const getColor = (label: string, i: number) =>
    Array.isArray(colors)
      ? colors[i % colors.length]
      : (colors[label.toLowerCase()] ?? CHART_COLORS[i % CHART_COLORS.length]);

  const pieData = data.map((d, i) => ({
    name: d.label,
    value: d.count,
    fill: getColor(d.label, i),
  }));

  const config: ChartConfig = Object.fromEntries(
    data.map((d, i) => [d.label, { label: d.label, color: getColor(d.label, i) }]),
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="mx-auto aspect-square h-56">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84}>
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend content={<ChartLegendContent nameKey="name" />} />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Vertical bar chart ─────────────────────────────────────────────────────────

function BarChartCard({
  title,
  description,
  data,
}: {
  title: string;
  description?: string;
  data: { label: string; count: number }[];
}) {
  if (!data.length) return null;
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const config: ChartConfig = { count: { label: 'Count', color: 'var(--chart-1)' } };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="h-56 w-full">
          <BarChart data={sorted} margin={{ top: 4, right: 8, left: -16, bottom: 48 }}>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, angle: -35, textAnchor: 'end' }}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {sorted.map((entry, i) => (
                <Cell key={entry.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

type Props = {
  data: JudgeBreakdown;
  totalEmails?: number;
};

export function JudgeBreakdownSection({ data, totalEmails = 0 }: Props) {
  const hasData =
    data.by_verdict.length > 0 ||
    data.by_primary_failure.length > 0 ||
    data.by_root_cause.length > 0;

  if (!hasData) return null;

  const verdictMap = new Map(data.by_verdict.map((v) => [v.label.toLowerCase(), v.count]));
  const judgedTotal = data.by_verdict.reduce((sum, v) => sum + v.count, 0);
  const pct = (n: number) =>
    judgedTotal > 0 ? ((n / judgedTotal) * 100).toFixed(1) : '0.0';

  const good = verdictMap.get('good') ?? 0;
  const acceptable = verdictMap.get('acceptable') ?? 0;
  const poor = verdictMap.get('poor') ?? 0;
  const wrong = verdictMap.get('wrong') ?? 0;
  const missedOutcome = verdictMap.get('missed_outcome') ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          AI Quality Assessment
        </h2>
      </div>

      {/* Verdict stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <JudgedEmailsCard judged={judgedTotal} total={totalEmails} />
        <VerdictCard label="Good" count={good} pct={pct(good)} color={VERDICT_COLOR.good} />
        <VerdictCard label="Acceptable" count={acceptable} pct={pct(acceptable)} color={VERDICT_COLOR.acceptable} />
        <VerdictCard label="Poor" count={poor} pct={pct(poor)} color={VERDICT_COLOR.poor} />
        <VerdictCard label="Wrong" count={wrong} pct={pct(wrong)} color={VERDICT_COLOR.wrong} />
        <VerdictCard
          label="Missed Outcome"
          count={missedOutcome}
          pct={pct(missedOutcome)}
          color={VERDICT_COLOR.missed_outcome}
          subtitle="action not acknowledged"
        />
      </div>

      {/* Row 1: donut | h-bar | h-bar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <DonutChart
          title="Verdict Distribution"
          description="LLM judge quality assessment split"
          data={data.by_verdict}
          colors={VERDICT_COLOR}
        />
        <BarChartCard
          title="Primary Failure Types"
          description="Most impactful failure per AI draft"
          data={data.by_primary_failure}
        />
        <BarChartCard
          title="Root Causes"
          description="Why the failure occurred"
          data={data.by_root_cause}
        />
      </div>

      {/* Row 2: h-bar | h-bar | donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChartCard
          title="Fix Layer"
          description="Smallest intervention to prevent failure"
          data={data.by_fix_layer}
        />
        <BarChartCard
          title="Fact Status"
          description="Factual accuracy of AI drafts"
          data={data.by_fact_status}
        />
        <DonutChart
          title="Fixable Without New Systems"
          description="Issues resolvable with current tools vs. requiring new integrations"
          data={data.by_could_be_fixed_without_new_systems}
          colors={['#22c55e', '#f59e0b', '#6366f1']}
        />
      </div>
    </div>
  );
}
