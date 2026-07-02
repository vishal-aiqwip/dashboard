import { cn } from '@/lib/utils';

function parseInlineMd(text: string): React.ReactNode[] {
  const segments = text.split(/(\*\*[^*\n]+\*\*)/g);
  return segments.map((seg, i) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    return seg || null;
  });
}

export function NarrativeText({ source, className }: { source: string; className?: string }) {
  if (!source?.trim()) return null;
  const lines = source.trim().split('\n');
  return (
    <div className={cn('text-sm leading-relaxed text-foreground', className)}>
      {lines.map((line, i) =>
        line.trim() === '' ? (
          <br key={i} />
        ) : (
          <p key={i} className={i < lines.length - 1 ? 'mb-1' : ''}>
            {parseInlineMd(line)}
          </p>
        ),
      )}
    </div>
  );
}
