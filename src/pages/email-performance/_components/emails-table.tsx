import { useMemo, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  type ColumnDef,
  type PaginationState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { IconEye, IconFilter, IconLoader2, IconX } from '@tabler/icons-react';

import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { EditClassBadge } from '@/pages/email-performance/_components/edit-class-badge';
import { EmailDetailSheet } from '@/pages/email-performance/_components/email-detail-sheet';
import { EmailsFilterSheet } from '@/pages/email-performance/_components/emails-filter-sheet';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  type EmailFilters,
} from '@/pages/email-performance/_components/emails-filters';
import { transformEmails } from '@/pages/email-performance/_data/transform';
import type { EmailRow } from '@/pages/email-performance/_data/mock';
import { emailPerformanceService } from '@/services/emailPerformance/emailPerformance';
import { EmailExportButton } from './email-export-button';

const STALE = 5 * 60 * 1000;

// Maps TanStack column id → backend sort field name
const SORT_KEY_MAP: Record<string, string> = {
  sentAt: 'sent_at',
  editDist: 'edit_distance_ratio',
  jaccard: 'jaccard_distance',
  semantic: 'semantic_similarity',
  verdict: 'verdict',
  failure: 'primary_failure',
};

function formatShortDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type BaseParams = { from_date: string; to_date: string; organization_id?: string };

type Props = {
  baseParams: BaseParams;
  categories?: string[];
  mailboxes?: string[];
};

export function EmailsTable({ baseParams, categories = [], mailboxes = [] }: Props) {
  const [filters, setFilters] = useState<EmailFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'sentAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 15 });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Reset to first page when sort, filters, or base params change
  const resetKey = `${JSON.stringify(filters)}|${JSON.stringify(sorting)}|${baseParams.from_date}|${baseParams.to_date}|${baseParams.organization_id ?? ''}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const sort = sorting[0];
  const queryParams = {
    ...baseParams,
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    include_body: true,
    ...(sort && {
      sort_by: SORT_KEY_MAP[sort.id] ?? sort.id,
      sort_dir: (sort.desc ? 'desc' : 'asc') as 'asc' | 'desc',
    }),
    ...(filters.mailbox !== 'all' && { mailbox_email: filters.mailbox }),
    ...(filters.category !== 'all' && { category: filters.category }),
    ...(filters.editClass !== 'all' && { edit_class: filters.editClass }),
    ...(filters.tripType !== 'all' && { trip_type: filters.tripType }),
    ...(filters.verdict !== 'all' && { verdict: filters.verdict }),
    ...(filters.failureType !== 'all' && { primary_failure: filters.failureType }),
    ...(filters.editDistMin !== '' && { min_edit_distance: Number(filters.editDistMin) }),
    ...(filters.editDistMax !== '' && { max_edit_distance: Number(filters.editDistMax) }),
    ...(filters.search.trim() !== '' && { search_text: filters.search.trim() }),
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['ea-emails', queryParams],
    queryFn: () => emailPerformanceService.getEmails(queryParams),
    staleTime: STALE,
    retry: 1,
  });

  const emails = data ? transformEmails(data.rows) : [];
  const totalCount = data?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));
  const activeCount = countActiveFilters(filters);

  const columns = useMemo<ColumnDef<EmailRow>[]>(
    () => [
      {
        id: 'sentAt',
        accessorKey: 'sentAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Sent At" />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap tabular-nums">
            {formatShortDateTime(row.original.sentAt)}
          </span>
        ),
      },
      {
        accessorKey: 'mailbox',
        enableSorting: false,
        header: 'Mailbox',
        cell: ({ row }) => (
          <span className="block max-w-44 truncate text-muted-foreground">
            {row.original.mailbox}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        enableSorting: false,
        header: 'Category',
        cell: ({ row }) => row.original.category,
      },
      {
        accessorKey: 'trip',
        enableSorting: false,
        header: 'Trip',
        cell: ({ row }) => row.original.trip,
      },
      {
        accessorKey: 'editClass',
        enableSorting: false,
        header: 'Edit Class',
        cell: ({ row }) => <EditClassBadge value={row.original.editClass} />,
      },
      {
        id: 'editDist',
        accessorKey: 'editDist',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Edit Dist." />,
        cell: ({ row }) => {
          const v = row.original.editDist;
          return (
            <span className={cn('tabular-nums font-medium', v === 0 ? 'text-emerald-600' : '')}>
              {v.toFixed(3)}
            </span>
          );
        },
      },
      {
        id: 'jaccard',
        accessorKey: 'jaccard',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Jaccard" />,
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.jaccard.toFixed(3)}
          </span>
        ),
      },
      {
        id: 'semantic',
        accessorKey: 'semantic',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Semantic" />,
        cell: ({ row }) => (
          <span className="tabular-nums font-medium text-emerald-700">
            {row.original.semantic.toFixed(3)}
          </span>
        ),
      },
      {
        accessorKey: 'subject',
        enableSorting: false,
        header: 'Subject',
        cell: ({ row }) => (
          <span className="block max-w-60 truncate font-medium">{row.original.subject}</span>
        ),
      },
      {
        id: 'verdict',
        accessorKey: 'verdict',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Verdict" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.verdict ?? '—'}</span>
        ),
      },
      {
        id: 'failure',
        accessorKey: 'failure',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Failure" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.failure ?? '—'}</span>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(row.original)}
              className="h-8 gap-1 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <IconEye className="size-4" />
              View
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: emails,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount,
    state: { sorting, pagination, columnVisibility },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <IconLoader2 className="size-4 animate-spin" />
        Loading emails…
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-500">
        Failed to load emails: {(error as Error).message}
      </p>
    );
  }

  return (
    <Card>
      <CardContent>
        <div className="flex  flex-col gap-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {isFetching ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconLoader2 className="size-3 animate-spin" />
                  Loading…
                </span>
              ) : (
                <>
                  {totalCount} email{totalCount !== 1 ? 's' : ''} match current filters
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setFilterOpen(true)}>
                <IconFilter className="size-4" />
                Filters
                {activeCount > 0 && (
                  <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                    {activeCount}
                  </span>
                )}
              </Button>
              {activeCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="text-muted-foreground"
                >
                  <IconX className="size-4" />
                  Clear
                </Button>
              )}
              <EmailExportButton baseParams={baseParams} filters={filters} />
            </div>
          </div>

          {/* Table */}
          {/* <Card className="overflow-hidden p-0 b"> */}
            <div className="overflow-x-auto border rounded-xl">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((hg) => (
                    <TableRow
                      key={hg.id}
                      className="bg-card text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {hg.headers.map((header) => (
                        <TableHead key={header.id} className="whitespace-nowrap">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        No emails match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="bg-card hover:bg-muted/40">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className=" py-3">
              <DataTablePagination table={table} />
            </div>
          {/* </Card> */}

          <EmailsFilterSheet
            open={filterOpen}
            onOpenChange={setFilterOpen}
            value={filters}
            onApply={setFilters}
            mailboxes={mailboxes}
            categories={categories}
          />

          <EmailDetailSheet email={selected} onClose={() => setSelected(null)} />
        </div>

      </CardContent>
    </Card>

  );
}
