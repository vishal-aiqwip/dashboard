import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { IconCalendar, IconChevronDown } from '@tabler/icons-react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type DatePreset = 'today' | 'yesterday' | 'last7' | 'last14' | 'last30' | 'last90';

export type DateRangeSelection =
  | { kind: 'preset'; preset: DatePreset }
  | { kind: 'custom'; from: Date; to: Date };

type DateRangeFilterProps = {
  value: DateRangeSelection;
  onChange: (value: DateRangeSelection) => void;
  granularity?: string;
};

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 days' },
  { key: 'last14', label: 'Last 14 days' },
  { key: 'last30', label: 'Last 30 days' },
  { key: 'last90', label: 'Last 90 days' },
];

const PRESET_LABEL: Record<DatePreset, string> = Object.fromEntries(
  PRESETS.map((p) => [p.key, p.label])
) as Record<DatePreset, string>;

const DEFAULT_SELECTION: DateRangeSelection = { kind: 'preset', preset: 'last30' };

function formatShortDate(d: Date): string {
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function triggerLabel(value: DateRangeSelection): string {
  if (value.kind === 'preset') return PRESET_LABEL[value.preset];
  return `${formatShortDate(value.from)} – ${formatShortDate(value.to)}`;
}

export function DateRangeFilter({ value, onChange, granularity = 'day' }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRangeSelection>(value);
  const [tab, setTab] = useState<'presets' | 'calendar'>(
    value.kind === 'custom' ? 'calendar' : 'presets'
  );
  const [range, setRange] = useState<DateRange | undefined>(
    value.kind === 'custom' ? { from: value.from, to: value.to } : undefined
  );

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setDraft(value);
      setTab(value.kind === 'custom' ? 'calendar' : 'presets');
      setRange(value.kind === 'custom' ? { from: value.from, to: value.to } : undefined);
    }
    setOpen(next);
  };

  const draftPreset = draft.kind === 'preset' ? draft.preset : null;

  const choosePreset = (preset: DatePreset) => {
    setDraft({ kind: 'preset', preset });
    setRange(undefined);
  };

  const onRangeSelect = (next: DateRange | undefined) => {
    setRange(next);
    if (next?.from && next.to) {
      setDraft({ kind: 'custom', from: next.from, to: next.to });
    }
  };

  const apply = () => {
    onChange(draft);
    setOpen(false);
  };

  const cancel = () => {
    setDraft(value);
    setOpen(false);
  };

  const clear = () => {
    setDraft(DEFAULT_SELECTION);
    setRange(undefined);
    setTab('presets');
  };

  const canApply =
    draft.kind === 'preset' ||
    (draft.kind === 'custom' && draft.from instanceof Date && draft.to instanceof Date);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 font-normal">
          <IconCalendar className="size-4 opacity-70" />
          <span>{triggerLabel(value)}</span>
          <IconChevronDown className="size-4 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-130 max-w-[calc(100vw-2rem)] p-0"
        align="end"
        sideOffset={6}
      >
        <div className="px-4 pt-4 text-sm text-muted-foreground">
          Granularity: {granularity}
        </div>
        <Separator />

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'presets' | 'calendar')}>
          <div className="px-4 ">
            <TabsList className='bg-gray-100/40' variant={"accent-tab"}>
              <TabsTrigger value="presets">Presets</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="presets" className="mt-0 px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => choosePreset(p.key)}
                  className={cn(
                    'rounded-md bg-muted/50 border px-4 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
                    draftPreset === p.key && 'bg-accent text-accent-foreground ring-1 ring-primary/30'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="mt-0 flex justify-center px-2 py-2">
           <div className='border-border border rounded-xl'>

            <Calendar
              mode="range"
              selected={range}
              onSelect={onRangeSelect}
              numberOfMonths={2}
              defaultMonth={range?.from}
            />
           </div>
          </TabsContent>
        </Tabs>

        <Separator className='p-0! m-0!' />
        <div className="flex items-center justify-between px-4 pb-4">
          <Button variant="ghost" size="sm" onClick={clear}>
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={apply} disabled={!canApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
