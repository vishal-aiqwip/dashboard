import { useState } from 'react';

import { ChevronDown, ChevronRight } from 'lucide-react';

import type { ToolCallDetail } from '@/services/emailTrainingCenter/emailTrainingCenter';

export function ToolCallPanel({ toolCalls }: { toolCalls: ToolCallDetail[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (!toolCalls.length)
    return <div className="text-xs text-muted-foreground italic py-2 px-4">No tool calls were made.</div>;

  return (
    <div className="space-y-2">
      {toolCalls.map((tc, idx) => {
        const isOpen = expandedIdx === idx;
        return (
          <div key={idx} className="border rounded bg-white">
            <button
              className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-muted/30"
              onClick={() => setExpandedIdx(isOpen ? null : idx)}
            >
              {isOpen
                ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <span className="text-xs font-semibold font-mono text-primary">{tc.name}</span>
            </button>
            {isOpen && (
              <div className="border-t px-3 py-2 space-y-2">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">Arguments</p>
                  <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-x-auto max-h-40 whitespace-pre-wrap font-mono">
                    {JSON.stringify(tc.arguments, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase mb-1">Result</p>
                  <pre className="text-[11px] bg-muted/40 rounded p-2 overflow-x-auto max-h-60 whitespace-pre-wrap font-mono">
                    {JSON.stringify(tc.output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
