import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileText, Search, Settings2, Share2, RefreshCw, MessageSquare } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { chatbotsService } from '@/services/chatbots/chatbots';
import type { AiProvider, GlobalChatbotSettings, OrgPublishedStatus } from '@/services/chatbots/chatbots';

import { OrgAutoRetrainDialog } from './_components/OrgAutoRetrainDialog';
import { OrgShareChatbotsDialog } from './_components/OrgShareChatbotsDialog';
import { OrgCustomToolPromptDialog } from './_components/OrgCustomToolPromptDialog';
import { OrgSystemPromptDialog } from './_components/OrgSystemPromptDialog';
import { OrgIndexResetDialog } from './_components/OrgIndexResetDialog';

// ─── ProviderOption ───────────────────────────────────────────────────────────

interface ProviderOptionProps {
  id: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  saving?: boolean;
}

function ProviderOption({ id, title, description, selected, onSelect, disabled, saving }: ProviderOptionProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-desc`}
      aria-disabled={disabled}
      tabIndex={0}
      className={cn(
        'rounded-lg border p-4 transition-colors cursor-pointer',
        disabled && 'opacity-60 pointer-events-none',
        selected ? 'border-primary ring-2 ring-primary/30' : 'hover:border-muted-foreground/40',
      )}
      onClick={() => !disabled && onSelect()}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div id={`${id}-title`} className="text-base font-medium">{title}</div>
          <div id={`${id}-desc`} className="text-sm text-muted-foreground mt-1">{description}</div>
        </div>
        {selected && <Badge variant="default">{saving ? 'Saving…' : 'Active'}</Badge>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ChatbotsPage() {
  const qc = useQueryClient();

  const [provider, setProvider] = useState<AiProvider>('azure');
  const [pendingProvider, setPendingProvider] = useState<AiProvider | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [confirmHideOpen, setConfirmHideOpen] = useState(false);
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  // Dialog state
  const [settingsOrgId, setSettingsOrgId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [shareOrgId, setShareOrgId] = useState<string | null>(null);
  const [shareOrgName, setShareOrgName] = useState<string | null>(null);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [promptOrgId, setPromptOrgId] = useState<string | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [systemPromptOrgId, setSystemPromptOrgId] = useState<string | null>(null);
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [resetOrgId, setResetOrgId] = useState<string | null>(null);
  const [resetOrgName, setResetOrgName] = useState<string | null>(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // ── Queries ──

  const { data: globalSettings, refetch: refetchGlobal } = useQuery<GlobalChatbotSettings>({
    queryKey: ['globalChatbotSettings'],
    queryFn: chatbotsService.getGlobalSettings,
    staleTime: 0,
  });

  const {
    data: orgPublished = [],
    isLoading: isOrgPublishedLoading,
    error: orgPublishedError,
  } = useQuery<OrgPublishedStatus[]>({
    queryKey: ['orgsChatbotsPublishedStatus'],
    queryFn: chatbotsService.listOrgPublishedStatus,
    staleTime: 0,
  });

  // ── Mutations ──

  const { mutateAsync: updateProvider, isPending: isProviderPending } = useMutation({
    mutationFn: chatbotsService.updateProvider,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['globalChatbotSettings'] }),
  });

  const { mutateAsync: updateVisibility, isPending: isVisibilityPending } = useMutation({
    mutationFn: chatbotsService.updateVisibility,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['globalChatbotSettings'] }),
  });

  const { mutateAsync: setOrgPublishedMutation, isPending: isSetOrgPublishedPending } = useMutation({
    mutationFn: async (payload: { organization_id: string; published: boolean }) =>
      chatbotsService.setOrgPublishedStatus(payload.organization_id, payload.published),
    onMutate: async ({ organization_id, published }) => {
      await qc.cancelQueries({ queryKey: ['orgsChatbotsPublishedStatus'] });
      const previous = qc.getQueryData<OrgPublishedStatus[]>(['orgsChatbotsPublishedStatus']);
      if (previous) {
        qc.setQueryData(['orgsChatbotsPublishedStatus'], previous.map((o) =>
          o.organization_id === organization_id ? { ...o, published } : o
        ));
      }
      return { previous };
    },
    onError: (_e, _v, ctx: any) => {
      if (ctx?.previous) qc.setQueryData(['orgsChatbotsPublishedStatus'], ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['orgsChatbotsPublishedStatus'], refetchType: 'active' }),
  });

  // ── Sync server state ──

  useEffect(() => {
    if (globalSettings?.llm_provider) setProvider(globalSettings.llm_provider);
    if (typeof globalSettings?.visible === 'boolean') setVisible(globalSettings.visible);
  }, [globalSettings?.llm_provider, globalSettings?.visible]);

  const orgsFiltered = useMemo(
    () =>
      [...orgPublished]
        .filter((o) => o.organization_name.toLowerCase().includes(orgSearchTerm.toLowerCase()))
        .sort((a, b) => a.organization_name.localeCompare(b.organization_name)),
    [orgPublished, orgSearchTerm],
  );

  const publishedCount = useMemo(() => orgPublished.filter((o) => o.published).length, [orgPublished]);

  // ── Handlers ──

  const requestChange = (newProvider: AiProvider) => {
    if (newProvider === provider || isProviderPending) return;
    setPendingProvider(newProvider);
    setConfirmOpen(true);
  };

  const confirmChange = async () => {
    if (!pendingProvider) return;
    try {
      await updateProvider(pendingProvider);
      await refetchGlobal();
      setProvider(pendingProvider);
      toast.success(`AI provider updated to ${pendingProvider === 'openai' ? 'OpenAI' : 'Azure OpenAI'}.`);
    } catch {
      toast.error('Failed to update AI provider.');
    } finally {
      setConfirmOpen(false);
      setPendingProvider(null);
    }
  };

  const handleVisibilitySwitch = async (checked: boolean) => {
    if (!checked) { setConfirmHideOpen(true); return; }
    try {
      await updateVisibility(true);
      await refetchGlobal();
      setVisible(true);
      toast.success('All chatbots are now visible.');
    } catch {
      toast.error('Failed to update visibility.');
    }
  };

  const confirmHideAll = async () => {
    try {
      await updateVisibility(false);
      await refetchGlobal();
      setVisible(false);
      toast.success('All chatbots are now hidden.');
    } catch {
      toast.error('Failed to hide all chatbots.');
    } finally {
      setConfirmHideOpen(false);
    }
  };

  const handleToggleOrgPublished = async (orgId: string, enabled: boolean) => {
    try {
      await setOrgPublishedMutation({ organization_id: orgId, published: enabled });
      toast.success(`Organization ${enabled ? 'published' : 'unpublished'} successfully.`);
    } catch {
      toast.error('Failed to update organization published status.');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Chatbots</h2>
        <p className="text-sm text-muted-foreground">
          Configure global chatbot settings and manage per-organization publishing.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Global settings */}
        <Card className="h-full">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Global chatbot settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="mb-3">
                <h3 className="text-base font-medium">AI Provider</h3>
                <p className="text-sm text-muted-foreground">
                  Choose which provider powers your organization's chatbots.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" role="radiogroup" aria-label="AI provider">
                <ProviderOption
                  id="provider-openai"
                  title="OpenAI"
                  description="Use OpenAI models via the OpenAI API."
                  selected={provider === 'openai'}
                  onSelect={() => requestChange('openai')}
                  disabled={isProviderPending}
                  saving={isProviderPending && pendingProvider === 'openai'}
                />
                <ProviderOption
                  id="provider-azure"
                  title="Azure OpenAI"
                  description="Use OpenAI models hosted on Azure."
                  selected={provider === 'azure'}
                  onSelect={() => requestChange('azure')}
                  disabled={isProviderPending}
                  saving={isProviderPending && pendingProvider === 'azure'}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium">Visibility</h3>
                  <p className="text-sm text-muted-foreground">Hide or show chatbots globally across all sites.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={visible ? 'default' : 'secondary'}>{visible ? 'Visible' : 'Hidden'}</Badge>
                  <Switch checked={visible} disabled={isVisibilityPending} onCheckedChange={handleVisibilitySwitch} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-org published */}
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Published per organization</CardTitle>
              <Badge variant="outline" className="text-xs">{publishedCount}/{orgPublished.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={orgSearchTerm}
                onChange={(e) => setOrgSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="rounded-md border">
              <ScrollArea className="h-64 sm:h-72 md:h-80 lg:h-[28rem]">
                <div className="p-2 space-y-1">
                  {orgPublishedError ? (
                    <p className="text-sm text-red-600 p-2">Failed to load organizations.</p>
                  ) : isOrgPublishedLoading ? (
                    <p className="text-sm text-muted-foreground p-2">Loading organizations…</p>
                  ) : orgsFiltered.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No organizations found.</p>
                  ) : (
                    orgsFiltered.map((org) => (
                      <div
                        key={org.organization_id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50"
                      >
                        <span className="text-sm font-medium truncate mr-2">{org.organization_name}</span>
                        <div className="flex items-center gap-1.5">
                          <ActionIconButton
                            label="Index status & reset"
                            onClick={() => { setResetOrgId(org.organization_id); setResetOrgName(org.organization_name); setIsResetOpen(true); }}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="System prompt"
                            onClick={() => { setSystemPromptOrgId(org.organization_id); setIsSystemPromptOpen(true); }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="Custom tool prompt"
                            onClick={() => { setPromptOrgId(org.organization_id); setIsPromptOpen(true); }}
                          >
                            <FileText className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="Share chatbots"
                            onClick={() => { setShareOrgId(org.organization_id); setShareOrgName(org.organization_name); setIsShareOpen(true); }}
                          >
                            <Share2 className="h-4 w-4" />
                          </ActionIconButton>
                          <ActionIconButton
                            label="Auto re-train settings"
                            onClick={() => { setSettingsOrgId(org.organization_id); setIsSettingsOpen(true); }}
                          >
                            <Settings2 className="h-4 w-4" />
                          </ActionIconButton>
                          <Switch
                            checked={org.published}
                            disabled={isSetOrgPublishedPending}
                            onCheckedChange={(enabled) => handleToggleOrgPublished(org.organization_id, enabled)}
                            className="shrink-0"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      {settingsOrgId && (
        <OrgAutoRetrainDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} organizationId={settingsOrgId} />
      )}
      {shareOrgId && (
        <OrgShareChatbotsDialog open={isShareOpen} onOpenChange={setIsShareOpen} organizationId={shareOrgId} organizationName={shareOrgName ?? undefined} />
      )}
      {promptOrgId && (
        <OrgCustomToolPromptDialog open={isPromptOpen} onOpenChange={setIsPromptOpen} organizationId={promptOrgId} />
      )}
      {systemPromptOrgId && (
        <OrgSystemPromptDialog open={isSystemPromptOpen} onOpenChange={setIsSystemPromptOpen} organizationId={systemPromptOrgId} />
      )}
      {resetOrgId && resetOrgName && (
        <OrgIndexResetDialog open={isResetOpen} onOpenChange={setIsResetOpen} organizationId={resetOrgId} organizationName={resetOrgName} />
      )}

      {/* Confirm provider change */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change AI model for all chatbots?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to change the AI provider for all chatbots. This affects how responses are generated. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProviderPending}>No, keep current</AlertDialogCancel>
            <AlertDialogAction onClick={confirmChange} disabled={isProviderPending}>
              {isProviderPending ? 'Saving…' : 'Yes, change provider'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm hide all */}
      <AlertDialog open={confirmHideOpen} onOpenChange={setConfirmHideOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hide all chatbots?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide chatbots from all sites and pages until you re-enable visibility. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVisibilityPending}>No, keep visible</AlertDialogCancel>
            <AlertDialogAction onClick={confirmHideAll} disabled={isVisibilityPending}>
              {isVisibilityPending ? 'Hiding…' : 'Yes, hide all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-muted transition-colors"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
