import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Database, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { axiosApi } from '@/lib/axios';
import type { KbDocument } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';
import { chatbotTrainingCenterService } from '@/services/chatbotTrainingCenter/chatbotTrainingCenter';

import { AddSourceDialog } from './add-source-dialog';
import { DocumentEditorDialog } from './document-editor-dialog';
import { DocumentCard, DomainUrlGroup } from './source-card';

interface KnowledgeTabProps {
  kbId: string;
  orgId: string;
  onCreateKb?: () => void;
}

// ── URL domain grouping helper ─────────────────────────────────────────────────

type DomainGroup = {
  domain: string;
  groupId: string;
  urls: import('@/services/chatbotTrainingCenter/chatbotTrainingCenter').KbUrl[];
};

function groupUrlsByDomain(
  urls: import('@/services/chatbotTrainingCenter/chatbotTrainingCenter').KbUrl[],
): DomainGroup[] {
  const byDomain: Record<string, DomainGroup> = {};
  for (const u of urls) {
    let domain = 'Other';
    try { domain = new URL(u.url).hostname; } catch { }
    if (!byDomain[domain]) {
      byDomain[domain] = { domain, groupId: `domain:${domain}`, urls: [] };
    }
    byDomain[domain]!.urls.push(u);
  }
  return Object.values(byDomain);
}

// ── Tab ────────────────────────────────────────────────────────────────────────

export function KnowledgeTab({ kbId, orgId, onCreateKb }: KnowledgeTabProps) {
  const qc = useQueryClient();

  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [editDocOpen, setEditDocOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KbDocument | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const docsQuery = useQuery({
    queryKey: ['kb-documents', kbId, orgId],
    queryFn: () => chatbotTrainingCenterService.listDocuments(kbId, orgId),
    enabled: !!kbId && !!orgId,
  });

  const urlsQuery = useQuery({
    queryKey: ['kb-urls', kbId, orgId],
    queryFn: () => chatbotTrainingCenterService.listUrls(kbId, orgId),
    enabled: !!kbId && !!orgId,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const docs = docsQuery.data ?? [];
      const urls = urlsQuery.data ?? [];
      const expanded: string[] = [];
      for (const id of ids) {
        if (id.startsWith('domain:')) {
          const domain = id.slice('domain:'.length);
          urls
            .filter((u) => { try { return new URL(u.url).hostname === domain; } catch { return false; } })
            .forEach((u) => expanded.push(u.id));
        } else {
          expanded.push(id);
        }
      }
      const items = expanded.map((id) => ({
        type: (docs.some((d) => d.id === id) ? 'file' : 'url') as 'file' | 'url',
        id,
        namespace: undefined as string | undefined,
      }));
      await axiosApi.post('/bulk-delete', { organization_id: orgId, knowledge_base_id: kbId, items });
    },
    onSuccess: () => {
      toast.success('Deleted successfully');
      setSelectedIds(new Set());
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId, orgId] });
      void qc.invalidateQueries({ queryKey: ['kb-urls', kbId, orgId] });
    },
    onError: () => toast.error('Delete failed'),
  });

  const createDocMutation = useMutation({
    mutationFn: ({ title, content }: { title: string; content: string }) =>
      chatbotTrainingCenterService.createDocument(orgId, kbId, { title, content }),
    onSuccess: () => {
      toast.success('Document created');
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId, orgId] });
    },
    onError: () => toast.error('Failed to create document'),
  });

  const updateDocMutation = useMutation({
    mutationFn: ({ docId, title, content }: { docId: string; title: string; content: string }) =>
      chatbotTrainingCenterService.updateDocument(orgId, kbId, docId, { title, content }),
    onSuccess: () => {
      toast.success('Document saved');
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId, orgId] });
    },
    onError: () => toast.error('Failed to save document'),
  });

  const addUrlMutation = useMutation({
    mutationFn: async (url: string) => {
      await axiosApi.post('/firecrawl-website-scraper', {
        accepted_urls: [url], rejected_urls: [], namespace: orgId,
        organization_id: orgId, knowledge_base_id: kbId, re_train: false,
      });
    },
    onSuccess: () => {
      toast.success('URL queued for training');
      void qc.invalidateQueries({ queryKey: ['kb-urls', kbId, orgId] });
    },
    onError: () => toast.error('Failed to add URL'),
  });

  const addWebsiteMutation = useMutation({
    mutationFn: async (url: string) => {
      await axiosApi.post('/firecrawl-website-scraper', {
        accepted_urls: [url], rejected_urls: [], namespace: orgId,
        organization_id: orgId, knowledge_base_id: kbId, re_train: false,
      });
    },
    onSuccess: () => {
      toast.success('Website queued for crawling');
      void qc.invalidateQueries({ queryKey: ['kb-urls', kbId, orgId] });
    },
    onError: () => toast.error('Failed to add website'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file as Blob);
      form.append('namespace', orgId);
      await axiosApi.post(`/files/${orgId}/${kbId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('File uploaded');
      void qc.invalidateQueries({ queryKey: ['kb-documents', kbId, orgId] });
    },
    onError: () => toast.error('Failed to upload file'),
  });

  // ── Derived state ────────────────────────────────────────────────────────────

  const docs = docsQuery.data ?? [];
  const urls = urlsQuery.data ?? [];
  const domainGroups = useMemo(() => groupUrlsByDomain(urls), [urls]);
  const isLoading = docsQuery.isLoading || urlsQuery.isLoading;
  const isEmpty = docs.length === 0 && urls.length === 0;

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditDoc = (doc: KbDocument) => {
    setEditingDoc(doc);
    setEditDocOpen(true);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex justify-between gap-2">
          <h4 className="font-semibold">
            Knowledge Base
          </h4>


          {/* {onCreateKb && (
            <Button size="sm" variant="outline" onClick={onCreateKb}>
              <Database className="mr-1.5 h-3.5 w-3.5" />
              New Knowledge Base
            </Button>
          )} */}
        </div>


        <div className="flex gap-2">
          <Button
            size="sm"

            onClick={() => setAddSourceOpen(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>

          {/* Bulk delete when items are selected */}
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteMutation.mutate([...selectedIds])}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Delete ({selectedIds.size})
            </Button>
          )}
        </div>

      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && isEmpty && (
        <div className="rounded-xl border border-dashed border-grey-100 py-16 text-center">
          <p className="text-sm text-muted-foreground">No knowledge base items yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Use the <span className="font-medium">Add</span> button above to add documents or URLs.
          </p>
        </div>
      )}

      {/* Documents section */}
      {!isLoading && docs.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Documents ({docs.length})
          </h3>
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              selectionMode
              selected={selectedIds.has(doc.id)}
              onSelect={toggleSelect}
              onEdit={openEditDoc}
              onDelete={(id) => deleteMutation.mutate([id])}
            />
          ))}
        </section>
      )}

      {/* URLs section — grouped by domain, checkboxes always visible */}
      {!isLoading && domainGroups.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            URLs ({urls.length} page{urls.length !== 1 ? 's' : ''} · {domainGroups.length} domain{domainGroups.length !== 1 ? 's' : ''})
          </h3>
          {domainGroups.map((group) => (
            <DomainUrlGroup
              key={group.groupId}
              domain={group.domain}
              urls={group.urls}
              groupId={group.groupId}
              selectionMode
              selected={selectedIds.has(group.groupId)}
              onSelect={toggleSelect}
              onDeleteUrl={(urlId) => deleteMutation.mutate([urlId])}
            />
          ))}
        </section>
      )}

      {/* Dialogs */}
      <AddSourceDialog
        open={addSourceOpen}
        onOpenChange={setAddSourceOpen}
        onWebsiteUrl={(url) => addWebsiteMutation.mutateAsync(url)}
        onSingleUrls={(urls) =>
          Promise.all(urls.map((u) => addUrlMutation.mutateAsync(u))).then(() => undefined)
        }
        onUpload={(file) => uploadFileMutation.mutateAsync(file)}
        onDocument={(title, content) => createDocMutation.mutateAsync({ title, content })}
      />
      <DocumentEditorDialog
        open={editDocOpen}
        onOpenChange={(v) => { setEditDocOpen(v); if (!v) setEditingDoc(null); }}
        document={editingDoc}
        onSave={async (title, content) => {
          if (editingDoc) {
            await updateDocMutation.mutateAsync({ docId: editingDoc.id, title, content });
          }
        }}
      />
    </div>
  );
}
