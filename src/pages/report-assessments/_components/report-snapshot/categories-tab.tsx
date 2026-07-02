import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { formatHours, toLabel } from './helpers';
import { SectionHeader } from './section-header';
import type { ServicePerformance, WorkloadProfile } from './types';

interface CategoriesTabProps {
  workload: WorkloadProfile | null;
  perf: ServicePerformance;
  guestEmailVolume: number;
}

export function CategoriesTab({ workload, perf, guestEmailVolume }: CategoriesTabProps) {
  const volumeByCategory = (workload?.volume_by_category ?? []).slice(0, 10).map((v) => ({
    category: toLabel(v.value),
    count: v.count,
  }));

  const guestVol = guestEmailVolume || 1;
  const responseTimeByCategory = (perf?.response_time_by_category ?? [])
    .filter((r) => r.median_minutes != null || r.p90_minutes != null)
    .map((r) => ({
      category: toLabel(r.category),
      median: r.median_minutes ?? 0,
      p90: r.p90_minutes ?? 0,
      count: r.email_count,
      percentage:
        r.email_count > 0 ? +((r.email_count / guestVol) * 100).toFixed(1) : 0,
    }));

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-grey-100 shadow-sm">
        <CardHeader className="pb-2">
          <SectionHeader
            title="Category mix"
            description="Where demand clusters in the guest inbox."
          />
        </CardHeader>
        <CardContent className="h-[480px] px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={volumeByCategory}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 16, bottom: 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="category"
                type="category"
                width={140}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-grey-100 shadow-sm">
        <CardHeader className="pb-2">
          <SectionHeader
            title="Response time by category"
            description="Median vs p90 — each on its own axis."
          />
        </CardHeader>
        <CardContent className="h-[480px] px-4 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={responseTimeByCategory}
              margin={{ top: 8, right: 48, left: 48, bottom: 72 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={72}
                interval={0}
              />
              <YAxis
                yAxisId="median"
                orientation="left"
                tickFormatter={(v) => formatHours(v)}
                width={48}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                yAxisId="p90"
                orientation="right"
                tickFormatter={(v) => formatHours(v)}
                width={48}
                tick={{ fontSize: 11 }}
              />
              <Tooltip formatter={(v: number) => formatHours(v)} />
              <Legend verticalAlign="bottom" />
              <Line
                yAxisId="median"
                type="monotone"
                dataKey="median"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb' }}
                name="Median"
              />
              <Line
                yAxisId="p90"
                type="monotone"
                dataKey="p90"
                stroke="#059669"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={{ r: 4, fill: '#059669' }}
                name="p90"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
