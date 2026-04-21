import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export default function DashboardPage() {
  const [period, setPeriod] = useState<number>(7);

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
         
        </div>
        <Tabs
          value={period.toString()}
          onValueChange={(v) => setPeriod(Number(v))}
        >
          <TabsList variant="accent-tab" className="h-9">
            <TabsTrigger value="7" className="text-xs px-3">7 days</TabsTrigger>
            <TabsTrigger value="30" className="text-xs px-3">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

    </div>
  );
}
