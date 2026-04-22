import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { HeatmapRow } from '@/pages/email-performance/_data/mock';

type Props = {
  weeks: string[];
  rows: HeatmapRow[];
};

// Map a value in [0, 1] to a Tailwind-friendly primary bg with varying opacity.
// Clamped and bucketed so cells get visibly distinct tones.
function cellClasses(value: number): string {
  if (value <= 0) return 'bg-muted/40 text-muted-foreground';
  if (value < 0.1) return 'bg-primary/10 text-foreground';
  if (value < 0.25) return 'bg-primary/25 text-foreground';
  if (value < 0.5) return 'bg-primary/45 text-primary-foreground';
  if (value < 0.75) return 'bg-primary/70 text-primary-foreground';
  return 'bg-primary/90 text-primary-foreground';
}

export function CategoryHeatmap({ weeks, rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Edit Distance Heatmap (Category × Week)
        </CardTitle>
        <CardDescription>
          Average edit distance per category per ISO week. Darker = more editing required.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <div
            className="grid min-w-[520px] gap-2"
            style={{
              gridTemplateColumns: `minmax(160px, 1fr) repeat(${weeks.length}, minmax(72px, 1fr))`,
            }}
          >
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Category
            </div>
            {weeks.map((w) => (
              <div
                key={w}
                className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {w}
              </div>
            ))}
            {rows.map((row) => (
              <HeatmapRowCells key={row.label} row={row} weeks={weeks} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Low edit</span>
          <div className="h-2 w-40 rounded-full bg-gradient-to-r from-muted via-primary/50 to-primary" />
          <span>High edit</span>
        </div>
      </CardContent>
    </Card>
  );
}

function HeatmapRowCells({ row, weeks }: { row: HeatmapRow; weeks: string[] }) {
  const byWeek = new Map(row.cells.map((c) => [c.week, c.value]));
  return (
    <>
      <div className="flex items-center text-sm font-medium">{row.label}</div>
      {weeks.map((w) => {
        const value = byWeek.get(w) ?? 0;
        return (
          <div
            key={w}
            title={`${row.label} · ${w}: ${value.toFixed(3)}`}
            className={cn(
              'flex h-10 items-center justify-center rounded-md text-xs font-semibold tabular-nums transition-colors',
              cellClasses(value)
            )}
          >
            {value > 0 ? value.toFixed(2) : ''}
          </div>
        );
      })}
    </>
  );
}
