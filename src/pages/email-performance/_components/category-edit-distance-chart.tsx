import { useMemo } from 'react';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, type TooltipProps } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { CategoryDailyPoint } from '@/pages/email-performance/_data/mock';

const AREA_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function toLabel(key: string) {
  return key
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Custom tooltip — hides entries where value is 0 to reduce clutter on sparse dates
function CategoryTooltip(props: TooltipProps<number, string>) {
  if (!props.active || !props.payload?.length) return null;
  const nonZero = props.payload.filter((p) => (p.value as number) !== 0);
  if (!nonZero.length) return null;
  return (
    <ChartTooltipContent
      {...props}
      payload={nonZero}
      labelFormatter={formatDate}
      indicator="dot"
    />
  );
}

type Props = { data: CategoryDailyPoint[] };

export function CategoryEditDistanceChart({ data }: Props) {
  // Derive category keys dynamically from data — any key that isn't "date"
  const categories = useMemo(() => {
    if (!data.length) return [];
    return Object.keys(data[0]).filter((k) => k !== 'date');
  }, [data]);

  const config: ChartConfig = useMemo(
    () =>
      Object.fromEntries(
        categories.map((cat, i) => [
          cat,
          { label: toLabel(cat), color: AREA_COLORS[i % AREA_COLORS.length] },
        ]),
      ),
    [categories],
  );

  if (!data.length || !categories.length) {
    return (
      <Card className="pt-0">
        <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
          <div className="grid flex-1 gap-1">
            <CardTitle>Avg Edit Distance per Category (Daily)</CardTitle>
            <CardDescription>How much editing was required per category each day</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12 text-sm text-muted-foreground">
          No category data for this period
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Avg Edit Distance per Category (Daily)</CardTitle>
          <CardDescription>How much editing was required per category each day</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={config} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              {categories.map((cat) => (
                <linearGradient key={cat} id={`fillCat_${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${cat})`} stopOpacity={0.7} />
                  <stop offset="95%" stopColor={`var(--color-${cat})`} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={formatDate}
            />
            <YAxis
              domain={[0, 1]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => v.toFixed(2)}
            />
            <ChartTooltip cursor={false} content={<CategoryTooltip />} />
            {categories.map((cat) => (
              <Area
                key={cat}
                dataKey={cat}
                type="natural"
                fill={`url(#fillCat_${cat})`}
                stroke={`var(--color-${cat})`}
              />
            ))}
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
