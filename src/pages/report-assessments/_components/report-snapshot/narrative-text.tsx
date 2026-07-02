import { cn } from '@/lib/utils';

export function NarrativeText({ source, className }: { source: string; className?: string }) {
  if (!source?.trim()) return null;
  return (
    <p className={cn('whitespace-pre-line text-sm leading-relaxed text-foreground', className)}>
      {source.trim()}
    </p>
  );
}
