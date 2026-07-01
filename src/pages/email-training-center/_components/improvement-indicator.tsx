import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export function ImprovementIndicator({ value }: { value: number }) {
  if (value > 0.01)
    return (
      <span className="inline-flex items-center gap-0.5 text-green-600 text-xs font-medium">
        <ArrowUp className="h-3 w-3" />{(value * 100).toFixed(1)}%
      </span>
    );
  if (value < -0.01)
    return (
      <span className="inline-flex items-center gap-0.5 text-red-600 text-xs font-medium">
        <ArrowDown className="h-3 w-3" />{(Math.abs(value) * 100).toFixed(1)}%
      </span>
    );
  return (
    <span className="inline-flex items-center gap-0.5 text-muted-foreground text-xs font-medium">
      <Minus className="h-3 w-3" />0%
    </span>
  );
}
