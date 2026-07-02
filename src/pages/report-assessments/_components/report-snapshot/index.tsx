import { useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

import { AutomationTab } from './automation-tab';
import { CategoriesTab } from './categories-tab';
import { ExecutiveTab } from './executive-tab';
import { FlagshipKpis } from './flagship-kpis';
import { HeroSection } from './hero-section';
import { QualityTab } from './quality-tab';
import { RevenueTab } from './revenue-tab';
import type { EmailReportSnapshot } from './types';

export type { EmailReportSnapshot } from './types';
export { isValidReportJson } from './helpers';

const TABS = [
  { value: 'executive', label: 'Executive' },
  { value: 'revenue', label: 'Lost Revenue' },
  { value: 'categories', label: 'Categories' },
  { value: 'automation', label: 'Automation' },
  { value: 'quality', label: 'Quality' },
] as const;

export function EmailReportSnapshotView({
  snapshot,
  className,
}: {
  snapshot: EmailReportSnapshot;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState('executive');

  const rj = snapshot.report_json;
  const exec = rj.executive_summary;
  const perf = rj.service_performance;
  const rev = rj.revenue_leakage;
  const auto = rj.automation_readiness ?? null;
  const brandVoice = rj.brand_voice_analysis ?? null;
  const bench = rj.benchmark_scores ?? null;
  const profile = brandVoice?.communication_profile ?? null;
  const workload = rj.workload_profile ?? null;

  return (
    <div className={cn('w-full text-left', className)}>
      <HeroSection
        snapshot={snapshot}
        exec={exec}
        perf={perf}
        workload={workload}
        rawStats={rj.raw_stats}
      />

      <FlagshipKpis headlineKpi={rj.headline_kpi} rev={rev} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="flex w-full flex-wrap gap-1.5 h-auto rounded-xl border bg-muted/60 p-1.5">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="executive" className="mt-6">
          <ExecutiveTab
            spotlightComments={rj.spotlight_comments ?? []}
            workload={workload}
            perf={perf}
            hourlyResponseData={rj.hourly_response_data}
          />
        </TabsContent>

        <TabsContent value="revenue" className="mt-6">
          <RevenueTab rev={rev} exec={exec} headlineKpi={rj.headline_kpi} />
        </TabsContent>

        <TabsContent value="categories" className="mt-6">
          <CategoriesTab
            workload={workload}
            perf={perf}
            guestEmailVolume={exec.guest_email_volume}
          />
        </TabsContent>

        <TabsContent value="automation" className="mt-6">
          <AutomationTab auto={auto} rj={rj} />
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          <QualityTab brandVoice={brandVoice} bench={bench} profile={profile} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
