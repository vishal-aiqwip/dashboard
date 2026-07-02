import { useCallback, useMemo, useState } from 'react';

import { useMutation, useQuery } from '@tanstack/react-query';
import {
  type PaginationState,
  type SortingState,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { IconFilter, IconX } from '@tabler/icons-react';
import {
  Building2,
  Check,
  ChevronsUpDown,
  Copy,
  Download,
  FlaskConical,
  Info,
  Languages,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Save,
  Scale,
  Settings2,
  Sparkles,
  FileText,
  User,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';

import { Accordion } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  countActiveFilters,
  EMPTY_FILTERS,
  type EmailFilters,
} from '@/pages/email-performance/_components/emails-filters';
import { EmailsFilterSheet } from '@/pages/email-performance/_components/emails-filter-sheet';
import {
  DateRangeFilter,
  type DatePreset,
  type DateRangeSelection,
} from '@/pages/email-performance/_components/date-range-filter';
import { EmailDetailSheet } from '@/pages/email-performance/_components/email-detail-sheet';
import { transformEmails } from '@/pages/email-performance/_data/transform';

import { organizationService } from '@/services/organizations/organizations';
import {
  emailPerformanceService,
  type EAEmailRow,
} from '@/services/emailPerformance/emailPerformance';
import {
  emailTrainingCenterService,
  type ReplayEmailResult,
  type ReplaySummary,
} from '@/services/emailTrainingCenter/emailTrainingCenter';

import { buildEmailColumns, MAX_SELECTION } from './_components/email-table-columns';
import { EmailSelectorTable } from './_components/email-selector-table';
import { ReplayResultsTable } from './_components/replay-results-table';
import { PromptEditorField } from './_components/prompt-editor-field';
import { SummaryCard } from './_components/summary-card';

// ── Constants ──────────────────────────────────────────────────────────────────

const SORT_KEY_MAP: Record<string, string> = {
  sentAt: 'sent_at',
  editDist: 'edit_distance_ratio',
  semantic: 'semantic_similarity',
  verdict: 'verdict',
};

const JUDGE_FIELDS = new Set([
  'verdict', 'primary_failure', 'root_cause', 'fix_layer', 'specific_fix',
  'fact_status', 'could_be_fixed_without_new_systems', 'missed_operational_outcome', 'judge_summary',
]);


// ── Date helpers ───────────────────────────────────────────────────────────────

const fmt = (d: Date) => d.toISOString().slice(0, 10);

function presetToDates(preset: DatePreset): { from_date: string; to_date: string } {
  const today = new Date();
  const to = new Date(today);
  const from = new Date(today);
  switch (preset) {
    case 'today': return { from_date: fmt(from), to_date: fmt(to) };
    case 'yesterday':
      from.setDate(from.getDate() - 1); to.setDate(to.getDate() - 1);
      return { from_date: fmt(from), to_date: fmt(to) };
    case 'last7': from.setDate(from.getDate() - 6); return { from_date: fmt(from), to_date: fmt(to) };
    case 'last14': from.setDate(from.getDate() - 13); return { from_date: fmt(from), to_date: fmt(to) };
    case 'last30': from.setDate(from.getDate() - 29); return { from_date: fmt(from), to_date: fmt(to) };
    case 'last90': from.setDate(from.getDate() - 89); return { from_date: fmt(from), to_date: fmt(to) };
  }
}

function dateRangeToParams(sel: DateRangeSelection) {
  if (sel.kind === 'custom') return { from_date: fmt(sel.from), to_date: fmt(sel.to) };
  return presetToDates(sel.preset);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[], cols: { key: string; label: string }[]): string {
  const header = cols.map((c) => `"${c.label}"`).join(',');
  const body = rows.map((row) =>
    cols.map((c) => {
      const v = row[c.key];
      if (v == null) return '';
      if (typeof v === 'string') return `"${v.replace(/"/g, '""')}"`;
      if (typeof v === 'object') return `"${JSON.stringify(v).replace(/"/g, '""')}"`;
      return String(v);
    }).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

// ── Main page ──────────────────────────────────────────────────────────────────

type ExpandedPromptField = { title: string; value: string; placeholder: string; onChange: (v: string) => void };

export default function EmailTrainingCenterPage() {
  // Hotel / mailbox
  const [hotelOrgId, setHotelOrgId] = useState('');
  const [hotelPickerOpen, setHotelPickerOpen] = useState(false);
  const [selectedMailbox, setSelectedMailbox] = useState('');
  const [mailboxOpen, setMailboxOpen] = useState(false);

  const { data: orgs = [], isLoading: orgsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => organizationService.listAll(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: mailboxList = [], isFetching: mailboxesFetching } = useQuery({
    queryKey: ['etc-mailboxes', hotelOrgId],
    queryFn: () => emailTrainingCenterService.getMailboxes(hotelOrgId),
    enabled: !!hotelOrgId,
    staleTime: 5 * 60 * 1000,
  });

  const activeMailbox = selectedMailbox || mailboxList[0] || '';
  const canEditPromptsAndReplay = !!(hotelOrgId && activeMailbox);

  // Prompt settings
  const { data: emailSettings, isLoading: emailSettingsLoading, refetch: refetchEmailSettings } = useQuery({
    queryKey: ['etc-email-settings', hotelOrgId],
    queryFn: () => emailTrainingCenterService.getEmailSettings(hotelOrgId),
    enabled: !!hotelOrgId,
    staleTime: 60_000,
  });

  const { data: mailboxSettings, isLoading: mailboxSettingsLoading, refetch: refetchMailboxSettings } = useQuery({
    queryKey: ['etc-mailbox-settings', hotelOrgId, activeMailbox],
    queryFn: () => emailTrainingCenterService.getMailboxSettings(activeMailbox, hotelOrgId),
    enabled: !!(hotelOrgId && activeMailbox),
    staleTime: 60_000,
  });

  const promptsLoading = !!activeMailbox && (emailSettingsLoading || mailboxSettingsLoading);

  const hotelPoliciesBaseline = useMemo(() => {
    const raw = emailSettings?.prompt_parts?.hotel_policies;
    if (Array.isArray(raw)) return raw.join('\n');
    return typeof raw === 'string' ? raw : '';
  }, [emailSettings?.prompt_parts?.hotel_policies]);

  const mbp = mailboxSettings?.mailbox_prompt_parts;

  // Local overrides (null = use server value)
  const [roleObjective, setRoleObjective] = useState<string | null>(null);
  const [hotelPolicies, setHotelPolicies] = useState<string | null>(null);
  const [learnedStyle, setLearnedStyle] = useState<string | null>(null);
  const [customToolPrompt, setCustomToolPrompt] = useState<string | null>(null);
  const [languageSelection, setLanguageSelection] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<string | null>(null);

  const currentRoleObjective = roleObjective ?? emailSettings?.prompt_parts?.role_objective ?? '';
  const currentHotelPolicies = hotelPolicies ?? hotelPoliciesBaseline;
  const currentLearnedStyle = learnedStyle ?? mbp?.learned_style ?? '';
  const currentToolPrompt = customToolPrompt ?? mailboxSettings?.custom_tool_prompt ?? '';
  const currentLanguageSelection = languageSelection ?? (emailSettings?.prompt_parts?.language_selection as string | undefined) ?? '';
  const currentOverrides = overrides ?? mbp?.overrides ?? '';

  const hasPromptChanges = roleObjective !== null || hotelPolicies !== null || learnedStyle !== null || customToolPrompt !== null || languageSelection !== null || overrides !== null;

  const resetLocalPromptFields = useCallback(() => {
    setRoleObjective(null); setHotelPolicies(null); setLearnedStyle(null);
    setCustomToolPrompt(null); setLanguageSelection(null); setOverrides(null);
  }, []);

  const refetchPrompts = useCallback(() => { void refetchEmailSettings(); void refetchMailboxSettings(); }, [refetchEmailSettings, refetchMailboxSettings]);
  const handleResetPrompts = useCallback(() => { resetLocalPromptFields(); refetchPrompts(); }, [resetLocalPromptFields, refetchPrompts]);

  // Date range
  const [dateRange, setDateRange] = useState<DateRangeSelection>({ kind: 'preset', preset: 'last30' });
  const { from_date, to_date } = dateRangeToParams(dateRange);

  // Email table — TanStack pattern (same as Email Performance emails tab)
  const [filters, setFilters] = useState<EmailFilters>(EMPTY_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'sentAt', desc: true }]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 });

  // Reset to page 0 on filter/sort/hotel/date changes
  const resetKey = `${hotelOrgId}|${activeMailbox}|${from_date}|${to_date}|${JSON.stringify(filters)}|${JSON.stringify(sorting)}`;
  const [prevResetKey, setPrevResetKey] = useState(resetKey);
  if (resetKey !== prevResetKey) { setPrevResetKey(resetKey); setPagination((p) => ({ ...p, pageIndex: 0 })); }

  const sort = sorting[0];
  const emailQueryParams = useMemo(() => ({
    from_date, to_date,
    organization_id: hotelOrgId || undefined,
    ...(activeMailbox ? { mailbox_email: activeMailbox } : filters.mailbox !== 'all' ? { mailbox_email: filters.mailbox } : {}),
    page: pagination.pageIndex + 1,
    page_size: pagination.pageSize,
    include_body: true,
    ...(sort && { sort_by: SORT_KEY_MAP[sort.id] ?? sort.id, sort_dir: (sort.desc ? 'desc' : 'asc') as 'asc' | 'desc' }),
    ...(filters.category !== 'all' && { category: filters.category }),
    ...(filters.editClass !== 'all' && { edit_class: filters.editClass }),
    ...(filters.tripType !== 'all' && { trip_type: filters.tripType }),
    ...(filters.verdict !== 'all' && { verdict: filters.verdict }),
    ...(filters.failureType !== 'all' && { primary_failure: filters.failureType }),
    ...(filters.editDistMin !== '' && { min_edit_distance: parseFloat(filters.editDistMin) }),
    ...(filters.editDistMax !== '' && { max_edit_distance: parseFloat(filters.editDistMax) }),
    ...(filters.search.trim() !== '' && { search_text: filters.search.trim() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [from_date, to_date, hotelOrgId, activeMailbox, pagination.pageIndex, pagination.pageSize, sort, filters]);

  const { data: emailsData, isLoading: emailsLoading, isFetching: emailsFetching } = useQuery({
    queryKey: ['etc-emails', emailQueryParams],
    queryFn: () => emailPerformanceService.getEmails(emailQueryParams),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const tableData = emailsData?.rows ?? [];
  const totalCount = emailsData?.total_count ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / pagination.pageSize));

  // Categories for filter sheet — derived from current page
  const pageCategories = useMemo(
    () => Array.from(new Set(tableData.map((r) => r.category).filter(Boolean))).sort() as string[],
    [tableData],
  );

  // Row selection (capped at MAX_SELECTION)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleEmail = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= MAX_SELECTION) return prev;
      next.add(id); return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  // Diff sheet — declared here so buildEmailColumns can reference setDiffDialogRow
  const [diffDialogRow, setDiffDialogRow] = useState<EAEmailRow | null>(null);

  // Columns — rebuilt when selectedIds, toggleEmail, or tableData change
  const columns = useMemo(
    () => buildEmailColumns({ selectedIds, tableData, toggleEmail, setSelectedIds, onViewEmail: setDiffDialogRow }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedIds, toggleEmail, tableData],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    manualSorting: true,
    manualPagination: true,
    pageCount,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
  });

  const activeFilterCount = countActiveFilters(filters);

  // Replay
  const replayMutation = useMutation({ mutationFn: emailTrainingCenterService.replayEmails });
  const [replayResults, setReplayResults] = useState<{ summary: ReplaySummary; results: ReplayEmailResult[] } | null>(null);
  const [testedWithChanges, setTestedWithChanges] = useState(false);

  const handleRunTest = useCallback(async () => {
    if (!hotelOrgId || !activeMailbox || selectedIds.size === 0) return;
    try {
      const res = await replayMutation.mutateAsync({
        org_id: hotelOrgId, mailbox: activeMailbox, interaction_ids: Array.from(selectedIds),
        role_objective_override: roleObjective !== null ? currentRoleObjective : null,
        hotel_policies_override: hotelPolicies !== null ? currentHotelPolicies : null,
        learned_style_override: learnedStyle !== null ? currentLearnedStyle : null,
        custom_tool_prompt_override: customToolPrompt !== null ? currentToolPrompt : null,
        language_selection_override: languageSelection !== null ? currentLanguageSelection : null,
        overrides_override: overrides !== null ? currentOverrides : null,
      });
      setReplayResults(res); setTestedWithChanges(hasPromptChanges);
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Replay failed'); }
  }, [hotelOrgId, activeMailbox, selectedIds, roleObjective, hotelPolicies, learnedStyle, customToolPrompt, languageSelection, overrides, currentRoleObjective, currentHotelPolicies, currentLearnedStyle, currentToolPrompt, currentLanguageSelection, currentOverrides, hasPromptChanges, replayMutation]);

  // Save
  const saveMutation = useMutation({ mutationFn: emailTrainingCenterService.savePrompt });

  const handleSave = useCallback(async () => {
    if (!hotelOrgId || !activeMailbox) return;
    try {
      await saveMutation.mutateAsync({
        org_id: hotelOrgId, mailbox: activeMailbox,
        role_objective: roleObjective !== null ? currentRoleObjective : null,
        hotel_policies: hotelPolicies !== null ? currentHotelPolicies : null,
        learned_style: learnedStyle !== null ? currentLearnedStyle : null,
        custom_tool_prompt: customToolPrompt !== null ? currentToolPrompt : null,
        language_selection: languageSelection !== null ? currentLanguageSelection : null,
        overrides: overrides !== null ? currentOverrides : null,
      });
      toast.success('Prompt saved to production.'); resetLocalPromptFields(); refetchPrompts();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Save failed'); }
  }, [hotelOrgId, activeMailbox, roleObjective, hotelPolicies, learnedStyle, customToolPrompt, languageSelection, overrides, currentRoleObjective, currentHotelPolicies, currentLearnedStyle, currentToolPrompt, currentLanguageSelection, currentOverrides, saveMutation, resetLocalPromptFields, refetchPrompts]);

  // Export
  const [includeThreads, setIncludeThreads] = useState(false);
  const [includeToolCalls, setIncludeToolCalls] = useState(false);
  const [includeJudgeAnalysis, setIncludeJudgeAnalysis] = useState(false);
  const [exportingEmails, setExportingEmails] = useState(false);

  const handleExportEmails = useCallback(async (format: 'csv' | 'json') => {
    if (!tableData.length) return;
    setExportingEmails(true);
    try {
      let threadMap: Record<string, unknown[]> = {};
      if (includeThreads) {
        const byOrg = new Map<string, { mailbox: string; conversation_id: string }[]>();
        for (const e of tableData) {
          const cid = e.conversation_id?.trim();
          if (!cid || !e.organization_id?.trim() || !e.mailbox_email?.trim()) continue;
          if (!byOrg.has(e.organization_id)) byOrg.set(e.organization_id, []);
          byOrg.get(e.organization_id)!.push({ mailbox: e.mailbox_email, conversation_id: cid });
        }
        for (const [oid, items] of byOrg) {
          try { Object.assign(threadMap, await emailPerformanceService.getBulkThreads(oid, items)); }
          catch { toast.warning('Some threads failed to load.'); }
        }
      }
      let toolCallMap: Record<string, unknown[]> = {};
      if (includeToolCalls) {
        const ids = tableData.map((e) => e.interaction_id).filter(Boolean).slice(0, 500);
        if (ids.length) {
          try { const r = await emailPerformanceService.getBulkToolCalls(ids); toolCallMap = r.tool_calls_by_interaction as Record<string, unknown[]>; }
          catch { toast.warning('Tool calls failed to load.'); }
        }
      }
      const enriched = tableData.map((e) => {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(e)) { if (!includeJudgeAnalysis && JUDGE_FIELDS.has(k)) continue; out[k] = v; }
        if (includeThreads && e.conversation_id) out.email_thread = threadMap[e.conversation_id] ?? null;
        if (includeToolCalls) out.tool_calls = toolCallMap[e.interaction_id] ?? [];
        return out;
      });
      const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      if (format === 'json') {
        downloadFile(JSON.stringify(enriched, null, 2), `training_center_emails_${ts}.json`, 'application/json');
      } else {
        const cols = [
          { key: 'sent_at', label: 'Sent At' }, { key: 'mailbox_email', label: 'Mailbox' },
          { key: 'original_subject', label: 'Subject' }, { key: 'edit_class', label: 'Edit Class' },
          { key: 'edit_distance_ratio', label: 'Edit Distance' }, { key: 'semantic_similarity', label: 'Semantic Similarity' },
          { key: 'original_sender', label: 'Sender' }, { key: 'category', label: 'Category' },
          { key: 'original_body_preview', label: 'Guest Email' }, { key: 'ai_draft_preview', label: 'AI Draft' },
          { key: 'final_sent_preview', label: 'Final Sent' },
          ...(includeJudgeAnalysis ? [
            { key: 'verdict', label: 'Verdict' }, { key: 'primary_failure', label: 'Primary Failure' },
            { key: 'root_cause', label: 'Root Cause' }, { key: 'fix_layer', label: 'Fix Layer' },
            { key: 'specific_fix', label: 'Specific Fix' }, { key: 'fact_status', label: 'Fact Status' },
            { key: 'could_be_fixed_without_new_systems', label: 'Fixable Without New Systems' },
            { key: 'missed_operational_outcome', label: 'Missed Operational Outcome' },
            { key: 'judge_summary', label: 'Judge Summary' },
          ] : []),
          ...(includeThreads ? [{ key: 'email_thread', label: 'Email Thread' }] : []),
          ...(includeToolCalls ? [{ key: 'tool_calls', label: 'Tool Calls' }] : []),
        ];
        downloadFile(toCsv(enriched, cols), `training_center_emails_${ts}.csv`, 'text/csv');
      }
    } finally { setExportingEmails(false); }
  }, [tableData, includeThreads, includeToolCalls, includeJudgeAnalysis]);

  const handleExportResults = useCallback((format: 'csv' | 'json') => {
    if (!replayResults?.results.length) return;
    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    if (format === 'json') {
      downloadFile(JSON.stringify(replayResults.results, null, 2), `training_center_results_${ts}.json`, 'application/json');
    } else {
      const cols = [
        { key: 'subject', label: 'Subject' }, { key: 'original_edit_class', label: 'Original Class' },
        { key: 'original_edit_distance', label: 'Original Distance' }, { key: 'new_edit_class', label: 'New Class' },
        { key: 'new_edit_distance', label: 'New Distance' }, { key: 'improvement', label: 'Improvement' },
        { key: 'original_draft', label: 'Original Draft' }, { key: 'new_draft', label: 'New Draft' },
        { key: 'final_sent', label: 'Final Sent' },
      ];
      downloadFile(toCsv(replayResults.results as unknown as Record<string, unknown>[], cols), `training_center_results_${ts}.csv`, 'text/csv');
    }
  }, [replayResults]);

  // Expanded prompt field
  const [expandedField, setExpandedField] = useState<ExpandedPromptField | null>(null);
  const [openPromptSections, setOpenPromptSections] = useState<string[]>([]);

  const selectedOrgName = hotelOrgId ? (orgs.find((o) => o.id === hotelOrgId)?.name ?? 'Hotel') : 'All hotels';

  return (
    <div className="w-full p-6 space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Training Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Override prompts, replay historical emails, and compare draft quality</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <Popover open={hotelPickerOpen} onOpenChange={setHotelPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-[200px] justify-between text-sm font-normal" disabled={orgsLoading}>
                <span className="truncate">{orgsLoading ? 'Loading…' : selectedOrgName}</span>
                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[320px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search hotels..." />
                <CommandList>
                  <CommandEmpty>No hotels found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="All hotels" onSelect={() => { setHotelOrgId(''); setSelectedMailbox(''); setSelectedIds(new Set()); setReplayResults(null); resetLocalPromptFields(); setHotelPickerOpen(false); }}>
                      <Check className={`mr-2 h-4 w-4 ${!hotelOrgId ? 'opacity-100' : 'opacity-0'}`} />All hotels
                    </CommandItem>
                    {orgs.map((o) => (
                      <CommandItem key={o.id} value={o.name} onSelect={() => { setHotelOrgId(o.id); setSelectedMailbox(''); setSelectedIds(new Set()); setReplayResults(null); resetLocalPromptFields(); setHotelPickerOpen(false); }}>
                        <Check className={`mr-2 h-4 w-4 ${hotelOrgId === o.id ? 'opacity-100' : 'opacity-0'}`} />{o.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={mailboxOpen} onOpenChange={setMailboxOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" disabled={!hotelOrgId} className="w-[300px] justify-between text-sm">
                {!hotelOrgId ? 'Select a hotel first' : mailboxesFetching ? 'Loading mailboxes…' : activeMailbox || 'Select mailbox…'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search mailbox..." />
                <CommandList>
                  <CommandEmpty>{mailboxesFetching ? 'Loading…' : 'No mailbox found.'}</CommandEmpty>
                  <CommandGroup>
                    {mailboxList.map((mb) => (
                      <CommandItem key={mb} value={mb} onSelect={() => { setSelectedMailbox(mb); setMailboxOpen(false); setSelectedIds(new Set()); setReplayResults(null); resetLocalPromptFields(); }}>
                        <Check className={`mr-2 h-4 w-4 ${activeMailbox === mb ? 'opacity-100' : 'opacity-0'}`} />{mb}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1  gap-6 items-start">
        {/* Right: Email selector */}
        <div className="space-y-4">
          <Card className="border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Select Emails to Test</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {selectedIds.size}/{MAX_SELECTION} selected
                    {emailsFetching
                      ? <span className="inline-flex items-center gap-1 ml-1"><Loader2 className="h-3 w-3 animate-spin" />Loading…</span>
                      : <span className="ml-1">· {totalCount.toLocaleString()} emails</span>}
                  </CardDescription>
                </div>
                <DateRangeFilter value={dateRange} onChange={setDateRange} />
              </div>

              {/* Toolbar — same pattern as email performance emails tab */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-1 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearSelection} disabled={selectedIds.size === 0}>
                    Clear selection
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setFilterOpen(true)}>
                    <IconFilter className="size-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <span className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => setFilters(EMPTY_FILTERS)}>
                      <IconX className="size-4" />Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs" disabled={tableData.length === 0 || exportingEmails}>
                        {exportingEmails ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleExportEmails('csv')}>Export as CSV</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportEmails('json')}>Export as JSON</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm" onClick={() => setIncludeThreads((v) => !v)}>
                        <Checkbox id="inc-threads" checked={includeThreads} onCheckedChange={(v) => setIncludeThreads(!!v)} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5" />
                        <label htmlFor="inc-threads" className="text-xs cursor-pointer flex items-center gap-1.5" onClick={(e) => e.preventDefault()}><MessageSquare className="h-3 w-3 text-violet-500" />Include threads</label>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm" onClick={() => setIncludeToolCalls((v) => !v)}>
                        <Checkbox id="inc-tc" checked={includeToolCalls} onCheckedChange={(v) => setIncludeToolCalls(!!v)} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5" />
                        <label htmlFor="inc-tc" className="text-xs cursor-pointer flex items-center gap-1.5" onClick={(e) => e.preventDefault()}><Wrench className="h-3 w-3 text-orange-500" />Include tool calls</label>
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-accent rounded-sm" onClick={() => setIncludeJudgeAnalysis((v) => !v)}>
                        <Checkbox id="inc-judge" checked={includeJudgeAnalysis} onCheckedChange={(v) => setIncludeJudgeAnalysis(!!v)} onClick={(e) => e.stopPropagation()} className="h-3.5 w-3.5" />
                        <label htmlFor="inc-judge" className="text-xs cursor-pointer flex items-center gap-1.5" onClick={(e) => e.preventDefault()}><Scale className="h-3 w-3 text-emerald-500" />Include judge analysis</label>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleRunTest} disabled={selectedIds.size === 0 || !canEditPromptsAndReplay || replayMutation.isPending}>
                    {replayMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <Play className="h-3.5 w-3.5" />
                    {hasPromptChanges ? `Run Test With Changes (${selectedIds.size})` : `Run Test (${selectedIds.size})`}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0 pb-4">
              <EmailSelectorTable
                table={table}
                columnCount={columns.length}
                isLoading={emailsLoading}
                selectedIds={selectedIds}
                onRowClick={toggleEmail}
              />
            </CardContent>
          </Card>

          {/* Replay results */}
          {replayResults && (
            <div className="space-y-4">
              {testedWithChanges && (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-xs text-blue-800">
                  <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                  Results generated using unsaved prompt edits. Save to Production to persist changes.
                </div>
              )}
              <SummaryCard summary={replayResults.summary} />
              <ReplayResultsTable results={replayResults.results} onExport={handleExportResults} />
            </div>
          )}
        </div>
        {/* Left: Prompt editor */}
        <div className="min-w-0">
          <Card className="min-w-0 border border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Prompt Configuration</CardTitle>
              <CardDescription className="text-xs">Organization writing guidelines plus the selected mailbox's learned style, overrides, and custom tool prompt.</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-5">
              <div className="flex gap-2 rounded-md border border-blue-200 bg-blue-50/60 px-3 py-2 text-[11px] leading-relaxed text-blue-800">
                <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Edits are local to this session. Use <strong>Run Test</strong> to test changes, then <strong>Save to Production</strong> to persist.</span>
              </div>
              {!hotelOrgId && (
                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] leading-relaxed text-amber-950">
                  <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>Choose a hotel above to load its prompts and mailboxes.</span>
                </div>
              )}
              {hasPromptChanges && (
                <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
                  <FlaskConical className="h-3.5 w-3.5 shrink-0" />
                  <span>You have unsaved test changes — these will be used when you run a test.</span>
                </div>
              )}
              {promptsLoading ? (
                <div className="space-y-3 py-1">
                  <p className="text-xs text-muted-foreground">Loading prompt configuration…</p>
                  {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[72px] w-full rounded-lg" />)}
                </div>
              ) : (
                <>
                  <Accordion type="multiple" value={openPromptSections} onValueChange={setOpenPromptSections} className="min-w-0 space-y-3 border-none rounded-none">
                    <PromptEditorField sectionValue="role-objective" label="Role & Objective" value={currentRoleObjective} placeholder="No role & objective yet..." minHeightClass="min-h-[100px]" icon={User} iconWrapperClassName="bg-blue-50" iconClassName="h-4 w-4 text-blue-600" onChange={setRoleObjective} onExpand={() => setExpandedField({ title: 'Role & Objective', value: currentRoleObjective, placeholder: 'No role & objective yet...', onChange: setRoleObjective })} />
                    <PromptEditorField sectionValue="language-selection" label="Language Selection" value={currentLanguageSelection} placeholder="No language selection yet..." minHeightClass="min-h-[60px]" icon={Languages} iconWrapperClassName="bg-violet-50" iconClassName="h-4 w-4 text-violet-600" onChange={setLanguageSelection} onExpand={() => setExpandedField({ title: 'Language Selection', value: currentLanguageSelection, placeholder: 'No language selection yet...', onChange: setLanguageSelection })} />
                    <PromptEditorField sectionValue="hotel-policies" label="Hotel Policies" value={currentHotelPolicies} placeholder="No hotel policies yet..." minHeightClass="min-h-[100px]" icon={FileText} iconWrapperClassName="bg-amber-50" iconClassName="h-4 w-4 text-amber-600" onChange={setHotelPolicies} onExpand={() => setExpandedField({ title: 'Hotel Policies', value: currentHotelPolicies, placeholder: 'No hotel policies yet...', onChange: setHotelPolicies })} />
                    <PromptEditorField sectionValue="learned-style" label="Learned Style" value={currentLearnedStyle} placeholder="No learned style yet..." minHeightClass="min-h-[120px]" icon={Sparkles} iconWrapperClassName="bg-primary/10" iconClassName="h-4 w-4 text-primary" onChange={setLearnedStyle} onExpand={() => setExpandedField({ title: 'Learned Style', value: currentLearnedStyle, placeholder: 'No learned style yet...', onChange: setLearnedStyle })} />
                    <PromptEditorField sectionValue="special-instructions" label="Special Instructions / Overrides" value={currentOverrides} placeholder="No special instructions yet..." minHeightClass="min-h-[80px]" icon={Settings2} iconWrapperClassName="bg-rose-50" iconClassName="h-4 w-4 text-rose-600" onChange={setOverrides} onExpand={() => setExpandedField({ title: 'Special Instructions / Overrides', value: currentOverrides, placeholder: 'No special instructions yet...', onChange: setOverrides })} />
                    <PromptEditorField sectionValue="custom-tool-prompt" label="Custom Tool Prompt" value={currentToolPrompt} placeholder="No custom tool prompt yet..." minHeightClass="min-h-[80px]" icon={Settings2} iconWrapperClassName="bg-slate-100" iconClassName="h-4 w-4 text-slate-600" onChange={setCustomToolPrompt} onExpand={() => setExpandedField({ title: 'Custom Tool Prompt', value: currentToolPrompt, placeholder: 'No custom tool prompt yet...', onChange: setCustomToolPrompt })} />
                  </Accordion>
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                    <Button variant="outline" size="sm" onClick={handleResetPrompts} disabled={!hasPromptChanges}>
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Discard Changes
                    </Button>
                    <Button size="sm" variant={hasPromptChanges ? 'outline' : 'default'} onClick={handleSave} disabled={!hasPromptChanges || !canEditPromptsAndReplay || saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                      <Save className="h-3.5 w-3.5 mr-1.5" />Save to Production
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      const parts = [
                        currentRoleObjective && `## Role & Objective\n${currentRoleObjective}`,
                        currentLanguageSelection && `## Language Selection\n${currentLanguageSelection}`,
                        currentHotelPolicies && `## Hotel Policies\n${currentHotelPolicies}`,
                        currentLearnedStyle && `## Learned Style\n${currentLearnedStyle}`,
                        currentOverrides && `## Special Instructions / Overrides\n${currentOverrides}`,
                      ].filter(Boolean).join('\n\n');
                      navigator.clipboard.writeText(parts);
                      toast.success('Full prompt copied to clipboard.');
                    }}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" />Copy Full Prompt
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>


      </div>

      {/* Filter sheet */}
      <EmailsFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={filters}
        onApply={setFilters}
        mailboxes={mailboxList}
        categories={pageCategories}
      />

      {/* Diff sheet */}
      <EmailDetailSheet
        email={diffDialogRow ? transformEmails([diffDialogRow])[0] : null}
        onClose={() => setDiffDialogRow(null)}
      />

      {/* Expanded prompt field dialog */}
      <Dialog open={!!expandedField} onOpenChange={(open) => !open && setExpandedField(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0"><DialogTitle>{expandedField?.title}</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0 py-4">
            <Textarea
              placeholder={expandedField?.placeholder}
              value={expandedField?.value ?? ''}
              onChange={(e) => { const v = e.target.value; setExpandedField((prev) => prev ? { ...prev, value: v } : prev); }}
              className="h-full min-h-full resize-none text-sm leading-relaxed"
            />
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button onClick={() => { if (expandedField) expandedField.onChange(expandedField.value); setExpandedField(null); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
