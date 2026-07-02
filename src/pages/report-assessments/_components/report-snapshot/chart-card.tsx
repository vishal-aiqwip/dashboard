import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';

import { SectionHeader } from './section-header';

interface ChartCardProps {
  title: string;
  description: string;
  config: ChartConfig;
  children: React.ComponentProps<typeof ChartContainer>['children'];
  hasData?: boolean;
}

export function ChartCard({ title, description, config, children, hasData = true }: ChartCardProps) {
  return (
    <Card className="rounded-2xl border-grey-100 shadow-sm pb-0">
      <CardHeader className="pb-2">
        <SectionHeader title={title} description={description} />
      </CardHeader>
      <CardContent className="px-4 pb-0">
        {hasData ? (
          <ChartContainer config={config} className="h-80 w-full">
            {children}
          </ChartContainer>
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-muted-foreground">
            Not available for this report
          </div>
        )}
      </CardContent>
    </Card>
  );
}
