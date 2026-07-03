import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Tags,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailSettingsService,
  type AnalysisCategory,
  type InquiryCategory,
} from '@/services/aiEmailSettings/aiEmailSettings';

// ── Types ──────────────────────────────────────────────────────────────────────

type EditableCategory = AnalysisCategory & {
  id?: string;
  _localId: string;
  _isNew?: boolean;
  _isDirty?: boolean;
};

let _idCounter = 0;
const newLocalId = () => `cat-local-${++_idCounter}`;

function toEditable(c: InquiryCategory): EditableCategory {
  return { id: c.id, _localId: newLocalId(), slug: c.slug, name: c.name, description: c.description, prompt: c.prompt };
}

// ── Category Form Dialog ───────────────────────────────────────────────────────

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: EditableCategory | null;
  onSave: (category: AnalysisCategory) => void;
}

function CategoryFormDialog({ open, onOpenChange, initial, onSave }: CategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '');
      setSlug(initial?.slug ?? '');
      setDescription(initial?.description ?? '');
      setPrompt(initial?.prompt ?? '');
    }
  }, [open, initial]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!initial && name) {
      setSlug(name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
    }
  }, [name, initial]);

  const handleSave = () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    if (!slug.trim()) { toast.error('Slug is required'); return; }
    onSave({ name: name.trim(), slug: slug.trim(), description: description.trim(), prompt: prompt.trim() });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Category' : 'Add Category'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-xs font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Cancellation Request"
                className="text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-slug" className="text-xs font-medium">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. cancellation_request"
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-desc" className="text-xs font-medium">Description</Label>
            <Textarea
              id="cat-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description of this category…"
              className="resize-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cat-prompt" className="text-xs font-medium">Prompt</Label>
            <Textarea
              id="cat-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="Instructions for the AI when handling this category…"
              className="resize-none text-xs"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave}>
            {initial ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Tab ───────────────────────────────────────────────────────────────────

interface CategoriesTabProps {
  orgId: string;
}

export function CategoriesTab({ orgId }: CategoriesTabProps) {
  const qc = useQueryClient();

  const inboxesQuery = useQuery({
    queryKey: ['ai-email-inboxes', orgId],
    queryFn: () => aiEmailSettingsService.getInboxes(orgId),
    enabled: !!orgId,
  });

  const inboxes = inboxesQuery.data ?? [];
  const [selectedInboxId, setSelectedInboxId] = useState('');

  useEffect(() => {
    if (inboxes.length > 0 && !selectedInboxId) {
      setSelectedInboxId(inboxes[0]!.id);
    }
  }, [inboxes, selectedInboxId]);

  const categoriesQuery = useQuery({
    queryKey: ['inbox-categories', orgId, selectedInboxId],
    queryFn: () => aiEmailSettingsService.getCategories(orgId, selectedInboxId),
    enabled: !!selectedInboxId && !!orgId,
  });

  const serverCategories = categoriesQuery.data ?? [];

  // ── Local edit state ───────────────────────────────────────────────────────
  const [localCategories, setLocalCategories] = useState<EditableCategory[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    if (!hasPendingChanges && categoriesQuery.data) {
      setLocalCategories(categoriesQuery.data.map(toEditable));
    }
  }, [categoriesQuery.data, hasPendingChanges]);

  const displayCategories = hasPendingChanges ? localCategories : serverCategories.map(toEditable);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EditableCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Analysis state ─────────────────────────────────────────────────────────
  const [analysisJobId, setAnalysisJobId] = useState<string | null>(null);
  const appliedJobRef = useRef<string | null>(null);

  const analysisStatusQuery = useQuery({
    queryKey: ['taxonomy-analysis', orgId, analysisJobId],
    queryFn: () => aiEmailSettingsService.getAnalysisStatus(orgId, analysisJobId!),
    enabled: !!analysisJobId && !!orgId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'queued' || s === 'running' ? 2000 : false;
    },
  });

  // Apply analysis results when complete
  useEffect(() => {
    const data = analysisStatusQuery.data;
    if (
      data?.status === 'success' &&
      data.categories &&
      analysisJobId &&
      appliedJobRef.current !== analysisJobId
    ) {
      appliedJobRef.current = analysisJobId;
      const discovered = data.categories.map((c) => ({
        ...c,
        _localId: newLocalId(),
        _isNew: true,
      }));
      setLocalCategories(discovered);
      setHasPendingChanges(true);
      toast.success(`Analysis complete — ${discovered.length} categories discovered`);
    } else if (data?.status === 'error') {
      toast.error(data.message || 'Analysis failed');
      setAnalysisJobId(null);
    }
  }, [analysisStatusQuery.data, analysisJobId]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const analyzeMutation = useMutation({
    mutationFn: () => aiEmailSettingsService.analyzeTaxonomy(orgId, selectedInboxId),
    onSuccess: (res) => {
      setAnalysisJobId(res.job_id);
      toast.success('Analysis started — this may take a few minutes');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      aiEmailSettingsService.saveCategories(
        orgId,
        selectedInboxId,
        localCategories.map(({ _localId: _, _isNew: __, _isDirty: ___, id: ____, ...rest }) => rest),
      ),
    onSuccess: () => {
      toast.success('Categories saved');
      setHasPendingChanges(false);
      setAnalysisJobId(null);
      void qc.invalidateQueries({ queryKey: ['inbox-categories', orgId, selectedInboxId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aiEmailSettingsService.deleteCategory(orgId, id),
    onSuccess: (_, id) => {
      toast.success('Category deleted');
      setDeletingId(null);
      void qc.invalidateQueries({ queryKey: ['inbox-categories', orgId, selectedInboxId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveCategory = (category: AnalysisCategory) => {
    if (editingCategory) {
      setLocalCategories((prev) =>
        prev.map((c) =>
          c._localId === editingCategory._localId
            ? { ...c, ...category, _isDirty: true }
            : c
        )
      );
    } else {
      setLocalCategories((prev) => [...prev, { ...category, _localId: newLocalId(), _isNew: true }]);
    }
    setHasPendingChanges(true);
  };

  const handleDeleteLocal = (localId: string) => {
    setLocalCategories((prev) => prev.filter((c) => c._localId !== localId));
    setHasPendingChanges(true);
    setDeletingId(null);
  };

  const handleDeleteServer = (id: string) => {
    deleteMutation.mutate(id);
  };

  const isAnalyzing = analysisStatusQuery.data?.status === 'queued' || analysisStatusQuery.data?.status === 'running';
  const analysisProgress = analysisStatusQuery.data?.progress ?? 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (inboxesQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (inboxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-16 text-center">
        <div className="rounded-full bg-muted p-4 ring-1 ring-border">
          <Tags className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">No inboxes found</p>
          <p className="text-xs text-muted-foreground">
            No email inboxes are configured for this organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Inbox selector */}
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">Inbox</p>
        <Select
          value={selectedInboxId}
          onValueChange={(v) => {
            setSelectedInboxId(v);
            setHasPendingChanges(false);
            setAnalysisJobId(null);
          }}
        >
          <SelectTrigger className="h-8 w-80 text-xs">
            <SelectValue placeholder="Select inbox…" />
          </SelectTrigger>
          <SelectContent>
            {inboxes.map((inbox) => (
              <SelectItem key={inbox.id} value={inbox.id} className="text-xs">
                {inbox.display_name || inbox.receiver_email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Analysis section */}
      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">Analyze Inbox</CardTitle>
              <CardDescription className="text-xs">
                Automatically discover categories from past email conversations.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-xs"
              disabled={analyzeMutation.isPending || isAnalyzing || !selectedInboxId}
              onClick={() => analyzeMutation.mutate()}
            >
              {analyzeMutation.isPending || isAnalyzing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              {isAnalyzing ? 'Analyzing…' : 'Analyze Inbox'}
            </Button>
          </div>
        </CardHeader>

        {(isAnalyzing || analysisStatusQuery.data) && (
          <CardContent className="pt-0">
            <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
                ) : analysisStatusQuery.data?.status === 'success' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                )}
                <span className="text-xs text-muted-foreground">
                  {analysisStatusQuery.data?.message ?? 'Starting analysis…'}
                </span>
              </div>
              {isAnalyzing && (
                <Progress value={analysisProgress} className="h-1.5" />
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Categories header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Inquiry Categories
            {displayCategories.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({displayCategories.length})
              </span>
            )}
          </p>
          {hasPendingChanges && (
            <p className="text-[11px] text-amber-600 font-medium">
              Unsaved changes — save to apply
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasPendingChanges && (
            <Button
              size="sm"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
              className="h-7 gap-1.5 text-xs"
            >
              {saveMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save Categories
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs"
            onClick={() => { setEditingCategory(null); setDialogOpen(true); }}
          >
            <Plus className="h-3 w-3" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Category list */}
      {categoriesQuery.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border-border shadow-sm">
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayCategories.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border/50 py-12 text-center">
          <Tags className="h-6 w-6 text-muted-foreground" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">No categories yet</p>
            <p className="text-xs text-muted-foreground">
              Add categories manually or use Analyze Inbox to discover them automatically.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {displayCategories.map((cat) => (
            <Card key={cat._localId} className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{cat.name}</p>
                      <Badge variant="secondary" className="h-4 font-mono text-[10px]">
                        {cat.slug}
                      </Badge>
                      {cat._isNew && (
                        <Badge className="h-4 text-[10px]">New</Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => { setEditingCategory(cat); setDialogOpen(true); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(cat._localId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editingCategory}
        onSave={handleSaveCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              {hasPendingChanges
                ? 'This will remove the category from the pending list.'
                : 'This will permanently delete the category from the database.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (!deletingId) return;
                const cat = displayCategories.find((c) => c._localId === deletingId);
                if (hasPendingChanges || !cat?.id) {
                  handleDeleteLocal(deletingId);
                } else {
                  handleDeleteServer(cat.id);
                }
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
