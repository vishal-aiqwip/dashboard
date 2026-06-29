import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { axiosApi } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type AutoRetrainSettings = {
  isAutoRetrainEnabled: boolean;
  frequency: 'daily' | 'weekly';
  dayOfWeek?: string;
  hourOfDay?: string;
};

type KnowledgeBase = {
  id: string;
  auto_retrain_settings?: AutoRetrainSettings;
};

const formSchema = z.object({
  isAutoRetrainEnabled: z.boolean(),
  frequency: z.enum(['daily', 'weekly']),
  dayOfWeek: z.string().optional(),
  hourOfDay: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const DAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({ value: `${i}:00`, label: `${i}:00` }));

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function OrgAutoRetrainDialog({ open, onOpenChange, organizationId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [currentSummary, setCurrentSummary] = useState('');
  const [mixedFlags, setMixedFlags] = useState<{
    enabled?: boolean; frequency?: boolean; day?: boolean; hour?: boolean;
  }>({});

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isAutoRetrainEnabled: false,
      frequency: 'weekly',
      dayOfWeek: 'monday',
      hourOfDay: '0:00',
    },
  });

  const { control, handleSubmit, watch, reset } = form;
  const frequency = watch('frequency');
  const isAutoRetrainEnabled = watch('isAutoRetrainEnabled');

  useEffect(() => {
    if (!open || !organizationId) return;
    let cancelled = false;

    (async () => {
      try {
        setIsFetching(true);
        const { data } = await axiosApi.get('/api/knowledge-bases', { params: { organization_id: organizationId } });
        const kbs: KnowledgeBase[] = data?.data?.knowledge_bases ?? [];
        if (cancelled) return;

        const enabledValues = kbs.map((k) => k.auto_retrain_settings?.isAutoRetrainEnabled ?? false);
        const allEnabledSame = enabledValues.every((v) => v === enabledValues[0]);
        const allDisabled = allEnabledSame && enabledValues[0] === false;
        const allEnabled = allEnabledSame && enabledValues[0] === true;

        let aggFrequency: 'daily' | 'weekly' | undefined;
        let freqMixed = false;
        let aggDay: string | undefined;
        let dayMixed = false;
        let aggHour: string | undefined;
        let hourMixed = false;

        if (allEnabled) {
          const freqs = kbs.map((k) => k.auto_retrain_settings?.frequency).filter(Boolean) as ('daily' | 'weekly')[];
          if (freqs.length > 0 && freqs.every((f) => f === freqs[0])) {
            aggFrequency = freqs[0];
          } else {
            freqMixed = true;
          }
          const days = kbs.map((k) => k.auto_retrain_settings?.dayOfWeek).filter(Boolean) as string[];
          if (aggFrequency === 'weekly') {
            if (days.length > 0 && days.every((d) => d === days[0])) {
              aggDay = days[0];
            } else {
              dayMixed = true;
            }
          }
          const hours = kbs.map((k) => k.auto_retrain_settings?.hourOfDay).filter(Boolean) as string[];
          if (hours.length > 0 && hours.every((h) => h === hours[0])) {
            aggHour = hours[0];
          } else {
            hourMixed = true;
          }
        }

        let summary = '';
        if (allDisabled) {
          summary = 'Current: Disabled across all chatbots';
        } else if (!allEnabledSame) {
          summary = 'Current: Mixed (some enabled, some disabled)';
        } else if (allEnabled) {
          if (!freqMixed && aggFrequency === 'daily') {
            summary = `Current: Daily at ${aggHour ?? '(mixed)'}`;
          } else if (!freqMixed && aggFrequency === 'weekly') {
            summary = `Current: Weekly on ${aggDay ?? '(mixed day)'} at ${aggHour ?? '(mixed hour)'}`;
          } else {
            summary = 'Current: Enabled (mixed schedule)';
          }
        }

        setCurrentSummary(summary);
        setMixedFlags({ enabled: !allEnabledSame, frequency: freqMixed, day: dayMixed, hour: hourMixed });

        if (allDisabled) {
          reset({ isAutoRetrainEnabled: false, frequency: 'weekly', dayOfWeek: 'monday', hourOfDay: '0:00' });
        } else if (allEnabled && !freqMixed && (aggFrequency === 'daily' || aggFrequency === 'weekly')) {
          reset({
            isAutoRetrainEnabled: true,
            frequency: aggFrequency,
            dayOfWeek: aggFrequency === 'weekly' && !dayMixed ? aggDay ?? 'monday' : 'monday',
            hourOfDay: !hourMixed ? aggHour ?? '0:00' : '0:00',
          });
        }
      } catch {
        setCurrentSummary('');
        setMixedFlags({});
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, organizationId, reset]);

  const onSubmit = async (values: FormValues) => {
    const settings: AutoRetrainSettings = {
      isAutoRetrainEnabled: values.isAutoRetrainEnabled,
      frequency: values.frequency,
      ...(values.frequency === 'weekly' ? { dayOfWeek: values.dayOfWeek } : {}),
      hourOfDay: values.hourOfDay,
    };

    setIsLoading(true);
    try {
      const { data } = await axiosApi.get('/api/knowledge-bases', { params: { organization_id: organizationId } });
      const kbs: KnowledgeBase[] = data?.data?.knowledge_bases ?? [];
      let updated = 0;
      for (const kb of kbs) {
        try {
          await axiosApi.put(`/api/knowledge-bases/${kb.id}/auto-retrain`, settings, { params: { organization_id: organizationId } });
          updated += 1;
        } catch { /* continue */ }
      }
      toast.success(updated > 0 ? `Updated ${updated} knowledge base${updated === 1 ? '' : 's'}.` : 'Auto re-train settings saved.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to update auto re-train settings.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Auto Re-train Settings</DialogTitle>
          <DialogDescription>
            Apply auto re-train schedule to all chatbots' knowledge bases in this organization.
          </DialogDescription>
          {isFetching ? (
            <p className="text-xs text-muted-foreground mt-1">Loading current settings…</p>
          ) : currentSummary ? (
            <p className="text-xs text-muted-foreground mt-1">{currentSummary}</p>
          ) : null}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={control}
              name="isAutoRetrainEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch id="auto-retrain-toggle" checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel htmlFor="auto-retrain-toggle" className="!mt-0">Enable Auto Re-train</FormLabel>
                  {mixedFlags.enabled && <span className="text-xs text-muted-foreground">(mixed)</span>}
                </FormItem>
              )}
            />

            {isAutoRetrainEnabled && (
              <div className="space-y-4">
                <FormField
                  control={control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Re-train Frequency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      {mixedFlags.frequency && (
                        <p className="text-xs text-muted-foreground">Current frequency differs across chatbots.</p>
                      )}
                    </FormItem>
                  )}
                />

                {frequency === 'weekly' && (
                  <FormField
                    control={control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of the Week</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DAYS.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {mixedFlags.day && (
                          <p className="text-xs text-muted-foreground">Current day differs across chatbots.</p>
                        )}
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={control}
                  name="hourOfDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hour of the Day</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select hour" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {mixedFlags.hour && (
                        <p className="text-xs text-muted-foreground">Current hour differs across chatbots.</p>
                      )}
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
