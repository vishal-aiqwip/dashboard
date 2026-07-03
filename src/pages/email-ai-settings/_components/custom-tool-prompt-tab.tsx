import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, Wrench } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { aiEmailSettingsService } from '@/services/aiEmailSettings/aiEmailSettings';

interface CustomToolPromptTabProps {
  orgId: string;
}

export function CustomToolPromptTab({ orgId }: CustomToolPromptTabProps) {
  const qc = useQueryClient();

  const mailboxesQuery = useQuery({
    queryKey: ['ai-email-mailboxes', orgId],
    queryFn: () => aiEmailSettingsService.getMailboxes(orgId),
    enabled: !!orgId,
  });

  const mailboxes = mailboxesQuery.data ?? [];

  const [selectedMailbox, setSelectedMailbox] = useState('');

  // Auto-select first mailbox
  useEffect(() => {
    if (mailboxes.length > 0 && !selectedMailbox) {
      setSelectedMailbox(mailboxes[0]!.mailbox);
    }
  }, [mailboxes, selectedMailbox]);

  const mailboxSettingsQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, selectedMailbox],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, selectedMailbox),
    enabled: !!selectedMailbox && !!orgId,
  });

  const mbSettings = mailboxSettingsQuery.data;

  const [customToolPrompt, setCustomToolPrompt] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (mbSettings) {
      setCustomToolPrompt(mbSettings.custom_tool_prompt ?? '');
      setIsDirty(false);
    }
  }, [mbSettings, selectedMailbox]);

  const saveMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.updateMailboxSettings({
        organization_id: orgId,
        mailbox_email: selectedMailbox,
        custom_tool_prompt: customToolPrompt || null,
        mailbox_prompt_parts: mbSettings?.mailbox_prompt_parts ?? undefined,
        auto_drafts_enabled: mbSettings?.auto_drafts_enabled,
        signature_html: mbSettings?.signature_html ?? null,
        include_signature_in_auto_drafts: mbSettings?.include_signature_in_auto_drafts,
        auto_drafts_blocked_sender_domains: mbSettings?.auto_drafts_blocked_sender_domains ?? [],
      }),
    onSuccess: () => {
      toast.success('Custom tool prompt saved');
      setIsDirty(false);
      void qc.invalidateQueries({ queryKey: ['mailbox-settings', orgId, selectedMailbox] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (mailboxesQuery.isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (mailboxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No mailboxes configured</p>
        <p className="text-xs text-muted-foreground">
          Add a mailbox in the Mailboxes tab to configure a custom tool prompt.
        </p>
      </div>
    );
  }

  return (
    <div className=" space-y-4">
      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Custom Tool Prompt</CardTitle>
              <CardDescription className="text-xs">
                Override the default tool-calling instructions for a specific mailbox.
              </CardDescription>
            </div>
            <Button
              size="sm"
              disabled={!isDirty || saveMutation.isPending || !selectedMailbox}
              onClick={() => saveMutation.mutate()}
              className="h-7 shrink-0 gap-1.5 text-xs"
            >
              {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mailbox selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Mailbox</Label>
            <Select
              value={selectedMailbox}
              onValueChange={(v) => {
                setSelectedMailbox(v);
                setIsDirty(false);
              }}
            >
              <SelectTrigger className="h-8 w-72 text-xs">
                <SelectValue placeholder="Select mailbox…" />
              </SelectTrigger>
              <SelectContent>
                {mailboxes.map((mb) => (
                  <SelectItem key={mb.mailbox} value={mb.mailbox} className="text-xs">
                    {mb.mailbox}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom tool prompt */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-foreground">Prompt</Label>
            {mailboxSettingsQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Textarea
                value={customToolPrompt}
                onChange={(e) => {
                  setCustomToolPrompt(e.target.value);
                  setIsDirty(true);
                }}
                rows={10}
                placeholder="Enter a custom tool prompt to override the default behavior for this mailbox…"
                className="resize-none font-mono text-xs"
              />
            )}
            <p className="text-[11px] text-muted-foreground">
              Leave blank to use the organization's default tool prompt.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
