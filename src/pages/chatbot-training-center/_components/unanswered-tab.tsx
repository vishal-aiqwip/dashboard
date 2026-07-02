import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  Folder,
  Languages,
  Loader2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { UnansweredQuestion } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

// ── Language options ───────────────────────────────────────────────────────────

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'no', label: 'Norwegian' },
  { value: 'sv', label: 'Swedish' },
  { value: 'da', label: 'Danish' },
  { value: 'fi', label: 'Finnish' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'nl', label: 'Dutch' },
  { value: 'pl', label: 'Polish' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
];

// ── Google Translate (free unofficial endpoint) ───────────────────────────────

async function googleTranslate(text: string, targetLang: string): Promise<string> {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Translation failed');
  const json = await res.json();
  return (json[0] as [string, unknown][]).map(([t]) => t).join('');
}

// ── TranslatedText ─────────────────────────────────────────────────────────────

function TranslatedText({
  text,
  enabled,
  targetLanguage,
}: {
  text: string;
  enabled: boolean;
  targetLanguage: string;
}) {
  const { data: translated, isPending } = useQuery({
    queryKey: ['translate', text, targetLanguage],
    queryFn: () => googleTranslate(text, targetLanguage),
    enabled: enabled && !!text,
    staleTime: Infinity,
    retry: false,
  });

  if (!enabled) return <>{text}</>;
  if (isPending) return <span className="text-muted-foreground">Translating…</span>;
  return <>{translated ?? text}</>;
}

// ── Translate popover ──────────────────────────────────────────────────────────

function TranslateButton({
  enabled,
  onToggle,
  targetLanguage,
  onLanguageChange,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  targetLanguage: string;
  onLanguageChange: (v: string) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Languages className="h-4 w-4" />
          {enabled ? 'Translate On' : 'Translate'}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Translate</p>
          <Switch checked={enabled} onCheckedChange={onToggle} />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Target language</p>
          <Select value={targetLanguage} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 border-grey-100 text-sm">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface UnansweredTabProps {
  kbId: string;
  orgId: string;
}

export function UnansweredTab({ kbId, orgId }: UnansweredTabProps) {
  const queryClient = useQueryClient();

  // Translation
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');

  // List state
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<UnansweredQuestion | null>(null);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [newDocTitle, setNewDocTitle] = useState('');

  // ── Data ──────────────────────────────────────────────────────────────────────

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['unanswered', kbId, orgId],
    queryFn: () => chatbotTrainingCenterService.listUnanswered(kbId, orgId),
    enabled: !!kbId && !!orgId,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['kb-documents', kbId, orgId],
    queryFn: () => chatbotTrainingCenterService.listDocuments(kbId, orgId),
    enabled: saveDialogOpen && !!kbId && !!orgId,
  });

  const sorted = useMemo(() => {
    const seen = new Set<string>();
    return [...questions]
      .filter((q) => {
        const key = q.original_question.trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.human_timestamp ?? 0).getTime() -
          new Date(a.human_timestamp ?? 0).getTime(),
      );
  }, [questions]);

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['unanswered', kbId, orgId] });

  const dismissOneMutation = useMutation({
    mutationFn: (q: UnansweredQuestion) =>
      chatbotTrainingCenterService.dismissQuestion(
        kbId,
        orgId,
        q.document_id,
        q.original_question,
      ),
    onSuccess: () => {
      toast.success('Question dismissed');
      invalidate();
    },
    onError: () => toast.error('Failed to dismiss question'),
  });

  const dismissManyMutation = useMutation({
    mutationFn: (ids: string[]) =>
      chatbotTrainingCenterService.dismissAllQuestions(kbId, orgId, ids),
    onSuccess: () => {
      toast.success('Questions dismissed');
      setSelectedIds(new Set());
      invalidate();
    },
    onError: () => toast.error('Failed to dismiss questions'),
  });

  const createDocMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) =>
      chatbotTrainingCenterService.createDocument(orgId, kbId, payload),
    onSuccess: () => {
      toast.success('Document created');
      setSaveDialogOpen(false);
      setNewDocTitle('');
      if (activeQuestion) dismissOneMutation.mutate(activeQuestion);
    },
    onError: () => toast.error('Failed to create document'),
  });

  const updateDocMutation = useMutation({
    mutationFn: (p: { docId: string; title: string; content: string }) =>
      chatbotTrainingCenterService.updateDocument(orgId, kbId, p.docId, {
        title: p.title,
        content: p.content,
      }),
    onSuccess: () => {
      toast.success('Document updated');
      setSaveDialogOpen(false);
      setSelectedDocId('');
      if (activeQuestion) dismissOneMutation.mutate(activeQuestion);
    },
    onError: () => toast.error('Failed to update document'),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const openSaveDialog = (q: UnansweredQuestion) => {
    setActiveQuestion(q);
    setSelectedDocId('');
    setNewDocTitle('');
    setSaveDialogOpen(true);
  };

  const handleSaveToExisting = () => {
    if (!activeQuestion || !selectedDocId) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    if (!doc) return;
    const draft = drafts[activeQuestion.document_id] ?? '';
    const appended = `${doc.content ?? ''}\n\n${activeQuestion.original_question}\n${draft}`.trim();
    updateDocMutation.mutate({
      docId: selectedDocId,
      title: doc.title ?? (doc.filename ?? '').replace(/\.[^.]+$/, ''),
      content: appended,
    });
  };

  const handleCreateNew = () => {
    if (!activeQuestion || !newDocTitle.trim()) return;
    const draft = drafts[activeQuestion.document_id] ?? '';
    createDocMutation.mutate({
      title: newDocTitle.trim(),
      content: `${activeQuestion.original_question}\n${draft}`.trim(),
    });
  };

  const formatDate = (ts?: string | null) => {
    if (!ts) return '';
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-grey-900">Unanswered Questions</h3>
        <div className="flex items-center gap-2">
          <TranslateButton
            enabled={translateEnabled}
            onToggle={setTranslateEnabled}
            targetLanguage={targetLanguage}
            onLanguageChange={setTargetLanguage}
          />
          {selectedIds.size > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={dismissManyMutation.isPending}
              onClick={() => {
                const ids = questions
                  .filter((q) => selectedIds.has(q.document_id))
                  .map((q) => q.document_id);
                if (ids.length > 0) dismissManyMutation.mutate(ids);
              }}
            >
              Dismiss Selected ({selectedIds.size})
            </Button>
          ) : (
            <Button
              size="sm"
              className=""
              disabled={isLoading || sorted.length === 0 || dismissManyMutation.isPending}
              onClick={() => {
                const ids = questions.map((q) => q.document_id);
                if (ids.length > 0) dismissManyMutation.mutate(ids);
              }}
            >
              {dismissManyMutation.isPending && (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              )}
              Dismiss All
            </Button>
          )}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-grey-100 py-16 text-center">
          <Folder className="h-8 w-8 text-primary/40" />
          <p className="text-sm font-medium text-grey-900">No Unanswered Questions</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            When the chatbot cannot answer a question, it will appear here so you can add the
            answer to the knowledge base.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((q) => {
            const id = q.document_id;
            const isExpanded = expandedIds.has(id);
            const draft = drafts[id] ?? '';
            return (
              <div key={id} className="rounded-lg border border-grey-100 bg-white">
                {/* Question row */}
                <div
                  className={[
                    'flex w-full cursor-pointer items-start justify-between p-4 text-left',
                    !isExpanded ? 'hover:bg-primary/5' : '',
                  ].join(' ')}
                  onClick={() => toggleExpand(id)}
                >
                  <div className="flex items-start gap-3 pr-4">
                    <Checkbox
                      className="mt-0.5"
                      checked={selectedIds.has(id)}
                      onCheckedChange={() => toggleSelect(id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <p className="text-sm text-grey-900">
                      <TranslatedText
                        text={q.original_question}
                        enabled={translateEnabled}
                        targetLanguage={targetLanguage}
                      />
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(q.human_timestamp)}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded: add your response */}
                {isExpanded && (
                  <div className="border-t border-grey-100 px-4 pb-4 pt-3">
                    <p className="mb-2 text-sm font-medium text-grey-900">Add your response</p>
                    <Textarea
                      placeholder="Type your answer here..."
                      className="min-h-28 w-full resize-y border-grey-100 bg-muted/30 text-sm"
                      value={draft}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                    />
                    <div className="mt-3 flex items-center justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                size="sm"
                                disabled={!draft.trim()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSaveDialog(q);
                                }}
                              >
                                Save to Document
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-left text-xs">
                            Stores this question and your answer in a text document so the
                            chatbot can use it next time.
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={dismissOneMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissOneMutation.mutate(q);
                        }}
                      >
                        Dismiss question
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Save-to-document dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <div className="space-y-4">
            <p className="text-sm font-medium text-grey-900">Save to existing document</p>

            {documents.filter((d) => d.filename?.toLowerCase().endsWith('.txt')).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No text documents found in this knowledge base.
              </p>
            ) : (
              <div className="grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {documents
                  .filter((d) => d.filename?.toLowerCase().endsWith('.txt'))
                  .map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      className={[
                        'flex items-center gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-muted/50',
                        selectedDocId === doc.id
                          ? 'border-primary ring-1 ring-primary'
                          : 'border-grey-100',
                      ].join(' ')}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setNewDocTitle('');
                      }}
                    >
                      <span className="rounded-md bg-grey-100 px-2 py-0.5 text-xs font-medium">
                        TXT
                      </span>
                      <span className="truncate text-sm">
                        {(doc.filename ?? doc.title ?? '').replace(/\.[^.]+$/, '')}
                      </span>
                    </button>
                  ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setSaveDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={
                  !selectedDocId || !!newDocTitle.trim() || updateDocMutation.isPending
                }
                onClick={handleSaveToExisting}
              >
                {updateDocMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save to document
              </Button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-grey-100" />
              <span className="mx-3 text-xs uppercase text-muted-foreground">or</span>
              <div className="flex-1 border-t border-grey-100" />
            </div>

            <p className="text-sm font-medium text-grey-900">Create new document</p>
            <div className="flex items-center gap-3">
              <Input
                placeholder="New document name"
                value={newDocTitle}
                className="border-grey-100"
                onChange={(e) => {
                  setNewDocTitle(e.target.value);
                  setSelectedDocId('');
                }}
              />
              <Button
                disabled={
                  !newDocTitle.trim() || !!selectedDocId || createDocMutation.isPending
                }
                onClick={handleCreateNew}
              >
                {createDocMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create and save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
