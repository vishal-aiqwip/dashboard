import { type ComponentType } from 'react';

import { Maximize2 } from 'lucide-react';

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type Props = {
  sectionValue: string;
  label: string;
  value: string;
  placeholder: string;
  minHeightClass: string;
  icon: ComponentType<{ className?: string }>;
  iconWrapperClassName: string;
  iconClassName: string;
  onChange: (v: string) => void;
  onExpand: () => void;
};

export function PromptEditorField({
  sectionValue, label, value, placeholder, minHeightClass,
  icon: Icon, iconWrapperClassName, iconClassName, onChange, onExpand,
}: Props) {
  const preview = value.trim()
    ? value.trim().replace(/\s+/g, ' ').slice(0, 90) + (value.trim().length > 90 ? '...' : '')
    : placeholder;

  return (
    <AccordionItem value={sectionValue} className="min-w-0 overflow-hidden rounded-lg border bg-card shadow-sm">
      <AccordionTrigger className="px-4 py-3 hover:no-underline [&[data-state=open]]:border-b">
        <div className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${iconWrapperClassName}`}>
            <Icon className={iconClassName} />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <div className="text-sm font-medium text-foreground">{label}</div>
            <p className="mt-1 break-words text-xs leading-snug text-muted-foreground line-clamp-2">{preview}</p>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="min-w-0 px-4 pb-4 pt-3">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center justify-end">
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onExpand}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <Textarea
            className={`min-h-0 min-w-0 max-w-full resize-y text-xs leading-relaxed break-words [overflow-wrap:anywhere] ${minHeightClass}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
