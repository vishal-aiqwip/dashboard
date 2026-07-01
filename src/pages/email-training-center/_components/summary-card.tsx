import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ReplaySummary } from '@/services/emailTrainingCenter/emailTrainingCenter';

export function SummaryCard({ summary }: { summary: ReplaySummary }) {
  const pct = (summary.avg_improvement * 100).toFixed(1);
  const improved = summary.avg_improvement > 0;

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Test Results Summary</CardTitle>
        <CardDescription className="text-xs">{summary.total_emails} emails tested</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Avg Original Score</p>
            <p className="text-lg font-semibold tabular-nums">{(summary.avg_original_score * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg New Score</p>
            <p className="text-lg font-semibold tabular-nums">{(summary.avg_new_score * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Avg Improvement</p>
            <p className={`text-lg font-semibold tabular-nums ${improved ? 'text-green-600' : summary.avg_improvement < 0 ? 'text-red-600' : ''}`}>
              {improved ? '+' : ''}{pct}%
            </p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Improved</p>
              <p className="text-lg font-semibold text-green-600">{summary.improved_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Worsened</p>
              <p className="text-lg font-semibold text-red-600">{summary.worsened_count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Same</p>
              <p className="text-lg font-semibold text-muted-foreground">{summary.unchanged_count}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
