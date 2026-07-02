import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Mail,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  reportAssessmentsService,
  type AssessmentListItem,
  type ReportHotel,
} from '@/services/reportAssessments/reportAssessments';

// ── Styles ────────────────────────────────────────────────────────────────────

const dtHead =
  'h-11 bg-surface/90 px-4 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-grey-500 first:pl-5 last:pr-5';
const dtRow =
  'border-b border-grey-100/70 transition-colors hover:bg-surface/80 last:border-b-0';
const dtCell = 'px-4 py-3.5 align-middle text-small first:pl-5 last:pr-5';
const dtWrap = 'overflow-hidden rounded-xl border border-grey-100';

// ── Status Badge ──────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  pending_consent: 'border-amber-200 bg-amber-50 text-amber-900',
  scraping: 'border-blue-200 bg-blue-50 text-blue-900',
  ready_for_processing: 'border-purple-200 bg-purple-50 text-purple-900',
  analyzing: 'border-indigo-200 bg-indigo-50 text-indigo-900',
  complete: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  failed: 'border-red-200 bg-red-50 text-red-900',
};

const STATUS_LABELS: Record<string, string> = {
  pending_consent: 'Pending consent',
  scraping: 'Scraping',
  ready_for_processing: 'Ready',
  analyzing: 'Analyzing',
  complete: 'Complete',
  failed: 'Failed',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${STATUS_STYLES[status] ?? 'border-grey-200 text-grey-700'}`}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

// ── Consent URL block ─────────────────────────────────────────────────────────

function ConsentUrlBlock({ consentUrl }: { consentUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(consentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy URL.');
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-small font-medium text-grey-900">Consent URL</p>
      <div className="flex items-center gap-2 rounded-lg border border-grey-100 bg-surface p-3">
        <span className="flex-1 break-all font-mono text-xs text-grey-700">{consentUrl}</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      <p className="text-xs text-grey-500">
        Share this link with the hotel&apos;s IT contact so they can grant inbox access.
      </p>
    </div>
  );
}

// ── Hotel row with accordion ──────────────────────────────────────────────────

function HotelRow({
  hotel,
  chainName,
  latestAssessment,
  assessments,
  isExpanded,
  onToggle,
  onNewAssessment,
  canMutate,
  onEdit,
  onDelete,
}: {
  hotel: ReportHotel;
  chainName: string | null;
  latestAssessment: AssessmentListItem | null;
  assessments: AssessmentListItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onNewAssessment: () => void;
  canMutate: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <>
      <TableRow className={`${dtRow} cursor-pointer`} onClick={onToggle}>
        <TableCell className={dtCell}>
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface text-grey-500 ring-1 ring-grey-100">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ChevronDown className="h-4 w-4" strokeWidth={2} />
              )}
            </span>
            <span className="font-medium text-grey-900">{hotel.name}</span>
          </div>
        </TableCell>
        <TableCell className={`${dtCell} text-grey-600`}>
          {chainName ?? <span className="text-grey-400">Independent</span>}
        </TableCell>
        <TableCell className={dtCell}>
          {latestAssessment ? (
            <StatusBadge status={latestAssessment.status} />
          ) : (
            <span className="text-xs font-medium text-grey-400">None yet</span>
          )}
        </TableCell>
        <TableCell className={`${dtCell} text-right`}>
          {canMutate ? (
            <div className="flex justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-grey-600 hover:bg-grey-100 hover:text-grey-900"
                onClick={onEdit}
                aria-label="Edit hotel"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg text-grey-600 hover:bg-red-50 hover:text-destructive"
                onClick={onDelete}
                aria-label="Delete hotel"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span className="text-xs text-grey-400">—</span>
          )}
        </TableCell>
      </TableRow>

      {isExpanded && (
        <TableRow className="border-b border-grey-100/70 bg-surface/90 hover:bg-surface/90">
          <TableCell colSpan={4} className="p-0">
            <div className="space-y-4 border-t border-grey-100 px-5 py-5 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              {assessments.length === 0 ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-small text-grey-600">
                    No inbox assessments for this property yet.
                  </p>
                  <Button
                    size="sm"
                    className="w-full shrink-0 rounded-lg sm:w-auto"
                    onClick={onNewAssessment}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New assessment
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-small font-medium text-grey-900">
                      {assessments.length} run{assessments.length !== 1 ? 's' : ''}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-lg sm:w-auto"
                      onClick={onNewAssessment}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New assessment
                    </Button>
                  </div>
                  <ul className="grid gap-2">
                    {assessments.map((a) => (
                      <li key={a.assessment_id}>
                        <div className="w-full rounded-xl border border-grey-100 bg-white p-4 shadow-sm">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-small text-grey-600">
                              <Mail className="h-4 w-4 shrink-0 text-grey-400" />
                              <span className="truncate font-medium text-grey-900">
                                {a.mailbox_email}
                              </span>
                              <span className="text-grey-400">·</span>
                              <span>{a.lookback_days} days</span>
                              {a.created_at && (
                                <>
                                  <span className="text-grey-400">·</span>
                                  <span>
                                    {new Date(a.created_at).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </>
                              )}
                            </div>
                            <StatusBadge status={a.status} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Hotels section ────────────────────────────────────────────────────────────

export function HotelsSection({ isAdmin }: { isAdmin: boolean }) {
  const queryClient = useQueryClient();

  const { data: chains = [] } = useQuery({
    queryKey: ['reportSubjects', 'chains'],
    queryFn: () => reportAssessmentsService.listChains(),
  });

  const [chainFilter, setChainFilter] = useState('all');
  const chainForApi =
    chainFilter === 'all' || chainFilter === 'independent' ? undefined : chainFilter;

  const { data: hotelsRaw = [], isLoading } = useQuery({
    queryKey: ['reportSubjects', 'hotels', chainForApi ?? 'all'],
    queryFn: () => reportAssessmentsService.listHotels(chainForApi),
  });

  const hotels = useMemo(
    () => (chainFilter === 'independent' ? hotelsRaw.filter((h) => !h.chain_id) : hotelsRaw),
    [hotelsRaw, chainFilter],
  );

  const { data: assessmentsData } = useQuery({
    queryKey: ['reportAssessments', 'list', 'all'],
    queryFn: () => reportAssessmentsService.listAssessments(),
  });

  const assessmentsByHotel = useMemo(() => {
    const m = new Map<string, AssessmentListItem[]>();
    for (const a of assessmentsData?.assessments ?? []) {
      if (!a.report_hotel_id) continue;
      const arr = m.get(a.report_hotel_id) ?? [];
      arr.push(a);
      m.set(a.report_hotel_id, arr);
    }
    for (const [k, v] of m) {
      m.set(
        k,
        [...v].sort((a, b) => {
          const da = a.created_at ? new Date(a.created_at).getTime() : 0;
          const db = b.created_at ? new Date(b.created_at).getTime() : 0;
          return db - da;
        }),
      );
    }
    return m;
  }, [assessmentsData]);

  const chainNameById = useMemo(() => {
    const m = new Map<string, string>();
    chains.forEach((c) => m.set(c.id, c.name));
    return m;
  }, [chains]);

  // Mutations
  const createHotel = useMutation({
    mutationFn: (payload: { name: string; chain_id: string | null }) =>
      reportAssessmentsService.createHotel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Hotel created.');
      setCreateOpen(false);
      setNewName('');
      setNewChainId('none');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create hotel.'),
  });

  const updateHotel = useMutation({
    mutationFn: ({
      id,
      name,
      chain_id,
    }: {
      id: string;
      name: string;
      chain_id: string | null;
    }) => reportAssessmentsService.updateHotel(id, { name, chain_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Saved.');
      setEditHotel(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Update failed.'),
  });

  const deleteHotel = useMutation({
    mutationFn: (id: string) => reportAssessmentsService.deleteHotel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reportSubjects'] });
      toast.success('Hotel deleted.');
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Delete failed.'),
  });

  const createAssessment = useMutation({
    mutationFn: reportAssessmentsService.createAssessment,
    onSuccess: (res, vars) => {
      queryClient.invalidateQueries({ queryKey: ['reportAssessments'] });
      setExpandedId(vars.report_hotel_id);
      setAssessmentHotel(null);
      setPostCreate({ consentUrl: res.consent_url, hotelName: vars.hotel_name });
      toast.success('Assessment created.');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create assessment.'),
  });

  // Dialog/accordion state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newChainId, setNewChainId] = useState('none');
  const [editHotel, setEditHotel] = useState<{
    id: string;
    name: string;
    chain_id: string | null;
  } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assessmentHotel, setAssessmentHotel] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [postCreate, setPostCreate] = useState<{
    consentUrl: string;
    hotelName: string;
  } | null>(null);
  const [mailbox, setMailbox] = useState('');
  const [lookback, setLookback] = useState('60');

  const openNewAssessment = (hotel: { id: string; name: string }) => {
    setPostCreate(null);
    setAssessmentHotel(hotel);
    setMailbox('');
    setLookback('60');
  };

  const handleCreateAssessment = () => {
    if (!assessmentHotel) return;
    const email = mailbox.trim();
    if (!email) {
      toast.error('Mailbox email is required.');
      return;
    }
    createAssessment.mutate({
      hotel_name: assessmentHotel.name,
      mailbox_email: email,
      lookback_days: parseInt(lookback, 10),
      report_hotel_id: assessmentHotel.id,
    });
  };

  return (
    <>
      <Card className="overflow-hidden  shadow-sm">
        <CardHeader className="flex flex-col gap-3  sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="text-h6 font-semibold ">Hotels</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger  className="w-[200px] rounded-lg ">
                <SelectValue placeholder="Filter by chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All hotels</SelectItem>
                <SelectItem value="independent">Independent (no chain)</SelectItem>
                {chains.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isAdmin && (
              <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New hotel
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="">
          {isLoading ? (
            <div className="p-5">
              <Skeleton className="h-28 w-full rounded-lg" />
            </div>
          ) : hotels.length === 0 ? (
            <div className="px-5 py-12">
              <p className="text-small font-medium ">No hotels in this view</p>
              <p className="mt-1 text-xs ">Try another filter or add a hotel.</p>
            </div>
          ) : (
            <div className={dtWrap}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-grey-100 hover:bg-transparent">
                    <TableHead className={dtHead}>Property</TableHead>
                    <TableHead className={dtHead}>Chain</TableHead>
                    <TableHead className={`${dtHead} w-[168px]`}>Status</TableHead>
                    <TableHead className={`${dtHead} text-right w-[108px]`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotels.map((h) => {
                    const hotelAssessments = assessmentsByHotel.get(h.id) ?? [];
                    return (
                      <HotelRow
                        key={h.id}
                        hotel={h}
                        chainName={
                          h.chain_id ? (chainNameById.get(h.chain_id) ?? h.chain_id) : null
                        }
                        latestAssessment={hotelAssessments[0] ?? null}
                        assessments={hotelAssessments}
                        isExpanded={expandedId === h.id}
                        onToggle={() => setExpandedId((p) => (p === h.id ? null : h.id))}
                        onNewAssessment={() => openNewAssessment({ id: h.id, name: h.name })}
                        canMutate={isAdmin}
                        onEdit={() =>
                          setEditHotel({ id: h.id, name: h.name, chain_id: h.chain_id ?? null })
                        }
                        onDelete={() => setDeleteId(h.id)}
                      />
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create hotel */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create hotel</DialogTitle>
            <DialogDescription>Leave chain empty for an independent property.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-hotel-name">Name</Label>
              <Input
                id="new-hotel-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Grand Hotel Oslo"
                className="rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>Chain (optional)</Label>
              <Select value={newChainId} onValueChange={setNewChainId}>
                <SelectTrigger className='w-full '>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (independent)</SelectItem>
                  {chains.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() =>
                createHotel.mutate({
                  name: newName.trim(),
                  chain_id: newChainId === 'none' ? null : newChainId,
                })
              }
              disabled={createHotel.isPending}
            >
              {createHotel.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit hotel */}
      <Dialog open={Boolean(editHotel)} onOpenChange={(o) => !o && setEditHotel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit hotel</DialogTitle>
            <DialogDescription>
              Set chain to &quot;None&quot; to detach (independent hotel).
            </DialogDescription>
          </DialogHeader>
          {editHotel && (
            <>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={editHotel.name}
                  onChange={(e) => setEditHotel({ ...editHotel, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Chain</Label>
                <Select
                  value={editHotel.chain_id ?? 'none'}
                  onValueChange={(v) =>
                    setEditHotel({ ...editHotel, chain_id: v === 'none' ? null : v })
                  }
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (independent)</SelectItem>
                    {chains.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={() =>
                    updateHotel.mutate({
                      id: editHotel.id,
                      name: editHotel.name.trim(),
                      chain_id: editHotel.chain_id,
                    })
                  }
                  disabled={updateHotel.isPending}
                >
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete hotel */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this hotel?</AlertDialogTitle>
            <AlertDialogDescription>
              Removes the hotel from the shared catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteHotel.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assessment / consent URL */}
      <Dialog
        open={assessmentHotel !== null || postCreate !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAssessmentHotel(null);
            setPostCreate(null);
          }
        }}
      >
        <DialogContent>
          {postCreate ? (
            <>
              <DialogHeader>
                <DialogTitle>Consent link</DialogTitle>
                <DialogDescription>
                  Assessment created for{' '}
                  <span className="font-medium text-foreground">{postCreate.hotelName}</span>.
                  Track progress by expanding the hotel row.
                </DialogDescription>
              </DialogHeader>
              <ConsentUrlBlock consentUrl={postCreate.consentUrl} />
              <DialogFooter>
                <Button onClick={() => setPostCreate(null)}>Done</Button>
              </DialogFooter>
            </>
          ) : assessmentHotel ? (
            <>
              <DialogHeader>
                <DialogTitle>Inbox assessment</DialogTitle>
                <DialogDescription>
                  Mailbox and lookback for{' '}
                  <span className="font-medium text-foreground">{assessmentHotel.name}</span>.
                  After creating, you will get a consent link to share with the hotel&apos;s IT
                  contact.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="assessment-mailbox">Mailbox email</Label>
                  <Input
                    id="assessment-mailbox"
                    type="email"
                    placeholder="e.g. info@hotel.com"
                    value={mailbox}
                    onChange={(e) => setMailbox(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time period</Label>
                  <Select value={lookback} onValueChange={setLookback}>
                    <SelectTrigger className='w-full'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="60">Last 60 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setAssessmentHotel(null)}
                  disabled={createAssessment.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => void handleCreateAssessment()}
                  disabled={createAssessment.isPending}
                >
                  {createAssessment.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Create assessment
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
