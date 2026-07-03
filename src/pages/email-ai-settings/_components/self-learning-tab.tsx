import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import {
  aiEmailSettingsService,
  type OnboardingStatus,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Types ──────────────────────────────────────────────────────────────────────

type LearnPhase = 'idle' | 'importing' | 'learning' | 'done' | 'error';

interface LearningState {
  importJobId: string | null;
  learnJobId: string | null;
  phase: LearnPhase;
}

// ── Job Status Hook ────────────────────────────────────────────────────────────

function useJobStatus(orgId: string, jobId: string | null) {
  return useQuery({
    queryKey: ['onboarding-status', orgId, jobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, jobId!),
    enabled: !!jobId && !!orgId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'running' ? 2000 : false;
    },
  });
}

// ── Status Display ─────────────────────────────────────────────────────────────

function JobStatusBadge({ status }: { status: OnboardingStatus['status'] | undefined }) {
  if (!status) return null;
  const config: Record<string, { label: string; icon: React.ReactNode }> = {
    queued: { label: 'Queued', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    running: { label: 'Running', icon: <Loader2 className="h-2.5 w-2.5 animate-spin" /> },
    success: { label: 'Complete', icon: <CheckCircle2 className="h-2.5 w-2.5" /> },
    error: { label: 'Error', icon: <XCircle className="h-2.5 w-2.5" /> },
  };
  const variant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    queued: 'secondary',
    running: 'default',
    success: 'default',
    error: 'destructive',
  };
  const c = config[status];
  if (!c) return null;
  return (
    <Badge variant={variant[status] ?? 'secondary'} className="gap-1 text-[10px]">
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ── Learning Card ─────────────────────────────────────────────────────────────

interface LearningCardProps {
  title: string;
  description: string;
  Icon: React.ElementType;
  state: LearningState;
  orgId: string;
  onStart: () => void;
  isStarting: boolean;
}

function LearningCard({ title, description, Icon, state, orgId, onStart, isStarting }: LearningCardProps) {
  const importStatus = useJobStatus(orgId, state.importJobId);
  const learnStatus = useJobStatus(orgId, state.learnJobId);

  const isRunning = state.phase === 'importing' || state.phase === 'learning';
  const isDone = state.phase === 'done';
  const isError = state.phase === 'error';

  const currentStatus = state.phase === 'learning' ? learnStatus.data : importStatus.data;
  const progress = currentStatus?.progress ?? 0;

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">{title}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">{description}</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant={isDone ? 'outline' : 'default'}
            className="h-7 shrink-0 gap-1.5 text-xs"
            disabled={isRunning || isStarting}
            onClick={onStart}
          >
            {isStarting || isRunning ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isDone ? (
              <RefreshCw className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            {isDone ? 'Re-learn' : isRunning ? 'Running…' : 'Start'}
          </Button>
        </div>
      </CardHeader>

      {(isRunning || isDone || isError) && (
        <CardContent className="pt-0">
          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            {/* Phase indicators */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Import:</span>
                <JobStatusBadge status={importStatus.data?.status} />
              </div>
              {state.learnJobId && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">Learn:</span>
                  <JobStatusBadge status={learnStatus.data?.status} />
                </div>
              )}
            </div>

            {/* Progress bar */}
            {isRunning && (
              <div className="space-y-1">
                <Progress value={progress} className="h-1.5" />
                {currentStatus?.message && (
                  <p className="text-[11px] text-muted-foreground">{currentStatus.message}</p>
                )}
              </div>
            )}

            {/* Done / Error message */}
            {isDone && (
              <div className="flex items-center gap-1.5 text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Learning complete</span>
              </div>
            )}
            {isError && (
              <div className="flex items-center gap-1.5 text-destructive">
                <XCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">
                  {currentStatus?.message ?? 'An error occurred. Please try again.'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface SelfLearningTabProps {
  orgId: string;
}

export function SelfLearningTab({ orgId }: SelfLearningTabProps) {
  const qc = useQueryClient();

  const mailboxesQuery = useQuery({
    queryKey: ['ai-email-mailboxes', orgId],
    queryFn: () => aiEmailSettingsService.getMailboxes(orgId),
    enabled: !!orgId,
  });

  const mailboxes = mailboxesQuery.data ?? [];

  const [selectedMailbox, setSelectedMailbox] = useState('');

  useEffect(() => {
    if (mailboxes.length > 0 && !selectedMailbox) {
      setSelectedMailbox(mailboxes[0]!.mailbox);
    }
  }, [mailboxes, selectedMailbox]);

  // ── Writing Style state ────────────────────────────────────────────────────
  const [writingState, setWritingState] = useState<LearningState>({
    importJobId: null,
    learnJobId: null,
    phase: 'idle',
  });

  // ── Knowledge Base state ───────────────────────────────────────────────────
  const [kbState, setKbState] = useState<LearningState>({
    importJobId: null,
    learnJobId: null,
    phase: 'idle',
  });

  // Reset state when mailbox changes
  useEffect(() => {
    setWritingState({ importJobId: null, learnJobId: null, phase: 'idle' });
    setKbState({ importJobId: null, learnJobId: null, phase: 'idle' });
  }, [selectedMailbox]);

  // ── Import status watchers ─────────────────────────────────────────────────

  // Watch writing style import job → start learn_writing_style job when done
  const writingImportStatus = useQuery({
    queryKey: ['onboarding-status', orgId, writingState.importJobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, writingState.importJobId!),
    enabled: !!writingState.importJobId && writingState.phase === 'importing',
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  const startLearnWritingRef = useRef(false);
  useEffect(() => {
    if (writingImportStatus.data?.status === 'success' && !startLearnWritingRef.current && writingState.phase === 'importing') {
      startLearnWritingRef.current = true;
      void aiEmailSettingsService
        .startOnboarding(orgId, selectedMailbox, 'learn_writing_style')
        .then((res) => {
          setWritingState((prev) => ({ ...prev, learnJobId: res.job_id, phase: 'learning' }));
        })
        .catch((err: Error) => {
          toast.error(err.message);
          setWritingState((prev) => ({ ...prev, phase: 'error' }));
        });
    } else if (writingImportStatus.data?.status === 'error' && writingState.phase === 'importing') {
      setWritingState((prev) => ({ ...prev, phase: 'error' }));
    }
  }, [writingImportStatus.data?.status, writingState.phase, orgId, selectedMailbox]);

  // Watch writing learn job → mark done
  const writingLearnStatus = useQuery({
    queryKey: ['onboarding-status', orgId, writingState.learnJobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, writingState.learnJobId!),
    enabled: !!writingState.learnJobId && writingState.phase === 'learning',
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  useEffect(() => {
    if (writingLearnStatus.data?.status === 'success' && writingState.phase === 'learning') {
      setWritingState((prev) => ({ ...prev, phase: 'done' }));
    } else if (writingLearnStatus.data?.status === 'error' && writingState.phase === 'learning') {
      setWritingState((prev) => ({ ...prev, phase: 'error' }));
    }
  }, [writingLearnStatus.data?.status, writingState.phase]);

  // Watch KB import job → start learn_kb job when done
  const kbImportStatus = useQuery({
    queryKey: ['onboarding-status', orgId, kbState.importJobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, kbState.importJobId!),
    enabled: !!kbState.importJobId && kbState.phase === 'importing',
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  const startLearnKbRef = useRef(false);
  useEffect(() => {
    if (kbImportStatus.data?.status === 'success' && !startLearnKbRef.current && kbState.phase === 'importing') {
      startLearnKbRef.current = true;
      void aiEmailSettingsService
        .startOnboarding(orgId, selectedMailbox, 'learn_kb')
        .then((res) => {
          setKbState((prev) => ({ ...prev, learnJobId: res.job_id, phase: 'learning' }));
        })
        .catch((err: Error) => {
          toast.error(err.message);
          setKbState((prev) => ({ ...prev, phase: 'error' }));
        });
    } else if (kbImportStatus.data?.status === 'error' && kbState.phase === 'importing') {
      setKbState((prev) => ({ ...prev, phase: 'error' }));
    }
  }, [kbImportStatus.data?.status, kbState.phase, orgId, selectedMailbox]);

  const kbLearnStatus = useQuery({
    queryKey: ['onboarding-status', orgId, kbState.learnJobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, kbState.learnJobId!),
    enabled: !!kbState.learnJobId && kbState.phase === 'learning',
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  useEffect(() => {
    if (kbLearnStatus.data?.status === 'success' && kbState.phase === 'learning') {
      setKbState((prev) => ({ ...prev, phase: 'done' }));
    } else if (kbLearnStatus.data?.status === 'error' && kbState.phase === 'learning') {
      setKbState((prev) => ({ ...prev, phase: 'error' }));
    }
  }, [kbLearnStatus.data?.status, kbState.phase]);

  // ── Start mutations ────────────────────────────────────────────────────────

  const startWritingMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.startOnboarding(orgId, selectedMailbox, 'import_emails'),
    onSuccess: (res) => {
      startLearnWritingRef.current = false;
      setWritingState({ importJobId: res.job_id, learnJobId: null, phase: 'importing' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const startKbMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.startOnboarding(orgId, selectedMailbox, 'import_emails'),
    onSuccess: (res) => {
      startLearnKbRef.current = false;
      setKbState({ importJobId: res.job_id, learnJobId: null, phase: 'importing' });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (mailboxesQuery.isLoading) {
    return (
      <div className=" space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (mailboxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
        <p className="text-sm font-medium text-foreground">No mailboxes configured</p>
        <p className="text-xs text-muted-foreground">
          Add a mailbox in the Mailboxes tab to start self-learning.
        </p>
      </div>
    );
  }

  return (
    <div className=" space-y-5">
      {/* Mailbox selector */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 shadow-sm">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-xs font-medium text-foreground">Mailbox</p>
          <Select
            value={selectedMailbox}
            onValueChange={(v) => setSelectedMailbox(v)}
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
        <p className="max-w-xs text-[11px] text-muted-foreground">
          The AI will import emails from this mailbox to learn your writing style and knowledge base.
        </p>
      </div>

      {/* Learning sections */}
      <LearningCard
        title="Writing Style"
        description="Analyze past sent emails to learn your hotel's unique writing style and tone."
        Icon={Sparkles}
        state={writingState}
        orgId={orgId}
        onStart={() => startWritingMutation.mutate()}
        isStarting={startWritingMutation.isPending}
      />

      <LearningCard
        title="Knowledge Base"
        description="Extract hotel information, policies, and FAQs from past email conversations."
        Icon={BookOpen}
        state={kbState}
        orgId={orgId}
        onStart={() => startKbMutation.mutate()}
        isStarting={startKbMutation.isPending}
      />
    </div>
  );
}
