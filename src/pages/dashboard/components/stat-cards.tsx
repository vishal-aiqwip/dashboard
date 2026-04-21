import {
  IconMessageCircle,
  IconMessages,
  IconCoins,
} from '@tabler/icons-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats } from '@/types/api';
import { Bot } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  subtitle?: string;
  color: string;
  bg: string;
  loading: boolean;
}

function StatCard({ icon, title, value, subtitle, color, bg, loading }: StatCardProps) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent>
        <div className="flex gap-3 items-center">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}>
            {icon}
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
        </div>
        <div className="min-w-0 mt-3">
          {loading ? (
            <Skeleton className="h-7 w-20 mt-1 rounded" />
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <span className="text-xs text-muted-foreground mt-0.5">{subtitle}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardStatCards({
  data,
  loading,
}: {
  data?: DashboardStats;
  loading: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<Bot size={20} />}
        title="Total Agents"
        value={data ? formatNumber(data.total_agents) : undefined}
        color="text-foreground"
        bg="bg-[#271a0012] dark:bg-primary/20"
        loading={loading}
      />
      <StatCard
        icon={<IconMessageCircle size={20} />}
        title="Conversations"
        value={data ? formatNumber(data.total_conversations) : undefined}
        color="text-foreground"
        bg="bg-[#271a0012] dark:bg-primary/20"
        loading={loading}
      />
      <StatCard
        icon={<IconMessages size={20} />}
        title="Messages"
        value={data ? formatNumber(data.total_messages) : undefined}
        color="text-foreground"
        bg="bg-[#271a0012] dark:bg-primary/20"
        loading={loading}
      />
      <StatCard
        icon={<IconCoins size={20} />}
        title="Total Tokens"
        value={
          data
            ? formatNumber(data.total_tokens_input + data.total_tokens_output)
            : undefined
        }
        subtitle={
          data
            ? `${formatNumber(data.total_tokens_input)} in / ${formatNumber(data.total_tokens_output)} out`
            : undefined
        }
        color="text-foreground"
        bg="bg-[#271a0012] dark:bg-primary/20"
        loading={loading}
      />
    </div>
  );
}
