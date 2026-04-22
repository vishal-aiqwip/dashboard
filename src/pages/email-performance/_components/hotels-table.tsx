import { useMemo, useState } from 'react';

import {
  IconAlertTriangle,
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconSearch,
  IconSortAscending,
  IconSortDescending,
} from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { HotelPerfRow, HotelStatus } from '@/pages/email-performance/_data/mock';

type SortKey =
  | 'hotel'
  | 'mailbox'
  | 'draftsCreated'
  | 'draftsSent'
  | 'sendRate'
  | 'sent7d'
  | 'lastSent'
  | 'acceptanceRate'
  | 'status';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 20;

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
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
  if (value === null) {
    return <span className="text-muted-foreground">—</span>;
  }
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

function sortRows(rows: HotelPerfRow[], key: SortKey, dir: SortDir): HotelPerfRow[] {
  const sign = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av: string | number | null = a[key] ?? '';
    const bv: string | number | null = b[key] ?? '';
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign;
    return String(av).localeCompare(String(bv)) * sign;
  });
}

type Props = { hotels: HotelPerfRow[] };

export function HotelsTable({ hotels }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | HotelStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('hotel');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return hotels.filter((h) => {
      if (statusFilter !== 'all' && h.status !== statusFilter) return false;
      if (q && !`${h.hotel} ${h.mailbox}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [hotels, search, statusFilter]);

  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const filterKey = `${search}|${statusFilter}|${sortKey}|${sortDir}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const effectivePage = Math.min(Math.max(1, page), pageCount);
  const pageStart = (effectivePage - 1) * PAGE_SIZE;
  const paged = sorted.slice(pageStart, pageStart + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-60">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search hotel or mailbox…"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="never-used">Never Used</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-card text-xs uppercase tracking-wider text-muted-foreground">
                <th className="sticky left-0 z-10 w-14 border-r bg-card px-4 py-3 text-left font-medium shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)]">
                  #
                </th>
                <SortHeader label="Hotel" k="hotel" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Mailbox" k="mailbox" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Drafts Created" k="draftsCreated" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Drafts Sent" k="draftsSent" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Send Rate" k="sendRate" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Sent (7d)" k="sent7d" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Last Sent" k="lastSent" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <SortHeader label="Acceptance Rate" k="acceptanceRate" current={sortKey} dir={sortDir} onClick={toggleSort} />
                <th className="whitespace-nowrap px-4 py-3 text-left font-medium">Auto-Drafts</th>
                <SortHeader label="Status" k="status" current={sortKey} dir={sortDir} onClick={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-muted-foreground">
                    No hotels match the current filters.
                  </td>
                </tr>
              ) : (
                paged.map((h, i) => (
                  <tr
                    key={h.id}
                    className="group border-b bg-card last:border-b-0 hover:bg-muted/40"
                  >
                    <td className="sticky left-0 z-10 border-r bg-card px-4 py-4 tabular-nums text-muted-foreground shadow-[4px_0_6px_-4px_rgba(0,0,0,0.08)] group-hover:bg-muted/40">
                      {pageStart + i + 1}
                    </td>
                    <td className="max-w-60 truncate px-4 py-4 font-medium">{h.hotel}</td>
                    <td className="max-w-60 truncate px-4 py-4 text-muted-foreground">
                      {h.mailbox}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-4 tabular-nums font-medium',
                        h.draftsCreated === 0 ? 'text-rose-600' : 'text-foreground'
                      )}
                    >
                      {h.draftsCreated}
                    </td>
                    <td
                      className={cn(
                        'px-4 py-4 tabular-nums font-medium',
                        h.draftsSent === 0 ? 'text-amber-600' : 'text-emerald-700'
                      )}
                    >
                      {h.draftsSent}
                    </td>
                    <td className="px-4 py-4">
                      <ProgressBar value={h.sendRate} />
                    </td>
                    <td
                      className={cn(
                        'px-4 py-4 tabular-nums font-medium',
                        h.sent7d === 0 ? 'text-amber-600' : 'text-emerald-700'
                      )}
                    >
                      {h.sent7d}
                    </td>
                    <td
                      className={cn(
                        'whitespace-nowrap px-4 py-4 tabular-nums',
                        h.lastSent ? 'text-emerald-700 font-medium' : 'text-muted-foreground'
                      )}
                    >
                      {formatDateTime(h.lastSent)}
                    </td>
                    <td className="px-4 py-4">
                      <ProgressBar value={h.acceptanceRate} />
                    </td>
                    <td className="px-4 py-4">
                      <AutoDraftsPill on={h.autoDrafts} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <StatusPill status={h.status} />
                        {h.needsAttention && (
                          <IconAlertTriangle className="size-4 text-amber-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm">
          <p className="text-muted-foreground">
            Showing{' '}
            <span className="tabular-nums font-medium text-foreground">
              {Math.min(pageStart + 1, sorted.length)}
            </span>
            –
            <span className="tabular-nums font-medium text-foreground">
              {Math.min(pageStart + PAGE_SIZE, sorted.length)}
            </span>{' '}
            of{' '}
            <span className="tabular-nums font-medium text-foreground">{sorted.length}</span> hotel
            mailboxes
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
    </div>
  );
}

function SortHeader({
  label,
  k,
  current,
  dir,
  onClick,
}: {
  label: string;
  k: SortKey;
  current: SortKey;
  dir: SortDir;
  onClick: (key: SortKey) => void;
}) {
  const active = current === k;
  const Icon = !active ? IconArrowsSort : dir === 'asc' ? IconSortAscending : IconSortDescending;
  return (
    <th
      className="cursor-pointer select-none whitespace-nowrap px-4 py-3 text-left font-medium hover:text-foreground"
      onClick={() => onClick(k)}
    >
      <span className={cn('inline-flex items-center gap-1', active && 'text-foreground')}>
        {label}
        <Icon className="size-3" />
      </span>
    </th>
  );
}
