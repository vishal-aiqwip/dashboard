import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { EmailPerformanceData } from '@/pages/email-performance/_data/mock';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en', { month: '2-digit', day: '2-digit' });
}

const chartConfig = {
  accepted: { label: 'Accepted', color: '#22c55e' },
  light: { label: 'Light', color: '#86efac' },
  medium: { label: 'Medium', color: '#f59e0b' },
  heavy: { label: 'Heavy', color: '#fca5a5' },
  rewritten: { label: 'Rewritten', color: '#dc2626' },
} satisfies ChartConfig;

type Props = { data: EmailPerformanceData['editClassOverTime'] };

export function EditClassBar({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Edit Class Over Time</CardTitle>
        <CardDescription>Daily breakdown: accepted / light / medium / heavy / rewritten</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-70 w-full">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent labelFormatter={formatDate} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="accepted" stackId="class" fill="var(--color-accepted)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="light" stackId="class" fill="var(--color-light)" />
            <Bar dataKey="medium" stackId="class" fill="var(--color-medium)" />
            <Bar dataKey="heavy" stackId="class" fill="var(--color-heavy)" />
            <Bar dataKey="rewritten" stackId="class" fill="var(--color-rewritten)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
