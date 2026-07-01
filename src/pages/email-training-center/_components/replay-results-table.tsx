import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ReplayEmailResult } from '@/services/emailTrainingCenter/emailTrainingCenter';

import { ResultRow } from './result-row';

type Props = {
  results: ReplayEmailResult[];
  onExport: (format: 'csv' | 'json') => void;
};

export function ReplayResultsTable({ results, onExport }: Props) {
  return (
    <Card className="border border-border/60 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold">Per-Email Results</CardTitle>
            <CardDescription className="text-xs">Click a row to expand the side-by-side draft comparison</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
                <Download className="h-3.5 w-3.5" />Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport('csv')}>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport('json')}>Export as JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3 font-medium">Subject</th>
                <th className="py-2.5 px-3 font-medium">Original Class</th>
                <th className="py-2.5 px-3 font-medium text-right">Original Dist.</th>
                <th className="py-2.5 px-3 font-medium">New Class</th>
                <th className="py-2.5 px-3 font-medium text-right">New Dist.</th>
                <th className="py-2.5 px-3 font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => <ResultRow key={r.interaction_id} result={r} />)}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
