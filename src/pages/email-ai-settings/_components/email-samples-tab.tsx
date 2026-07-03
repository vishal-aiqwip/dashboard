import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Mail, MessageSquare, Pencil, Plus, Reply, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailSettingsService,
  type EmailSample,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Types ──────────────────────────────────────────────────────────────────────

type LocalSample = EmailSample & { _localId: string };

let _idCounter = 0;
const newLocalId = () => `local-${++_idCounter}`;

// ── Sample Form Dialog ─────────────────────────────────────────────────────────

interface SampleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: LocalSample | null;
  onSave: (sample: EmailSample) => void;
}

function SampleFormDialog({ open, onOpenChange, initial, onSave }: SampleFormDialogProps) {
  const [title, setTitle] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [aiEmailReply, setAiEmailReply] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '');
      setCustomerEmail(initial?.customerEmail ?? '');
      setAiEmailReply(initial?.aiEmailReply ?? '');
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    onSave({ title: title.trim(), customerEmail: customerEmail.trim(), aiEmailReply: aiEmailReply.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>{initial ? 'Edit Email Sample' : 'Add New Email Sample'}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* Title — full width */}
          <div className="shrink-0 space-y-1.5">
            <Label htmlFor="sample-title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sample-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 'Booking Confirmation', 'Complaint Response'"
              className="text-xs"
            />
          </div>

          {/* Customer Email + AI Reply — side by side, filling remaining height */}
          <div className="grid min-h-0 flex-1 grid-cols-2 gap-4">
            <div className="flex min-h-0 flex-col space-y-1.5">
              <Label htmlFor="sample-customer" className="shrink-0 text-xs font-medium">
                Customer Email <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sample-customer"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="Paste the original customer email here…"
                className="min-h-0 flex-1 resize-none text-xs"
              />
            </div>

            <div className="flex min-h-0 flex-col space-y-1.5">
              <Label htmlFor="sample-reply" className="shrink-0 text-xs font-medium">
                AI Reply Email <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sample-reply"
                value={aiEmailReply}
                onChange={(e) => setAiEmailReply(e.target.value)}
                placeholder="Paste your ideal response email here…"
                className="min-h-0 flex-1 resize-none text-xs"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            {initial ? 'Save Changes' : 'Add Sample'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Sample Card ────────────────────────────────────────────────────────────────

interface SampleCardProps {
  sample: LocalSample;
  onEdit: () => void;
  onDelete: () => void;
}

function SampleCard({ sample, onEdit, onDelete }: SampleCardProps) {
  return (
    <Card className="">
      <CardContent className="py-0! px-4">
        {/* Title row */}
        <div className="flex items-center justify-between gap-3 ">
          <p className="truncate text-sm font-semibold text-foreground">{sample.title}</p>
          <div className="flex shrink-0 items-center gap-1 ">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Customer Email */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Customer Email</span>
          </div>
          <div className="rounded-md bg-secondary dark:bg-muted px-3 py-2 text-xs leading-relaxed text-foreground">
            <span className="line-clamp-3">{sample.customerEmail || '—'}</span>
          </div>
        </div>

        {/* AI Reply */}
        <div className="space-y-1.5 mt-2">
          <div className="flex items-center gap-1.5">
            <Reply className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">AI Reply</span>
          </div>
          <div className="rounded-md bg-secondary  dark:bg-muted px-3 py-2 text-xs leading-relaxed text-foreground">
            <span className="line-clamp-3">{sample.aiEmailReply || '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface EmailSamplesTabProps {
  orgId: string;
}

export function EmailSamplesTab({ orgId }: EmailSamplesTabProps) {
  const qc = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: ['ai-email-settings', orgId],
    queryFn: () => aiEmailSettingsService.getSettings(orgId),
    enabled: !!orgId,
  });

  const settings = settingsQuery.data;

  const [localSamples, setLocalSamples] = useState<LocalSample[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSample, setEditingSample] = useState<LocalSample | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (settings) {
      if (skipSyncRef.current) {
        skipSyncRef.current = false;
        return;
      }
      setLocalSamples(
        (settings.examples ?? []).map((s) => ({ ...s, _localId: newLocalId() }))
      );
      setIsDirty(false);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.updateSettings({
        organization_id: orgId,
        email_settings_id: settings?.email_settings_id ?? null,
        prompt_parts: settings?.prompt_parts ?? {},
        insert_font_family: settings?.insert_font_family ?? null,
        insert_font_size: settings?.insert_font_size ?? null,
        insert_font_color: settings?.insert_font_color ?? null,
        examples: localSamples.map(({ _localId: _, ...rest }) => rest),
      }),
    onSuccess: () => {
      toast.success('Email samples saved');
      setIsDirty(false);
      skipSyncRef.current = true;
      void qc.invalidateQueries({ queryKey: ['ai-email-settings', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleOpenAdd = () => {
    setEditingSample(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (sample: LocalSample) => {
    setEditingSample(sample);
    setDialogOpen(true);
  };

  const handleSampleSave = (sample: EmailSample) => {
    if (editingSample) {
      setLocalSamples((prev) =>
        prev.map((s) => (s._localId === editingSample._localId ? { ...sample, _localId: s._localId } : s))
      );
    } else {
      setLocalSamples((prev) => [...prev, { ...sample, _localId: newLocalId() }]);
    }
    setIsDirty(true);
  };

  const handleDelete = (localId: string) => {
    setLocalSamples((prev) => prev.filter((s) => s._localId !== localId));
    setDeletingId(null);
    setIsDirty(true);
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-2 gap-3 p-4">
              <Skeleton className="h-20 rounded-lg" />
              <Skeleton className="h-20 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Email Samples{' '}
            <span className="font-normal text-muted-foreground">({localSamples.length}/20)</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Provide example conversations to help the AI learn your preferred response style.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="h-8 gap-1.5 text-xs"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save
            </Button>
          )}
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" />
            Add Sample
          </Button>
        </div>
      </div>

      {/* Sample list */}
      {localSamples.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 ring-1 ring-border">
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No email samples yet</p>
            <p className="text-xs text-muted-foreground">
              Add example emails to help the AI understand your response style.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleOpenAdd} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Sample
          </Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
          {localSamples.map((sample) => (
            <SampleCard
              key={sample._localId}
              sample={sample}
              onEdit={() => handleOpenEdit(sample)}
              onDelete={() => setDeletingId(sample._localId)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <SampleFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingSample}
        onSave={handleSampleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete email sample?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the sample from the list. You'll need to save to persist the change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
