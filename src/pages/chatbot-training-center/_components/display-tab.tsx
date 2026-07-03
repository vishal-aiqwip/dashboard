import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Laptop,
  Loader2,
  MessageSquare,
  Move,
  Palette,
  Smartphone,
  Type as TextIcon,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { axiosApi } from '@/lib/axios';
import type { ChatbotDetail } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

// ── Constants ─────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#F5F5F5', '#E5E5E5', '#D1D5DB', '#9CA3AF', '#6B7280', '#374151',
  '#1F2937', '#2563EB', '#0D9488', '#059669', '#CA8A04', '#DC2626', '#7C3AED', '#EC4899',
];

const RECENTS_KEY = 'altek.display.colorPicker.recents';
const MAX_RECENTS = 8;

const FONT_OPTIONS = [
  { value: 'Arial, Helvetica, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", label: 'Segoe UI' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: "'Trebuchet MS', Helvetica, sans-serif", label: 'Trebuchet MS' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: "'Courier New', Courier, monospace", label: 'Courier New' },
  { value: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Inter' },
  { value: 'Roboto, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Roboto' },
  { value: "'Open Sans', system-ui, -apple-system, Segoe UI, sans-serif", label: 'Open Sans' },
  { value: 'Montserrat, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Montserrat' },
  { value: 'Lato, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Lato' },
  { value: 'Poppins, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Poppins' },
  { value: 'Raleway, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Raleway' },
  { value: 'Nunito, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Nunito' },
  { value: 'Rubik, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Rubik' },
  { value: "'DM Sans', system-ui, -apple-system, Segoe UI, sans-serif", label: 'DM Sans' },
  { value: "'Work Sans', system-ui, -apple-system, Segoe UI, sans-serif", label: 'Work Sans' },
  { value: 'Ubuntu, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Ubuntu' },
  { value: 'Oswald, system-ui, -apple-system, Segoe UI, sans-serif', label: 'Oswald' },
  { value: "'Playfair Display', Georgia, serif", label: 'Playfair Display' },
];

const FONT_SIZE_HEADER = Array.from({ length: 12 }, (_, i) => ({
  value: `${10 + i * 2}px`, label: `${10 + i * 2}px`,
}));

const FONT_SIZE_CHAT = Array.from({ length: 7 }, (_, i) => ({
  value: `${10 + i * 2}px`, label: `${10 + i * 2}px`,
}));

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
];

// ── Color picker helpers ───────────────────────────────────────────────────────

function normalizeHex(raw: string): string | null {
  const s = String(raw ?? '').trim().replace(/^#/, '').replace(/[^0-9A-Fa-f]/g, '');
  if (!s) return null;
  let h = s;
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  else if (h.length < 6) h = h.padEnd(6, '0').slice(0, 6);
  else h = h.slice(0, 6);
  return `#${h.toUpperCase()}`;
}

function readRecents(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_KEY);
    return raw ? (JSON.parse(raw) as string[]).slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
}

function addRecent(hex: string): void {
  try {
    const n = normalizeHex(hex);
    if (!n) return;
    const prev = readRecents().filter((h) => h.toLowerCase() !== n.toLowerCase());
    localStorage.setItem(RECENTS_KEY, JSON.stringify([n, ...prev].slice(0, MAX_RECENTS)));
  } catch { /* quota / private mode */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisplayTabProps {
  chatbot: ChatbotDetail;
  orgId: string;
  onSaved: (updated: Partial<ChatbotDetail>) => void;
}

type FormValues = {
  c_header_bg: string;
  c_header_text: string;
  c_bot_bg: string;
  c_bot_text: string;
  c_user_bg: string;
  c_user_text: string;
  c_bubble_bg: string;
  c_bg: string;
  c_send_icon: string;
  c_close_icon: string;
  font_family: string;
  font_family_header: string;
  font_size_header: string;
  font_weight_header: string;
  font_size_chat: string;
  corner_style: string;
  header_text: string;
  placeholder_text: string;
  floating_message: string;
  ai_policy_message: string;
  welcome_message: string;
  prompt1: string;
  prompt2: string;
  prompt3: string;
  bubble_label_text: string;
  bubble_label_text_color: string;
  bubble_label_font_family: string;
  bubble_label_font_weight: string;
  bubble_label_font_size: string;
  bubble_shadow: boolean;
  show_on_phone: boolean;
  lp_x: number;
  lp_y: number;
  lp_d: number;
  ld_x: number;
  ld_y: number;
  ld_d: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getContrastColor(hex: string): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000000' : '#ffffff';
  } catch {
    return '#000000';
  }
}

function buildDefaults(chatbot: ChatbotDetail): FormValues {
  const cc = chatbot.color_config ?? {};
  const ln = chatbot.launcher;
  const prompts = chatbot.initial_suggested_prompts ?? [];
  return {
    c_header_bg: cc.header_bg_color ?? '#428CFD',
    c_header_text: cc.header_text_color ?? '#ffffff',
    c_bot_bg: cc.bot_bg_color ?? '#f3f4f6',
    c_bot_text: cc.bot_text_color ?? '#111827',
    c_user_bg: cc.user_bg_color ?? '#428CFD',
    c_user_text: cc.user_text_color ?? '#ffffff',
    c_bubble_bg: cc.bubble_bg_color ?? '#428CFD',
    c_bg: cc.bg_color ?? '#ffffff',
    c_send_icon: cc.send_icon_color ?? '#428CFD',
    c_close_icon: cc.close_icon_color ?? '#6b7280',
    font_family: chatbot.font_family ?? '',
    font_family_header: chatbot.font_family_header ?? '',
    font_size_header: chatbot.font_size_header ?? '24px',
    font_weight_header: chatbot.font_weight_header ?? '600',
    font_size_chat: chatbot.font_size_chat ?? '16px',
    corner_style: chatbot.corner_style ?? '12px',
    header_text: chatbot.header_text ?? '',
    placeholder_text: chatbot.placeholder_text ?? '',
    floating_message: chatbot.floating_message ?? '',
    ai_policy_message: chatbot.ai_policy_message ?? '',
    welcome_message: chatbot.welcome_message ?? '',
    prompt1: prompts[0] ?? '',
    prompt2: prompts[1] ?? '',
    prompt3: prompts[2] ?? '',
    bubble_label_text: chatbot.bubble_label_text ?? '',
    bubble_label_text_color: chatbot.bubble_label_text_color ?? '#ffffff',
    bubble_label_font_family: chatbot.bubble_label_font_family ?? '',
    bubble_label_font_weight: chatbot.bubble_label_font_weight ?? '400',
    bubble_label_font_size: chatbot.bubble_label_font_size ?? '14px',
    bubble_shadow: chatbot.bubble_shadow ?? false,
    show_on_phone: chatbot.show_on_phone !== false,
    lp_x: ln?.phone?.x_percent ?? 90,
    lp_y: ln?.phone?.y_percent ?? 90,
    lp_d: ln?.phone?.diameter_px ?? 60,
    ld_x: ln?.desktop?.x_percent ?? 90,
    ld_y: ln?.desktop?.y_percent ?? 90,
    ld_d: ln?.desktop?.diameter_px ?? 60,
  };
}

// ── ColorPickerField ───────────────────────────────────────────────────────────

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localHex, setLocalHex] = useState(value || '#ffffff');
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => { setLocalHex(value || '#ffffff'); }, [value]);
  useEffect(() => { if (open) setRecents(readRecents()); }, [open]);

  const displayHex = normalizeHex(localHex)?.slice(1) ?? '—';

  const apply = (hex: string) => {
    const n = normalizeHex(hex);
    if (!n) return;
    setLocalHex(n);
    onChange(n);
    addRecent(n);
    setRecents(readRecents());
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-grey-900">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-md border border-grey-100 bg-white px-2 text-left shadow-sm transition-colors hover:border-grey-300"
          >
            <span
              className="h-5 w-5 shrink-0 rounded-sm border border-grey-200"
              style={{ backgroundColor: localHex }}
            />
            <span className="flex-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-grey-900">
              {displayHex}
            </span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-grey-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start" sideOffset={4}>
          {/* Presets + Recents */}
          <div className="border-b border-grey-100 bg-grey-50/70 px-3 py-3 space-y-3">
            <div>
              <p className="mb-2 text-[11px] font-medium text-grey-600">Presets</p>
              <div className="grid grid-cols-8 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    className={`h-7 w-7 rounded-md border transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                      normalizeHex(localHex) === normalizeHex(c)
                        ? 'border-grey-800 shadow-sm ring-1 ring-grey-900 ring-offset-1'
                        : 'border-grey-200 hover:border-grey-400'
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => apply(c)}
                  />
                ))}
              </div>
            </div>
            {recents.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] font-medium text-grey-600">Recent</p>
                <div className="flex flex-wrap gap-1.5">
                  {recents.map((c, i) => (
                    <button
                      key={`${c}-${i}`}
                      type="button"
                      title={c}
                      className={`h-7 w-7 rounded-md border transition-transform hover:scale-110 ${
                        normalizeHex(localHex) === normalizeHex(c)
                          ? 'border-grey-800 shadow-sm ring-1 ring-grey-900 ring-offset-1'
                          : 'border-grey-200 hover:border-grey-400'
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => apply(c)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Hex + native color picker */}
          <div className="px-3 py-3">
            <div className="flex items-center gap-2">
              <label className="relative h-9 w-9 shrink-0 cursor-pointer overflow-hidden rounded-md border border-grey-200">
                <div className="absolute inset-0" style={{ backgroundColor: localHex }} />
                <input
                  type="color"
                  value={localHex}
                  onChange={(e) => apply(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
              <div className="flex flex-1 items-center gap-1.5 rounded-md border border-grey-100 px-2 py-1.5">
                <span className="shrink-0 text-[10px] font-semibold tracking-wider text-grey-500">HEX</span>
                <Input
                  value={localHex.replace(/^#/, '')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
                    setLocalHex(`#${raw}`);
                    if (raw.length === 6) apply(`#${raw}`);
                  }}
                  className="h-auto border-0 bg-transparent p-0 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
                  maxLength={6}
                  placeholder="FFFFFF"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// ── FontSelect ────────────────────────────────────────────────────────────────

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-grey-900">{label}</Label>
      <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? '' : v)}>
        <SelectTrigger className="h-9 border-grey-100">
          <SelectValue placeholder="Select font" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="_none">— Default —</SelectItem>
          {FONT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value} style={{ fontFamily: o.value }}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── OptionSelect ──────────────────────────────────────────────────────────────

function OptionSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-grey-900">{label}</Label>
      <Select value={value || ''} onValueChange={onChange}>
        <SelectTrigger className="h-9 border-grey-100">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── FilePickerField ───────────────────────────────────────────────────────────

function FilePickerField({
  label,
  previewUrl,
  onFile,
  onDelete,
  uploading,
}: {
  label: string;
  previewUrl?: string | null;
  onFile: (file: File) => void;
  onDelete: () => void;
  uploading?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-grey-900">{label}</Label>
      {previewUrl ? (
        <div className="flex items-start gap-3">
          <img
            src={previewUrl}
            alt=""
            className="h-14 max-w-35 rounded border border-grey-100 bg-muted/30 object-contain p-1"
          />
          <div className="flex flex-col gap-1">
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs"
              onClick={() => inputRef.current?.click()} disabled={uploading}>
              Change
            </Button>
            <Button type="button" variant="ghost" size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={onDelete}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-grey-200 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 disabled:opacity-50">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Upload image'}
        </button>
      )}
      <input ref={inputRef} type="file" accept=".svg,.jpg,.jpeg,.png,.webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DisplayTab({ chatbot, orgId, onSaved }: DisplayTabProps) {
  const [subTab, setSubTab] = useState<'styling' | 'text' | 'launcher'>('styling');
  const [showColorsAdv, setShowColorsAdv] = useState(false);
  const [showTypoAdv, setShowTypoAdv] = useState(false);
  const [autoContrast, setAutoContrast] = useState(false);
  const [applyFontEverywhere, setApplyFontEverywhere] = useState(false);
  const [launcherMode, setLauncherMode] = useState<'image' | 'text'>(
    chatbot.use_bubble_text ? 'text' : 'image',
  );
  const [device, setDevice] = useState<'phone' | 'desktop'>('phone');
  const [headerLogoPreview, setHeaderLogoPreview] = useState<string | null>(chatbot.header_logo ?? null);
  const [bubbleIconPreview, setBubbleIconPreview] = useState<string | null>(chatbot.bubble_icon ?? null);
  const [uploadingHeader, setUploadingHeader] = useState(false);
  const [uploadingBubble, setUploadingBubble] = useState(false);
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(chatbot.header_logo ?? null);
  const [bubbleIconUrl, setBubbleIconUrl] = useState<string | null>(chatbot.bubble_icon ?? null);
  const [headerLogoDeleted, setHeaderLogoDeleted] = useState(false);
  const [bubbleIconDeleted, setBubbleIconDeleted] = useState(false);

  const screenRef = useRef<HTMLDivElement | null>(null);
  const [screenWidth, setScreenWidth] = useState(0);

  const { register, handleSubmit, reset, control, watch, setValue, getValues, formState: { isDirty } } =
    useForm<FormValues>({ defaultValues: buildDefaults(chatbot) });

  useEffect(() => {
    reset(buildDefaults(chatbot));
    setHeaderLogoPreview(chatbot.header_logo ?? null);
    setHeaderLogoUrl(chatbot.header_logo ?? null);
    setBubbleIconPreview(chatbot.bubble_icon ?? null);
    setBubbleIconUrl(chatbot.bubble_icon ?? null);
    setHeaderLogoDeleted(false);
    setBubbleIconDeleted(false);
    setLauncherMode(chatbot.use_bubble_text ? 'text' : 'image');
  }, [chatbot, reset]);

  // ── Live preview ────────────────────────────────────────────────────────────
  // Keep a ref with the latest "side-state" so the stable subscription closure
  // never goes stale without needing to re-subscribe on every render.
  const previewCtxRef = useRef({ headerLogoPreview, bubbleIconPreview, launcherMode });
  useEffect(() => {
    previewCtxRef.current = { headerLogoPreview, bubbleIconPreview, launcherMode };
  });

  const sendPreviewMsg = useCallback((values: Partial<FormValues>) => {
    try {
      const iframe = document.querySelector<HTMLIFrameElement>('iframe[title="Chatbot Preview"]');
      if (!iframe?.contentWindow) return;
      const { headerLogoPreview: logo, bubbleIconPreview: bubble, launcherMode: lm } =
        previewCtxRef.current;
      const prompts = [values.prompt1, values.prompt2, values.prompt3].filter(
        (p): p is string => !!p,
      );
      // Config must match the TChatBot snake_case shape the widget expects,
      // with colors nested inside color_config (not flat camelCase).
      const config = {
        welcome_message: values.welcome_message ?? '',
        font_family_header: values.font_family_header || undefined,
        floating_message: values.floating_message ?? '',
        placeholder_text: values.placeholder_text ?? '',
        font_size_header: values.font_size_header ?? '24px',
        font_weight_header: values.font_weight_header ?? '600',
        chatbot_name: values.header_text ?? '',
        header_text: values.header_text ?? '',
        font_size_chat: values.font_size_chat ?? '16px',
        initial_suggested_prompts: prompts,
        color_config: {
          user_bg_color: values.c_user_bg ?? '#428CFD',
          bubble_bg_color: values.c_bubble_bg ?? '#428CFD',
          bot_text_color: values.c_bot_text ?? '#111827',
          bot_bg_color: values.c_bot_bg ?? '#f3f4f6',
          close_icon_color: values.c_close_icon ?? '#6b7280',
          bg_color: values.c_bg ?? '#ffffff',
          header_bg_color: values.c_header_bg ?? '#428CFD',
          user_text_color: values.c_user_text ?? '#ffffff',
          header_text_color: values.c_header_text ?? '#ffffff',
          send_icon_color: values.c_send_icon ?? '#428CFD',
        },
        bubble_icon: lm === 'image' ? (bubble ?? null) : null,
        corner_style: values.corner_style ?? '12px',
        font_family: values.font_family || undefined,
        header_logo: logo ?? null,
        ai_policy_message: values.ai_policy_message ?? '',
        bubble_shadow: values.bubble_shadow ?? false,
        pos_x_percent: values.ld_x ?? 90,
        pos_y_percent: values.ld_y ?? 90,
        bubble_diameter: `${values.ld_d ?? 60}px`,
      };
      iframe.contentWindow.postMessage({ type: 'chatbot-config', config }, '*');
    } catch {
      // cross-origin or iframe-not-ready — silently ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable: reads all mutable state via refs

  // Subscribe to form changes ONCE. Debounce 150 ms to avoid flooding the
  // widget with every keypress / rapid native colour-picker drag event.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sub = watch((values) => {
      clearTimeout(timer);
      timer = setTimeout(() => sendPreviewMsg(values), 150);
    });
    return () => {
      clearTimeout(timer);
      sub.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — subscribe once on mount

  // When the iframe loads (or reloads after save), it posts chatbot-ready.
  // Reply immediately with current form values so the preview always reflects
  // the form state even after a full iframe reload.
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'chatbot-ready') {
        sendPreviewMsg(getValues());
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — sendPreviewMsg and getValues are stable refs

  // ── Launcher preview sizing ───────────────────────────────────────────────
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const update = () => setScreenWidth(el.getBoundingClientRect().width || 0);
    update();
    let obs: ResizeObserver | null = null;
    try {
      obs = new ResizeObserver((entries) => setScreenWidth(entries[0]?.contentRect.width || 0));
      obs.observe(el);
    } catch {
      const id = setInterval(update, 300);
      return () => clearInterval(id);
    }
    return () => obs?.disconnect();
  }, [device]);

  const xKey = device === 'phone' ? 'lp_x' : 'ld_x';
  const yKey = device === 'phone' ? 'lp_y' : 'ld_y';
  const dKey = device === 'phone' ? 'lp_d' : 'ld_d';
  const xPct = watch(xKey);
  const yPct = watch(yKey);
  const dPx = watch(dKey);

  // Watched for bubble preview rendering
  const bubbleBgColor = watch('c_bubble_bg');
  const bubbleShadowOn = watch('bubble_shadow');
  const floatingMsg = watch('floating_message');
  const botBgColor = watch('c_bot_bg');
  const botTextColor = watch('c_bot_text');
  const bubbleLabelText = watch('bubble_label_text');
  const bubbleLabelTextColor = watch('bubble_label_text_color');

  const baseline = device === 'phone' ? 390 : 1440;
  const scale = screenWidth > 0 ? screenWidth / baseline : 1;
  const renderDiam = Math.max(8, Math.round(Number(dPx || 60) * scale));
  const iconSize = Math.max(8, Math.round(renderDiam * 0.5));

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const container = screenRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const startLeft = (Number(xPct ?? 90) / 100) * (rect.width - renderDiam);
      const startTop = (Number(yPct ?? 90) / 100) * (rect.height - renderDiam);
      const onMove = (ev: MouseEvent) => {
        const newLeft = Math.max(0, Math.min(rect.width - renderDiam, startLeft + ev.clientX - startX));
        const newTop = Math.max(0, Math.min(rect.height - renderDiam, startTop + ev.clientY - startY));
        setValue(xKey, Math.round((newLeft / (rect.width - renderDiam)) * 100), { shouldDirty: true });
        setValue(yKey, Math.round((newTop / (rect.height - renderDiam)) * 100), { shouldDirty: true });
      };
      const onUp = () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [xKey, yKey, xPct, yPct, renderDiam, setValue],
  );

  // ── File upload ───────────────────────────────────────────────────────────
  const uploadImage = async (file: File, pathPrefix: string): Promise<string> => {
    const form = new FormData();
    form.append('file', file);
    form.append('path_prefix', pathPrefix);
    form.append('organization_id', orgId);
    form.append('chatbot_id', chatbot.id);
    const { data } = await axiosApi.post('/api/cloud-storage/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return (data?.data?.url ?? data?.url ?? '') as string;
  };

  const handleHeaderFile = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setHeaderLogoPreview(preview);
    setUploadingHeader(true);
    try {
      const url = await uploadImage(file, 'chatbot-assets/header');
      setHeaderLogoUrl(url);
      setHeaderLogoDeleted(false);
      toast.success('Header image uploaded');
    } catch {
      toast.error('Failed to upload header image');
      setHeaderLogoPreview(headerLogoUrl);
    } finally {
      setUploadingHeader(false);
    }
  };

  const handleBubbleFile = async (file: File) => {
    const preview = URL.createObjectURL(file);
    setBubbleIconPreview(preview);
    setUploadingBubble(true);
    try {
      const url = await uploadImage(file, 'chatbot-assets/bubble');
      setBubbleIconUrl(url);
      setBubbleIconDeleted(false);
      toast.success('Bubble icon uploaded');
    } catch {
      toast.error('Failed to upload bubble icon');
      setBubbleIconPreview(bubbleIconUrl);
    } finally {
      setUploadingBubble(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const prompts = [values.prompt1, values.prompt2, values.prompt3].filter(Boolean);
      const payload: Partial<ChatbotDetail> = {
        header_text: values.header_text,
        welcome_message: values.welcome_message,
        floating_message: values.floating_message,
        placeholder_text: values.placeholder_text,
        ai_policy_message: values.ai_policy_message,
        initial_suggested_prompts: prompts,
        corner_style: values.corner_style,
        font_family: values.font_family || null,
        font_family_header: values.font_family_header || null,
        font_size_header: values.font_size_header || null,
        font_weight_header: values.font_weight_header || null,
        font_size_chat: values.font_size_chat || null,
        bubble_shadow: values.bubble_shadow,
        show_on_phone: values.show_on_phone,
        use_bubble_text: launcherMode === 'text',
        bubble_label_text: values.bubble_label_text || null,
        bubble_label_text_color: values.bubble_label_text_color || null,
        bubble_label_font_family: values.bubble_label_font_family || null,
        bubble_label_font_weight: values.bubble_label_font_weight || null,
        bubble_label_font_size: values.bubble_label_font_size || null,
        header_logo: headerLogoDeleted ? null : (headerLogoUrl ?? chatbot.header_logo ?? null),
        bubble_icon: bubbleIconDeleted ? null : (bubbleIconUrl ?? chatbot.bubble_icon ?? null),
        color_config: {
          header_bg_color: values.c_header_bg,
          header_text_color: values.c_header_text,
          bot_bg_color: values.c_bot_bg,
          bot_text_color: values.c_bot_text,
          user_bg_color: values.c_user_bg,
          user_text_color: values.c_user_text,
          bubble_bg_color: values.c_bubble_bg,
          bg_color: values.c_bg,
          send_icon_color: values.c_send_icon,
          close_icon_color: values.c_close_icon,
        },
        launcher: {
          phone: { x_percent: values.lp_x, y_percent: values.lp_y, diameter_px: values.lp_d },
          desktop: { x_percent: values.ld_x, y_percent: values.ld_y, diameter_px: values.ld_d },
        },
        // Mark as published so backend refreshes Redis cache;
        // without this the widget keeps serving the old Firestore version.
        published: true,
      };
      await chatbotTrainingCenterService.updateChatbot(chatbot.id, payload, orgId);
      return payload;
    },
    onSuccess: (payload) => {
      toast.success('Display settings saved');
      onSaved(payload);
      reset(undefined, { keepValues: true });
    },
    onError: () => toast.error('Failed to save display settings'),
  });

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-0">
      {/* Sub-tab navigation */}
      <div className="mb-6 border-b border-grey-100">
        <div className="flex gap-0">
          {(
            [
              { key: 'styling', icon: <Palette className="h-3.5 w-3.5" />, label: 'Styling' },
              { key: 'text', icon: <TextIcon className="h-3.5 w-3.5" />, label: 'Text Presets' },
              { key: 'launcher', icon: <MessageSquare className="h-3.5 w-3.5" />, label: 'Chat Launcher' },
            ] as const
          ).map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                subTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-grey-900'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── STYLING TAB ───────────────────────────────────────────────── */}
      {subTab === 'styling' && (
        <div className="space-y-5">
          {/* Color Theme */}
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-grey-900">
              <Palette className="h-4 w-4 text-muted-foreground" />
              Color Theme
            </h4>
            <div className="mb-4 max-w-xs">
              <Controller
                control={control}
                name="c_header_bg"
                render={({ field }) => (
                  <ColorPickerField
                    label="Primary color"
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                     
                      if (autoContrast) {
                        const fg = getContrastColor(v);
                        setValue('c_header_text', fg, { shouldDirty: true });
                       setValue('c_bubble_bg', v, { shouldDirty: true });
                      setValue('c_user_bg', v, { shouldDirty: true });
                      setValue('c_send_icon', v, { shouldDirty: true });                        setValue('c_user_text', fg, { shouldDirty: true });
                      }
                    }}
                  />
                )}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Chat header, send icon, and launcher</p>
            </div>
            <div className="mb-5 flex items-center gap-2.5">
              <Checkbox id="auto-contrast" checked={autoContrast}
                onCheckedChange={(v) => setAutoContrast(v === true)} className="h-4 w-4" />
              <Label htmlFor="auto-contrast" className="cursor-pointer text-[11px] text-grey-600">
                Auto-contrast text on header, bubbles, and launcher
              </Label>
            </div>

            <button type="button" onClick={() => setShowColorsAdv((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {showColorsAdv ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Advanced colors
            </button>

            {showColorsAdv && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {(
                  [
                    { name: 'c_header_bg', label: 'Header' },
                    { name: 'c_header_text', label: 'Header text' },
                    { name: 'c_bot_bg', label: 'Hotel bubble' },
                    { name: 'c_bot_text', label: 'Hotel text' },
                    { name: 'c_user_bg', label: 'Guest bubble' },
                    { name: 'c_user_text', label: 'Guest text' },
                    { name: 'c_bg', label: 'Chat window' },
                    { name: 'c_bubble_bg', label: 'Launcher' },
                    { name: 'c_send_icon', label: 'Send icon' },
                    { name: 'c_close_icon', label: 'Close icon' },
                  ] as const
                ).map(({ name, label }) => (
                  <Controller key={name} control={control} name={name}
                    render={({ field }) => (
                      <ColorPickerField label={label} value={field.value} onChange={field.onChange} />
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Typography */}
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-grey-900">
              <TextIcon className="h-4 w-4 text-muted-foreground" />
              Typography
            </h4>
            <div className="mb-3 max-w-xs">
              <Controller control={control} name="font_family"
                render={({ field }) => (
                  <FontSelect label="Main font" value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      if (applyFontEverywhere) {
                        setValue('font_family_header', v, { shouldDirty: true });
                        setValue('bubble_label_font_family', v, { shouldDirty: true });
                      }
                    }}
                  />
                )}
              />
            </div>
            <div className="mb-4 flex items-center gap-2.5">
              <Checkbox id="font-everywhere" checked={applyFontEverywhere}
                onCheckedChange={(v) => setApplyFontEverywhere(v === true)} className="h-4 w-4" />
              <Label htmlFor="font-everywhere" className="cursor-pointer text-[11px] text-grey-600">
                Use the main font for header, chat, and launcher label
              </Label>
            </div>

            <button type="button" onClick={() => setShowTypoAdv((v) => !v)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              {showTypoAdv ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Advanced typography
            </button>

            {showTypoAdv && (
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Controller control={control} name="font_family_header"
                  render={({ field }) => <FontSelect label="Header font" value={field.value} onChange={field.onChange} />} />
                <Controller control={control} name="font_size_header"
                  render={({ field }) => <OptionSelect label="Header size" value={field.value} onChange={field.onChange} options={FONT_SIZE_HEADER} />} />
                <Controller control={control} name="font_weight_header"
                  render={({ field }) => <OptionSelect label="Header weight" value={field.value} onChange={field.onChange} options={FONT_WEIGHT_OPTIONS} />} />
                <Controller control={control} name="font_size_chat"
                  render={({ field }) => <OptionSelect label="Chat text size" value={field.value} onChange={field.onChange} options={FONT_SIZE_CHAT} />} />
              </div>
            )}
          </div>

          {/* Header Image */}
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold text-grey-900">
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              Header Image
            </h4>
            <FilePickerField label="Upload a logo or banner (SVG, PNG, JPG, WebP)"
              previewUrl={headerLogoPreview} onFile={handleHeaderFile}
              onDelete={() => { setHeaderLogoPreview(null); setHeaderLogoUrl(null); setHeaderLogoDeleted(true); }}
              uploading={uploadingHeader} />
          </div>

          {/* Panel Shape */}
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-4 text-sm font-semibold text-grey-900">Panel Shape</h4>
            <div className="max-w-xs">
              <Controller control={control} name="corner_style"
                render={({ field }) => (
                  <OptionSelect label="Corner style" value={field.value} onChange={field.onChange}
                    options={[{ value: '0px', label: 'Sharp corners' }, { value: '12px', label: 'Rounded corners' }]} />
                )}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── TEXT PRESETS TAB ──────────────────────────────────────────── */}
      {subTab === 'text' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-1 text-sm font-semibold text-grey-900">Text Presets</h4>
            <p className="mb-4 text-xs text-muted-foreground">Labels and short copy guests see in the widget header, input, and teasers.</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Header text</Label>
                <Input {...register('header_text')} placeholder="Chat with us!" className="border-grey-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Input placeholder</Label>
                <Input {...register('placeholder_text')} placeholder="Type a message..." className="border-grey-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Floating teaser</Label>
                <Input {...register('floating_message')} placeholder="Hi, how can I help you?" className="border-grey-100" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">AI policy message</Label>
                <Input {...register('ai_policy_message')} placeholder="AI generated answer" className="border-grey-100" />
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              <Label className="text-xs font-medium">Welcome message</Label>
              <Input {...register('welcome_message')} placeholder="Hi, how can I help you today?" className="border-grey-100" />
            </div>
          </div>

          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-1 text-sm font-semibold text-grey-900">Suggested Prompts</h4>
            <p className="mb-4 text-xs text-muted-foreground">Optional quick suggestions above the message field.</p>
            <div className="space-y-3">
              {(['prompt1', 'prompt2', 'prompt3'] as const).map((name, i) => (
                <div key={name} className="space-y-1.5">
                  <Label className="text-xs font-medium">Prompt {i + 1}</Label>
                  <Input {...register(name)} placeholder={['Can I bring my pet?', 'What time is check-out?', 'When does the restaurant open?'][i]} className="border-grey-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CHAT LAUNCHER TAB ─────────────────────────────────────────── */}
      {subTab === 'launcher' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-1 text-sm font-semibold text-grey-900">Launcher Label</h4>
            <p className="mb-4 text-xs text-muted-foreground">Image or short text on the floating chat button.</p>

            <Tabs value={launcherMode} onValueChange={(v) => setLauncherMode(v as 'image' | 'text')}>
              <TabsList className="mb-4">
                <TabsTrigger value="image" className="flex items-center gap-1.5 text-sm">
                  <ImageIcon className="h-3.5 w-3.5" /> Image
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-1.5 text-sm">
                  <TextIcon className="h-3.5 w-3.5" /> Text
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {launcherMode === 'image' && (
              <FilePickerField label="Bubble icon (SVG, PNG, JPG, WebP)" previewUrl={bubbleIconPreview}
                onFile={handleBubbleFile}
                onDelete={() => { setBubbleIconPreview(null); setBubbleIconUrl(null); setBubbleIconDeleted(true); }}
                uploading={uploadingBubble} />
            )}

            {launcherMode === 'text' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Label text (max 6 chars)</Label>
                  <Input {...register('bubble_label_text')} placeholder="Chat" maxLength={6} className="border-grey-100" />
                </div>
                <Controller control={control} name="bubble_label_text_color"
                  render={({ field }) => <ColorPickerField label="Text color" value={field.value} onChange={field.onChange} />} />
                <Controller control={control} name="bubble_label_font_family"
                  render={({ field }) => <FontSelect label="Label font" value={field.value} onChange={field.onChange} />} />
                <Controller control={control} name="bubble_label_font_weight"
                  render={({ field }) => (
                    <OptionSelect label="Label weight" value={field.value} onChange={field.onChange}
                      options={FONT_WEIGHT_OPTIONS.filter((o) => ['400', '700'].includes(o.value))} />
                  )} />
                <Controller control={control} name="bubble_label_font_size"
                  render={({ field }) => (
                    <OptionSelect label="Label size" value={field.value} onChange={field.onChange}
                      options={[{ value: '12px', label: 'Small' }, { value: '14px', label: 'Medium' }, { value: '16px', label: 'Large' }]} />
                  )} />
              </div>
            )}

            <div className="mt-6 flex items-center gap-3">
              <Controller control={control} name="bubble_shadow"
                render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
              <Label className="cursor-pointer text-sm">Launcher drop shadow</Label>
            </div>
          </div>

          <div className="rounded-xl border border-grey-100 bg-white p-5">
            <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-grey-900">
              <Move className="h-4 w-4 text-muted-foreground" />
              Launcher Position
            </h4>
            <p className="mb-4 text-xs text-muted-foreground">Drag in the preview or use the sliders. Phone and desktop can differ.</p>

            <Tabs value={device} onValueChange={(v) => setDevice(v as 'phone' | 'desktop')}>
              <TabsList className="mb-4">
                <TabsTrigger value="phone" className="flex items-center gap-1.5 text-sm">
                  <Smartphone className="h-3.5 w-3.5" /> On phone
                </TabsTrigger>
                <TabsTrigger value="desktop" className="flex items-center gap-1.5 text-sm">
                  <Laptop className="h-3.5 w-3.5" /> On laptop
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {device === 'phone' && (
              <div className="mb-4 flex items-center gap-3">
                <Controller control={control} name="show_on_phone"
                  render={({ field }) => <Switch checked={field.value !== false} onCheckedChange={field.onChange} />} />
                <Label className="cursor-pointer text-sm">Show launcher on phone</Label>
              </div>
            )}

            {/* Preview */}
            <div className="relative mb-5 h-56 overflow-hidden rounded-md bg-muted/20">
              {device === 'phone' ? (
                <div className="absolute inset-y-4 left-1/2 -translate-x-1/2 rounded-md border border-primary/30 bg-primary/10"
                  style={{ width: 120 }} ref={screenRef}>
                  <div className="absolute" style={{
                    left: `calc((100% - ${renderDiam}px) * ${Number(xPct ?? 90) / 100})`,
                    top: `calc((100% - ${renderDiam}px) * ${Number(yPct ?? 90) / 100})`,
                    pointerEvents: 'none',
                  }}>
                    <div className="relative flex flex-col items-center">
                      {floatingMsg && (
                        <div className="absolute rounded-lg px-2 py-1 text-[10px] leading-snug"
                          style={{
                            bottom: '100%', right: 0, marginBottom: 6,
                            maxWidth: 110, width: 'max-content',
                            backgroundColor: botBgColor || '#f3f4f6',
                            color: botTextColor || '#111827',
                            boxShadow: bubbleShadowOn ? '0px 4px 12px rgba(0,0,0,0.15)' : 'none',
                          }}>
                          {floatingMsg}
                        </div>
                      )}
                      <div className="flex cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                        style={{
                          width: renderDiam, height: renderDiam,
                          backgroundColor: bubbleBgColor || '#428CFD',
                          boxShadow: bubbleShadowOn ? '0px 4px 12px rgba(0,0,0,0.15)' : 'none',
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={handleDragStart}>
                        {launcherMode === 'text' ? (
                          <span className="uppercase leading-none select-none" style={{
                            color: bubbleLabelTextColor || '#ffffff',
                            fontSize: Math.max(8, Math.floor(renderDiam * 0.28)) + 'px',
                            fontWeight: 700,
                          }}>
                            {bubbleLabelText || 'CHAT'}
                          </span>
                        ) : launcherMode === 'image' && bubbleIconPreview ? (
                          <img src={bubbleIconPreview} alt="" className="object-contain" style={{ width: iconSize, height: iconSize }} draggable={false} />
                        ) : (
                          <MessageSquare className="text-white" style={{ width: iconSize, height: iconSize }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-md border border-primary/30 bg-primary/10"
                  style={{ width: '100%', maxWidth: 'calc(100% - 32px)', aspectRatio: '16 / 9' }}
                  ref={screenRef}>
                  <div className="absolute" style={{
                    left: `calc((100% - ${renderDiam}px) * ${Number(xPct ?? 90) / 100})`,
                    top: `calc((100% - ${renderDiam}px) * ${Number(yPct ?? 90) / 100})`,
                    pointerEvents: 'none',
                  }}>
                    <div className="relative flex flex-col items-center">
                      {floatingMsg && (
                        <div className="absolute rounded-lg px-2 py-1 text-[10px] leading-snug"
                          style={{
                            bottom: '100%', right: 0, marginBottom: 6,
                            maxWidth: 160, width: 'max-content',
                            backgroundColor: botBgColor || '#f3f4f6',
                            color: botTextColor || '#111827',
                            boxShadow: bubbleShadowOn ? '0px 4px 12px rgba(0,0,0,0.15)' : 'none',
                          }}>
                          {floatingMsg}
                        </div>
                      )}
                      <div className="flex cursor-grab items-center justify-center rounded-full active:cursor-grabbing"
                        style={{
                          width: renderDiam, height: renderDiam,
                          backgroundColor: bubbleBgColor || '#428CFD',
                          boxShadow: bubbleShadowOn ? '0px 4px 12px rgba(0,0,0,0.15)' : 'none',
                          pointerEvents: 'auto',
                        }}
                        onMouseDown={handleDragStart}>
                        {launcherMode === 'text' ? (
                          <span className="uppercase leading-none select-none" style={{
                            color: bubbleLabelTextColor || '#ffffff',
                            fontSize: Math.max(8, Math.floor(renderDiam * 0.28)) + 'px',
                            fontWeight: 700,
                          }}>
                            {bubbleLabelText || 'CHAT'}
                          </span>
                        ) : launcherMode === 'image' && bubbleIconPreview ? (
                          <img src={bubbleIconPreview} alt="" className="object-contain" style={{ width: iconSize, height: iconSize }} draggable={false} />
                        ) : (
                          <MessageSquare className="text-white" style={{ width: iconSize, height: iconSize }} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              {([
                { key: xKey, label: '↔ Move left / right', unit: '%', min: 0, max: 100, val: xPct ?? 90, def: 90 },
                { key: yKey, label: '↕ Move up / down', unit: '%', min: 0, max: 100, val: yPct ?? 90, def: 90 },
                { key: dKey, label: 'Launcher size', unit: 'px', min: 30, max: 200, val: dPx ?? 60, def: 60 },
              ] as const).map(({ key, label, unit, min, max, val, def }) => (
                <div key={`${key}-${device}`} className="space-y-2">
                  <Label className="text-xs font-medium">{label}</Label>
                  <div className="flex items-center gap-4">
                    <Controller key={`${key}-ctrl-${device}`} control={control} name={key}
                      render={({ field }) => (
                        <Slider className="flex-1" min={min} max={max} step={1}
                          value={[Number(field.value ?? def)]}
                          onValueChange={([v]) => field.onChange(v)} />
                      )} />
                    <div className="flex items-center gap-1">
                      <Input type="number" min={min} max={max} className="h-8 w-16 border-grey-100 text-xs"
                        value={Number(val)}
                        onChange={(e) =>
                          setValue(key, Math.max(min, Math.min(max, Number(e.target.value || min))), { shouldDirty: true })
                        } />
                      <span className="text-xs text-muted-foreground">{unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save button */}
      <div className="mt-6 flex justify-end border-t border-grey-100 pt-5">
        <Button type="submit" disabled={saveMutation.isPending || uploadingHeader || uploadingBubble}>
          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save display settings
        </Button>
      </div>
    </form>
  );
}
