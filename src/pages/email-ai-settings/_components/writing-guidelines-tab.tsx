import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  FileText,
  Languages,
  Loader2,
  Mail,
  Maximize2,
  Save,
  Settings2,
  Sparkles,
  Type,
  User,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import { aiEmailSettingsService, type PromptHistoryEntry } from '@/services/aiEmailSettings/aiEmailSettings';

// ── Constants ──────────────────────────────────────────────────────────────────

const FONT_FAMILIES = [
  { value: 'Aptos, sans-serif', label: 'Aptos' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Calibri, sans-serif', label: 'Calibri' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
  { value: 'Helvetica, sans-serif', label: 'Helvetica' },
];

const FONT_SIZES = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '16pt', '18pt', '20pt', '24pt'];

// ── Truncated preview helper ───────────────────────────────────────────────────

function preview(text: string, max = 70): string {
  if (!text) return 'Not configured';
  return text.length > max ? text.slice(0, max) + '…' : text;
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface WritingGuidelinesTabProps {
  orgId: string;
}

type ExpandedField = {
  title: string;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  placeholder?: string;
};

export function WritingGuidelinesTab({ orgId }: WritingGuidelinesTabProps) {
  const qc = useQueryClient();

  // ── Queries ────────────────────────────────────────────────────────────────
  const settingsQuery = useQuery({
    queryKey: ['ai-email-settings', orgId],
    queryFn: () => aiEmailSettingsService.getSettings(orgId),
    enabled: !!orgId,
  });

  const mailboxesQuery = useQuery({
    queryKey: ['ai-email-mailboxes', orgId],
    queryFn: () => aiEmailSettingsService.getMailboxes(orgId),
    enabled: !!orgId,
  });

  const settings = settingsQuery.data;
  const mailboxes = mailboxesQuery.data ?? [];

  // ── Org-level form state ───────────────────────────────────────────────────
  const [roleObjective, setRoleObjective] = useState('');
  const [languageSelection, setLanguageSelection] = useState('');
  const [hotelPolicies, setHotelPolicies] = useState('');
  const [fontFamily, setFontFamily] = useState('Aptos, sans-serif');
  const [fontSize, setFontSize] = useState('12pt');
  const [fontColor, setFontColor] = useState('#000000');
  const [isDirty, setIsDirty] = useState(false);

  // ── Mailbox-level state ────────────────────────────────────────────────────
  const [selectedMailbox, setSelectedMailbox] = useState('');
  const [mbLearnedStyle, setMbLearnedStyle] = useState('');
  const [mbOverrides, setMbOverrides] = useState('');
  const [mbOverridesDirty, setMbOverridesDirty] = useState(false);

  // ── History / dialog state ─────────────────────────────────────────────────
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<number | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedField, setExpandedField] = useState<ExpandedField | null>(null);

  // ── Mailbox settings query ─────────────────────────────────────────────────
  const mbSettingsQuery = useQuery({
    queryKey: ['mailbox-settings', orgId, selectedMailbox],
    queryFn: () => aiEmailSettingsService.getMailboxSettings(orgId, selectedMailbox),
    enabled: !!selectedMailbox && !!orgId,
  });

  // ── Prompt history query (fetched only when history dialog is open) ────────
  const historyQuery = useQuery({
    queryKey: ['ai-email-prompt-history', orgId],
    queryFn: () => aiEmailSettingsService.getPromptHistory(orgId),
    enabled: !!orgId && isHistoryOpen,
  });

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (settings) {
      setRoleObjective(settings.prompt_parts?.role_objective ?? '');
      setLanguageSelection(settings.prompt_parts?.language_selection ?? '');
      setHotelPolicies(settings.prompt_parts?.hotel_policies ?? '');
      setFontFamily(settings.insert_font_family ?? 'Aptos, sans-serif');
      setFontSize(settings.insert_font_size ?? '12pt');
      setFontColor(settings.insert_font_color ?? '#000000');
      setIsDirty(false);
    }
  }, [settings]);

  // Auto-select first mailbox
  useEffect(() => {
    if (mailboxes.length > 0 && !selectedMailbox) {
      setSelectedMailbox(mailboxes[0]!.mailbox);
    }
  }, [mailboxes, selectedMailbox]);

  // Sync mailbox prompt parts
  useEffect(() => {
    if (!selectedMailbox) {
      setMbLearnedStyle('');
      setMbOverrides('');
      setMbOverridesDirty(false);
      return;
    }
    const parts = mbSettingsQuery.data?.mailbox_prompt_parts;
    if (parts !== undefined) {
      setMbLearnedStyle(parts?.learned_style ?? '');
      setMbOverrides(parts?.overrides ?? '');
      setMbOverridesDirty(false);
    }
  }, [mbSettingsQuery.data, selectedMailbox]);

  const markDirty = useCallback(() => setIsDirty(true), []);

  // ── Compose preview helper ─────────────────────────────────────────────────
  const composePreview = useCallback((): string => {
    const sections: string[] = [];
    if (roleObjective.trim()) sections.push(`# ROLE AND OBJECTIVE\n${roleObjective.trim()}`);
    if (languageSelection.trim()) sections.push(`# LANGUAGE SELECTION\n${languageSelection.trim()}`);
    if (hotelPolicies.trim()) sections.push(`# HOTEL POLICIES\n${hotelPolicies.trim()}`);
    if (selectedMailbox && mbLearnedStyle.trim())
      sections.push(`# STYLE LEARNED FROM HOTEL EMAILS\n${mbLearnedStyle.trim()}`);
    if (selectedMailbox && mbOverrides.trim()) sections.push(`# OVERRIDES\n${mbOverrides.trim()}`);
    return sections.join('\n\n');
  }, [roleObjective, languageSelection, hotelPolicies, selectedMailbox, mbLearnedStyle, mbOverrides]);

  const handleCopyComposed = () => {
    const text = composePreview() || '(No content yet)';
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  // ── Mutations ──────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.updateSettings({
        organization_id: orgId,
        email_settings_id: settings?.email_settings_id ?? null,
        prompt_parts: {
          role_objective: roleObjective || null,
          language_selection: languageSelection || null,
          hotel_policies: hotelPolicies || null,
          overrides: settings?.prompt_parts?.overrides ?? null,
          learned_style: settings?.prompt_parts?.learned_style ?? null,
        },
        insert_font_family: fontFamily || null,
        insert_font_size: fontSize || null,
        insert_font_color: fontColor || null,
        examples: settings?.examples ?? [],
      }),
    onSuccess: () => {
      toast.success('Writing guidelines saved');
      setIsDirty(false);
      void qc.invalidateQueries({ queryKey: ['ai-email-settings', orgId] });
      void qc.invalidateQueries({ queryKey: ['ai-email-prompt-history', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveMbMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.updateMailboxSettings({
        organization_id: orgId,
        mailbox_email: selectedMailbox,
        mailbox_prompt_parts: {
          overrides: mbOverrides || null,
          learned_style: mbSettingsQuery.data?.mailbox_prompt_parts?.learned_style ?? null,
        },
      }),
    onSuccess: () => {
      toast.success(`Special instructions saved for ${selectedMailbox}`);
      setMbOverridesDirty(false);
      void qc.invalidateQueries({ queryKey: ['mailbox-settings', orgId, selectedMailbox] });
      void qc.invalidateQueries({ queryKey: ['ai-email-prompt-history', orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const snapshotMutation = useMutation({
    mutationFn: (version: number) => aiEmailSettingsService.getPromptSnapshot(orgId, version),
    onError: (err: Error) => toast.error(err.message),
  });

  const revertMutation = useMutation({
    mutationFn: (version: number) => aiEmailSettingsService.revertPrompt(orgId, version),
    onSuccess: () => {
      toast.success(`Reverted to v${previewVersion}`);
      void qc.invalidateQueries({ queryKey: ['ai-email-settings', orgId] });
      void qc.invalidateQueries({ queryKey: ['ai-email-prompt-history', orgId] });
      setIsHistoryOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (settingsQuery.isLoading) {
    return (
      <div className=" space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">Failed to load email settings.</p>
        <Button size="sm" variant="outline" onClick={() => void settingsQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const promptHistory = historyQuery.data;

  return (
    <div className=" space-y-5">

      {/* ── Accordion: Role / Language / Policies ─────────────────────────── */}
      <Accordion type="multiple" className="space-y-3 p-4">

        {/* Role & Objective */}
        <AccordionItem
          value="role"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Role &amp; Objective</p>
                <p className="truncate text-xs text-muted-foreground">{preview(roleObjective)}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <Textarea
              value={roleObjective}
              onChange={(e) => { setRoleObjective(e.target.value); markDirty(); }}
              rows={5}
              placeholder="Describe the AI assistant's role and objectives…"
              className="resize-y text-xs"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Language Rules */}
        <AccordionItem
          value="language"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
                <Languages className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Language Rules</p>
                <p className="truncate text-xs text-muted-foreground">{preview(languageSelection)}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <Textarea
              value={languageSelection}
              onChange={(e) => { setLanguageSelection(e.target.value); markDirty(); }}
              rows={4}
              placeholder="Specify language style, tone, and communication rules…"
              className="resize-y text-xs"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Hotel Policies */}
        <AccordionItem
          value="policies"
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        >
          <AccordionTrigger className="px-4 py-3 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Hotel Policies</p>
                <p className="truncate text-xs text-muted-foreground">{preview(hotelPolicies)}</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 pt-3">
            <Textarea
              value={hotelPolicies}
              onChange={(e) => { setHotelPolicies(e.target.value); markDirty(); }}
              rows={6}
              placeholder="Enter hotel policies, check-in/check-out times, cancellation policy, etc.…"
              className="resize-y text-xs"
            />
          </AccordionContent>
        </AccordionItem>

      </Accordion>

      {/* ── Email Formatting ──────────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
              <Type className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Email Formatting</CardTitle>
              <CardDescription className="text-xs">
                Default font settings applied when inserting AI-generated text.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Font Family */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Font Family</Label>
              <Select
                value={fontFamily}
                onValueChange={(v) => { setFontFamily(v); markDirty(); }}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map((f) => (
                    <SelectItem key={f.value} value={f.value} className="text-xs">
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Size */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Font Size</Label>
              <Select
                value={fontSize}
                onValueChange={(v) => { setFontSize(v); markDirty(); }}
              >
                <SelectTrigger className=" w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_SIZES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Font Color */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">Font Color</Label>
              <div className="flex h-8 items-center gap-2">
                {/* Swatch — clicking opens the native browser color picker */}
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md border border-border shadow-sm">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => { setFontColor(e.target.value); markDirty(); }}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="h-full w-full" style={{ backgroundColor: fontColor }} />
                </div>
                {/* Hex text input */}
                <Input
                  value={fontColor}
                  onChange={(e) => { setFontColor(e.target.value); markDirty(); }}
                  className="h-8 flex-1 font-mono text-xs"
                  placeholder="#000000"
                  maxLength={7}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Mailbox-specific sections ─────────────────────────────────────────── */}
      <div className="space-y-4 border-t border-border pt-5">

        {/* Mailbox selector row */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-0.5">
            <Label className="text-xs font-medium text-foreground">Mailbox</Label>
            <p className="text-xs text-muted-foreground">Learned Style is unique per mailbox</p>
          </div>
          {mailboxesQuery.isLoading ? (
            <Skeleton className="h-8 w-65" />
          ) : (
            <Select
              value={selectedMailbox}
              onValueChange={(v) => {
                setSelectedMailbox(v);
                setMbOverridesDirty(false);
              }}
            >
              <SelectTrigger className="w-65 text-xs">
                <SelectValue placeholder="Select a mailbox" />
              </SelectTrigger>
              <SelectContent>
                {mailboxes.map((mb) => (
                  <SelectItem key={mb.mailbox} value={mb.mailbox} className="text-xs">
                    {mb.mailbox}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Learned Style card — only shown when a mailbox is selected */}
        {selectedMailbox && (
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Learned Style</CardTitle>
                    <CardDescription className="text-xs">
                      Auto-generated style for {selectedMailbox}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setExpandedField({
                      title: `Learned Style (${selectedMailbox})`,
                      value:
                        mbLearnedStyle ||
                        'Run learning from the Self Learning tab to generate style patterns.',
                      readOnly: true,
                    })
                  }
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {mbSettingsQuery.isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <Accordion type="single" collapsible>
                  <AccordionItem value="preview" className="border-none">
                    <AccordionTrigger className="">
                      {mbLearnedStyle ? 'View learned patterns' : 'No learned style yet'}
                    </AccordionTrigger>
                    <AccordionContent>
                      <Textarea
                        value={
                          mbLearnedStyle ||
                          'Run learning from the Self Learning tab to generate style patterns.'
                        }
                        disabled
                        rows={6}
                        className="resize-none text-xs"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </CardContent>
          </Card>
        )}

        {/* Special Instructions card — only shown when a mailbox is selected */}
        {selectedMailbox && (
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 ring-1 ring-border">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Special Instructions</CardTitle>
                    <CardDescription className="text-xs">
                      Overrides for {selectedMailbox}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    setExpandedField({
                      title: `Special Instructions (${selectedMailbox})`,
                      value: mbOverrides,
                      onChange: (v) => {
                        setMbOverrides(v);
                        setMbOverridesDirty(true);
                      },
                      placeholder:
                        'Example:\n- Always mention breakfast is included this month\n- For groups over 10, ask for a contact phone number',
                    })
                  }
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {mbSettingsQuery.isLoading ? (
                <Skeleton className="h-24 w-full" />
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Time-bound notes, campaigns, or special instructions specific to this mailbox.
                  </p>
                  <Textarea
                    placeholder={
                      'Example:\n- Always mention breakfast is included this month\n- For groups over 10, ask for a contact phone number'
                    }
                    value={mbOverrides}
                    onChange={(e) => {
                      setMbOverrides(e.target.value);
                      setMbOverridesDirty(true);
                    }}
                    rows={4}
                    className="resize-y text-xs"
                  />
                  <Button
                    size="sm"
                    disabled={!mbOverridesDirty || saveMbMutation.isPending}
                    onClick={() => saveMbMutation.mutate()}
                    className="gap-1.5"
                  >
                    {saveMbMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Complete Email Guide card — always shown */}
        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Complete Email Guide</CardTitle>
                <CardDescription className="text-xs">Full prompt sent to the AI</CardDescription>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyComposed}
                  className="h-7 gap-1.5 text-xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPreviewVersion(null);
                    setPreviewText(null);
                    setIsHistoryOpen(true);
                  }}
                  className="h-7 text-xs"
                >
                  History
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    setExpandedField({
                      title: 'Complete Email Guide',
                      value: composePreview() || '(No content yet)',
                      readOnly: true,
                    })
                  }
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-0">
            <Accordion type="single" collapsible>
              <AccordionItem value="preview" className="border-none">
                <AccordionTrigger className="">
                  View complete guide
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    value={composePreview() || '(No content yet)'}
                    disabled
                    rows={10}
                    className="resize-none text-xs"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

      </div>

      {/* ── Sticky save bar ───────────────────────────────────────────────────── */}
      {isDirty && (
        <div className="sticky bottom-4 flex items-center gap-4 rounded-xl border border-border/70 bg-background/90 p-4 shadow-lg shadow-black/5 backdrop-blur-md">
          <p className="flex-1 text-sm text-muted-foreground">You have unsaved changes</p>
          <Button
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="gap-1.5"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save Changes
          </Button>
        </div>
      )}

      {/* ── Prompt History Dialog ─────────────────────────────────────────────── */}
      <Dialog
        open={isHistoryOpen}
        onOpenChange={(open) => {
          setIsHistoryOpen(open);
          if (!open) {
            setPreviewVersion(null);
            setPreviewText(null);
          }
        }}
      >
        <DialogContent className="flex h-[80vh] max-w-225 flex-col p-0 sm:max-w-225">
          <DialogHeader className="shrink-0 border-b px-6 py-4">
            <DialogTitle>Prompt History</DialogTitle>
          </DialogHeader>
          <div className="flex min-h-0 flex-1">
            {/* Left panel: version list */}
            <div className="flex w-70 shrink-0 flex-col border-r">
              <div className="border-b bg-muted/30 px-4 py-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Versions
                </p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {historyQuery.isLoading ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : !promptHistory?.history?.length ? (
                  <div className="p-4 text-sm text-muted-foreground">No history yet.</div>
                ) : (
                  <div className="py-1">
                    {promptHistory.history.map((h: PromptHistoryEntry) => {
                      const isCurrentVersion =
                        promptHistory.current_prompt_version != null &&
                        h.version === promptHistory.current_prompt_version;
                      const isSelected = previewVersion === h.version;
                      return (
                        <button
                          key={h.version}
                          type="button"
                          onClick={async () => {
                            try {
                              const resp = await snapshotMutation.mutateAsync(h.version);
                              setPreviewVersion(h.version);
                              setPreviewText(resp?.prompt || '(empty prompt)');
                            } catch {
                              // error handled in mutation
                            }
                          }}
                          className={cn(
                            'w-full border-b px-4 py-3 text-left transition-colors hover:bg-muted/50',
                            isSelected ? 'border-l-2 border-l-primary bg-primary/10' : '',
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">v{h.version}</span>
                            {isCurrentVersion && (
                              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 text-xs text-muted-foreground">
                            {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                          </div>
                          {h.action && (
                            <div className="mt-0.5 truncate text-xs text-muted-foreground/70">
                              {h.action.replace(/_/g, ' ')}
                            </div>
                          )}
                          {h.mailbox_email && (
                            <Badge
                              variant="secondary"
                              className="mt-1 h-5 max-w-full truncate text-[10px]"
                            >
                              <Mail className="mr-1 h-3 w-3 shrink-0" />
                              {h.mailbox_email}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel: preview */}
            <div className="flex min-w-0 flex-1 flex-col">
              {previewText ? (
                <>
                  <div className="flex shrink-0 items-center justify-between border-b bg-muted/30 px-4 py-2">
                    <p className="text-sm font-medium">Previewing v{previewVersion}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Read-only preview</span>
                      {(() => {
                        const isCurrentVersion =
                          promptHistory?.current_prompt_version != null &&
                          previewVersion === promptHistory.current_prompt_version;
                        return (
                          <Button
                            size="sm"
                            disabled={!!isCurrentVersion || revertMutation.isPending}
                            onClick={() => {
                              if (previewVersion !== null) revertMutation.mutate(previewVersion);
                            }}
                          >
                            {revertMutation.isPending && (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            )}
                            {isCurrentVersion ? 'Already Current' : 'Revert to This Version'}
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <pre className="h-full overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/30 p-4 font-mono text-sm">
                      {previewText}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-sm">Select a version to preview</p>
                    <p className="mt-1 text-xs">
                      Click any version on the left to see its content
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Expand Text Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!expandedField} onOpenChange={(open) => !open && setExpandedField(null)}>
        <DialogContent className="flex h-[85vh] max-w-4xl flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{expandedField?.title}</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 py-4">
            <Textarea
              placeholder={expandedField?.placeholder}
              value={expandedField?.value ?? ''}
              readOnly={!expandedField?.onChange || !!expandedField.readOnly}
              onChange={(e) => {
                if (!expandedField?.onChange || expandedField.readOnly) return;
                const v = e.target.value;
                setExpandedField((prev) => (prev ? { ...prev, value: v } : prev));
              }}
              className="h-full min-h-full resize-none font-mono text-sm"
            />
          </div>
          <DialogFooter className="shrink-0">
            <Button
              onClick={() => {
                if (expandedField?.onChange && !expandedField.readOnly) {
                  expandedField.onChange(expandedField.value);
                }
                setExpandedField(null);
              }}
            >
              {expandedField?.onChange && !expandedField.readOnly ? 'Done' : 'Close'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
