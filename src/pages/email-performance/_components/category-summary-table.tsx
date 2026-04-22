import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { CategoryRow } from '@/pages/email-performance/_data/mock';

function AcceptanceBadge({ value }: { value: number }) {
  const tone =
    value >= 90
      ? 'bg-emerald-500/15 text-emerald-600'
      : value >= 50
      ? 'bg-amber-500/15 text-amber-600'
      : 'bg-rose-500/15 text-rose-600';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        tone
      )}
    >
      {value.toFixed(1)}%
    </span>
  );
}

type Props = { rows: CategoryRow[] };

export function CategorySummaryTable({ rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Category Performance</CardTitle>
        <CardDescription>Aggregated edit stats per email category</CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-6 py-3 text-left font-medium">Category</th>
                <th className="px-6 py-3 text-right font-medium">Emails</th>
                <th className="px-6 py-3 text-right font-medium">Avg edit dist.</th>
                <th className="px-6 py-3 text-right font-medium">Median</th>
                <th className="px-6 py-3 text-right font-medium">Acceptance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={row.key}
                  className={cn(
                    'transition-colors hover:bg-muted/40',
                    i < rows.length - 1 && 'border-b'
                  )}
                >
                  <td className="px-6 py-4 font-medium">{row.label}</td>
                  <td className="px-6 py-4 text-right tabular-nums">{row.emails}</td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    {row.avgEditDistance.toFixed(3)}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">{row.median.toFixed(3)}</td>
                  <td className="px-6 py-4 text-right">
                    <AcceptanceBadge value={row.acceptance} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
