import { Mail } from 'lucide-react';

import type { EAEmailRow } from '@/services/emailPerformance/emailPerformance';

type Props = {
  row: EAEmailRow;
  onView: (row: EAEmailRow) => void;
};

export function EmailPreviewCell({ row, onView }: Props) {
  const hasBodies = !!(row.ai_draft_preview && row.final_sent_preview);
  const guestSnippet = row.original_body_preview?.replace(/\s+/g, ' ').trim();

  return (
    <div className="flex flex-col gap-1 max-w-[280px]">
      {/* <p className="text-xs font-medium truncate" title={row.original_subject ?? undefined}>
        {row.original_subject || '(no subject)'}
      </p>
      {guestSnippet && (
        <p className="text-[11px] text-muted-foreground/70 line-clamp-1 italic">
          <Mail className="inline h-3 w-3 mr-1 text-indigo-400" />
          {guestSnippet.slice(0, 80)}{guestSnippet.length > 80 ? '…' : ''}
        </p>
      )}
      {hasBodies ? (
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            <span className="text-red-500 font-mono mr-1">−</span>{row.ai_draft_preview!.slice(0, 90)}
          </p>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            <span className="text-green-600 font-mono mr-1">+</span>{row.final_sent_preview!.slice(0, 90)}
          </p>
        </div>
      ) : row.ai_draft_preview ? (
        <p className="text-[11px] text-muted-foreground line-clamp-2">{row.ai_draft_preview.slice(0, 120)}</p>
      ) : null} */}
      {hasBodies && (
        <button
          className="text-xs text-primary hover:underline text-left w-fit mt-0.5"
          onClick={(e) => { e.stopPropagation(); onView(row); }}
        >
          View diff
        </button>
      )}
    </div>
  );
}
