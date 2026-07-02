import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  COHORT_METRICS,
  benchmarkNumber,
  dedupeLatestPerHotel,
  formatMetricValue,
  isBetterThanMedian,
  medianSorted,
  percentAheadOfPeers,
  type BenchmarkRow,
} from '@/lib/benchmark-cohort';
import { filterToDominantPeriodDays } from '@/lib/industry-benchmark-aggregates';
import { useAppSelector } from '@/redux';
import { reportAssessmentsService } from '@/services/reportAssessments/reportAssessments';

import { IndustryInsightsPanel } from './_components/industry-insights-panel';

const FETCH_LIMIT = 5000;
const RAW_PAGE_SIZE = 50;

function hotelLabel(row: BenchmarkRow): string {
  const hid = typeof row.hotel_id === 'string' ? row.hotel_id : 'unknown';
  const gen = row.generated_at;
  if (typeof gen === 'string' && gen.length >= 10) return `${hid} · ${gen.slice(0, 10)}`;
  return hid;
}

function BenchmarksContent() {
  const [rawOffset, setRawOffset] = useState(0);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emailReports', 'benchmarks', FETCH_LIMIT, 0],
    queryFn: () => reportAssessmentsService.listBenchmarks({ limit: FETCH_LIMIT, offset: 0 }),
  });

  const compareRows = (data?.benchmarks ?? []) as BenchmarkRow[];

  const hotels = useMemo(
    () => dedupeLatestPerHotel(compareRows).sort((a, b) => String(a.hotel_id).localeCompare(String(b.hotel_id))),
    [compareRows],
  );

  const { filtered: periodAlignedCohort, periodDays, excludedCount } = useMemo(
    () => filterToDominantPeriodDays(hotels),
    [hotels],
  );

  const compareCohort = useMemo(
    () => (periodAlignedCohort.length > 0 ? periodAlignedCohort : hotels),
    [periodAlignedCohort, hotels],
  );

  useEffect(() => {
    if (compareCohort.length === 0) return;
    const exists = compareCohort.some((h) => String(h.hotel_id) === selectedHotelId);
    if (!selectedHotelId || !exists) setSelectedHotelId(String(compareCohort[0]!.hotel_id));
  }, [compareCohort, selectedHotelId]);

  const selectedRow = useMemo(
    () => compareCohort.find((h) => String(h.hotel_id) === selectedHotelId),
    [compareCohort, selectedHotelId],
  );

  const rawRows = useMemo(() => compareRows.slice(rawOffset, rawOffset + RAW_PAGE_SIZE), [compareRows, rawOffset]);
  const hasPrevRaw = rawOffset > 0;
  const hasNextRaw = rawOffset + RAW_PAGE_SIZE < compareRows.length;
  const rawPageNumber = Math.floor(rawOffset / RAW_PAGE_SIZE) + 1;

  if (isLoading) {
    return (
      <div className="flex min-h-50 items-center justify-center rounded-xl border border-dashed border-grey-100">
        <Loader2 className="h-8 w-8 animate-spin text-grey-300" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="mx-auto max-w-lg border-destructive/30 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-grey-900">Couldn't load benchmarks</CardTitle>
          <CardDescription className="text-sm text-grey-700">
            Try again in a moment. If this keeps happening, check with engineering.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (compareRows.length === 0) {
    return <p className="text-sm text-grey-700">No benchmark rows returned.</p>;
  }

  return (
    <div className="space-y-8 text-left">
      <header className="space-y-2">
        <h2 className="text-h5 font-semibold tracking-tight text-grey-900">Benchmarks</h2>
        <p className="max-w-2xl text-sm leading-relaxed text-grey-700">
          Industry-level timing and category curves from the loaded cohort (newest row per hotel, aligned to the most
          common assessment window). Use <span className="font-medium text-grey-900">Property vs cohort</span> for
          scalar medians vs a selected property.
        </p>
      </header>

      <Tabs defaultValue="industry" className="w-full">
        <TabsList variant={'accent-tab'} className="mb-6 flex flex-wrap gap-1">
          <TabsTrigger value="industry">Industry insights</TabsTrigger>
          <TabsTrigger value="compare">Property vs cohort</TabsTrigger>
          <TabsTrigger value="raw">Raw export</TabsTrigger>
        </TabsList>

        <TabsContent value="industry" className="mt-0 space-y-6">
          <IndustryInsightsPanel rows={compareCohort} periodDays={periodDays} excludedByPeriodCount={excludedCount} />
        </TabsContent>

        <TabsContent value="compare" className="mt-0 space-y-6">
          {compareCohort.length < 2 ? (
            <p className="text-sm text-muted-foreground">
              Need at least two properties (two distinct{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">hotel_id</code> values) after de-duplication to
              compare. Currently {compareCohort.length}.
            </p>
          ) : (
            <>
            <Card>
              <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2 sm:max-w-md">
                  <label className="text-sm font-medium text-grey-900">Property</label>
                  <Select value={selectedHotelId} onValueChange={setSelectedHotelId}>
                    <SelectTrigger className="border-grey-100 bg-background">
                      <SelectValue placeholder="Choose hotel" />
                    </SelectTrigger>
                    <SelectContent>
                      {compareCohort.map((row) => (
                        <SelectItem key={String(row.hotel_id)} value={String(row.hotel_id)}>
                          {hotelLabel(row)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground sm:text-right">
                  Cohort: <span className="font-medium text-grey-800">{compareCohort.length}</span> properties
                  (period-aligned) · up to {FETCH_LIMIT.toLocaleString()} rows loaded
                </p>
              </div>

              <div className="grid mt-4 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {COHORT_METRICS.map((m) => {
                  const allVals = compareCohort
                    .map((r) => benchmarkNumber(r, m.key))
                    .filter((n): n is number => n != null)
                    .sort((a, b) => a - b);
                  const med = medianSorted(allVals);
                  const hotelVal = selectedRow ? benchmarkNumber(selectedRow, m.key) : null;
                  const others = compareCohort
                    .filter((r) => String(r.hotel_id) !== selectedHotelId)
                    .map((r) => benchmarkNumber(r, m.key))
                    .filter((n): n is number => n != null);
                  const ahead = hotelVal != null ? percentAheadOfPeers(hotelVal, others, m.direction) : null;
                  const better =
                    hotelVal != null && med != null ? isBetterThanMedian(hotelVal, med, m.direction) : null;

                  return (
                    <div key={m.key} className="rounded-xl border border-grey-100 bg-muted/30 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
                        {better === true && (
                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Above median
                          </span>
                        )}
                        {better === false && (
                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Below median
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xl font-semibold tracking-tight tabular-nums text-grey-900">
                        {hotelVal != null ? formatMetricValue(hotelVal, m.format) : '—'}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{m.hint}</p>
                      <div className="mt-3 space-y-0.5 border-t border-grey-100 pt-2.5">
                        <p className="text-xs text-muted-foreground">
                          Cohort median:{' '}
                          <span className="font-medium text-grey-800">
                            {med != null ? formatMetricValue(med, m.format) : '—'}
                          </span>
                        </p>
                        {ahead != null && others.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Ahead of <span className="font-medium text-grey-800">{ahead.toFixed(0)}%</span> of peers
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="raw" className="mt-0 space-y-6">
          <p className="max-w-lg text-sm text-grey-700">
            Same dataset as cohort compare (up to {FETCH_LIMIT.toLocaleString()} rows, newest first). Client-side pages
            of {RAW_PAGE_SIZE} rows.
          </p>
          <ul className="flex flex-col gap-3">
            {rawRows.map((row, i) => (
              <li key={`bench-raw-${rawOffset}-${i}`}>
                <Card className="overflow-hidden border-grey-100/90 shadow-sm">
                  <CardContent className="p-0">
                    <pre className="max-h-96 overflow-auto bg-surface/80 p-4 text-xs leading-relaxed text-grey-900">
                      {JSON.stringify(row, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grey-100 pt-5">
            <p className="text-xs text-grey-600">
              Page {rawPageNumber} · {rawRows.length} row{rawRows.length === 1 ? '' : 's'} on this page ·{' '}
              {compareRows.length.toLocaleString()} total loaded
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={!hasPrevRaw} onClick={() => setRawOffset((o) => Math.max(0, o - RAW_PAGE_SIZE))}>Previous</Button>
              <Button size="sm" variant="outline" disabled={!hasNextRaw} onClick={() => setRawOffset((o) => o + RAW_PAGE_SIZE)}>Next</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function BenchmarksPage() {
  const { role } = useAppSelector((s) => s.session);

  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-md">
        <Card className="border border-grey-100 bg-white shadow-sm">
          <CardContent className="px-6 py-10 text-left">
            <p className="text-sm leading-relaxed text-grey-700">
              Benchmark data is restricted to Altek admins. Ask your contact if you need access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      <BenchmarksContent />
    </div>
  );
}
