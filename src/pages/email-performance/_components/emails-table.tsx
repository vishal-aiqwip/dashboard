import { useMemo, useState } from 'react';

import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDownload,
  IconEye,
  IconFilter,
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
import type { EmailRow } from '@/pages/email-performance/_data/mock';

type SortKey = 'sentAt' | 'editDist' | 'jaccard' | 'semantic' | 'verdict' | 'failure';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

function formatShortDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

function applyFilters(rows: EmailRow[], f: EmailFilters): EmailRow[] {
  const min = f.editDistMin === '' ? null : Number(f.editDistMin);
  const max = f.editDistMax === '' ? null : Number(f.editDistMax);
  const q = f.search.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.mailbox !== 'all' && r.mailbox !== f.mailbox) return false;
    if (f.category !== 'all' && r.category !== f.category) return false;
    if (f.editClass !== 'all' && r.editClass !== f.editClass) return false;
    if (f.tripType !== 'all' && r.trip !== f.tripType) return false;
    if (f.verdict !== 'all' && r.verdict !== f.verdict) return false;
    if (f.failureType !== 'all' && r.failure !== f.failureType) return false;
    if (min !== null && !Number.isNaN(min) && r.editDist < min) return false;
    if (max !== null && !Number.isNaN(max) && r.editDist > max) return false;
    if (q) {
      const haystack = `${r.subject} ${r.guestEmail} ${r.aiDraft} ${r.finalSent}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

function sortRows(rows: EmailRow[], key: SortKey, dir: SortDir): EmailRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av: string | number | null = a[key] ?? '';
    const bv: string | number | null = b[key] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
}

type Props = { emails: EmailRow[] };

export function EmailsTable({ emails }: Props) {
  const [filters, setFilters] = useState<EmailFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('sentAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<EmailRow | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => applyFilters(emails, filters), [emails, filters]);
  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const filterKey = `${JSON.stringify(filters)}|${sortKey}|${sortDir}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const effectivePage = Math.min(Math.max(1, page), pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const paged = sorted.slice(pageStart, pageStart + PAGE_SIZE);
  const activeCount = countActiveFilters(filters);

  const mailboxes = useMemo(() => Array.from(new Set(emails.map((e) => e.mailbox))), [emails]);
  const categories = useMemo(() => Array.from(new Set(emails.map((e) => e.category))), [emails]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const showingFrom = sorted.length === 0 ? 0 : pageStart + 1;
  const showingTo = Math.min(pageStart + PAGE_SIZE, sorted.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sorted.length} email{sorted.length !== 1 ? 's' : ''} match current filters
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
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-6 py-12 text-center text-muted-foreground">
                    No emails match the current filters.
                  </td>
                </tr>
              ) : (
                paged.map((row, i) => (
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
            <span className="tabular-nums font-medium text-foreground">{sorted.length}</span>
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
