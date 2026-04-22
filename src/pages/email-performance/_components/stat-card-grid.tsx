import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconFileText,
  IconSend,
  IconPercentage,
  IconChecks,
  IconPencil,
  IconMessageCircle2,
  IconUsers,
  IconInfoCircle,
  type Icon,
} from '@tabler/icons-react';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type {
  EmailPerformanceData,
  MetricHint,
  MetricValue,
  SecondaryMetric,
} from '@/pages/email-performance/_data/mock';

function formatPct(n: number): string {
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function deltaClass(deltaPct: number | undefined, hint: MetricHint): string {
  if (!deltaPct || hint === 'neutral' || hint === 'ratio') return 'text-muted-foreground';
  const good =
    (deltaPct > 0 && hint === 'higher-is-better') || (deltaPct < 0 && hint === 'lower-is-better');
  return good ? 'text-emerald-600' : 'text-rose-600';
}

function Sparkline({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-3 w-10 shrink-0', className)}
      aria-hidden
    >
      <path
        d="M0 8 L6 6 L12 9 L18 3 L24 7 L30 2 L36 6 L40 4"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type PrimaryCardProps = {
  title: string;
  icon: Icon;
  metric: MetricValue;
  valueFormatter: (n: number) => string;
};

function PrimaryCard({ title, icon: IconComp, metric, valueFormatter }: PrimaryCardProps) {
  const deltaColor = deltaClass(metric.deltaPct, metric.hint);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <IconComp size={15} />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight">{valueFormatter(metric.value)}</p>
        <div className="flex items-center gap-1.5 text-xs">
          {metric.deltaPct !== undefined && metric.hint !== 'ratio' && metric.hint !== 'neutral' ? (
            <>
              <Sparkline className={deltaColor} />
              <span className={cn('font-medium', deltaColor)}>{formatPct(metric.deltaPct)}</span>
            </>
          ) : (
            <Sparkline className="text-muted-foreground/60" />
          )}
          {metric.note && (
            <span className="truncate text-muted-foreground">{metric.note}</span>
          )}
          <IconInfoCircle size={13} className="shrink-0 text-muted-foreground/60" />
        </div>
      </CardContent>
    </Card>
  );
}

function SecondaryCard({
  title,
  metric,
  formatter,
}: {
  title: string;
  metric: SecondaryMetric;
  formatter: (n: number) => string;
}) {
  const diffPct =
    metric.previous === 0 ? 0 : ((metric.value - metric.previous) / metric.previous) * 100;
  const isUp = diffPct > 0;
  const isDown = diffPct < 0;
  const ArrowIcon = isUp ? IconArrowUpRight : isDown ? IconArrowDownRight : null;
  const deltaColor = isUp
    ? 'text-emerald-600 bg-emerald-500/10'
    : isDown
    ? 'text-rose-600 bg-rose-500/10'
    : 'text-muted-foreground bg-muted';

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatter(metric.value)}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              from {formatter(metric.previous)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-semibold shrink-0',
            deltaColor
          )}
        >
          {ArrowIcon && <ArrowIcon size={12} />}
          {isUp ? '+' : ''}
          {diffPct.toFixed(1)}%
        </span>
      </CardContent>
    </Card>
  );
}

const fmtInt = (n: number) => Math.round(n).toLocaleString();
const fmtPctValue = (n: number) => `${n.toFixed(1)}%`;
const fmtDecimal3 = (n: number) => n.toFixed(3);
const fmtDecimal2 = (n: number) => n.toFixed(2);

type Props = { kpis: EmailPerformanceData['kpis'] };

export function StatCardGrid({ kpis }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
        <PrimaryCard
          title="Drafts Created"
          icon={IconFileText}
          metric={kpis.draftsCreated}
          valueFormatter={fmtInt}
        />
        <PrimaryCard
          title="Drafts Sent"
          icon={IconSend}
          metric={kpis.draftsSent}
          valueFormatter={fmtInt}
        />
        <PrimaryCard
          title="Send Rate"
          icon={IconPercentage}
          metric={kpis.sendRate}
          valueFormatter={fmtPctValue}
        />
        <PrimaryCard
          title="Acceptance Rate"
          icon={IconChecks}
          metric={kpis.acceptanceRate}
          valueFormatter={fmtPctValue}
        />
        <PrimaryCard
          title="Avg Edit Distance"
          icon={IconPencil}
          metric={kpis.avgEditDistance}
          valueFormatter={fmtDecimal3}
        />
        <PrimaryCard
          title="Avg Semantic Similarity"
          icon={IconMessageCircle2}
          metric={kpis.avgSemanticSimilarity}
          valueFormatter={fmtDecimal3}
        />
        <PrimaryCard
          title="Unique Guest Senders"
          icon={IconUsers}
          metric={kpis.uniqueGuestSenders}
          valueFormatter={fmtInt}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SecondaryCard title="Avg Draft Tokens" metric={kpis.avgDraftTokens} formatter={fmtInt} />
        <SecondaryCard title="Avg Final Tokens" metric={kpis.avgFinalTokens} formatter={fmtInt} />
        <SecondaryCard
          title="Draft → Final Ratio"
          metric={kpis.draftFinalRatio}
          formatter={fmtDecimal2}
        />
      </div>
    </div>
  );
}
