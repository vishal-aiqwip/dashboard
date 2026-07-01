import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDownload,
  IconEye,
  IconFilter,
  IconLoader2,
  IconSortAscending,
  IconSortDescending,
  IconX,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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

type SortKey = 'sentAt' | 'editDist' | 'jaccard' | 'semantic' | 'verdict' | 'failure';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 15;
const STALE = 5 * 60 * 1000;

const SORT_KEY_MAP: Record<SortKey, string> = {
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
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
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
  const [sortKey, setSortKey] = useState<SortKey>('sentAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const [page, setPage] = useState(1);

  // Reset page when filters, sort, or base params (date/hotel) change
  const resetKey = `${JSON.stringify(filters)}|${sortKey}|${sortDir}|${baseParams.from_date}|${baseParams.to_date}|${baseParams.organization_id ?? ''}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) {
    setPrevResetKey(resetKey);
    setPage(1);
  }

  const queryParams = {
    ...baseParams,
    page,
    page_size: PAGE_SIZE,
    include_body: true,
    sort_by: SORT_KEY_MAP[sortKey],
    sort_dir: sortDir,
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
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const effectivePage = Math.min(Math.max(1, page), pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const activeCount = countActiveFilters(filters);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const showingFrom = totalCount === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, totalCount);

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
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {isFetching ? (
            <span className="inline-flex items-center gap-1.5">
              <IconLoader2 className="size-3 animate-spin" />
              Loading…
            </span>
          ) : (
            <>{totalCount} email{totalCount !== 1 ? 's' : ''} match current filters</>
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
          <Button variant="outline" size="sm">
            <IconDownload className="size-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-10 w-14 border-r bg-card px-4 py-3 text-left font-medium shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)]">
                  #
                </th>
                <SortHeader
                  label="Sent at"
                  sortKey="sentAt"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <PlainHeader label="Mailbox" />
                <PlainHeader label="Category" />
                <PlainHeader label="Trip" />
                <PlainHeader label="Edit class" />
                <SortHeader
                  label="Edit dist."
                  sortKey="editDist"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Jaccard"
                  sortKey="jaccard"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Semantic"
                  sortKey="semantic"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <PlainHeader label="Subject" />
                <SortHeader
                  label="Verdict"
                  sortKey="verdict"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <SortHeader
                  label="Failure"
                  sortKey="failure"
                  current={sortKey}
                  dir={sortDir}
                  onClick={toggleSort}
                />
                <th className="sticky right-0 z-10 border-l bg-card px-4 py-3 text-right font-medium shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {emails.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">
                    No emails match the current filters.
                  </td>
                </tr>
              ) : (
                emails.map((row, i) => (
                  <tr
                    key={row.id}
                    className="group border-b bg-card last:border-b-0 hover:bg-muted/40"
                  >
                    <td className="sticky left-0 z-10 border-r bg-card px-4 py-4 tabular-nums text-muted-foreground shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)] group-hover:bg-muted/40">
                      {pageStart + i + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 tabular-nums">
                      {formatShortDateTime(row.sentAt)}
                    </td>
                    <td className="max-w-45 truncate px-4 py-4 text-muted-foreground">
                      {row.mailbox}
                    </td>
                    <td className="px-4 py-4">{row.category}</td>
                    <td className="px-4 py-4">{row.trip}</td>
                    <td className="px-4 py-4">
                      <EditClassBadge value={row.editClass} />
                    </td>
                    <td
                      className={cn(
                        'px-4 py-4 tabular-nums font-medium',
                        row.editDist === 0 ? 'text-emerald-600' : 'text-foreground'
                      )}
                    >
                      {row.editDist.toFixed(3)}
                    </td>
                    <td className="px-4 py-4 tabular-nums text-muted-foreground">
                      {row.jaccard.toFixed(3)}
                    </td>
                    <td className="px-4 py-4 tabular-nums font-medium text-emerald-700">
                      {row.semantic.toFixed(3)}
                    </td>
                    <td className="max-w-60 truncate px-4 py-4 font-medium">{row.subject}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.verdict ?? '—'}</td>
                    <td className="px-4 py-4 text-muted-foreground">{row.failure ?? '—'}</td>
                    <td className="sticky right-0 z-10 border-l bg-card px-4 py-3 text-right shadow-[-4px_0_6px_-4px_rgba(0,0,0,0.08)] group-hover:bg-muted/40">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected(row)}
                        className="h-8 gap-1 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        <IconEye className="size-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Showing <span className="tabular-nums font-medium text-foreground">{showingFrom}</span>–
            <span className="tabular-nums font-medium text-foreground">{showingTo}</span> of{' '}
            <span className="tabular-nums font-medium text-foreground">{totalCount}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={effectivePage === 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <IconChevronsLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={effectivePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <IconChevronLeft className="size-4" />
            </Button>
            <span className="mx-2 text-sm tabular-nums text-muted-foreground">
              Page <span className="font-medium text-foreground">{effectivePage}</span> of{' '}
              <span className="font-medium text-foreground">{pageCount}</span>
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={effectivePage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              aria-label="Next page"
            >
              <IconChevronRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={effectivePage >= pageCount}
              onClick={() => setPage(pageCount)}
              aria-label="Last page"
            >
              <IconChevronsRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

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
  );
}

function PlainHeader({ label, align = 'left' }: { label: string; align?: 'left' | 'right' }) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-3 text-left font-medium',
        align === 'right' && 'text-right'
      )}
    >
      {label}
    </th>
  );
}

function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onClick,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const active = current === sortKey;
  const Icon = !active ? IconArrowsSort : dir === 'asc' ? IconSortAscending : IconSortDescending;
  return (
    <th
      className={cn(
        'cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-medium hover:text-foreground',
        align === 'right' && 'text-right'
      )}
      onClick={() => onClick(sortKey)}
    >
      <span className={cn('inline-flex items-center gap-1', active && 'text-foreground')}>
        {label}
        <Icon className="size-3" />
      </span>
    </th>
  );
}
