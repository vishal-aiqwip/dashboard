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
  rate: { label: 'Acceptance rate', color: 'var(--chart-4)' },
  sent: { label: 'Sent count', color: 'var(--chart-1)' },
} satisfies ChartConfig;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = { data: EmailPerformanceData['acceptanceRateOverTime'] };

export function AcceptanceRateChart({ data }: Props) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Acceptance Rate Over Time</CardTitle>
          <CardDescription>% of AI drafts sent without any edits</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillAcceptRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-rate)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-rate)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillAcceptSent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sent)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-sent)" stopOpacity={0.05} />
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
              yAxisId="left"
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(v) => `${v}%`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={formatDate} indicator="dot" />}
            />
            <Area
              yAxisId="right"
              dataKey="sent"
              type="natural"
              fill="url(#fillAcceptSent)"
              stroke="var(--color-sent)"
              strokeDasharray="4 4"
            />
            <Area
              yAxisId="left"
              dataKey="rate"
              type="natural"
              fill="url(#fillAcceptRate)"
              stroke="var(--color-rate)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
