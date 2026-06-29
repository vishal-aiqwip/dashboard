import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { axiosApi } from '@/lib/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

type IndexStatus = {
  knowledge_base_id: string;
  knowledge_base_name: string;
  index_name: string;
  namespace: string;
  vector_count?: number;
  total_index_vector_count?: number;
  resetJobId?: string | null;
};

type ResetJobState = {
  state: 'PENDING' | 'PROGRESS' | 'SUCCESS' | 'FAILURE';
  details?: { percent?: number; error?: string };
};

// ─── ResetJobStatus ───────────────────────────────────────────────────────────

function ResetJobStatus({
  jobId,
  kbName,
  organizationId,
  onComplete,
  onError,
}: {
  jobId: string;
  kbName: string;
  organizationId: string;
  onComplete: (jobId: string, kbName: string) => void;
  onError: (jobId: string, error: string, kbName: string) => void;
}) {
  const { data: jobStatus } = useQuery<ResetJobState>({
    queryKey: ['pinecone-reset-status', jobId],
    queryFn: async () => {
      const { data } = await axiosApi.get(`/indexes/reset-status/${jobId}`, {
        params: { organization_id: organizationId },
      });
      return data?.data ?? data;
    },
    enabled: !!jobId,
    refetchInterval: (q) => {
      const s = q.state.data?.state;
      return s === 'PENDING' || s === 'PROGRESS' ? 3000 : false;
    },
  });

  useEffect(() => {
    if (jobStatus?.state === 'SUCCESS') onComplete(jobId, kbName);
    else if (jobStatus?.state === 'FAILURE') onError(jobId, jobStatus.details?.error ?? 'Unknown error', kbName);
  }, [jobStatus, jobId, kbName, onComplete, onError]);

  if (!jobStatus) return null;
  const { state, details } = jobStatus;

  if (state === 'PENDING') {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-xs">Preparing to reset…</span>
      </div>
    );
  }
  if (state === 'PROGRESS') {
    const pct = details?.percent ?? 0;
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">Resetting… {pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
    );
  }
  if (state === 'SUCCESS') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs">Reset completed</span>
      </div>
    );
  }
  if (state === 'FAILURE') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-xs">Failed: {details?.error ?? 'Unknown error'}</span>
      </div>
    );
  }
  return null;
}

// ─── OrgIndexResetDialog ──────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  organizationName: string;
}

export function OrgIndexResetDialog({ open, onOpenChange, organizationId, organizationName }: Props) {
  const [isFetching, setIsFetching] = useState(false);
  const [indexStatuses, setIndexStatuses] = useState<IndexStatus[]>([]);

  useEffect(() => {
    if (!open || !organizationId) return;
    let cancelled = false;

    (async () => {
      try {
        setIsFetching(true);
        const { data } = await axiosApi.get('/api/knowledge-bases', { params: { organization_id: organizationId } });
        const kbs: Array<{ id: string; knowledge_base_name: string; pinecone_index: string; pinecone_namespace: string }> =
          data?.data?.knowledge_bases ?? [];
        if (cancelled) return;

        const statuses = await Promise.all(
          kbs.map(async (kb) => {
            try {
              const { data: statsData } = await axiosApi.get(`/indexes/${organizationId}/${kb.id}/stats`);
              const s = statsData?.data ?? statsData;
              return {
                knowledge_base_id: kb.id,
                knowledge_base_name: kb.knowledge_base_name,
                index_name: kb.pinecone_index,
                namespace: kb.pinecone_namespace,
                vector_count: s?.vector_count,
                total_index_vector_count: s?.total_index_vector_count,
                resetJobId: null,
              } satisfies IndexStatus;
            } catch {
              return {
                knowledge_base_id: kb.id,
                knowledge_base_name: kb.knowledge_base_name,
                index_name: kb.pinecone_index,
                namespace: kb.pinecone_namespace,
                resetJobId: null,
              } satisfies IndexStatus;
            }
          }),
        );

        if (!cancelled) setIndexStatuses(statuses);
      } catch (err: any) {
        if (!cancelled) {
          toast.error(`Failed to load index statuses: ${err?.message ?? 'Unknown error'}`);
          setIsFetching(false);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [open, organizationId]);

  const handleReset = async () => {
    if (!organizationId || indexStatuses.length === 0) return;
    try {
      const results = await Promise.all(
        indexStatuses.map(async (status) => {
          try {
            const { data } = await axiosApi.post(`/indexes/${organizationId}/${status.knowledge_base_id}/reset`);
            const jobId = data?.data?.job_id;
            if (!jobId) throw new Error('No job ID returned');
            setIndexStatuses((prev) =>
              prev.map((s) => s.knowledge_base_id === status.knowledge_base_id ? { ...s, resetJobId: jobId } : s),
            );
            return { success: true };
          } catch {
            return { success: false };
          }
        }),
      );
      const ok = results.filter((r) => r.success).length;
      const fail = results.length - ok;
      if (ok > 0) {
        toast.success(`Reset initiated for ${ok} knowledge base${ok === 1 ? '' : 's'}.${fail > 0 ? ` ${fail} failed.` : ''}`);
      } else {
        toast.error('Failed to initiate reset for all knowledge bases.');
      }
    } catch {
      toast.error('Failed to reset indexes. Please try again.');
    }
  };

  const onComplete = useCallback((jobId: string, kbName: string) => {
    toast.success(`${kbName} reset completed successfully.`);
    setIndexStatuses((prev) => {
      const next = prev.map((s) => s.resetJobId === jobId ? { ...s, resetJobId: null } : s);
      if (!next.some((s) => s.resetJobId)) setTimeout(() => onOpenChange(false), 1000);
      return next;
    });
  }, [onOpenChange]);

  const onResetError = useCallback((jobId: string, error: string, kbName: string) => {
    toast.error(`${kbName} reset failed: ${error}`);
    setIndexStatuses((prev) => prev.map((s) => s.resetJobId === jobId ? { ...s, resetJobId: null } : s));
  }, []);

  const isResetting = indexStatuses.some((s) => !!s.resetJobId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Index Status & Reset</DialogTitle>
          <DialogDescription>
            View Pinecone index status and reset indexes for {organizationName}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-800">Remember to unpublish the chatbot before resetting the index.</p>
          </div>

          {isFetching ? (
            <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading index statuses…</span>
            </div>
          ) : indexStatuses.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No knowledge bases found for this organization.
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {indexStatuses.map((status) => (
                <div key={status.knowledge_base_id} className="p-3 border rounded-md space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{status.knowledge_base_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Index: {status.index_name} | Namespace: {status.namespace}
                      </p>
                      {status.vector_count !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Vectors: {status.vector_count.toLocaleString()}
                          {status.total_index_vector_count !== undefined &&
                            ` / Total: ${status.total_index_vector_count.toLocaleString()}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {status.resetJobId && (
                    <div className="pt-2 border-t">
                      <ResetJobStatus
                        jobId={status.resetJobId}
                        kbName={status.knowledge_base_name}
                        organizationId={organizationId}
                        onComplete={onComplete}
                        onError={onResetError}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Close</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={indexStatuses.length === 0 || isResetting}
          >
            {isResetting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isResetting ? 'Resetting…' : 'Delete and Refresh'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
