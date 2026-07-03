import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  CalendarIcon,
  ChevronDown,
  ChevronUp,
  Languages,
  Loader2,
  MessagesSquare,
  MoreVertical,
  RefreshCw,
  Search,
  StickyNote,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import type { ChatConversation } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
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

// ── Google Translate (free unofficial endpoint) ────────────────────────────────

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
  if (isPending) return <span className="text-muted-foreground/60">Translating…</span>;
  return <>{translated ?? text}</>;
}

// ── TranslateButton (popover) ─────────────────────────────────────────────────

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
        <Button
          size="sm"
          variant={enabled ? 'default' : 'outline'}
          className="h-7 gap-1.5 text-xs"
        >
          <Languages className="h-3.5 w-3.5" />
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

interface ChatLogsTabProps {
  chatbotId: string;
  orgId: string;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function channelBadge(channel: ChatConversation['channel']) {
  switch (channel) {
    case 'web': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'messenger': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'instagram': return 'bg-pink-50 text-pink-700 border-pink-200';
    default: return 'bg-grey-50 text-grey-600 border-grey-100';
  }
}

// ── Conversation Card ──────────────────────────────────────────────────────────

function ConversationCard({
  conv,
  chatbotId,
  translateEnabled = false,
  targetLanguage = 'en',
  onRerun,
}: {
  conv: ChatConversation;
  chatbotId: string;
  translateEnabled?: boolean;
  targetLanguage?: string;
  onRerun?: (conv: ChatConversation) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(conv.error_note ?? '');

  const qc = useQueryClient();

  const noteMutation = useMutation({
    mutationFn: (note: string) =>
      chatbotTrainingCenterService.updateConversation(chatbotId, conv.id, {
        error_note: note || null,
        is_error: conv.is_error ?? false,
      }),
    onSuccess: () => {
      toast.success('Note saved');
      setEditingNote(false);
      qc.invalidateQueries({ queryKey: ['chat-logs', chatbotId] });
    },
    onError: () => toast.error('Failed to save note'),
  });

  const openAddNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    setEditingNote(true);
  };

  // Preview: first human message, fallback to first message
  const firstHuman = conv.messages?.find((m) => m.sender === 'human');
  const preview =
    (firstHuman ?? conv.messages?.[0])?.message_content?.slice(0, 120) ?? '(no messages)';

  const positiveCount =
    conv.messages?.filter((m) => m.feedback?.rating === 'positive').length ?? 0;
  const negativeCount =
    conv.messages?.filter((m) => m.feedback?.rating === 'negative').length ?? 0;

  return (
    <div className="relative rounded-xl border border-grey-100 bg-muted/30">
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4  text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <MessagesSquare className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="max-w-xs truncate text-sm font-medium text-grey-900">{preview}</p>
            {conv.is_error && (
              <Badge variant="outline" className="border-red-200 bg-red-50 text-[10px] text-red-700">
                Error
              </Badge>
            )}
            {conv.channel && (
              <Badge variant="outline" className={`text-[10px] ${channelBadge(conv.channel)}`}>
                {conv.channel}
              </Badge>
            )}
            {conv.is_transferred_to_agent && (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                Transferred
              </Badge>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3">
            <p className="text-xs text-muted-foreground">
              {formatDate(conv.created_at)} · {conv.messages?.length ?? 0} messages
            </p>
            {positiveCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-emerald-600">
                <ThumbsUp className="h-3 w-3" /> {positiveCount}
              </span>
            )}
            {negativeCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                <ThumbsDown className="h-3 w-3" /> {negativeCount}
              </span>
            )}
            {conv.error_note && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                <StickyNote className="h-3 w-3" /> note
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-muted-foreground ">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}

        </div>
        <div className="">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); onRerun?.(conv); }}
              >
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Re-run conversation
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openAddNote}>
                <StickyNote className="mr-2 h-3.5 w-3.5" />
                Add note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </button>

      {/* Three-dots menu — outside the expand button so clicks don't toggle */}


      {expanded && (
        <div className="space-y-2.5 border-t border-grey-100 px-4 pb-4 pt-3">
          {/* Messages */}
          {(conv.messages ?? []).map((msg, idx) => {
            const isHuman = msg.sender === 'human';
            return (
              <div
                key={idx}
                className={`rounded-lg p-3 text-xs ${isHuman
                    ? 'ml-6 bg-primary/10 text-grey-900'
                    : 'mr-6 border border-grey-100 bg-background text-grey-700'
                  }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {isHuman ? 'Guest' : 'Bot'}
                  </p>
                  {msg.feedback?.rating === 'positive' && (
                    <ThumbsUp className="h-3 w-3 text-emerald-500" />
                  )}
                  {msg.feedback?.rating === 'negative' && (
                    <ThumbsDown className="h-3 w-3 text-red-500" />
                  )}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">
                  <TranslatedText
                    text={msg.message_content ?? ''}
                    enabled={translateEnabled}
                    targetLanguage={targetLanguage}
                  />
                </p>
                {msg.timestamp && (
                  <p className="mt-1.5 text-[9px] text-muted-foreground/60">
                    {new Date(msg.timestamp).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            );
          })}

          {/* Error note (read-only display) */}
          {conv.error_note && !editingNote && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-800">
              <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p className="flex-1 leading-relaxed">{conv.error_note}</p>
            </div>
          )}

          {/* Note editor */}
          {editingNote ? (
            <div className="space-y-2">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Add a note about this conversation…"
                className="min-h-20 resize-none border-grey-100 text-xs"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  disabled={noteMutation.isPending}
                  onClick={() => noteMutation.mutate(noteDraft)}
                >
                  {noteMutation.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    'Save note'
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditingNote(false);
                    setNoteDraft(conv.error_note ?? '');
                  }}
                >
                  Cancel
                </Button>
                {noteDraft && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                    onClick={() => noteMutation.mutate('')}
                  >
                    Remove note
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-grey-800"
              onClick={(e) => {
                e.stopPropagation();
                setEditingNote(true);
              }}
            >
              <StickyNote className="h-3 w-3" />
              {conv.error_note ? 'Edit note' : 'Add note'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab ────────────────────────────────────────────────────────────────────────

export function ChatLogsTab({ chatbotId, orgId }: ChatLogsTabProps) {
  const [search, setSearch] = useState('');
  const [channel, setChannel] = useState<'all' | 'web' | 'messenger' | 'instagram'>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [dateOpen, setDateOpen] = useState(false);
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest');
  const [limit, setLimit] = useState(20);
  const [translateEnabled, setTranslateEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');

  const handleRerun = async (conv: ChatConversation) => {
    const userTurns = (conv.messages ?? [])
      .filter((m) => (m.sender === 'human' || m.sender === 'user') && m.message_content?.trim())
      .sort((a, b) => {
        const ta = new Date((a as any).timestamp || (a as any).created_at || 0).getTime();
        const tb = new Date((b as any).timestamp || (b as any).created_at || 0).getTime();
        return ta - tb;
      })
      .map((m) => String(m.message_content));

    if (userTurns.length === 0) {
      toast.info('No user messages to replay.');
      return;
    }

    const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Chatbot Preview"]');
    if (!iframe?.contentWindow) {
      toast.info('Open the Live Preview to replay this conversation.');
      return;
    }

    const win = iframe.contentWindow;

    // Wait for the bot to finish responding to one question
    const waitForStep = (timeoutMs = 45_000) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, timeoutMs);
        const onMsg = (e: MessageEvent) => {
          const t = (e.data as any)?.type as string | undefined;
          if (
            t === 'CHATBOT:RESPONSE_COMPLETE' ||
            t === 'CHATBOT:RESPONSE_FINAL' ||
            t === 'final' ||
            t === 'CHATBOT:ERROR'
          ) {
            clearTimeout(timer);
            window.removeEventListener('message', onMsg);
            resolve();
          }
        };
        window.addEventListener('message', onMsg);
      });

    toast.success(`Replaying ${userTurns.length} message${userTurns.length > 1 ? 's' : ''}…`);

    win.postMessage({ type: 'CLEAR_CHAT_HISTORY' }, '*');
    await new Promise((r) => setTimeout(r, 150));

    for (const question of userTurns) {
      win.postMessage({ type: 'ASK_QUESTION', payload: { question } }, '*');
      await waitForStep();
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  const fromDate = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
  const toDate = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ['chat-logs', chatbotId, orgId, fromDate, toDate, limit],
    queryFn: () =>
      chatbotTrainingCenterService.listConversations(chatbotId, orgId, {
        limit,
        from_date: fromDate || undefined,
        to_date: toDate || undefined,
      }),
    enabled: !!chatbotId && !!orgId,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  const allConvs = data?.conversations ?? [];
  const hasMore = data?.has_more ?? false;

  const filtered = allConvs
    .filter((c) => channel === 'all' || c.channel === channel)
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        c.messages?.some((m) => m.message_content?.toLowerCase().includes(q)) ||
        c.error_note?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return sort === 'newest' ? tb - ta : ta - tb;
    });

  const totalPositive = allConvs.reduce(
    (n, c) => n + (c.messages?.filter((m) => m.feedback?.rating === 'positive').length ?? 0),
    0,
  );
  const totalNegative = allConvs.reduce(
    (n, c) => n + (c.messages?.filter((m) => m.feedback?.rating === 'negative').length ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      {/* ── Top bar ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-grey-900">Chat Logs</p>
        <TranslateButton
          enabled={translateEnabled}
          onToggle={setTranslateEnabled}
          targetLanguage={targetLanguage}
          onLanguageChange={setTargetLanguage}
        />
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative min-w-40 flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search messages…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-grey-100 pl-8 text-xs"
          />
          {search && (
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-grey-800"
              onClick={() => setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Date range popover */}
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-8 gap-1.5 border-grey-100 text-xs font-normal ${dateRange?.from ? 'text-grey-900' : 'text-muted-foreground'}`}
            >
              <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, 'dd MMM')} – ${format(dateRange.to, 'dd MMM yyyy')}`
                ) : (
                  format(dateRange.from, 'dd MMM yyyy')
                )
              ) : (
                'Pick a date'
              )}
              {dateRange?.from && (
                <span
                  role="button"
                  className="ml-1 rounded-sm text-muted-foreground hover:text-grey-800"
                  onClick={(e) => { e.stopPropagation(); setDateRange(undefined); }}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(r) => { setDateRange(r); if (r?.from && r?.to) setDateOpen(false); }}
              initialFocus
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Channel */}
        <Select value={channel} onValueChange={(v) => setChannel(v as typeof channel)}>
          <SelectTrigger className="h-8 w-32 shrink-0 border-grey-100 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="messenger">Messenger</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-8 w-30 shrink-0 border-grey-100 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Most Recent</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────────────── */}
      {allConvs.length > 0 && (
        <div className="flex  flex-wrap items-center gap-4 rounded-xl border border-grey-100 bg-muted/20 px-4 py-2.5">
          <span className="text-xs text-muted-foreground">
            <span className="font-semibold text-grey-800">{allConvs.length}</span> conversations
            {hasMore && ' (more available)'}
          </span>
          {totalPositive > 0 && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span className="font-semibold">{totalPositive}</span> helpful
            </span>
          )}
          {totalNegative > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <ThumbsDown className="h-3.5 w-3.5" />
              <span className="font-semibold">{totalNegative}</span> unhelpful
            </span>
          )}
          {search && (
            <span className="text-xs text-muted-foreground">
              <span className="font-semibold text-grey-800">{filtered.length}</span> match search
            </span>
          )}
        </div>
      )}

      {/* ── Loading / error ─────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      {isError && <p className="text-sm text-destructive">Failed to load conversations.</p>}

      {/* ── Empty state ────────────────────────────────────────────────────── */}
      {!isLoading && !isError && filtered.length === 0 && (
        <div className="rounded-xl  border border-dashed border-grey-100 py-16 text-center">
          <MessagesSquare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-medium text-grey-900">No conversations</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {search
              ? `No conversations match "${search}".`
              : channel !== 'all'
                ? `No ${channel} conversations in this range.`
                : 'No conversations recorded yet.'}
          </p>
        </div>
      )}

      {/* ── List ────────────────────────────────────────────────────────────── */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((conv) => (
            <ConversationCard
              key={conv.id}
              conv={conv}
              chatbotId={chatbotId}
              translateEnabled={translateEnabled}
              targetLanguage={targetLanguage}
              onRerun={handleRerun}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="border-grey-100 text-xs"
                onClick={() => setLimit((prev) => prev + 20)}
                disabled={isFetching}
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Loading…
                  </>
                ) : (
                  'Load more conversations'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
