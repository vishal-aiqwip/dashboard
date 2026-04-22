import { useState } from 'react';

import { IconChevronDown, IconChevronRight, IconMail } from '@tabler/icons-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { editClassBadgeClasses } from '@/pages/email-performance/_components/edit-class-colors';
import type { EmailRow } from '@/pages/email-performance/_data/mock';

function formatDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

type Props = {
  email: EmailRow | null;
  onClose: () => void;
};

export function EmailDetailSheet({ email, onClose }: Props) {
  return (
    <Sheet open={!!email} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-screen max-w-full flex-col gap-0 p-0 sm:max-w-full"
      >
        {email && <EmailDetailBody email={email} />}
      </SheetContent>
    </Sheet>
  );
}

function EmailDetailBody({ email }: { email: EmailRow }) {
  return (
    <>
      <SheetHeader className="border-b px-6 py-4 gap-2">
        <div className="flex items-start justify-between gap-4 pr-10">
          <div className="flex flex-col gap-2">
            <SheetTitle className="text-lg">{email.subject}</SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  editClassBadgeClasses(email.editClass)
                )}
              >
                {email.editClass[0].toUpperCase() + email.editClass.slice(1)}
              </span>
              <span className="font-medium text-foreground tabular-nums">
                edit dist. {email.editDist.toFixed(3)}
              </span>
              <span>{formatDate(email.sentAt)}</span>
              <span>{email.mailbox}</span>
              <span>from {email.guestFrom}</span>
            </SheetDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            <IconMail className="size-3" />
            Email Thread
          </Badge>
        </div>
      </SheetHeader>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-64 shrink-0 border-r bg-muted/20 lg:block">
          <div className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email Thread
          </div>
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Single round in this thread.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6">
            {email.toolCalls && email.toolCalls.length > 0 && (
              <ToolCallsBlock calls={email.toolCalls} />
            )}
            <GuestEmailBlock email={email} />
            <DiffBlock aiDraft={email.aiDraft} finalSent={email.finalSent} />
          </div>
        </div>
      </div>
    </>
  );
}

function CollapsibleHeader({
  open,
  onToggle,
  title,
  badge,
  right,
}: {
  open: boolean;
  onToggle: () => void;
  title: React.ReactNode;
  badge?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2 border-b bg-muted/30 px-4 py-2.5 text-left text-sm hover:bg-muted/50"
    >
      {open ? (
        <IconChevronDown className="size-4 text-muted-foreground" />
      ) : (
        <IconChevronRight className="size-4 text-muted-foreground" />
      )}
      <span className="font-semibold">{title}</span>
      {badge}
      {right && <span className="ml-auto">{right}</span>}
    </button>
  );
}

function ToolCallsBlock({ calls }: { calls: NonNullable<EmailRow['toolCalls']> }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <CollapsibleHeader
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title={<>🔧 TOOL CALLS</>}
        badge={
          <span className="text-xs text-muted-foreground">
            ({calls.length} call{calls.length > 1 ? 's' : ''})
          </span>
        }
      />
      {open && (
        <div className="flex flex-col gap-3 p-4">
          {calls.map((call, i) => (
            <ToolCall key={i} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}

function ToolCall({ call }: { call: NonNullable<EmailRow['toolCalls']>[number] }) {
  const [showDetails, setShowDetails] = useState(true);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs">
        {call.provider && (
          <Badge variant="secondary" className="bg-amber-500/15 text-amber-700">
            {call.provider}
          </Badge>
        )}
        <span className="font-medium">{call.tool}</span>
        <Badge
          variant="secondary"
          className={cn(
            call.status === 'success'
              ? 'bg-emerald-500/15 text-emerald-700'
              : 'bg-rose-500/15 text-rose-700'
          )}
        >
          {call.status}
        </Badge>
        <button
          type="button"
          onClick={() => setShowDetails((s) => !s)}
          className="ml-auto text-xs text-primary hover:underline"
        >
          {showDetails ? 'Hide details' : 'Show details'}
        </button>
      </div>
      {showDetails && (
        <div className="grid gap-3 rounded-md bg-muted/30 p-3 text-xs">
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
              Arguments
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {JSON.stringify(call.args, null, 2)}
            </pre>
          </div>
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">
              Output
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
              {call.output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function GuestEmailBlock({ email }: { email: EmailRow }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <CollapsibleHeader
        open={open}
        onToggle={() => setOpen((o) => !o)}
        title={<>📨 GUEST EMAIL</>}
        right={<span className="text-xs text-muted-foreground">from {email.guestFrom}</span>}
      />
      {open && (
        <div className="whitespace-pre-wrap p-4 text-sm leading-relaxed">{email.guestEmail}</div>
      )}
    </div>
  );
}

function DiffBlock({ aiDraft, finalSent }: { aiDraft: string; finalSent: string }) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2.5 text-xs">
        <Badge variant="secondary" className="bg-rose-500/15 text-rose-700">
          removed
        </Badge>
        <span className="text-muted-foreground">in AI draft</span>
        <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700">
          added
        </Badge>
        <span className="text-muted-foreground">in final sent</span>
      </div>
      <div className="grid grid-cols-1 divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
        <DiffColumn title="AI DRAFT" body={aiDraft} other={finalSent} mode="removed" />
        <DiffColumn title="FINAL SENT" body={finalSent} other={aiDraft} mode="added" />
      </div>
    </div>
  );
}

function DiffColumn({
  title,
  body,
  other,
  mode,
}: {
  title: string;
  body: string;
  other: string;
  mode: 'removed' | 'added';
}) {
  const otherSet = new Set(other.split(/\n/).map((s) => s.trim()));
  const highlight = mode === 'removed' ? 'bg-rose-500/10' : 'bg-emerald-500/10';
  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="flex flex-col gap-1 p-4 text-sm leading-relaxed">
        {body.split(/\n/).map((line, i) => {
          const trimmed = line.trim();
          const changed = trimmed !== '' && !otherSet.has(trimmed);
          return (
            <div
              key={i}
              className={cn(
                'whitespace-pre-wrap rounded px-1',
                changed && highlight,
                !trimmed && 'h-3'
              )}
            >
              {line || ' '}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EmailDetailTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="link"
      size="sm"
      className="h-auto gap-1 px-0 text-primary"
      onClick={onClick}
    >
      <IconMail className="size-3.5" />
      View diff
    </Button>
  );
}
