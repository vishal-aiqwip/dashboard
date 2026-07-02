import { useRef, useState } from 'react';
import { FileText, Globe, Link as LinkIcon, Loader2, Minus, Plus, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──────────────────────────────────────────────────────────────────────

type SourceType = 'website-url' | 'single-url' | 'upload-file' | 'new-document';

export type { SourceType };

interface SourceOption {
  type: SourceType;
  icon: React.ElementType;
  title: string;
  description: string;
}

const OPTIONS: SourceOption[] = [
  { type: 'website-url', icon: Globe, title: 'Website URL', description: 'Add a website for crawling' },
  { type: 'single-url', icon: LinkIcon, title: 'Single URL', description: 'Add one specific page' },
  { type: 'upload-file', icon: Upload, title: 'Upload File', description: 'DOCX files only' },
  { type: 'new-document', icon: FileText, title: 'New Text Document', description: 'Write content directly' },
];

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWebsiteUrl: (url: string) => Promise<void>;
  onSingleUrls: (urls: string[]) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onDocument: (title: string, content: string) => Promise<void>;
}

function isValidUrl(v: string) {
  try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch { return false; }
}

// ── Dialog ─────────────────────────────────────────────────────────────────────

export function AddSourceDialog({
  open,
  onOpenChange,
  onWebsiteUrl,
  onSingleUrls,
  onUpload,
  onDocument,
}: AddSourceDialogProps) {
  const [selected, setSelected] = useState<SourceType | null>(null);
  const [busy, setBusy] = useState(false);

  // website-url
  const [websiteUrl, setWebsiteUrl] = useState('');

  // single-url
  const [singleUrls, setSingleUrls] = useState<string[]>(['']);

  // upload-file
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // new-document
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  const resetForm = () => {
    setWebsiteUrl('');
    setSingleUrls(['']);
    setFile(null);
    setDocTitle('');
    setDocContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = (v: boolean) => {
    if (!v) { setSelected(null); resetForm(); }
    onOpenChange(v);
  };

  const selectOption = (type: SourceType) => {
    setSelected(type);
    resetForm();
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      setSelected(null);
      resetForm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  // ── Per-option inline sections ───────────────────────────────────────────────

  const renderInline = () => {
    if (!selected) return null;

    if (selected === 'website-url') {
      const valid = isValidUrl(websiteUrl);
      return (
        <div className="space-y-3 border-t border-grey-100 pt-4">
          <div>
            <p className="text-sm font-medium text-grey-900">Website URL</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Scans all subpages and domains of the website. If a link already exists in the Knowledge
              Base, it will be updated and replaced with the new one.
            </p>
          </div>
          <Input
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="border-grey-100"
            onKeyDown={(e) => { if (e.key === 'Enter' && valid) void run(() => onWebsiteUrl(websiteUrl.trim())); }}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => run(() => onWebsiteUrl(websiteUrl.trim()))} disabled={!valid || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Map Website
            </Button>
          </div>
        </div>
      );
    }

    if (selected === 'single-url') {
      const allValid = singleUrls.every((u) => isValidUrl(u));
      const nonEmpty = singleUrls.filter((u) => u.trim());
      return (
        <div className="space-y-3 border-t border-grey-100 pt-4">
          <div>
            <p className="text-sm font-medium text-grey-900">Single URLs</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Only scans the link(s) listed. If a link already exists in the Knowledge Base, it will
              be updated and replaced with the new one.
            </p>
          </div>
          <div className="space-y-2">
            {singleUrls.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={u}
                  onChange={(e) => {
                    const next = [...singleUrls];
                    next[i] = e.target.value;
                    setSingleUrls(next);
                  }}
                  placeholder="https://example.com/page"
                  className="border-grey-100"
                />
                {singleUrls.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => setSingleUrls(singleUrls.filter((_, j) => j !== i))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            onClick={() => setSingleUrls([...singleUrls, ''])}
          >
            <Plus className="h-3.5 w-3.5" />
            Add another URL
          </button>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>Cancel</Button>
            <Button
              onClick={() => run(() => onSingleUrls(nonEmpty))}
              disabled={!allValid || nonEmpty.length === 0 || busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Train URLs
            </Button>
          </div>
        </div>
      );
    }

    if (selected === 'upload-file') {
      return (
        <div className="space-y-3 border-t border-grey-100 pt-4">
          <Label className="text-sm font-medium">Upload a .docx file</Label>
          <Input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            className="cursor-pointer border-grey-100"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          {file && <p className="text-xs text-muted-foreground">Selected: {file.name}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>Cancel</Button>
            <Button onClick={() => run(() => onUpload(file!))} disabled={!file || busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload File
            </Button>
          </div>
        </div>
      );
    }

    if (selected === 'new-document') {
      return (
        <div className="space-y-3 border-t border-grey-100 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Document title"
              className="border-grey-100"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Content</Label>
            <Textarea
              id="doc-content"
              value={docContent}
              onChange={(e) => setDocContent(e.target.value)}
              placeholder="Write or paste your content here..."
              className="min-h-35 resize-y border-grey-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleClose(false)} disabled={busy}>Cancel</Button>
            <Button
              onClick={() => run(() => onDocument(docTitle.trim(), docContent.trim()))}
              disabled={!docTitle.trim() || !docContent.trim() || busy}
            >
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Document
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl font-light text-primary">+</span>
          </div>
          <DialogTitle className="text-lg">Add source</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select a content source to add to your knowledge base.
          </DialogDescription>
        </DialogHeader>

        {/* 2×2 option grid */}
        <div className="grid grid-cols-2 gap-3">
          {OPTIONS.map(({ type, icon: Icon, title, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => selectOption(type)}
              className={[
                'flex items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                selected === type
                  ? 'border-primary bg-primary/5'
                  : 'border-grey-100 bg-background hover:border-primary/40 hover:bg-muted/40',
              ].join(' ')}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-grey-900">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Inline section — changes per selected option */}
        {renderInline()}

        {/* Cancel-only footer when nothing is selected */}
        {!selected && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
