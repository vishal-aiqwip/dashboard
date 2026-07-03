import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Info,
  Loader2,
  Mail,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  type LatestOnboardingJob,
  type OnboardingStatus,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Types / helpers ────────────────────────────────────────────────────────────

type Phase = 'idle' | 'importing' | 'learning' | 'done' | 'error';

const isJobActive  = (s?: string) => s === 'queued' || s === 'running';
const isJobSuccess = (s?: string) => s === 'success';
const isJobError   = (s?: string) => s === 'error' || s === 'timed_out';

function derivePhase(
  importJobId?: string, importStatus?: string,
  learnJobId?: string,  learnStatus?: string,
): Phase {
  if (learnJobId) {
    if (isJobActive(learnStatus))  return 'learning';
    if (isJobSuccess(learnStatus)) return 'done';
    if (isJobError(learnStatus))   return 'error';
  }
  if (importJobId) {
    if (isJobActive(importStatus) || importStatus === 'success') return 'importing';
    if (isJobError(importStatus)) return 'error';
  }
  return 'idle';
}

function progressNum(raw?: number | Record<string, number>): number {
  if (typeof raw === 'number') return raw;
  return 0;
}

type LatestByType = {
  learn_writing_style?: LatestOnboardingJob;
  learn_kb?: LatestOnboardingJob;
};

function groupJobs(jobs: LatestOnboardingJob[]): LatestByType {
  const out: LatestByType = {};
  for (const j of jobs) {
    if (j.job_type === 'learn_writing_style') out.learn_writing_style = j;
    else if (j.job_type === 'learn_kb')       out.learn_kb = j;
  }
  return out;
}

// ── Status polling hook ────────────────────────────────────────────────────────

function useJobStatus(orgId: string, jobId?: string) {
  return useQuery({
    queryKey: ['onboarding-status', orgId, jobId],
    queryFn: () => aiEmailSettingsService.getOnboardingStatus(orgId, jobId!),
    enabled: !!jobId && !!orgId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });
}

// ── Phase badge ────────────────────────────────────────────────────────────────

function PhaseBadge({ phase, inSession }: { phase: Phase; inSession: boolean }) {
  if (phase === 'importing' || phase === 'learning') {
    return (
      <Badge variant="secondary" className="gap-1 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        {phase === 'importing' ? 'Importing…' : 'Learning…'}
      </Badge>
    );
  }
  if (inSession && phase === 'done') {
    return (
      <Badge className="gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </Badge>
    );
  }
  if (inSession && phase === 'error') {
    return (
      <Badge variant="destructive" className="gap-1 text-xs">
        <AlertCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }
  return null;
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface SelfLearningTabProps { orgId: string; }

export function SelfLearningTab({ orgId }: SelfLearningTabProps) {
  const mailboxesQuery = useQuery({
    queryKey: ['ai-email-mailboxes', orgId],
    queryFn: () => aiEmailSettingsService.getMailboxes(orgId),
    enabled: !!orgId,
  });

  const mailboxes = mailboxesQuery.data ?? [];

  const [mailboxEmail, setMailboxEmail] = useState('');
  const [lookbackDays, setLookbackDays] = useState(60);

  // Writing Style job state
  const [wsImportJobId, setWsImportJobId] = useState<string | undefined>();
  const [wsStyleJobId,  setWsStyleJobId]  = useState<string | undefined>();
  const wsChainFiredRef = useRef(false);

  // Knowledge Base job state
  const [kbImportJobId, setKbImportJobId] = useState<string | undefined>();
  const [kbKbJobId,     setKbKbJobId]     = useState<string | undefined>();
  const kbChainFiredRef = useRef(false);

  const wsImportStatus = useJobStatus(orgId, wsImportJobId);
  const wsStyleStatus  = useJobStatus(orgId, wsStyleJobId);
  const kbImportStatus = useJobStatus(orgId, kbImportJobId);
  const kbKbStatus     = useJobStatus(orgId, kbKbJobId);

  // Restore active jobs on page load (survives refresh)
  const latestJobsQuery = useQuery({
    queryKey: ['ai-email-latest-jobs', orgId, mailboxEmail],
    queryFn: () => aiEmailSettingsService.getLatestJobs(orgId, mailboxEmail),
    enabled: !!orgId && !!mailboxEmail,
  });

  useEffect(() => {
    if (!latestJobsQuery.data) return;
    const { learn_writing_style, learn_kb } = groupJobs(latestJobsQuery.data);
    if (learn_writing_style?.job_id && isJobActive(learn_writing_style.status) && !wsStyleJobId) {
      setWsStyleJobId(learn_writing_style.job_id);
    }
    if (learn_kb?.job_id && isJobActive(learn_kb.status) && !kbKbJobId) {
      setKbKbJobId(learn_kb.job_id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestJobsQuery.data]);

  // Auto-select first mailbox
  useEffect(() => {
    const first = mailboxes[0]?.mailbox;
    if (!mailboxEmail && first) setMailboxEmail(first);
  }, [mailboxes, mailboxEmail]);

  // Reset on mailbox change
  const resetCards = () => {
    setWsImportJobId(undefined); setWsStyleJobId(undefined);
    setKbImportJobId(undefined); setKbKbJobId(undefined);
    wsChainFiredRef.current = false; kbChainFiredRef.current = false;
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(resetCards, [mailboxEmail]);

  // Chain: WS import done → fire learn_writing_style
  useEffect(() => {
    if (!wsImportJobId || wsStyleJobId || wsChainFiredRef.current) return;
    if (wsImportStatus.data?.status !== 'success') return;
    wsChainFiredRef.current = true;
    void aiEmailSettingsService
      .startOnboarding(orgId, mailboxEmail, 'learn_writing_style', { lookback_days: lookbackDays })
      .then((res) => setWsStyleJobId(res.job_id))
      .catch(() => { wsChainFiredRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsImportStatus.data?.status, wsImportJobId, wsStyleJobId]);

  // Chain: KB import done → fire learn_kb
  useEffect(() => {
    if (!kbImportJobId || kbKbJobId || kbChainFiredRef.current) return;
    if (kbImportStatus.data?.status !== 'success') return;
    kbChainFiredRef.current = true;
    void aiEmailSettingsService
      .startOnboarding(orgId, mailboxEmail, 'learn_kb', { lookback_days: lookbackDays })
      .then((res) => setKbKbJobId(res.job_id))
      .catch(() => { kbChainFiredRef.current = false; });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kbImportStatus.data?.status, kbImportJobId, kbKbJobId]);

  // Success toast for writing style
  useEffect(() => {
    if (!wsImportJobId) return;
    if (wsStyleStatus.data?.status !== 'success') return;
    toast.success('Writing style learned! Your Writing Guidelines have been updated.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsStyleStatus.data?.status]);

  // Error toasts
  useEffect(() => {
    if (!wsImportJobId || !isJobError(wsImportStatus.data?.status)) return;
    toast.error(wsImportStatus.data?.message || 'Email import failed. Please try again.');
  }, [wsImportStatus.data?.status, wsImportJobId, wsImportStatus.data?.message]);

  useEffect(() => {
    if (!wsImportJobId || !isJobError(wsStyleStatus.data?.status)) return;
    toast.error(wsStyleStatus.data?.message || 'Writing style learning failed.');
  }, [wsStyleStatus.data?.status, wsImportJobId, wsStyleStatus.data?.message]);

  useEffect(() => {
    if (!kbImportJobId || !isJobError(kbImportStatus.data?.status)) return;
    toast.error(kbImportStatus.data?.message || 'Email import failed. Please try again.');
  }, [kbImportStatus.data?.status, kbImportJobId, kbImportStatus.data?.message]);

  useEffect(() => {
    if (!kbImportJobId || !isJobError(kbKbStatus.data?.status)) return;
    toast.error(kbKbStatus.data?.message || 'Knowledge base learning failed.');
  }, [kbKbStatus.data?.status, kbImportJobId, kbKbStatus.data?.message]);

  const wsPhase = derivePhase(wsImportJobId, wsImportStatus.data?.status, wsStyleJobId, wsStyleStatus.data?.status);
  const kbPhase = derivePhase(kbImportJobId, kbImportStatus.data?.status, kbKbJobId, kbKbStatus.data?.status);

  const wsActive = wsPhase === 'importing' || wsPhase === 'learning';
  const kbActive = kbPhase === 'importing' || kbPhase === 'learning';

  const restoringState = latestJobsQuery.isLoading && !wsStyleJobId && !kbKbJobId;

  const handleStartLearning = async (type: 'learn_writing_style' | 'learn_kb') => {
    if (!mailboxEmail) { toast.error('Please select a mailbox first.'); return; }
    try {
      const res = await aiEmailSettingsService.startOnboarding(orgId, mailboxEmail, 'import_emails', { lookback_days: lookbackDays });
      if (type === 'learn_writing_style') {
        wsChainFiredRef.current = false;
        setWsImportJobId(res.job_id);
        setWsStyleJobId(undefined);
      } else {
        kbChainFiredRef.current = false;
        setKbImportJobId(res.job_id);
        setKbKbJobId(undefined);
      }
      toast.success('Importing emails — learning will start automatically.');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      const detail = err?.response?.data?.detail;
      let message = 'Failed to start. Please try again.';
      if (detail === 'admin_consent_missing') message = 'Admin consent is required. Please contact your administrator.';
      else if (detail === 'graph_app_only_not_verified') message = 'App verification is pending. Please try again later.';
      toast.error(message);
    }
  };

  if (mailboxesQuery.isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const wsImportProgress = progressNum(wsImportStatus.data?.progress);
  const wsStyleProgress  = progressNum(wsStyleStatus.data?.progress);
  const kbImportProgress = progressNum(kbImportStatus.data?.progress);
  const kbKbProgress     = progressNum(kbKbStatus.data?.progress);

  const wsCurrentStep = wsImportStatus.data?.current_step ?? wsImportStatus.data?.step;
  const wsStyleStep   = wsStyleStatus.data?.current_step  ?? wsStyleStatus.data?.step;
  const kbCurrentStep = kbImportStatus.data?.current_step ?? kbImportStatus.data?.step;
  const kbKbStep      = kbKbStatus.data?.current_step     ?? kbKbStatus.data?.step;

  return (
    <div className=" space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 shrink-0 text-primary" />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Learn from your emails
          </h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Choose what you want to learn. Each job imports your recent emails automatically before running.
        </p>
      </div>

      {/* How it works */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/60 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <div className="space-y-1.5 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-200">How it works</p>
          <ul className="space-y-1 text-xs text-blue-800/80 dark:text-blue-300/80">
            <li>
              <span className="font-medium">Learn Writing Style</span> — imports your emails, then analyzes your replies to generate a personalized style prompt
            </li>
            <li>
              <span className="font-medium">Learn Knowledge Base</span> — imports your emails, then extracts Q&amp;A pairs and adds them to your knowledge base
            </li>
          </ul>
          <p className="text-xs text-blue-700/70 dark:text-blue-400/70">Both jobs can be re-run at any time to pick up new emails.</p>
        </div>
      </div>

      {/* Email source */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            Email source
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">Applied to both learning jobs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Mailbox</label>
              <Select
                value={mailboxEmail}
                onValueChange={setMailboxEmail}
                disabled={!mailboxes.length || wsActive || kbActive}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder={mailboxes.length ? 'Select mailbox' : 'No mailboxes available'} />
                </SelectTrigger>
                <SelectContent>
                  {mailboxes.map((mb) => (
                    <SelectItem key={mb.mailbox} value={mb.mailbox} className="text-xs">{mb.mailbox}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!mailboxes.length && (
                <p className="text-xs text-muted-foreground">Add a mailbox in the Mailboxes tab first</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-foreground">Time period</label>
              <Select
                value={String(lookbackDays)}
                onValueChange={(v) => setLookbackDays(parseInt(v, 10))}
                disabled={wsActive || kbActive}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30" className="text-xs">Last 30 days</SelectItem>
                  <SelectItem value="60" className="text-xs">Last 60 days</SelectItem>
                  <SelectItem value="90" className="text-xs">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">More days = more examples to learn from</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learn Writing Style */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-muted-foreground" />
              Learn Writing Style
            </span>
            {restoringState
              ? <Badge variant="secondary" className="gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" />Loading…</Badge>
              : <PhaseBadge phase={wsPhase} inSession={!!wsImportJobId} />
            }
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Analyzes your hotel&apos;s sent replies to generate a personalized &ldquo;Learned Style&rdquo; that makes AI drafts sound like you.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => void handleStartLearning('learn_writing_style')}
            disabled={wsActive || !mailboxEmail || restoringState}
            className="w-full gap-2 sm:w-auto"
          >
            {wsActive ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{wsPhase === 'importing' ? 'Importing emails…' : 'Learning style…'}</>
            ) : (
              <><Sparkles className="h-4 w-4" />Learn Writing Style</>
            )}
          </Button>

          {(wsActive || (!!wsImportJobId && !restoringState)) && (
            <div className="space-y-3 border-t border-border pt-3">
              {wsPhase === 'importing' && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step 1 of 2 — Importing emails</span>
                  </div>
                  <Progress value={wsImportProgress || 10} className="h-2" />
                  {wsCurrentStep && (
                    <p className="text-xs text-muted-foreground">{wsCurrentStep.replace(/_/g, ' ')}</p>
                  )}
                </>
              )}
              {wsPhase === 'learning' && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step 2 of 2 — Learning writing style</span>
                  </div>
                  <Progress value={wsStyleProgress || 10} className="h-2" />
                  {wsStyleStep && (
                    <p className="text-xs text-muted-foreground">{wsStyleStep.replace(/_/g, ' ')}</p>
                  )}
                </>
              )}
              {wsImportJobId && wsPhase === 'done' && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm">
                    Style learned! Check the <span className="font-medium">Writing Guidelines</span> tab.
                  </p>
                  <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              )}
              {wsImportJobId && wsPhase === 'error' && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    {wsStyleStatus.data?.message || wsImportStatus.data?.message || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Learn Knowledge Base */}
      <Card className="overflow-hidden border border-border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
              Learn Knowledge Base
            </span>
            {restoringState
              ? <Badge variant="secondary" className="gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" />Loading…</Badge>
              : <PhaseBadge phase={kbPhase} inSession={!!kbImportJobId} />
            }
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Extracts Q&amp;A pairs from your email conversations and adds them to the AI knowledge base.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={() => void handleStartLearning('learn_kb')}
            disabled={kbActive || !mailboxEmail || restoringState}
            className="w-full gap-2 sm:w-auto"
          >
            {kbActive ? (
              <><Loader2 className="h-4 w-4 animate-spin" />{kbPhase === 'importing' ? 'Importing emails…' : 'Building knowledge base…'}</>
            ) : (
              <><BookOpen className="h-4 w-4" />Learn Knowledge Base</>
            )}
          </Button>

          {(kbActive || (!!kbImportJobId && !restoringState)) && (
            <div className="space-y-3 border-t border-border pt-3">
              {kbPhase === 'importing' && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step 1 of 2 — Importing emails</span>
                  </div>
                  <Progress value={kbImportProgress || 10} className="h-2" />
                  {kbCurrentStep && (
                    <p className="text-xs text-muted-foreground">{kbCurrentStep.replace(/_/g, ' ')}</p>
                  )}
                </>
              )}
              {kbPhase === 'learning' && (
                <>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Step 2 of 2 — Extracting Q&amp;A pairs</span>
                  </div>
                  <Progress value={kbKbProgress || 10} className="h-2" />
                  {kbKbStep && (
                    <p className="text-xs text-muted-foreground">{kbKbStep.replace(/_/g, ' ')}</p>
                  )}
                </>
              )}
              {kbImportJobId && kbPhase === 'done' && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <p className="text-sm">Knowledge base updated successfully.</p>
                </div>
              )}
              {kbImportJobId && kbPhase === 'error' && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    {kbKbStatus.data?.message || kbImportStatus.data?.message || 'Something went wrong. Please try again.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        The learned style only affects tone and phrasing — it never overrides your Hotel Policies or Special Instructions.
      </p>
    </div>
  );
}
