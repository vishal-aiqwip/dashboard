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
import type { CategoryDailyPoint } from '@/pages/email-performance/_data/mock';

const chartConfig = {
  faq_general_info: { label: 'Faq General Info', color: 'var(--chart-2)' },
  room_bookings: { label: 'Room Bookings', color: 'var(--chart-1)' },
  transportation: { label: 'Transportation', color: 'var(--chart-4)' },
} satisfies ChartConfig;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type Props = { data: CategoryDailyPoint[] };

export function CategoryEditDistanceChart({ data }: Props) {
  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Avg Edit Distance per Category (Daily)</CardTitle>
          <CardDescription>How much editing was required per category each day</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-62.5 w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillCatFaq" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-faq_general_info)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-faq_general_info)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCatRooms" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-room_bookings)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-room_bookings)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillCatTransport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-transportation)" stopOpacity={0.7} />
                <stop offset="95%" stopColor="var(--color-transportation)" stopOpacity={0.05} />
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
              dataKey="transportation"
              type="natural"
              fill="url(#fillCatTransport)"
              stroke="var(--color-transportation)"
            />
            <Area
              dataKey="room_bookings"
              type="natural"
              fill="url(#fillCatRooms)"
              stroke="var(--color-room_bookings)"
            />
            <Area
              dataKey="faq_general_info"
              type="natural"
              fill="url(#fillCatFaq)"
              stroke="var(--color-faq_general_info)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
