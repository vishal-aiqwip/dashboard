import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  File,
  FileText,
  Globe,
  Link as LinkIcon,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { KbDocument, KbUrl } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function extBadgeClass(ext: string | null | undefined): string {
  switch ((ext ?? '').toLowerCase().replace('.', '')) {
    case 'pdf': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'docx':
    case 'doc': return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'txt': return 'bg-violet-50 text-violet-700 border-violet-200';
    default: return 'bg-grey-50 text-grey-700 border-grey-100';
  }
}

// ── Document card ──────────────────────────────────────────────────────────────

interface DocumentCardProps {
  doc: KbDocument;
  onEdit?: (doc: KbDocument) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function DocumentCard({
  doc,
  onEdit,
  onDelete,
  selected,
  onSelect,
  selectionMode,
}: DocumentCardProps) {
  const [expanded, setExpanded] = useState(false);
  const ext = doc.original_extension ?? doc.filename?.split('.').pop();

  return (
    <div
      className={`rounded-xl border border-grey-100 bg-muted/30 p-4 transition-colors ${
        selected ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onSelect?.(doc.id)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
        )}
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-grey-900">{doc.title || doc.filename}</p>
            {ext && (
              <Badge
                variant="outline"
                className={`px-1.5 py-0 text-[10px] font-medium ${extBadgeClass(ext)}`}
              >
                {ext.toUpperCase()}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Uploaded {formatDate(doc.upload_date)} · Trained {formatDate(doc.last_trained)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {doc.content && !selectionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </Button>
          )}

          {!selectionMode && (onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(doc)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onEdit && onDelete && <DropdownMenuSeparator />}
                {onDelete && (
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(doc.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {selectionMode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(doc.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {expanded && doc.content && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-grey-100 bg-background p-3">
          <pre className="whitespace-pre-wrap text-xs text-grey-700">{doc.content}</pre>
        </div>
      )}
    </div>
  );
}

// ── Domain URL group ───────────────────────────────────────────────────────────
// Groups all URLs from the same hostname into one collapsible card.

interface DomainUrlGroupProps {
  domain: string;
  urls: KbUrl[];
  groupId: string;
  onDeleteUrl?: (id: string) => void;
  selected?: boolean;
  onSelect?: (groupId: string) => void;
  selectionMode?: boolean;
}

export function DomainUrlGroup({
  domain,
  urls,
  groupId,
  onDeleteUrl,
  selected,
  onSelect,
  selectionMode,
}: DomainUrlGroupProps) {
  const [expanded, setExpanded] = useState(false);

  const oldestUpload = urls
    .map((u) => u.upload_date)
    .filter(Boolean)
    .sort()[0];

  return (
    <div
      className={`rounded-xl border border-grey-100 bg-muted/30 transition-colors ${
        selected ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <Checkbox
          checked={selected ?? false}
          onCheckedChange={() => onSelect?.(groupId)}
          className="mt-0.5 shrink-0"
        />
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <Globe className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-grey-900">{domain}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {urls.length} page{urls.length !== 1 ? 's' : ''} · Added {formatDate(oldestUpload)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Child pages */}
      {expanded && (
        <div className="space-y-0.5 border-t border-grey-100 px-4 pb-3 pt-2">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Pages ({urls.length})
          </p>
          {urls.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
            >
              <LinkIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p
                className="min-w-0 flex-1 truncate text-xs text-grey-700"
                title={u.url}
              >
                {u.title && u.title.toLowerCase() !== '(no title)' ? u.title : u.url}
              </p>
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={() => window.open(u.url, '_blank', 'noopener,noreferrer')}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                {onDeleteUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteUrl(u.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Single URL card (for ungrouped / solo domain) ──────────────────────────────

interface UrlCardProps {
  url: KbUrl;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

export function UrlCard({ url, onDelete, selected, onSelect, selectionMode }: UrlCardProps) {
  return (
    <div
      className={`rounded-xl border border-grey-100 bg-muted/30 p-4 transition-colors ${
        selected ? 'border-primary/50 bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {selectionMode && (
          <input
            type="checkbox"
            checked={selected ?? false}
            onChange={() => onSelect?.(url.id)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
        )}
        <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">
          <Globe className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-grey-900">
              {url.title || url.url}
            </p>
          </div>
          {url.title && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{url.url}</p>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">
            Added {formatDate(url.upload_date)} · Trained {formatDate(url.last_trained)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => window.open(url.url, '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
          {onDelete && !selectionMode && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(url.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {selectionMode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(url.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Generic icon re-export
export { File };
