import { useState } from 'react';

import {
  IconBuildingSkyscraper,
  IconChartBar,
  IconMail,
  IconTag,
} from '@tabler/icons-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AcceptanceRateChart } from './_components/acceptance-rate-chart';
import { CategoryEditDistanceChart } from './_components/category-edit-distance-chart';
import { CategoryHeatmap } from './_components/category-heatmap';
import { CategorySummaryTable } from './_components/category-summary-table';
import {
  DateRangeFilter,
  type DateRangeSelection,
} from './_components/date-range-filter';
import { EditClassBar } from './_components/edit-class-bar';
import { EditDistanceChart } from './_components/edit-distance-chart';
import { EditDistanceHistogram } from './_components/edit-distance-histogram';
import { EmailsTable } from './_components/emails-table';
import { ALL_HOTELS, HotelFilter } from './_components/hotel-filter';
import { HotelsStatCards } from './_components/hotels-stat-cards';
import { HotelsTable } from './_components/hotels-table';
import { OverallSplitPie } from './_components/overall-split-pie';
import { StatCardGrid } from './_components/stat-card-grid';
import { emailPerformanceMock } from './_data/mock';

export default function EmailPerformancePage() {
  const [hotelId, setHotelId] = useState<string>(ALL_HOTELS);
  const [dateRange, setDateRange] = useState<DateRangeSelection>({
    kind: 'preset',
    preset: 'last30',
  });

  const data = emailPerformanceMock;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold tracking-tight">Email Assistant Statistics</h1>

      <Tabs defaultValue="overview" className="flex flex-col gap-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <TabsList variant={"accent-tab"}>
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

        <TabsContent value="overview" className="flex flex-col gap-6">
          <StatCardGrid kpis={data.kpis} />

          
          <div className="grid gap-4 lg:grid-cols-2">
            <EditDistanceChart data={data.editDistanceOverTime} />
            <AcceptanceRateChart data={data.acceptanceRateOverTime} />
          </div>

          {/* <SectionLabel>Edit Class Distribution</SectionLabel> */}
          <div className="grid gap-4 lg:grid-cols-2">
            <EditClassBar data={data.editClassOverTime} />
            <OverallSplitPie data={data.overallSplit} />
          </div>

          {/* <SectionLabel>Edit Distance Distribution</SectionLabel> */}
          <EditDistanceHistogram data={data.editDistanceHistogram} />
        </TabsContent>

        <TabsContent value="by-category" className="flex flex-col gap-6">
          <CategorySummaryTable rows={data.categorySummary} />

          <CategoryEditDistanceChart data={data.editDistanceByCategory} />

          <CategoryHeatmap
            weeks={data.editDistanceHeatmap.weeks}
            rows={data.editDistanceHeatmap.rows}
          />
        </TabsContent>
        <TabsContent value="emails">
          <EmailsTable emails={data.emails} />
        </TabsContent>
        <TabsContent value="hotels" className="flex flex-col gap-6">
          <HotelsStatCards stats={data.hotelStats} />
          <HotelsTable hotels={data.hotels} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
