import { useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { IconAlertTriangle } from '@tabler/icons-react';

import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HotelPerfRow, HotelStatus } from '@/pages/email-performance/_data/mock';
import { Card, CardContent } from '@/components/ui/card';

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatusPill({ status }: { status: HotelStatus }) {
  const tone: Record<HotelStatus, string> = {
    active: 'bg-emerald-500/15 text-emerald-700',
    inactive: 'bg-rose-500/15 text-rose-700',
    'never-used': 'bg-secondary text-muted-foreground',
  };
  const label: Record<HotelStatus, string> = {
    active: 'Active',
    inactive: 'Inactive',
    'never-used': 'Never Used',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        tone[status]
      )}
    >
      {label[status]}
    </span>
  );
}

function AutoDraftsPill({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        on ? 'bg-emerald-500/15 text-emerald-700' : 'bg-secondary text-muted-foreground'
      )}
    >
      {on ? 'On' : 'Off'}
    </span>
  );
}

function ProgressBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground">—</span>;
  const pct = Math.min(100, Math.max(0, value));
  const color =
    value === 0 ? 'bg-muted-foreground/20' : value >= 75 ? 'bg-primary' : 'bg-primary/70';
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tabular-nums text-xs font-medium">{value.toFixed(1)}%</span>
    </div>
  );
}

const columns: ColumnDef<HotelPerfRow>[] = [
  {
    accessorKey: 'hotel',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hotel" />,
    cell: ({ row }) => (
      <span className="block max-w-52 truncate font-medium">{row.original.hotel}</span>
    ),
  },
  {
    accessorKey: 'mailbox',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Mailbox" />,
    cell: ({ row }) => (
      <span className="block max-w-52 truncate text-muted-foreground">{row.original.mailbox}</span>
    ),
  },
  {
    accessorKey: 'draftsCreated',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Drafts Created" />,
    cell: ({ row }) => {
      const v = row.original.draftsCreated;
      return (
        <span className={cn('tabular-nums font-medium', v === 0 ? 'text-rose-600' : '')}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: 'draftsSent',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Drafts Sent" />,
    cell: ({ row }) => {
      const v = row.original.draftsSent;
      return (
        <span className={cn('tabular-nums font-medium', v === 0 ? 'text-amber-600' : 'text-emerald-700')}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: 'sendRate',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Send Rate" />,
    cell: ({ row }) => <ProgressBar value={row.original.sendRate} />,
  },
  {
    accessorKey: 'sent7d',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Sent (7d)" />,
    cell: ({ row }) => {
      const v = row.original.sent7d;
      return (
        <span className={cn('tabular-nums font-medium', v === 0 ? 'text-amber-600' : 'text-emerald-700')}>
          {v}
        </span>
      );
    },
  },
  {
    accessorKey: 'lastSent',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Sent" />,
    cell: ({ row }) => (
      <span
        className={cn(
          'whitespace-nowrap tabular-nums',
          row.original.lastSent ? 'font-medium text-emerald-700' : 'text-muted-foreground'
        )}
      >
        {formatDateTime(row.original.lastSent)}
      </span>
    ),
  },
  {
    accessorKey: 'acceptanceRate',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Acceptance Rate" />,
    cell: ({ row }) => <ProgressBar value={row.original.acceptanceRate} />,
  },
  {
    accessorKey: 'autoDrafts',
    enableGlobalFilter: false,
    enableSorting: false,
    header: 'Auto-Drafts',
    cell: ({ row }) => <AutoDraftsPill on={row.original.autoDrafts} />,
  },
  {
    accessorKey: 'status',
    enableGlobalFilter: false,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <StatusPill status={row.original.status} />
        {row.original.needsAttention && (
          <IconAlertTriangle className="size-4 text-amber-500" />
        )}
      </div>
    ),
  },
];

type Props = { hotels: HotelPerfRow[] };

export function HotelsTable({ hotels }: Props) {
  const [statusFilter, setStatusFilter] = useState<'all' | HotelStatus>('all');

  const filtered =
    statusFilter === 'all' ? hotels : hotels.filter((h) => h.status === statusFilter);

  return (
    <Card >
      <CardContent>

      <DataTable
        columns={columns}
        data={filtered}
        filterPlaceholder="Search hotel or mailbox…"
        emptyMessage="No hotels match the current filters."
        enableGlobalFilter
        enableColumnVisibilityToggle
        enablePagination
        toolbarContent={
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="h-9 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="never-used">Never Used</SelectItem>
            </SelectContent>
          </Select>
        }
      />
      </CardContent>

    </Card>
  );
}
