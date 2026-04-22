import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

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
import type { EmailPerformanceData } from '@/pages/email-performance/_data/mock';

const chartConfig = {
  avg: { label: 'Avg edit dist.', color: 'var(--chart-2)' },
  median: { label: 'Median edit dist.', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = { data: EmailPerformanceData['editDistanceOverTime'] };

export function EditDistanceChart({ data }: Props) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Edit Distance Over Time</CardTitle>
          <CardDescription>
            Avg &amp; median edit distance (0 = accepted as-is, 1 = fully rewritten)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillEditAvg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-avg)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-avg)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillEditMedian" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-median)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-median)" stopOpacity={0.1} />
              </linearGradient>
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
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={formatDate} indicator="dot" />}
            />
            <Area
              dataKey="median"
              type="natural"
              fill="url(#fillEditMedian)"
              stroke="var(--color-median)"
            />
            <Area
              dataKey="avg"
              type="natural"
              fill="url(#fillEditAvg)"
              stroke="var(--color-avg)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
