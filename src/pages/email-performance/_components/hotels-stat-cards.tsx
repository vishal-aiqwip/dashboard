import {
  IconAlertTriangle,
  IconBuildingSkyscraper,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconSparkles,
  type Icon,
} from '@tabler/icons-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HotelStats } from '@/pages/email-performance/_data/mock';

type CardTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info';

const TONE_CLASSES: Record<CardTone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/15 text-emerald-600',
  danger: 'bg-rose-500/15 text-rose-600',
  warning: 'bg-amber-500/15 text-amber-600',
  info: 'bg-accent text-accent-foreground',
};

function HotelStatCard({
  title,
  value,
  icon: IconComp,
  tone,
}: {
  title: string;
  value: number;
  icon: Icon;
  tone: CardTone;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
              TONE_CLASSES[tone]
            )}
          >
            <IconComp size={15} />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {value.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

export function HotelsStatCards({ stats }: { stats: HotelStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <HotelStatCard
        title="Total Hotels"
        value={stats.total}
        icon={IconBuildingSkyscraper}
        tone="neutral"
      />
      <HotelStatCard
        title="Active (7d)"
        value={stats.active7d}
        icon={IconCircleCheckFilled}
        tone="success"
      />
      <HotelStatCard
        title="Inactive (7d)"
        value={stats.inactive7d}
        icon={IconCircleXFilled}
        tone="danger"
      />
      <HotelStatCard
        title="Needs Attention"
        value={stats.needsAttention}
        icon={IconAlertTriangle}
        tone="warning"
      />
      <HotelStatCard
        title="Auto-Drafts On"
        value={stats.autoDraftsOn}
        icon={IconSparkles}
        tone="info"
      />
    </div>
  );
}
