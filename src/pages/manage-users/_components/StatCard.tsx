import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="px-4! p-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <Icon className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
