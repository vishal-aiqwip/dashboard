import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { axiosApi } from '@/lib/axios';

type Chatbot = { id: string; custom_tool_prompt?: string | null };

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
}

export function OrgCustomToolPromptDialog({ open, onOpenChange, organizationId }: Props) {
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: chatbots = [], isLoading, isError } = useQuery<Chatbot[]>({
    queryKey: ['chatbots', organizationId, 'with-tool-prompts'],
    queryFn: async () => {
      const { data } = await axiosApi.get('/api/chatbots', { params: { organization_id: organizationId } });
      return data?.data?.chatbots ?? [];
    },
    enabled: open && !!organizationId,
    staleTime: 0,
  });

  const initialState = useMemo(() => {
    if (!chatbots.length) return { value: '', mixed: false };
    const values = chatbots.map((c) => (c.custom_tool_prompt ?? '').trim());
    const allSame = values.every((v) => v === values[0]);
    return { value: values[0] ?? '', mixed: !allSame };
  }, [chatbots]);

  useEffect(() => {
    if (open) setPrompt(initialState.value);
  }, [open, initialState.value]);

  const onSave = async () => {
    setIsSaving(true);
    try {
      const { data } = await axiosApi.get('/api/chatbots', { params: { organization_id: organizationId } });
      const bots: Chatbot[] = data?.data?.chatbots ?? [];
      let updated = 0;
      for (const bot of bots) {
        try {
          await axiosApi.patch(`/api/chatbots/${bot.id}`, { custom_tool_prompt: prompt }, { params: { organization_id: organizationId } });
          updated += 1;
        } catch { /* continue */ }
      }
      toast.success(updated > 0 ? `Updated ${updated} chatbot${updated === 1 ? '' : 's'}.` : 'No chatbots updated.');
      onOpenChange(false);
    } catch {
      toast.error('Failed to save custom tool prompt.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom Tool Prompt</DialogTitle>
          <DialogDescription>
            Set a shared custom tool prompt for all chatbots in this organization. This will overwrite the value on each chatbot.
          </DialogDescription>
          {isLoading ? (
            <p className="text-xs text-muted-foreground mt-1">Loading chatbots…</p>
          ) : isError ? (
            <p className="text-xs text-red-600 mt-1">Failed to load chatbots.</p>
          ) : initialState.mixed ? (
            <p className="text-xs text-muted-foreground mt-1">Current values differ across chatbots. Editing will apply to all.</p>
          ) : null}
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Custom tool prompt</label>
          <Textarea
            rows={10}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the tools and instructions available to this org's chatbots…"
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
