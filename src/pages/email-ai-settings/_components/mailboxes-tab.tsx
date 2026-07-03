import { ClipboardEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  FileSignature,
  Loader2,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailSettingsService,
  type MailboxRow,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor(abs / 3600000);
  if (diff < 0) {
    if (days > 0) return `Expired ${days}d ago`;
    if (hours > 0) return `Expired ${hours}h ago`;
    return 'Just expired';
  }
  if (days > 0) return `Expires in ${days}d`;
  if (hours > 0) return `Expires in ${hours}h`;
  return 'Expires soon';
}

function normalizeDomain(input: string): string | null {
  let d = input.trim().toLowerCase();
  if (!d) return null;
  if (d.includes('@')) {
    const parts = d.split('@');
    if (parts.length !== 2 || !parts[1]) return null;
    d = parts[1].trim();
  }
  d = d.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].replace(/\.+$/, '');
  if (!d) return null;
  if (!/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/.test(d)) return null;
  return d;
}

// ── Status Badge ───────────────────────────────────────────────────────────────

type MailboxStatus = 'active' | 'expired' | 'not_subscribed' | 'setting_up' | 'waiting_consent' | 'error';

function deriveStatus(mb: MailboxRow): { status: MailboxStatus; expired: boolean } {
  const sub = mb.subscription;
  if (!sub || sub.status === 'missing' || !sub.status) return { status: 'not_subscribed', expired: false };
  const expired = sub.expiration ? !isNaN(Date.parse(sub.expiration)) && Date.parse(sub.expiration) < Date.now() : false;
  if (expired) return { status: 'expired', expired: true };
  if (sub.needs_reconnect) return { status: 'waiting_consent', expired: false };
  if (sub.status === 'active') return { status: 'active', expired: false };
  if (sub.status === 'error') return { status: 'error', expired: false };
  return { status: 'setting_up', expired: false };
}

const STATUS_CONFIG: Record<MailboxStatus, { label: string; icon: React.ElementType; className: string }> = {
  active:          { label: 'Active',           icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  expired:         { label: 'Expired',          icon: AlertCircle,  className: 'border-red-200 bg-red-50 text-red-700' },
  not_subscribed:  { label: 'Not subscribed',   icon: Clock,        className: 'border-amber-200 bg-amber-50 text-amber-700' },
  setting_up:      { label: 'Setting up',       icon: RefreshCw,    className: 'border-blue-200 bg-blue-50 text-blue-700' },
  waiting_consent: { label: 'Waiting for consent', icon: Clock,     className: 'border-amber-200 bg-amber-50 text-amber-700' },
  error:           { label: 'Error',            icon: AlertCircle,  className: 'border-red-200 bg-red-50 text-red-700' },
};

function StatusBadge({ status }: { status: MailboxStatus }) {
  const { label, icon: Icon, className } = STATUS_CONFIG[status];
  return (
    <Badge variant="outline" className={`gap-1 text-[11px] ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ── Signature Dialog ───────────────────────────────────────────────────────────

function SignatureDialog({ open, onOpenChange, orgId, mailboxEmail }: {
  open: boolean; onOpenChange: (v: boolean) => void; orgId: string; mailboxEmail: string;
}) {
  const qc = useQueryClient();
  const mbQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, mailboxEmail],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, mailboxEmail),
    enabled: open && !!mailboxEmail,
  });

  const [signatureHtml, setSignatureHtml] = useState('');
  const [includeInDrafts, setIncludeInDrafts] = useState(true);

  useEffect(() => {
    if (open && mbQuery.data) {
      const html = mbQuery.data.signature_html ?? '';
      setSignatureHtml(html);
      setIncludeInDrafts(html.trim() ? (mbQuery.data.include_signature_in_auto_drafts ?? true) : true);
    }
    if (!open) { setSignatureHtml(''); setIncludeInDrafts(true); }
  }, [open, mbQuery.data]);

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData?.getData('text/html');
    if (html?.trim()) { e.preventDefault(); setSignatureHtml(html.trim()); }
  };

  const saveMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.updateMailboxSettings({
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
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Signature — {mailboxEmail}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Paste your email signature from Outlook or Gmail.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {mbQuery.isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Signature HTML</Label>
                <Textarea
                  value={signatureHtml}
                  onChange={(e) => setSignatureHtml(e.target.value)}
                  onPaste={handlePaste}
                  rows={8}
                  placeholder="Paste your signature here (Ctrl/Cmd + V)…"
                  className="resize-none font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Include in auto-generated drafts</p>
                  <p className="text-[11px] text-muted-foreground">Append this signature to AI-generated email drafts</p>
                </div>
                <Switch checked={includeInDrafts} onCheckedChange={setIncludeInDrafts} />
              </div>

              {signatureHtml.trim() && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Preview</Label>
                  <div className="min-h-16 overflow-auto rounded-lg border border-border bg-white p-4">
                    <div
                      className="[&_img]:max-w-full [&_img]:h-auto"
                      dangerouslySetInnerHTML={{ __html: signatureHtml }}
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>Cancel</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || mbQuery.isLoading}>
            {saveMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Save Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Blocked Domains Dialog ─────────────────────────────────────────────────────

function BlockedDomainsDialog({ open, onOpenChange, orgId, mailboxEmail }: {
  open: boolean; onOpenChange: (v: boolean) => void; orgId: string; mailboxEmail: string;
}) {
  const qc = useQueryClient();
  const mbQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, mailboxEmail],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, mailboxEmail),
    enabled: open && !!mailboxEmail,
  });

  const [domains, setDomains] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    if (open && mbQuery.data) setDomains(mbQuery.data.auto_drafts_blocked_sender_domains ?? []);
    if (!open) { setDomains([]); setInputVal(''); setInputError(''); }
  }, [open, mbQuery.data]);

  const handleAdd = () => {
    const normalized = normalizeDomain(inputVal);
    if (!normalized) {
      setInputError(inputVal.trim().includes('@') ? 'Enter a domain, not an email. Example: mews.com' : 'Invalid domain format. Example: mews.com');
      return;
    }
    if (domains.includes(normalized)) { setInputError('Domain already blocked'); return; }
    setDomains([...domains, normalized].sort());
    setInputVal('');
    setInputError('');
  };

  const saveMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.updateMailboxSettings({
      organization_id: orgId,
      mailbox_email: mailboxEmail,
      auto_drafts_blocked_sender_domains: domains,
    }),
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
          <DialogTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5" />
            Blocked Domains — {mailboxEmail}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Emails from these domains will not trigger AI auto-drafts.
          </DialogDescription>
        </DialogHeader>

        {mbQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4">
            {/* Add input */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Add Domain</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="example.com"
                  value={inputVal}
                  onChange={(e) => { setInputVal(e.target.value); setInputError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                  className={inputError ? 'border-destructive text-xs' : 'text-xs'}
                />
                <Button size="sm" variant="outline" onClick={handleAdd} disabled={!inputVal}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {inputError && <p className="text-[11px] text-destructive">{inputError}</p>}
            </div>

            {/* Domain chips */}
            {domains.length > 0 ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Blocked Domains ({domains.length})</Label>
                <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-muted/30 p-3">
                  {domains.map((d) => (
                    <div key={d} className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
                      <span className="font-mono text-xs">{d}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 text-muted-foreground hover:text-destructive"
                        onClick={() => setDomains(domains.filter((x) => x !== d))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center">
                <p className="text-xs text-muted-foreground">No blocked domains yet. Add domains above.</p>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>Cancel</Button>
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || mbQuery.isLoading}>
            {saveMutation.isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Dialog ──────────────────────────────────────────────────────────────

function DeleteDialog({ mailbox, onConfirm, onCancel, isPending }: {
  mailbox: string; onConfirm: () => void; onCancel: () => void; isPending: boolean;
}) {
  return (
    <Dialog open={!!mailbox} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Remove Mailbox
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                You are about to remove{' '}
                <span className="font-medium text-foreground">{mailbox}</span> from the AI Email Assistant.
              </p>
              <p className="font-medium text-foreground">What happens next:</p>
              <ul className="list-inside list-disc space-y-1 text-xs">
                <li>AI will stop generating draft replies for this mailbox</li>
                <li>The mailbox will be removed from your monitored list</li>
                <li>Your emails in Outlook remain unaffected — nothing is deleted</li>
              </ul>
              <p className="text-xs">You can re-add this mailbox at any time to resume AI assistance.</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isPending}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending} className="gap-1.5">
            {isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Removing…</> : <><Trash2 className="h-3.5 w-3.5" />Remove Mailbox</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── IT Partner Dialog ──────────────────────────────────────────────────────────

function ItPartnerDialog({ open, onOpenChange, orgId, mailboxes }: {
  open: boolean; onOpenChange: (v: boolean) => void; orgId: string; mailboxes: string[];
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    "Hi! We're setting up an AI email assistant to help respond to guest emails. Could you help approve the required email access when you receive the request? Let me know if you have any questions. Thanks!"
  );
  const [grantLink, setGrantLink] = useState<string | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);

  const close = () => {
    onOpenChange(false);
    setTimeout(() => { setName(''); setEmail(''); setGrantLink(null); }, 200);
  };

  const inviteMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.inviteItPartner({
      organization_id: orgId,
      it_partner_name: name.trim(),
      it_partner_email: email.trim(),
      message: message.trim(),
      requested_mailboxes: mailboxes,
    }),
    onSuccess: (res) => {
      toast.success('Invite sent to IT partner');
      const link = res?.data?.grant_access_link?.trim();
      if (link) setGrantLink(link);
      else close();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md">
        {grantLink ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Invite sent</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Your IT contact will receive the request. You can also share this link directly.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Grant access link</Label>
              <div className="flex gap-2">
                <Input ref={linkRef} value={grantLink} readOnly className="text-xs font-mono" />
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(grantLink); toast.success('Copied'); }}>Copy</Button>
              </div>
            </div>
            <DialogFooter>
              <Button size="sm" onClick={close}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />Invite IT Partner</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Send an email to your IT contact so they can approve Microsoft email access for the AI assistant.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Full name</Label>
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} disabled={inviteMutation.isPending} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Email</Label>
                <Input type="email" placeholder="email@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={inviteMutation.isPending} className="text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Message to IT</Label>
                <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} disabled={inviteMutation.isPending} className="resize-none text-xs" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={close} disabled={inviteMutation.isPending}>Cancel</Button>
              <Button size="sm" onClick={() => inviteMutation.mutate()} disabled={inviteMutation.isPending || !name.trim() || !email.trim()} className="gap-1.5">
                {inviteMutation.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</> : <><Send className="h-3.5 w-3.5" />Send Invite</>}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Mailbox Card ───────────────────────────────────────────────────────────────

function MailboxCard({ mb, orgId, onDelete, onSubscribe, onReconnect, isPendingSubscribe, isPendingReconnect }: {
  mb: MailboxRow; orgId: string;
  onDelete: () => void; onSubscribe: () => void; onReconnect: () => void;
  isPendingSubscribe: boolean; isPendingReconnect: boolean;
}) {
  const qc = useQueryClient();
  const { status, expired } = deriveStatus(mb);
  const [sigOpen, setSigOpen] = useState(false);
  const [blockedOpen, setBlockedOpen] = useState(false);

  const toggleDraftsMutation = useMutation({
    mutationFn: (enabled: boolean) => aiEmailSettingsService.updateMailboxSettings({
      organization_id: orgId, mailbox_email: mb.mailbox, auto_drafts_enabled: enabled,
    }),
    onSuccess: (_, enabled) => {
      toast.success(`Auto-drafts ${enabled ? 'enabled' : 'disabled'}`);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <>
      <Card className={`overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md ${expired ? 'border-destructive/40 bg-destructive/3' : ''}`}>
        <CardContent className="px-4 py-0">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: avatar + email + status */}
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{mb.mailbox}</p>
                <div className="mt-1 flex items-center gap-2">
                  <StatusBadge status={status} />
                  {mb.subscription?.expiration && !['not_subscribed'].includes(status) && (
                    <span className="text-[11px] text-muted-foreground">
                      {formatRelativeTime(mb.subscription.expiration)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: controls */}
            <div className="flex items-center gap-3">
              {/* Auto-drafts */}
              <div className="flex items-center gap-2">
                <span className="hidden text-xs text-muted-foreground sm:inline">Auto-drafts</span>
                <Switch
                  checked={!!mb.auto_drafts_enabled}
                  disabled={toggleDraftsMutation.isPending}
                  onCheckedChange={(v) => toggleDraftsMutation.mutate(v)}
                />
              </div>

              <div className="hidden h-5 w-px bg-border sm:block" />

              {/* Action buttons */}
              <div className="flex items-center gap-1.5">
                {status === 'not_subscribed' ? (
                  <Button size="sm" variant="outline" onClick={onSubscribe} disabled={isPendingSubscribe} className="h-8 gap-1.5 text-xs">
                    {isPendingSubscribe ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Subscribe
                  </Button>
                ) : (
                  <Button size="sm" variant={expired ? 'default' : 'outline'} onClick={onReconnect} disabled={isPendingReconnect} className="h-8 gap-1.5 text-xs">
                    <RefreshCw className={`h-3.5 w-3.5 ${isPendingReconnect ? 'animate-spin' : ''}`} />
                    Reconnect
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSigOpen(true)} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <FileSignature className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Signature</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setBlockedOpen(true)} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Ban className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Blocked</span>
                </Button>
                <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SignatureDialog open={sigOpen} onOpenChange={setSigOpen} orgId={orgId} mailboxEmail={mb.mailbox} />
      <BlockedDomainsDialog open={blockedOpen} onOpenChange={setBlockedOpen} orgId={orgId} mailboxEmail={mb.mailbox} />
    </>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface MailboxesTabProps { orgId: string; }

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
  const consent = consentQuery.data;

  const [addMailboxInput, setAddMailboxInput] = useState('');
  const [mailboxToDelete, setMailboxToDelete] = useState<string | null>(null);
  const [itPartnerOpen, setItPartnerOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ mailbox: string; type: 'subscribe' | 'reconnect' } | null>(null);

  const subscribeMutation = useMutation({
    mutationFn: (email: string) => aiEmailSettingsService.createSubscription(orgId, email),
    onSuccess: () => {
      toast.success('Subscription created');
      setPendingAction(null);
      setAddMailboxInput('');
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => { toast.error(err.message); setPendingAction(null); },
  });

  const reconnectMutation = useMutation({
    mutationFn: (email: string) => aiEmailSettingsService.recreateSubscription(orgId, email),
    onSuccess: () => {
      toast.success('Subscription reconnected');
      setPendingAction(null);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => { toast.error(err.message); setPendingAction(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (email: string) => aiEmailSettingsService.deleteSubscription(orgId, email),
    onSuccess: () => {
      toast.success('Mailbox removed');
      setMailboxToDelete(null);
      void qc.invalidateQueries({ queryKey: ['ai-email-mailboxes', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleAddMailbox = () => {
    const email = addMailboxInput.trim().toLowerCase();
    if (!email || !email.includes('@')) { toast.error('Enter a valid email address'); return; }
    const existing = mailboxes.find((m) => m.mailbox.toLowerCase() === email);
    if (existing?.subscription && existing.subscription.status !== 'missing') {
      toast.error('This mailbox already has a subscription. Use Reconnect instead.');
      return;
    }
    setPendingAction({ mailbox: email, type: 'subscribe' });
    subscribeMutation.mutate(email);
  };

  if (mailboxesQuery.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden rounded-xl border border-border shadow-sm">
            <CardContent className="px-5 py-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-52" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-32 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const consentGranted = consent?.admin_consent_granted ?? consent?.has_consent ?? false;
  const appVerified = consent?.graph_app_only_verified ?? consentGranted;
  const grantAccessLink = consent?.grant_access_link ?? consent?.consent_url;

  return (
    <div className="space-y-5">
      {/* Add Mailbox input */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 shadow-sm">
        <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          placeholder="info@hotel.com"
          value={addMailboxInput}
          onChange={(e) => setAddMailboxInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAddMailbox(); }}
          className="flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
        <Button
          size="sm"
          onClick={handleAddMailbox}
          disabled={subscribeMutation.isPending || !addMailboxInput.trim()}
          className="h-8 shrink-0 gap-1.5 text-xs"
        >
          {subscribeMutation.isPending && !pendingAction?.mailbox ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Add Mailbox
        </Button>
      </div>

      {/* Mailbox count header */}
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

      {/* Mailbox list */}
      {mailboxes.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted ring-1 ring-border">
            <Mail className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">No mailboxes connected</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Enter an email address above and click &quot;Add Mailbox&quot; to get started.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {mailboxes.map((mb) => (
            <MailboxCard
              key={mb.mailbox}
              mb={mb}
              orgId={orgId}
              onDelete={() => setMailboxToDelete(mb.mailbox)}
              onSubscribe={() => { setPendingAction({ mailbox: mb.mailbox, type: 'subscribe' }); subscribeMutation.mutate(mb.mailbox); }}
              onReconnect={() => { setPendingAction({ mailbox: mb.mailbox, type: 'reconnect' }); reconnectMutation.mutate(mb.mailbox); }}
              isPendingSubscribe={pendingAction?.mailbox === mb.mailbox && pendingAction.type === 'subscribe' && subscribeMutation.isPending}
              isPendingReconnect={pendingAction?.mailbox === mb.mailbox && pendingAction.type === 'reconnect' && reconnectMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Microsoft Integration Status (collapsible) */}
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Microsoft Integration Status</span>
          <Badge
            variant="outline"
            className={consentGranted
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'}
          >
            {consentQuery.isLoading ? '…' : consentGranted ? 'Connected' : 'Not connected'}
          </Badge>
        </summary>

        <Card className="mt-3 overflow-hidden rounded-xl border border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Microsoft Admin Consent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">Admin consent</span>
              <Badge variant="outline" className={consentGranted ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-muted/50 text-muted-foreground'}>
                {consentQuery.isLoading ? 'Loading…' : consentGranted ? 'Granted' : 'Not granted'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-xs text-muted-foreground">App-only verified</span>
              <Badge variant="outline" className={appVerified ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-border bg-muted/50 text-muted-foreground'}>
                {consentQuery.isLoading ? '…' : appVerified ? 'Yes' : 'No'}
              </Badge>
            </div>

            {!consentQuery.isLoading && !consentGranted && (
              <div className="space-y-3 border-t border-border pt-3">
                {grantAccessLink && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-muted-foreground">Grant access link (share with your IT admin):</p>
                    <div className="flex gap-2">
                      <Input value={grantAccessLink} readOnly className="text-xs font-mono" />
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(grantAccessLink); toast.success('Copied'); }}>Copy</Button>
                    </div>
                  </div>
                )}
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setItPartnerOpen(true)}>
                  <Send className="h-3.5 w-3.5" />
                  Invite IT Partner to Grant Access
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </details>

      {/* Delete Dialog */}
      {mailboxToDelete && (
        <DeleteDialog
          mailbox={mailboxToDelete}
          onConfirm={() => deleteMutation.mutate(mailboxToDelete)}
          onCancel={() => setMailboxToDelete(null)}
          isPending={deleteMutation.isPending}
        />
      )}

      {/* IT Partner Dialog */}
      <ItPartnerDialog
        open={itPartnerOpen}
        onOpenChange={setItPartnerOpen}
        orgId={orgId}
        mailboxes={mailboxes.map((m) => m.mailbox)}
      />
    </div>
  );
}
