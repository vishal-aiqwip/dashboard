import { useMemo, useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { ReplayEmailResult } from '@/services/emailTrainingCenter/emailTrainingCenter';

import { computeWordDiff, DiffText } from './diff-utils';
import { EditClassBadge } from './edit-class-badge';
import { ImprovementIndicator } from './improvement-indicator';
import { ToolCallPanel } from './tool-call-panel';

function editDistanceColor(v: number): string {
  if (v === 0) return 'text-emerald-600';
  if (v <= 0.15) return 'text-lime-600';
  if (v <= 0.4) return 'text-amber-600';
  return 'text-red-600';
}

export function ResultRow({ result }: { result: ReplayEmailResult }) {
  const [open, setOpen] = useState(false);

  const origFinal = useMemo(
    () => result.original_draft && result.final_sent
      ? computeWordDiff(result.original_draft, result.final_sent)
      : null,
    [result.original_draft, result.final_sent],
  );

  const newFinal = useMemo(
    () => result.new_draft && result.final_sent
      ? computeWordDiff(result.new_draft, result.final_sent)
      : null,
    [result.new_draft, result.final_sent],
  );

  return (
    <>
      <tr className="border-b hover:bg-muted/40 cursor-pointer text-left" onClick={() => setOpen((v) => !v)}>
        <td className="py-2.5 px-3">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </td>
        <td className="py-2.5 px-3 text-sm max-w-[250px] truncate">{result.subject || '(no subject)'}</td>
        <td className="py-2.5 px-3"><EditClassBadge editClass={result.original_edit_class} /></td>
        <td className={`py-2.5 px-3 tabular-nums text-sm text-right ${editDistanceColor(result.original_edit_distance)}`}>
          {result.original_edit_distance.toFixed(3)}
        </td>
        <td className="py-2.5 px-3"><EditClassBadge editClass={result.new_edit_class} /></td>
        <td className={`py-2.5 px-3 tabular-nums text-sm text-right ${editDistanceColor(result.new_edit_distance)}`}>
          {result.new_edit_distance.toFixed(3)}
        </td>
        <td className="py-2.5 px-3"><ImprovementIndicator value={result.improvement} /></td>
      </tr>
      {open && (
        <tr>
          <td colSpan={7} className="p-0">
            <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <mark className="bg-red-200/80 text-red-900 rounded-[2px] px-1">removed</mark>from AI draft
              </span>
              <span className="flex items-center gap-1.5">
                <mark className="bg-green-200/80 text-green-900 rounded-[2px] px-1">added</mark>by hotel
              </span>
            </div>
            <div className="grid grid-cols-3 border-b text-left">
              <div className="border-r">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2 bg-red-50/40 border-b">
                  Original AI Draft
                </p>
                <div className="text-xs p-4 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono">
                  {origFinal ? <DiffText tokens={origFinal.left} /> : result.original_draft || '—'}
                </div>
              </div>
              <div className="border-r">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2 bg-blue-50/40 border-b">
                  New AI Draft
                </p>
                <div className="text-xs p-4 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono">
                  {newFinal ? <DiffText tokens={newFinal.left} /> : result.new_draft || '—'}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-4 py-2 bg-green-50/40 border-b">
                  Hotel's Final Version
                </p>
                <div className="text-xs p-4 max-h-72 overflow-y-auto whitespace-pre-wrap font-mono">
                  {result.final_sent || '—'}
                </div>
              </div>
            </div>
            {result.tool_calls && result.tool_calls.length > 0 && (
              <div className="border-b px-4 py-3 bg-muted/20">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Tool Calls ({result.tool_calls.length})
                </p>
                <ToolCallPanel toolCalls={result.tool_calls} />
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
