import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { EMPTY_FILTERS, type EmailFilters } from './emails-filters';

type EmailsFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: EmailFilters;
  onApply: (next: EmailFilters) => void;
  mailboxes: string[];
  categories: string[];
};

const EDIT_CLASSES = ['accepted', 'light', 'medium', 'heavy', 'rewritten'];
const TRIP_TYPES = ['Leisure', 'Business', 'Group'];
const VERDICTS = ['needs_review', 'rejected', 'approved'];
const FAILURES = ['hallucination', 'policy', 'format', 'tone'];

export function EmailsFilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  mailboxes,
  categories,
}: EmailsFilterSheetProps) {
  const update = <K extends keyof EmailFilters>(key: K, next: EmailFilters[K]) =>
    onApply({ ...value, [key]: next });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow the email list. Changes apply instantly.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-5">
            <SelectField
              label="Mailbox"
              value={value.mailbox}
              onChange={(v) => update('mailbox', v)}
              options={[{ value: 'all', label: 'All mailboxes' }, ...mailboxes.map((m) => ({ value: m, label: m }))]}
            />
            <SelectField
              label="Category"
              value={value.category}
              onChange={(v) => update('category', v)}
              options={[{ value: 'all', label: 'All categories' }, ...categories.map((c) => ({ value: c, label: c }))]}
            />
            <SelectField
              label="Edit class"
              value={value.editClass}
              onChange={(v) => update('editClass', v)}
              options={[
                { value: 'all', label: 'All classes' },
                ...EDIT_CLASSES.map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })),
              ]}
            />
            <SelectField
              label="Trip type"
              value={value.tripType}
              onChange={(v) => update('tripType', v)}
              options={[
                { value: 'all', label: 'All types' },
                ...TRIP_TYPES.map((t) => ({ value: t, label: t })),
              ]}
            />
            <SelectField
              label="Verdict"
              value={value.verdict}
              onChange={(v) => update('verdict', v)}
              options={[
                { value: 'all', label: 'All verdicts' },
                ...VERDICTS.map((v) => ({ value: v, label: v })),
              ]}
            />
            <SelectField
              label="Failure type"
              value={value.failureType}
              onChange={(v) => update('failureType', v)}
              options={[
                { value: 'all', label: 'All failures' },
                ...FAILURES.map((f) => ({ value: f, label: f })),
              ]}
            />

            <div className="flex flex-col gap-2">
              <Label>Edit distance</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  placeholder="Min"
                  value={value.editDistMin}
                  onChange={(e) => update('editDistMin', e.target.value)}
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  max={1}
                  placeholder="Max"
                  value={value.editDistMax}
                  onChange={(e) => update('editDistMax', e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Search</Label>
              <Input
                placeholder="Search subject, guest body, AI draft & final sent body…"
                value={value.search}
                onChange={(e) => update('search', e.target.value)}
              />
            </div>
          </div>
        </div>

        <SheetFooter className="flex-row border-t px-6 py-4">
          <Button
            variant="ghost"
            className="mr-auto"
            onClick={() => onApply(EMPTY_FILTERS)}
          >
            Reset
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
