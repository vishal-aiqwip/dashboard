import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Brain, Database, Loader2, MessageCircleQuestion, MessagesSquare, Palette } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppSelector } from '@/redux/hooks';
import type { ChatbotDetail } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

import { BehaviorTab } from './_components/behavior-tab';
import { ChatLogsTab } from './_components/chat-logs-tab';
import { ChatbotPreview } from './_components/chatbot-preview';
import { CreateKnowledgeBaseDialog } from './_components/create-knowledge-base-dialog';
import { DisplayTab } from './_components/display-tab';
import { KnowledgeTab } from './_components/knowledge-tab';
import { UnansweredTab } from './_components/unanswered-tab';

// ── Tab definitions ────────────────────────────────────────────────────────────

type Tab = 'knowledge' | 'unanswered' | 'chat-logs' | 'display' | 'behavior';

const TABS: { value: Tab; label: string; Icon: React.ElementType }[] = [
  { value: 'knowledge', label: 'Knowledge', Icon: BookOpen },
  { value: 'unanswered', label: 'Unanswered', Icon: MessageCircleQuestion },
  { value: 'chat-logs', label: 'Chat Logs', Icon: MessagesSquare },
  { value: 'display', label: 'Display', Icon: Palette },
  { value: 'behavior', label: 'Behavior', Icon: Brain },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ChatbotTrainingCenterPage() {
  const selectedOrg = useAppSelector((state: any) => state.selectedOrg.selectedOrg);
  const orgId = selectedOrg?.id ?? '';

  const [selectedChatbotId, setSelectedChatbotId] = useState<string>('');
  const [localChatbot, setLocalChatbot] = useState<ChatbotDetail | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('knowledge');
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

  // ── Chatbots for selected org ───────────────────────────────────────────────
  const chatbotsQuery = useQuery({
    queryKey: ['chatbots-by-org', orgId],
    queryFn: () => chatbotTrainingCenterService.listChatbots(orgId),
    enabled: !!orgId,
  });
  const chatbots = chatbotsQuery.data ?? [];

  // Auto-select first chatbot; reset when org changes
  useEffect(() => {
    setSelectedChatbotId('');
  }, [orgId]);

  useEffect(() => {
    if (chatbots.length > 0 && (!selectedChatbotId || !chatbots.find((c) => c.id === selectedChatbotId))) {
      setSelectedChatbotId(chatbots[0]!.id);
    }
  }, [chatbots, selectedChatbotId]);

  useEffect(() => {
    const found = chatbots.find((c) => c.id === selectedChatbotId);
    setLocalChatbot(found ?? null);
  }, [chatbots, selectedChatbotId]);

  const chatbot = localChatbot;
  const kbId = chatbot?.knowledge_base_id ?? '';

  const [createKbOpen, setCreateKbOpen] = useState(false);
  const qc = useQueryClient();

  const createKbMutation = useMutation({
    mutationFn: async (language: string) => {
      if (!chatbot) return;
      const kb = await chatbotTrainingCenterService.createKnowledgeBase(orgId, language);
      await chatbotTrainingCenterService.linkChatbotToKnowledgeBase(chatbot.id, kb.id, orgId);
      // Optimistically update local state so the tab switches immediately
      setLocalChatbot((prev) => prev ? { ...prev, knowledge_base_id: kb.id } : prev);
      void qc.invalidateQueries({ queryKey: ['chatbots-by-org', orgId] });
    },
    onSuccess: () => toast.success('Knowledge base created and linked'),
    onError: () => toast.error('Failed to create knowledge base'),
  });

  const handleChatbotSaved = (updated: Partial<ChatbotDetail>) => {
    setLocalChatbot((prev) => (prev ? { ...prev, ...updated } : prev));
    setPreviewRefreshKey((k) => k + 1);
  };

  // ── No org selected yet ────────────────────────────────────────────────────
  if (!orgId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* ── Header bar ─────────────────────────────────────────────────────── */}
      {/* <div className="flex flex-wrap items-end gap-4 border-b border-grey-100 px-6 py-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-grey-900">Training Center</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Manage knowledge, review conversations, and customize your chatbot.
          </p>
        </div>

       
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-grey-700">Chatbot</p>
          {chatbotsQuery.isLoading ? (
            <div className="flex h-8 w-48 items-center gap-2 rounded-lg border border-grey-100 bg-background px-3">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading…</span>
            </div>
          ) : chatbots.length === 0 ? (
            <div className="flex h-8 w-48 items-center rounded-lg border border-grey-100 bg-background px-3">
              <span className="text-xs text-muted-foreground">No chatbots found</span>
            </div>
          ) : (
            <Select value={selectedChatbotId} onValueChange={setSelectedChatbotId}>
              <SelectTrigger className="h-8 w-48 border-grey-100 bg-background text-xs">
                <SelectValue placeholder="Select chatbot" />
              </SelectTrigger>
              <SelectContent>
                {chatbots.map((cb) => (
                  <SelectItem key={cb.id} value={cb.id}>{cb.chatbot_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div> */}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {!chatbot && !chatbotsQuery.isLoading && (
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="border-grey-100 shadow-sm">
            <CardContent className="px-12 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {chatbots.length === 0
                  ? 'No chatbots found for this organization.'
                  : 'Select a chatbot above to manage its training center.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Split panel ─────────────────────────────────────────────────────── */}
      {chatbot && (
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left: chatbot preview */}
          <div className="hidden lg:flex w-110 relative flex-col items-center border-r border-grey-100 bg-muted/20 p-6 overflow-y-auto">
            <ChatbotPreview chatbot={chatbot} orgId={orgId} refreshKey={previewRefreshKey} />
          </div>

          {/* Right: editing panel */}
          <div className="flex bg-card flex-1 flex-col min-h-0 overflow-hidden">
            {/* No KB warning */}
            {!kbId && (
              <div className="border-b border-amber-200 bg-amber-50/40 px-5 py-2">
                <p className="text-xs text-amber-800">
                  This chatbot has no linked knowledge base — go to the <span className="font-semibold">Knowledge</span> tab to create one.
                </p>
              </div>
            )}

            {/* Tab switcher */}
            <div className="flex items-center gap-0.5 overflow-x-auto border-b border-grey-100 px-4 py-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
              {TABS.map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setActiveTab(value)}
                  className={[
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150',
                    activeTab === value
                      ? 'bg-primary/10 font-semibold text-primary'
                      : 'text-grey-700 hover:bg-muted hover:text-grey-900',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
              {activeTab === 'knowledge' && (
                kbId
                  ? <KnowledgeTab kbId={kbId} orgId={orgId} onCreateKb={() => setCreateKbOpen(true)} />
                  : <NoKbEmptyState onCreateClick={() => setCreateKbOpen(true)} />
              )}
              {activeTab === 'unanswered' && (
                kbId
                  ? <UnansweredTab kbId={kbId} orgId={orgId} />
                  : <NoKbEmptyState onCreateClick={() => setCreateKbOpen(true)} />
              )}
              {activeTab === 'chat-logs' && (
                <ChatLogsTab chatbotId={chatbot.id} orgId={orgId} />
              )}
              {activeTab === 'display' && (
                <DisplayTab chatbot={chatbot} orgId={orgId} onSaved={handleChatbotSaved} />
              )}
              {activeTab === 'behavior' && (
                <BehaviorTab chatbot={chatbot} onSaved={handleChatbotSaved} />
              )}
            </div>
          </div>
        </div>
      )}

      <CreateKnowledgeBaseDialog
        open={createKbOpen}
        onOpenChange={setCreateKbOpen}
        onCreate={(language) => createKbMutation.mutateAsync(language)}
      />
    </div>
  );
}

// ── Helper component ───────────────────────────────────────────────────────────

function NoKbEmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-grey-100 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Database className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-grey-900">No knowledge base linked</p>
        <p className="text-xs text-muted-foreground">
          Create a knowledge base to start training this chatbot with documents and URLs.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateClick}
        className="rounded-lg bg-grey-900 px-4 py-2 text-sm font-medium text-white hover:bg-grey-800"
      >
        Create Knowledge Base
      </button>
    </div>
  );
}
