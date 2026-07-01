import { useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import {
  IconBuildingSkyscraper,
  IconChartBar,
  IconLoader2,
  IconMail,
  IconTag,
} from '@tabler/icons-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailPerformanceService } from '@/services/emailPerformance/emailPerformance';

import { AcceptanceRateChart } from './_components/acceptance-rate-chart';
import { CategoryEditDistanceChart } from './_components/category-edit-distance-chart';
import { CategoryHeatmap } from './_components/category-heatmap';
import { CategorySummaryTable } from './_components/category-summary-table';
import {
  DateRangeFilter,
  type DatePreset,
  type DateRangeSelection,
} from './_components/date-range-filter';
import { EditClassBar } from './_components/edit-class-bar';
import { EditDistanceChart } from './_components/edit-distance-chart';
import { EditDistanceHistogram } from './_components/edit-distance-histogram';
import { EmailsTable } from './_components/emails-table';
import { ALL_HOTELS, HotelFilter } from './_components/hotel-filter';
import { HotelsStatCards } from './_components/hotels-stat-cards';
import { HotelsTable } from './_components/hotels-table';
import { JudgeBreakdownSection } from './_components/judge-breakdown';
import { OverallSplitPie } from './_components/overall-split-pie';
import { StatCardGrid } from './_components/stat-card-grid';
import {
  transformCategoryAnalysis,
  transformHotelOverview,
  transformJudgeBreakdown,
  transformKpis,
  transformTimeseries,
} from './_data/transform';

// ── Date helpers ───────────────────────────────────────────────────────────────

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function presetToDates(preset: DatePreset): { from_date: string; to_date: string } {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);
  switch (preset) {
    case 'today':
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'yesterday':
      from.setDate(from.getDate() - 1);
      to.setDate(to.getDate() - 1);
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'last7':
      from.setDate(from.getDate() - 6);
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'last14':
      from.setDate(from.getDate() - 13);
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'last30':
      from.setDate(from.getDate() - 29);
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'last90':
      from.setDate(from.getDate() - 89);
      return { from_date: fmt(from), to_date: fmt(to) };
  }
}

function dateRangeToParams(selection: DateRangeSelection): { from_date: string; to_date: string } {
  if (selection.kind === 'custom') {
    return { from_date: fmt(selection.from), to_date: fmt(selection.to) };
  }
  return presetToDates(selection.preset);
}

// ─────────────────────────────────────────────────────────────────────────────

function Loading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <IconLoader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

const STALE = 5 * 60 * 1000;

export default function EmailPerformancePage() {
  const [hotelId, setHotelId] = useState<string>(ALL_HOTELS);
  const [dateRange, setDateRange] = useState<DateRangeSelection>({
    kind: 'preset',
    preset: 'last30',
  });

  const { from_date, to_date } = dateRangeToParams(dateRange);
  const organization_id = hotelId === ALL_HOTELS ? undefined : hotelId;
  const baseParams = { from_date, to_date, ...(organization_id ? { organization_id } : {}) };

  const { data: rawKpis, isLoading: kpisLoading, error: kpisError } = useQuery({
    queryKey: ['ea-kpis', from_date, to_date, organization_id],
    queryFn: () => emailPerformanceService.getKpis(baseParams),
    staleTime: STALE,
    retry: 1,
  });

  const { data: rawTimeseries, isLoading: timeseriesLoading, error: timeseriesError } = useQuery({
    queryKey: ['ea-timeseries', from_date, to_date, organization_id],
    queryFn: () => emailPerformanceService.getTimeseries(baseParams),
    staleTime: STALE,
    retry: 1,
  });

  const { data: rawCategory, isLoading: categoryLoading, error: categoryError } = useQuery({
    queryKey: ['ea-category', from_date, to_date, organization_id],
    queryFn: () => emailPerformanceService.getCategoryAnalysis(baseParams),
    staleTime: STALE,
    retry: 1,
  });

  const { data: rawHotels, isLoading: hotelsLoading, error: hotelsError } = useQuery({
    queryKey: ['ea-hotels', from_date, to_date],
    queryFn: () => emailPerformanceService.getHotelOverview({ from_date, to_date }),
    staleTime: STALE,
    retry: 1,
  });


  // Judge breakdown — only fetched for "All hotels" view
  const isAllHotels = hotelId === ALL_HOTELS;
  const {
    data: rawJudge,
    isLoading: judgeLoading,
    error: judgeError,
  } = useQuery({
    queryKey: ['ea-judge-breakdown', from_date, to_date],
    queryFn: () => emailPerformanceService.getJudgeBreakdown({ from_date, to_date }),
    staleTime: STALE,
    retry: 1,
    enabled: isAllHotels,
  });

  // ── Transforms ───────────────────────────────────────────────────────────────
  const kpis = rawKpis ? transformKpis(rawKpis) : undefined;
  const ts = rawTimeseries ? transformTimeseries(rawTimeseries) : undefined;
  const cat = rawCategory ? transformCategoryAnalysis(rawCategory) : undefined;
  const hotels = rawHotels ? transformHotelOverview(rawHotels) : undefined;
  const judgeBreakdown = rawJudge ? transformJudgeBreakdown(rawJudge) : undefined;

  // Derive available filter options from already-fetched data
  const availableCategories = cat?.categorySummary.map((c) => c.key) ?? [];
  const availableMailboxes = hotels?.hotels.map((h) => h.mailbox) ?? [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Email Assistant Statistics</h1>

      <Tabs defaultValue="overview" className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <TabsList variant={'accent-tab'}>
            <TabsTrigger value="overview">
              <IconChartBar className="size-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="by-category">
              <IconTag className="size-4" />
              By Category
            </TabsTrigger>
            <TabsTrigger value="emails">
              <IconMail className="size-4" />
              Emails
            </TabsTrigger>
            <TabsTrigger value="hotels">
              <IconBuildingSkyscraper className="size-4" />
              Hotels
            </TabsTrigger>
          </TabsList>
          <div className="flex flex-wrap items-center gap-2">
            <HotelFilter value={hotelId} onChange={setHotelId} />
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>

        {/* ── Overview ─────────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="flex flex-col gap-6">
          {kpisLoading ? (
            <Loading label="Loading metrics…" />
          ) : kpisError ? (
            <p className="text-sm text-red-500">Failed to load metrics: {(kpisError as Error).message}</p>
          ) : kpis ? (
            <StatCardGrid kpis={kpis} />
          ) : null}

          {timeseriesError ? (
            <p className="text-sm text-red-500">Failed to load chart data: {(timeseriesError as Error).message}</p>
          ) : timeseriesLoading ? (
            <Loading label="Loading charts…" />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <EditDistanceChart data={ts?.editDistanceOverTime ?? []} />
                <AcceptanceRateChart data={ts?.acceptanceRateOverTime ?? []} />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <EditClassBar data={ts?.editClassOverTime ?? []} />
                <OverallSplitPie data={ts?.overallSplit ?? []} />
              </div>

              <EditDistanceHistogram data={ts?.editDistanceHistogram ?? []} />
            </>
          )}

          {/* AI Quality Assessment — only shown for "All hotels" */}
          {isAllHotels && (
            judgeLoading ? (
              <Loading label="Loading quality assessment…" />
            ) : judgeError ? (
              <p className="text-sm text-red-500">
                Failed to load quality assessment: {(judgeError as Error).message}
              </p>
            ) : judgeBreakdown ? (
              <JudgeBreakdownSection
                data={judgeBreakdown}
                totalEmails={rawKpis?.current?.total_emails ?? 0}
              />
            ) : null
          )}
        </TabsContent>

        {/* ── By Category ──────────────────────────────────────────────────── */}
        <TabsContent value="by-category" className="flex flex-col gap-6">
          {categoryLoading ? (
            <Loading label="Loading category analysis…" />
          ) : categoryError ? (
            <p className="text-sm text-red-500">Failed to load category data: {(categoryError as Error).message}</p>
          ) : cat ? (
            <>
              <CategorySummaryTable rows={cat.categorySummary} />
              <CategoryEditDistanceChart data={cat.editDistanceByCategory} />
              <CategoryHeatmap
                weeks={cat.editDistanceHeatmap.weeks}
                rows={cat.editDistanceHeatmap.rows}
              />
            </>
          ) : null}
        </TabsContent>

        {/* ── Emails ───────────────────────────────────────────────────────── */}
        <TabsContent value="emails">
          <EmailsTable
            baseParams={baseParams}
            categories={availableCategories}
            mailboxes={availableMailboxes}
          />
        </TabsContent>

        {/* ── Hotels ───────────────────────────────────────────────────────── */}
        <TabsContent value="hotels" className="flex flex-col gap-6">
          {hotelsLoading ? (
            <Loading label="Loading hotel data…" />
          ) : hotelsError ? (
            <p className="text-sm text-red-500">Failed to load hotel data: {(hotelsError as Error).message}</p>
          ) : hotels ? (
            <>
              <HotelsStatCards stats={hotels.hotelStats} />
              <HotelsTable hotels={hotels.hotels} />
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
