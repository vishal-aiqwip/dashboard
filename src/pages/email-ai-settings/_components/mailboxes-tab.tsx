import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  ShieldOff,
  Trash2,
  XCircle,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailSettingsService,
  type MailboxRow,
  type MailboxSettings,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Helpers ────────────────────────────────────────────────────────────────────

type SubscriptionStatus = 'active' | 'inactive' | 'needs_reconnect' | 'error' | 'none';

function deriveStatus(mb: MailboxRow): SubscriptionStatus {
  const sub = mb.subscription;
  if (!sub || !sub.status) return 'none';
  if (sub.needs_reconnect) return 'needs_reconnect';
  if (sub.status === 'active') {
    // Check expiration
    if (sub.expiration) {
      const exp = new Date(sub.expiration);
      if (exp < new Date()) return 'needs_reconnect';
    }
    return 'active';
  }
  if (sub.status === 'error') return 'error';
  return 'inactive';
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const config: Record<SubscriptionStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; Icon: React.ElementType }> = {
    active: { label: 'Active', variant: 'default', Icon: CheckCircle2 },
    inactive: { label: 'Inactive', variant: 'secondary', Icon: XCircle },
    needs_reconnect: { label: 'Reconnect', variant: 'outline', Icon: AlertTriangle },
    error: { label: 'Error', variant: 'destructive', Icon: XCircle },
    none: { label: 'No Subscription', variant: 'secondary', Icon: ShieldOff },
  };
  const { label, variant, Icon } = config[status];
  return (
    <Badge variant={variant} className="gap-1 text-[10px]">
      <Icon className="h-2.5 w-2.5" />
      {label}
    </Badge>
  );
}

// ── Signature Dialog ───────────────────────────────────────────────────────────

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  mailboxEmail: string;
}

function SignatureDialog({ open, onOpenChange, orgId, mailboxEmail }: SignatureDialogProps) {
  const qc = useQueryClient();

  const mbSettingsQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, mailboxEmail],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, mailboxEmail),
    enabled: open && !!mailboxEmail,
  });

  const [signatureHtml, setSignatureHtml] = useState('');
  const [includeInDrafts, setIncludeInDrafts] = useState(false);

  useEffect(() => {
    if (mbSettingsQuery.data) {
      setSignatureHtml(mbSettingsQuery.data.signature_html ?? '');
      setIncludeInDrafts(mbSettingsQuery.data.include_signature_in_auto_drafts ?? false);
    }
  }, [mbSettingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.updateMailboxSettings({
        organization_id: orgId,
        mailbox_email: mailboxEmail,
        signature_html: signatureHtml || null,
        include_signature_in_auto_drafts: includeInDrafts,
      }),
    onSuccess: () => {
      toast.success('Signature saved');
      void qc.invalidateQueries({ queryKey: ['mailbox-settings', orgId, mailboxEmail] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Email Signature — {mailboxEmail}</DialogTitle>
        </DialogHeader>

        {mbSettingsQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Signature HTML</Label>
              <Textarea
                value={signatureHtml}
                onChange={(e) => setSignatureHtml(e.target.value)}
                rows={8}
                placeholder="Paste your HTML signature here…"
                className="resize-none font-mono text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={includeInDrafts}
                onCheckedChange={setIncludeInDrafts}
                id="include-sig-drafts"
              />
              <Label htmlFor="include-sig-drafts" className="text-xs">
                Include signature in auto-drafts
              </Label>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || mbSettingsQuery.isLoading}
          >
            {saveMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Blocked Domains Dialog ─────────────────────────────────────────────────────

interface BlockedDomainsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  mailboxEmail: string;
}

function BlockedDomainsDialog({ open, onOpenChange, orgId, mailboxEmail }: BlockedDomainsDialogProps) {
  const qc = useQueryClient();

  const mbSettingsQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, mailboxEmail],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, mailboxEmail),
    enabled: open && !!mailboxEmail,
  });

  const [domainsText, setDomainsText] = useState('');

  useEffect(() => {
    if (mbSettingsQuery.data) {
      setDomainsText((mbSettingsQuery.data.auto_drafts_blocked_sender_domains ?? []).join('\n'));
    }
  }, [mbSettingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const domains = domainsText
        .split('\n')
        .map((d) => d.trim())
        .filter(Boolean);
      return aiEmailSettingsService.updateMailboxSettings({
        organization_id: orgId,
        mailbox_email: mailboxEmail,
        auto_drafts_blocked_sender_domains: domains,
      });
    },
    onSuccess: () => {
      toast.success('Blocked domains saved');
      void qc.invalidateQueries({ queryKey: ['mailbox-settings', orgId, mailboxEmail] });
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Blocked Sender Domains — {mailboxEmail}</DialogTitle>
        </DialogHeader>

        {mbSettingsQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Domains (one per line)</Label>
            <Textarea
              value={domainsText}
              onChange={(e) => setDomainsText(e.target.value)}
              rows={8}
              placeholder="example.com&#10;spam-domain.net&#10;noreply.service.io"
              className="resize-none font-mono text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Auto-drafts won't be generated for emails from these domains.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || mbSettingsQuery.isLoading}
          >
            {saveMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Mailbox Row ────────────────────────────────────────────────────────────────

interface MailboxRowCardProps {
  mb: MailboxRow;
  orgId: string;
  onDelete: (mailbox: string) => void;
  onSubscribe: (mailbox: string) => void;
  onReconnect: (mailbox: string) => void;
  isSubscribing: boolean;
  isReconnecting: boolean;
  isDeleting: boolean;
}

function MailboxRowCard({
  mb,
  orgId,
  onDelete,
  onSubscribe,
  onReconnect,
  isSubscribing,
  isReconnecting,
  isDeleting,
}: MailboxRowCardProps) {
  const qc = useQueryClient();
  const status = deriveStatus(mb);

  const [sigDialogOpen, setSigDialogOpen] = useState(false);
  const [blockedDialogOpen, setBlockedDialogOpen] = useState(false);

  const toggleDraftsMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      aiEmailSettingsService.updateMailboxSettings({
        organization_id: orgId,
        mailbox_email: mb.mailbox,
        auto_drafts_enabled: enabled,
      }),
    onSuccess: (_, enabled) => {
      toast.success(`Auto-drafts ${enabled ? 'enabled' : 'disabled'}`);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Card className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>

            {/* Email + status */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{mb.mailbox}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
            </div>

            {/* Auto-drafts toggle */}
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Auto-drafts</span>
              <Switch
                checked={mb.auto_drafts_enabled}
                disabled={toggleDraftsMutation.isPending}
                onCheckedChange={(v) => toggleDraftsMutation.mutate(v)}
                className="scale-75"
              />
            </div>

            {/* Subscribe / Reconnect button */}
            {status === 'none' || status === 'inactive' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1.5 text-xs"
                disabled={isSubscribing}
                onClick={() => onSubscribe(mb.mailbox)}
              >
                {isSubscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Subscribe
              </Button>
            ) : status === 'needs_reconnect' ? (
              <Button
                size="sm"
                variant="outline"
                className="h-7 shrink-0 gap-1.5 text-xs"
                disabled={isReconnecting}
                onClick={() => onReconnect(mb.mailbox)}
              >
                {isReconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                Reconnect
              </Button>
            ) : null}

            {/* Actions menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => setSigDialogOpen(true)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit Signature
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBlockedDialogOpen(true)}>
                  <ShieldOff className="mr-2 h-3.5 w-3.5" />
                  Blocked Domains
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  disabled={isDeleting}
                  onClick={() => onDelete(mb.mailbox)}
                >
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Remove Mailbox
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      <SignatureDialog
        open={sigDialogOpen}
        onOpenChange={setSigDialogOpen}
        orgId={orgId}
        mailboxEmail={mb.mailbox}
      />
      <BlockedDomainsDialog
        open={blockedDialogOpen}
        onOpenChange={setBlockedDialogOpen}
        orgId={orgId}
        mailboxEmail={mb.mailbox}
      />
    </>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface MailboxesTabProps {
  orgId: string;
}

export function MailboxesTab({ orgId }: MailboxesTabProps) {
  const qc = useQueryClient();

  const mailboxesQuery = useQuery({
    queryKey: ['ai-email-mailboxes', orgId],
    queryFn: () => aiEmailSettingsService.getMailboxes(orgId),
    enabled: !!orgId,
  });

  const consentQuery = useQuery({
    queryKey: ['ai-email-consent', orgId],
    queryFn: () => aiEmailSettingsService.getConsentStatus(orgId),
    enabled: !!orgId,
  });

  const mailboxes = mailboxesQuery.data ?? [];

  const [deletingMailbox, setDeletingMailbox] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ mailbox: string; type: 'subscribe' | 'reconnect' | 'delete' } | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: (mailboxEmail: string) => aiEmailSettingsService.createSubscription(orgId, mailboxEmail),
    onSuccess: () => {
      toast.success('Subscription created');
      setPendingAction(null);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const reconnectMutation = useMutation({
    mutationFn: (mailboxEmail: string) => aiEmailSettingsService.recreateSubscription(orgId, mailboxEmail),
    onSuccess: () => {
      toast.success('Subscription reconnected');
      setPendingAction(null);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (mailboxEmail: string) => aiEmailSettingsService.deleteSubscription(orgId, mailboxEmail),
    onSuccess: () => {
      toast.success('Mailbox removed');
      setDeletingMailbox(null);
      setPendingAction(null);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
      setPendingAction(null);
    },
  });

  const handleSubscribe = (mailboxEmail: string) => {
    setPendingAction({ mailbox: mailboxEmail, type: 'subscribe' });
    subscribeMutation.mutate(mailboxEmail);
  };

  const handleReconnect = (mailboxEmail: string) => {
    setPendingAction({ mailbox: mailboxEmail, type: 'reconnect' });
    reconnectMutation.mutate(mailboxEmail);
  };

  const handleDeleteConfirm = () => {
    if (!deletingMailbox) return;
    setPendingAction({ mailbox: deletingMailbox, type: 'delete' });
    deleteMutation.mutate(deletingMailbox);
  };

  if (mailboxesQuery.isLoading) {
    return (
      <div className="max-w-3xl space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden border-border shadow-sm">
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-7 w-7 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {/* Microsoft Consent status */}
      {consentQuery.data && (
        <Card className={`border shadow-sm ${consentQuery.data.has_consent ? 'border-green-200 bg-green-50/30' : 'border-amber-200 bg-amber-50/30'}`}>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              {consentQuery.data.has_consent ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <p className="text-xs font-medium text-foreground">
                Microsoft Admin Consent:{' '}
                <span className={consentQuery.data.has_consent ? 'text-green-700' : 'text-amber-700'}>
                  {consentQuery.data.has_consent ? 'Granted' : 'Not granted'}
                </span>
              </p>
              {!consentQuery.data.has_consent && consentQuery.data.consent_url && (
                <a
                  href={consentQuery.data.consent_url}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-xs font-medium text-primary underline-offset-2 hover:underline"
                >
                  Grant Consent →
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Connected Mailboxes{' '}
            {mailboxes.length > 0 && (
              <span className="font-normal text-muted-foreground">({mailboxes.length})</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Manage Microsoft 365 mailboxes connected to the AI email assistant.
          </p>
        </div>
      </div>

      {/* Mailbox list */}
      {mailboxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
          <div className="rounded-full bg-muted p-4 ring-1 ring-border">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No mailboxes connected</p>
            <p className="text-xs text-muted-foreground">
              Contact your IT administrator to add and connect a Microsoft 365 mailbox.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {mailboxes.map((mb) => (
            <MailboxRowCard
              key={mb.mailbox}
              mb={mb}
              orgId={orgId}
              onDelete={(mailbox) => setDeletingMailbox(mailbox)}
              onSubscribe={handleSubscribe}
              onReconnect={handleReconnect}
              isSubscribing={pendingAction?.mailbox === mb.mailbox && pendingAction.type === 'subscribe' && subscribeMutation.isPending}
              isReconnecting={pendingAction?.mailbox === mb.mailbox && pendingAction.type === 'reconnect' && reconnectMutation.isPending}
              isDeleting={pendingAction?.mailbox === mb.mailbox && pendingAction.type === 'delete' && deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingMailbox} onOpenChange={(o) => !o && setDeletingMailbox(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove mailbox?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the subscription for <strong>{deletingMailbox}</strong>. The mailbox will no longer receive AI email assistance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
