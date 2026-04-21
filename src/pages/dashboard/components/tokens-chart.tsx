import { IconCoins } from '@tabler/icons-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { DailyTokenDataPoint } from '@/types/api';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

const chartConfig = {
  input_tokens: { label: 'Input Tokens', color: 'var(--chart-1)' },
  output_tokens: { label: 'Output Tokens', color: 'var(--chart-2)' },
} satisfies ChartConfig;

export function TokensChart({
  data,
  loading,
}: {
  data?: DailyTokenDataPoint[];
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#271a0012] dark:bg-primary/20">
            <IconCoins size={16} className="text-foreground" />
          </div>
          Token Usage
        </CardTitle>
        <CardDescription>Daily input & output token breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[280px] w-full rounded-lg" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="dashInputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-input_tokens)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-input_tokens)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="dashOutputGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-output_tokens)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-output_tokens)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tickLine={false}
                axisLine={false}
                fontSize={12}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickMargin={8} />
              <ChartTooltip
                content={<ChartTooltipContent labelFormatter={formatDate} />}
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="input_tokens"
                stackId="1"
                stroke="var(--color-input_tokens)"
                strokeWidth={2}
                fill="url(#dashInputGradient)"
              />
              <Area
                type="monotone"
                dataKey="output_tokens"
                stackId="1"
                stroke="var(--color-output_tokens)"
                strokeWidth={2}
                fill="url(#dashOutputGradient)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
