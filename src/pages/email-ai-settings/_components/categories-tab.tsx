import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GitMerge,
  Layers,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Tag,
  Trash2,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailSettingsService,
  type AnalysisCategory,
  type InquiryCategory,
  type TaxonomyAnalysisStatus,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Types ──────────────────────────────────────────────────────────────────────

type EditableCategory = InquiryCategory & { _dirty?: boolean; _new?: boolean };

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

// ── Analysis Progress Panel ────────────────────────────────────────────────────

const PHASE_STEPS = [
  { key: 'sampling',    label: 'Sample emails',          icon: <RefreshCw className="h-3.5 w-3.5" /> },
  { key: 'batch',       label: 'Pass 1: Batch categorize', icon: <Layers className="h-3.5 w-3.5" /> },
  { key: 'consolidate', label: 'Pass 2: Consolidate',    icon: <GitMerge className="h-3.5 w-3.5" /> },
  { key: 'prompt',      label: 'Pass 3: Write prompts',  icon: <Sparkles className="h-3.5 w-3.5" /> },
] as const;

function currentPhaseKey(step: string): string {
  if (step === 'sampling') return 'sampling';
  if (step.startsWith('batch_')) return 'batch';
  if (step === 'consolidate') return 'consolidate';
  if (step.startsWith('prompt_')) return 'prompt';
  return '';
}

function AnalysisProgressPanel({ status }: { status: TaxonomyAnalysisStatus }) {
  const phase = currentPhaseKey(status.step ?? '');
  const isDone  = status.status === 'success';
  const isError = status.status === 'error';

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PHASE_STEPS.map((s, idx) => {
          const phaseIndex = PHASE_STEPS.findIndex((p) => p.key === phase);
          const done   = isDone || idx < phaseIndex;
          const active = !isDone && !isError && s.key === phase;
          return (
            <div key={s.key} className="flex items-center gap-1">
              <span className={[
                'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                done   ? 'bg-emerald-100 text-emerald-700'
                       : active ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                : 'bg-muted text-muted-foreground',
              ].join(' ')}>
                {active ? <Loader2 className="h-3 w-3 animate-spin" />
                        : done ? <CheckCircle2 className="h-3 w-3" />
                               : s.icon}
                {s.label}
              </span>
              {idx < PHASE_STEPS.length - 1 && <span className="text-muted-foreground text-xs">›</span>}
            </div>
          );
        })}
      </div>

      {!isError && (
        <div className="space-y-1">
          <Progress value={status.progress} className="h-1.5" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="truncate pr-4">{status.message}</span>
            <span className="shrink-0">{status.progress}%</span>
          </div>
        </div>
      )}

      {isDone && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
          <CheckCircle2 className="h-4 w-4" />
          {status.message}
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {status.message || 'Analysis failed.'}
        </div>
      )}
    </div>
  );
}

// ── Category Row (accordion) ───────────────────────────────────────────────────

type CategoryRowProps = {
  category: EditableCategory;
  expanded: boolean;
  onToggle: () => void;
  onFieldChange: (field: 'slug' | 'name' | 'description' | 'prompt', value: string) => void;
  onDelete: () => void;
};

function CategoryRow({ category, expanded, onToggle, onFieldChange, onDelete }: CategoryRowProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Header row */}
      <div
        className="flex cursor-pointer select-none items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
        onClick={onToggle}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Tag className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{category.name || 'Untitled category'}</span>
            {category._dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />}
            {category._new && <Badge className="h-4 bg-primary/15 text-[10px] text-primary">New</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {category.description
              ? category.description.slice(0, 80) + (category.description.length > 80 ? '…' : '')
              : 'No description'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
            title="Delete category"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
            : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </div>

      {/* Expanded fields */}
      {expanded && (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Name</Label>
              <Input
                value={category.name}
                onChange={(e) => onFieldChange('name', e.target.value)}
                placeholder="e.g. Room Upgrade Request"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Slug</Label>
              <Input
                value={category.slug}
                onChange={(e) => {
                  const raw = e.target.value.toLowerCase().replace(/\s/g, '_');
                  onFieldChange('slug', slugify(raw) || raw);
                }}
                placeholder="e.g. room_upgrade_request"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Description</Label>
            <Input
              value={category.description}
              onChange={(e) => onFieldChange('description', e.target.value)}
              placeholder="Short description of what emails belong here"
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Prompt{' '}
              <span className="normal-case font-normal text-muted-foreground">(how the AI should respond)</span>
            </Label>
            <Textarea
              value={category.prompt}
              onChange={(e) => onFieldChange('prompt', e.target.value)}
              rows={8}
              className="resize-y font-mono text-sm"
              placeholder="Describe how the AI should respond to emails in this category…"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface CategoriesTabProps { orgId: string; }

export function CategoriesTab({ orgId }: CategoriesTabProps) {
  const qc = useQueryClient();

  // `selectedInboxId` is only set when the user manually picks an inbox (multi-inbox case).
  // For the common single-inbox case we derive the ID directly from the query data to
  // avoid the two-render lag that would occur with a useEffect→setInboxId pattern.
  const [selectedInboxId, setSelectedInboxId] = useState('');
  const [jobId, setJobId]               = useState<string | undefined>();
  const [months, setMonths]             = useState(12);
  const [emailsPerMonth, setEmailsPerMonth] = useState(80);
  const [categories, setCategories]     = useState<EditableCategory[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [expandedIds, setExpandedIds]   = useState<Set<string>>(new Set());
  const [showResetConfirm, setShowResetConfirm]   = useState(false);

  const appliedJobRef = useRef<string | undefined>();
  const prevInboxIdRef = useRef('');

  const inboxesQuery = useQuery({
    queryKey: ['ai-email-inboxes', orgId],
    queryFn: () => aiEmailSettingsService.getInboxes(orgId),
    enabled: !!orgId,
  });

  const inboxes = inboxesQuery.data ?? [];

  // Derive active inbox ID without waiting for an effect cycle:
  // prefer user's explicit selection, otherwise fall back to first inbox.
  const inboxId = selectedInboxId || (inboxes[0]?.id ?? '');

  const categoriesQuery = useQuery({
    queryKey: ['inbox-categories', orgId, inboxId],
    queryFn: () => aiEmailSettingsService.getCategories(orgId, inboxId),
    enabled: !!inboxId && !!orgId,
  });

  const statusQuery = useQuery({
    queryKey: ['taxonomy-analysis', orgId, jobId],
    queryFn: () => aiEmailSettingsService.getAnalysisStatus(orgId, jobId!),
    enabled: !!jobId && !!orgId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  const jobStatus = statusQuery.data;
  const isRunning = jobStatus?.status === 'running' || jobStatus?.status === 'queued';
  const isDone    = jobStatus?.status === 'success';
  const isError   = jobStatus?.status === 'error';

  // The committed categories — always derived from server data
  const committedCategories: EditableCategory[] = (categoriesQuery.data ?? []).map((c) => ({
    ...c, _dirty: false,
  }));

  // Display: local edits > server data
  const displayCategories = hasPendingChanges ? categories : committedCategories;
  const hasCategories     = displayCategories.length > 0;

  const enterEditMode = (applyFn: (base: EditableCategory[]) => EditableCategory[]) => {
    const base = hasPendingChanges ? categories : committedCategories;
    setCategories(applyFn(base));
    setHasPendingChanges(true);
  };

  // Reset on org change
  useEffect(() => {
    setSelectedInboxId(''); setJobId(undefined); setCategories([]);
    setHasPendingChanges(false); appliedJobRef.current = undefined;
  }, [orgId]);

  // Reset local edits when the effective inbox changes
  useEffect(() => {
    if (inboxId && inboxId !== prevInboxIdRef.current) {
      prevInboxIdRef.current = inboxId;
      setCategories([]); setHasPendingChanges(false); setExpandedIds(new Set());
    }
  }, [inboxId]);

  // Apply analysis results
  useEffect(() => {
    if (isDone && jobId && appliedJobRef.current !== jobId && jobStatus?.categories?.length) {
      appliedJobRef.current = jobId;
      const discovered: EditableCategory[] = (jobStatus?.categories ?? []).map((c) => ({
        ...c,
        id: `new_${Math.random().toString(36).slice(2)}`,
        inbox_id: inboxId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _dirty: true, _new: true,
      }));
      setCategories(discovered);
      setHasPendingChanges(true);
      toast.success(`Found ${discovered.length} categories. Review and save below.`);
    } else if (isError && jobId && appliedJobRef.current !== jobId) {
      appliedJobRef.current = jobId;
      toast.error(jobStatus?.message || 'Analysis failed.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, isError, jobId]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const startAnalysisMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.analyzeTaxonomy(orgId, inboxId, { months, emails_per_month: emailsPerMonth }),
    onSuccess: (res) => { appliedJobRef.current = undefined; setJobId(res.job_id); },
    onError: () => toast.error('Failed to start analysis.'),
  });

  const saveAllMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.saveCategories(
        orgId, inboxId,
        categories.map(({ slug, name, description, prompt }): AnalysisCategory => ({ slug, name, description, prompt })),
      ),
    onSuccess: () => {
      setCategories([]); setHasPendingChanges(false);
      void qc.invalidateQueries({ queryKey: ['inbox-categories', orgId, inboxId] });
      toast.success('Categories saved successfully.');
    },
    onError: () => toast.error('Failed to save categories.'),
  });

  const resetMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.saveCategories(orgId, inboxId, []),
    onSuccess: () => {
      setCategories([]); setHasPendingChanges(false);
      setJobId(undefined); appliedJobRef.current = undefined;
      setShowResetConfirm(false);
      void qc.invalidateQueries({ queryKey: ['inbox-categories', orgId, inboxId] });
      toast.success('Categories cleared.');
    },
    onError: () => toast.error('Failed to reset categories.'),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleUpdateField = (id: string, field: 'slug' | 'name' | 'description' | 'prompt', value: string) => {
    enterEditMode((base) => base.map((c) => (c.id === id ? { ...c, [field]: value, _dirty: true } : c)));
  };

  const handleDelete = (id: string) => {
    enterEditMode((base) => base.filter((c) => c.id !== id));
    setExpandedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  };

  const handleAddCategory = () => {
    const newCat: EditableCategory = {
      id: `new_${Math.random().toString(36).slice(2)}`,
      inbox_id: inboxId,
      slug: 'new_category',
      name: 'New Category',
      description: '',
      prompt: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      _dirty: true, _new: true,
    };
    enterEditMode((base) => [...base, newCat]);
    setExpandedIds((prev) => new Set([...prev, newCat.id]));
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedInboxLabel = (() => {
    const found = inboxes.find((b) => b.id === inboxId);
    return found?.display_name || found?.receiver_email || '';
  })();

  // ── Render ─────────────────────────────────────────────────────────────────

  if (inboxesQuery.isLoading || (inboxId && categoriesQuery.isLoading)) {
    return (
      <div className=" space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-16 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className=" space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight text-foreground">Categories</h2>
          <p className="text-sm text-muted-foreground">
            Define email inquiry categories and how the AI responds to each
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasCategories && (
            <Badge variant="outline" className="border-border bg-muted/30 text-muted-foreground">
              {displayCategories.length} {displayCategories.length === 1 ? 'category' : 'categories'}
            </Badge>
          )}
          {hasPendingChanges && (
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Unsaved changes
            </Badge>
          )}
        </div>
      </div>

      {/* Inbox selector (only when multiple inboxes) */}
      {inboxes.length > 1 && (
        <div className="flex items-center gap-3">
          <Label className="shrink-0 text-sm text-muted-foreground">Inbox</Label>
          <Select value={inboxId} onValueChange={setSelectedInboxId}>
            <SelectTrigger className="w-72 text-sm">
              <SelectValue placeholder="Select inbox" />
            </SelectTrigger>
            <SelectContent>
              {inboxes.map((inbox) => (
                <SelectItem key={inbox.id} value={inbox.id} className="text-sm">
                  {inbox.display_name || inbox.receiver_email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* No inbox */}
      {inboxes.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/60 py-16 text-center text-sm text-muted-foreground">
          No inboxes configured. Add a mailbox in the Mailboxes tab first.
        </div>
      )}

      {/* Has categories — show list + action bar */}
      {inboxId && hasCategories && (
        <>
          <div className="space-y-3">
            {displayCategories.map((cat) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                expanded={expandedIds.has(cat.id)}
                onToggle={() => toggleExpand(cat.id)}
                onFieldChange={(field, value) => handleUpdateField(cat.id, field, value)}
                onDelete={() => handleDelete(cat.id)}
              />
            ))}
          </div>

          {/* Action bar — sticky when dirty */}
          <div className={`flex items-center gap-3 ${
            hasPendingChanges
              ? 'sticky bottom-4 rounded-xl border border-border/80 bg-card/90 p-4 shadow-lg backdrop-blur-md'
              : ''
          }`}>
            <Button
              onClick={() => saveAllMutation.mutate()}
              disabled={!hasPendingChanges || saveAllMutation.isPending}
              className="gap-2"
            >
              {saveAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddCategory} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Category
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetConfirm(true)}
              className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset categories
            </Button>
          </div>

          {!hasPendingChanges && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset categories
              </Button>
            </div>
          )}
        </>
      )}

      {/* No categories yet */}
      {inboxId && !hasCategories && (
        <div className="space-y-6">
          {/* Empty state */}
          {!isRunning && !isDone && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-8 py-12 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">No categories yet</h3>
                <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                  Let the AI discover your common inquiry types from past emails, or add them manually.
                </p>
              </div>
            </div>
          )}

          {/* Analysis config */}
          <div className="space-y-5 overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">AI Category Discovery</p>
                <p className="text-xs text-muted-foreground">
                  Analyze{' '}
                  {selectedInboxLabel
                    ? <span className="font-medium">{selectedInboxLabel}</span>
                    : 'your inbox'}{' '}
                  to automatically discover inquiry categories
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Lookback period</Label>
                <Select value={String(months)} onValueChange={(v) => setMonths(Number(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12].map((m) => (
                      <SelectItem key={m} value={String(m)} className="text-sm">{m} months</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Emails per month</Label>
                <Select value={String(emailsPerMonth)} onValueChange={(v) => setEmailsPerMonth(Number(v))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[30, 50, 80, 120].map((n) => (
                      <SelectItem key={n} value={String(n)} className="text-sm">{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => startAnalysisMutation.mutate()}
                disabled={!inboxId || isRunning || startAnalysisMutation.isPending}
                className="gap-2"
              >
                {isRunning || startAnalysisMutation.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Analyzing…</>
                  : <><Brain className="h-4 w-4" />Analyze Inbox</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddCategory} className="gap-1.5">
                <Plus className="h-3.5 w-3.5" />
                Add manually
              </Button>
            </div>

            {(isRunning || isDone || isError) && jobStatus && (
              <AnalysisProgressPanel status={jobStatus} />
            )}
          </div>
        </div>
      )}

      {/* Reset confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset categories?</AlertDialogTitle>
            <AlertDialogDescription>
              All categories for this inbox will be permanently deleted. You can run a new analysis or add them manually afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
