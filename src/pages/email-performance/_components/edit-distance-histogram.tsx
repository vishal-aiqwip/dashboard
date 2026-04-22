import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { EmailPerformanceData } from '@/pages/email-performance/_data/mock';

const chartConfig = {
  count: { label: 'Emails', color: 'var(--chart-2)' },
} satisfies ChartConfig;

type Props = { data: EmailPerformanceData['editDistanceHistogram'] };

export function EditDistanceHistogram({ data }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Edit Distance Histogram</CardTitle>
        <CardDescription>
          Number of emails per edit-distance bucket — shows AI draft quality distribution
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
            <XAxis
              dataKey="bucket"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              tickMargin={8}
            />
            <YAxis tickLine={false} axisLine={false} fontSize={11} tickMargin={8} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="var(--color-count)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
