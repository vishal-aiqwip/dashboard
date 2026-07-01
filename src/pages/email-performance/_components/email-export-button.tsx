import { useState } from 'react';

import { IconDownload, IconLoader2 } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { emailPerformanceService } from '@/services/emailPerformance/emailPerformance';
import type { EmailFilters } from './emails-filters';

const JUDGE_FIELDS = new Set([
  'verdict',
  'primary_failure',
  'root_cause',
  'fix_layer',
  'specific_fix',
  'fact_status',
  'could_be_fixed_without_new_systems',
  'missed_operational_outcome',
  'judge_summary',
]);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function jsonToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(','), ...rows.map((r) => keys.map((k) => escape(r[k])).join(','))].join('\n');
}

type Props = {
  baseParams: { from_date: string; to_date: string; organization_id?: string };
  filters: EmailFilters;
};

export function EmailExportButton({ baseParams, filters }: Props) {
  const [includeThreads, setIncludeThreads] = useState(false);
  const [includeToolCalls, setIncludeToolCalls] = useState(false);
  const [includeJudgeAnalysis, setIncludeJudgeAnalysis] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const exportParams: Record<string, unknown> = {
        ...baseParams,
        ...(filters.mailbox !== 'all' && { mailbox_email: filters.mailbox }),
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.editClass !== 'all' && { edit_class: filters.editClass }),
        ...(filters.tripType !== 'all' && { trip_type: filters.tripType }),
        ...(filters.verdict !== 'all' && { verdict: filters.verdict }),
        ...(filters.failureType !== 'all' && { primary_failure: filters.failureType }),
        ...(filters.editDistMin !== '' && { min_edit_distance: Number(filters.editDistMin) }),
        ...(filters.editDistMax !== '' && { max_edit_distance: Number(filters.editDistMax) }),
        ...(filters.search.trim() && { search_text: filters.search.trim() }),
      };

      const rawText = await emailPerformanceService.getEmailsExport(exportParams);
      const parsed = JSON.parse(rawText) as
        | { rows?: Record<string, unknown>[] }
        | Record<string, unknown>[];
      let rows: Record<string, unknown>[] = Array.isArray(parsed)
        ? parsed
        : ((parsed as { rows?: Record<string, unknown>[] }).rows ?? []);

      if (includeToolCalls) {
        const ids = rows
          .map((r) => r.interaction_id as string)
          .filter(Boolean)
          .slice(0, 500);
        if (ids.length) {
          try {
            const tcResult = await emailPerformanceService.getBulkToolCalls(ids);
            const tcMap = tcResult.tool_calls_by_interaction ?? {};
            rows = rows.map((r) => ({
              ...r,
              tool_calls: tcMap[r.interaction_id as string] ?? [],
            }));
          } catch (enrichErr) {
            console.warn('Tool calls enrichment failed, skipping:', enrichErr);
          }
        }
      }

      if (includeThreads && baseParams.organization_id) {
        // filter rows that have a conversation_id first, then cap at 50
        const items = rows
          .filter((r) => r.conversation_id && r.mailbox_email)
          .slice(0, 50)
          .map((r) => ({
            mailbox: r.mailbox_email as string,
            conversation_id: r.conversation_id as string,
          }));
        if (items.length) {
          try {
            const threadMap = await emailPerformanceService.getBulkThreads(
              baseParams.organization_id,
              items,
            );
            rows = rows.map((r) => ({
              ...r,
              email_thread: threadMap[r.conversation_id as string] ?? null,
            }));
          } catch (enrichErr) {
            console.warn('Thread enrichment failed, skipping:', enrichErr);
          }
        }
      }

      if (!includeJudgeAnalysis) {
        rows = rows.map((r) => {
          const next = { ...r };
          for (const f of JUDGE_FIELDS) delete next[f];
          return next;
        });
      }

      const date = new Date().toISOString().slice(0, 10);
      const filename = `ea_emails_${date}`;

      if (format === 'json') {
        downloadBlob(
          new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' }),
          `${filename}.json`,
        );
      } else {
        downloadBlob(new Blob([jsonToCsv(rows)], { type: 'text/csv' }), `${filename}.csv`);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  };

  // Keep checkbox items from closing the menu on click
  const keepOpen = (e: Event) => e.preventDefault();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting}>
          {exporting ? (
            <IconLoader2 className="size-4 animate-spin" />
          ) : (
            <IconDownload className="size-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onSelect={() => handleExport('csv')}>Export as CSV</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => handleExport('json')}>Export as JSON</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={includeThreads}
          onCheckedChange={setIncludeThreads}
          onSelect={keepOpen}
          disabled={!baseParams.organization_id}
        >
          Include threads
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={includeToolCalls}
          onCheckedChange={setIncludeToolCalls}
          onSelect={keepOpen}
        >
          Include tool calls
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={includeJudgeAnalysis}
          onCheckedChange={setIncludeJudgeAnalysis}
          onSelect={keepOpen}
        >
          Include judge analysis
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
