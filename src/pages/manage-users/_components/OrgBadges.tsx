import { Badge } from '@/components/ui/badge';

export function OrgBadges({ orgIds, orgMap }: { orgIds: string[]; orgMap: Map<string, string> }) {
  if (!orgIds.length) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {orgIds.map((id) => (
        <Badge key={id} variant="secondary" className="text-xs">
          {orgMap.get(id) ?? id.slice(0, 8)}
        </Badge>
      ))}
    </div>
  );
}
