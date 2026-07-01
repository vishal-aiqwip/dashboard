import { type ColumnDef } from '@tanstack/react-table';

import { Checkbox } from '@/components/ui/checkbox';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import type { EAEmailRow } from '@/services/emailPerformance/emailPerformance';

import { EditClassBadge } from './edit-class-badge';
import { EmailPreviewCell } from './email-preview-cell';

export const MAX_SELECTION = 20;

const VERDICT_COLORS: Record<string, string> = {
  good: 'bg-green-100 text-green-800',
  acceptable: 'bg-lime-100 text-lime-800',
  poor: 'bg-amber-100 text-amber-800',
  wrong: 'bg-red-100 text-red-800',
};

function semanticColor(v: number): string {
  if (v >= 0.9) return 'text-green-700 font-semibold';
  if (v >= 0.7) return 'text-lime-700';
  if (v >= 0.5) return 'text-amber-700';
  return 'text-red-700 font-semibold';
}

function editDistanceColor(v: number): string {
  if (v === 0) return 'text-emerald-600';
  if (v <= 0.15) return 'text-lime-600';
  if (v <= 0.4) return 'text-amber-600';
  return 'text-red-600';
}

type BuildColumnsParams = {
  selectedIds: Set<string>;
  tableData: EAEmailRow[];
  toggleEmail: (id: string) => void;
  setSelectedIds: (fn: (prev: Set<string>) => Set<string>) => void;
  onViewEmail: (row: EAEmailRow) => void;
};

export function buildEmailColumns({
  selectedIds,
  tableData,
  toggleEmail,
  setSelectedIds,
  onViewEmail,
}: BuildColumnsParams): ColumnDef<EAEmailRow>[] {
  const allOnPage = tableData.length > 0 && tableData.every((r) => selectedIds.has(r.interaction_id));
  const someOnPage = tableData.some((r) => selectedIds.has(r.interaction_id));

  return [
    {
      id: 'select',
      enableSorting: false,
      enableHiding: false,
      header: () => (
        <Checkbox
          checked={allOnPage ? true : someOnPage ? 'indeterminate' : false}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                for (const r of tableData) { if (next.size >= MAX_SELECTION) break; next.add(r.interaction_id); }
                return next;
              });
            } else {
              setSelectedIds((prev) => {
                const next = new Set(prev);
                tableData.forEach((r) => next.delete(r.interaction_id));
                return next;
              });
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.interaction_id)}
          disabled={!selectedIds.has(row.original.interaction_id) && selectedIds.size >= MAX_SELECTION}
          onCheckedChange={() => toggleEmail(row.original.interaction_id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      id: 'sentAt',
      accessorKey: 'sent_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums text-xs text-muted-foreground">
          {row.original.sent_at?.slice(0, 10)}
        </span>
      ),
    },
    {
      id: 'editClass',
      accessorKey: 'edit_class',
      enableSorting: false,
      header: 'Edit Class',
      cell: ({ row }) => <EditClassBadge editClass={row.original.edit_class ?? ''} />,
    },
    {
      id: 'editDist',
      accessorKey: 'edit_distance_ratio',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Edit Dist." />,
      cell: ({ row }) => (
        <span className={`tabular-nums text-xs font-medium ${editDistanceColor(row.original.edit_distance_ratio)}`}>
          {row.original.edit_distance_ratio.toFixed(3)}
        </span>
      ),
    },
    {
      id: 'semantic',
      accessorKey: 'semantic_similarity',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Semantic" />,
      cell: ({ row }) => {
        const v = row.original.semantic_similarity;
        return v != null
          ? <span className={`tabular-nums text-xs font-medium ${semanticColor(v)}`}>{v.toFixed(3)}</span>
          : <span className="text-muted-foreground text-xs">—</span>;
      },
    },
    {
      id: 'verdict',
      accessorKey: 'verdict',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Verdict" />,
      cell: ({ row }) => {
        const v = row.original.verdict;
        return v
          ? <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${VERDICT_COLORS[v] ?? ''}`}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: 'failure',
      accessorKey: 'primary_failure',
      enableSorting: false,
      header: 'Failure',
      cell: ({ row }) => {
        const f = row.original.primary_failure;
        return f && f !== 'no_issue'
          ? <span className="text-xs">{f.replace(/_/g, ' ')}</span>
          : <span className="text-xs text-muted-foreground">—</span>;
      },
    },
    {
      id: 'category',
      accessorKey: 'category',
      enableSorting: false,
      header: 'Category',
      cell: ({ row }) => (
        <span className="text-xs capitalize text-muted-foreground">{row.original.category || '—'}</span>
      ),
    },
    {
      id: 'emailData',
      enableSorting: false,
      enableHiding: false,
      header: 'Email',
      cell: ({ row }) => <EmailPreviewCell row={row.original} onView={onViewEmail} />,
    },
  ];
}
