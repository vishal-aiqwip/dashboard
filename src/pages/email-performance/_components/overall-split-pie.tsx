import { Cell, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { EmailPerformanceData, EditClass } from '@/pages/email-performance/_data/mock';

const chartConfig = {
  accepted: { label: 'Accepted', color: '#22c55e' },
  light: { label: 'Light', color: '#86efac' },
  medium: { label: 'Medium', color: '#f59e0b' },
  heavy: { label: 'Heavy', color: '#fca5a5' },
  rewritten: { label: 'Rewritten', color: '#dc2626' },
} satisfies ChartConfig;

const COLOR_BY_CLASS: Record<EditClass, string> = {
  accepted: 'var(--color-accepted)',
  light: 'var(--color-light)',
  medium: 'var(--color-medium)',
  heavy: 'var(--color-heavy)',
  rewritten: 'var(--color-rewritten)',
};

type Props = { data: EmailPerformanceData['overallSplit'] };

export function OverallSplitPie({ data }: Props) {
  const pieData = data.map((d) => ({ name: d.class, value: d.count, fill: COLOR_BY_CLASS[d.class] }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Overall Split</CardTitle>
        <CardDescription>Proportion across the full period</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-70">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={96}>
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
