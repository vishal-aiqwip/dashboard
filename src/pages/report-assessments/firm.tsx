import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Loader2, Pencil, Plus, Trash2, Upload, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';

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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAppSelector } from '@/redux';
import {
  reportAssessmentsService,
  type ConsultantWorkspace,
  type ConsultantWorkspaceMember,
} from '@/services/reportAssessments/reportAssessments';

// ── Style helpers ─────────────────────────────────────────────────────────────

const dtHead =
  'h-11 bg-surface/90 px-4 text-left text-[0.7rem] font-semibold uppercase tracking-wider text-grey-500 first:pl-5 last:pr-5';
const dtRow = 'border-b border-grey-100/70 transition-colors hover:bg-surface/80 last:border-b-0';
const dtCell = 'px-4 py-3.5 align-middle text-small first:pl-5 last:pr-5';
const dtCellRight = `${dtCell} text-right`;

// ── Workspace List (Admin) ─────────────────────────────────────────────────────

function WorkspaceList({
  onSelect,
}: {
  onSelect: (workspace: ConsultantWorkspace) => void;
}) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: workspaces = [], isLoading } = useQuery({
    queryKey: ['consultantWorkspaces'],
    queryFn: () => reportAssessmentsService.listWorkspaces(),
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => reportAssessmentsService.createWorkspace({ name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces'] });
      toast.success('Firm created.');
      setNewName('');
      setCreateOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to create firm.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportAssessmentsService.deleteWorkspace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces'] });
      toast.success('Firm deleted.');
      setDeleteId(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to delete firm.'),
  });

  const handleCreate = async () => {
    const n = newName.trim();
    if (!n) { toast.error('Name is required.'); return; }
    createMutation.mutate(n);
  };

  return (
    <div className="p-6  space-y-6 w-full">
      <div className="space-y-1">
        <h2 className="text-h6 font-semibold tracking-tight">Firms</h2>
        <p className="text-small leading-relaxed ">
          Consultant firms with workspace access to report assessments.
        </p>
      </div>

      <Card className="overflow-hidden  shadow-sm w-full">
        <CardHeader className="flex flex-col gap-3  sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="font-semibold ">All Firms</CardTitle>
          <Button size="sm" className="rounded-lg" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Firm
          </Button>
        </CardHeader>
        <CardContent className="">
          {isLoading ? (
            <div className="p-5 space-y-3">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : workspaces.length === 0 ? (
            <div className="px-5 py-12 text-left">
              <p className="text-small font-medium ">No firms yet</p>
              <p className="mt-1 text-xs ">Create a firm to manage consultant workspace access.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-grey-100">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-grey-100 hover:bg-transparent">
                    <TableHead className={dtHead}>Firm Name</TableHead>
                    <TableHead className={dtHead}>Created</TableHead>
                    <TableHead className={`${dtHead} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspaces.map((ws) => (
                    <TableRow
                      key={ws.id}
                      className={`${dtRow} cursor-pointer`}
                      onClick={() => onSelect(ws)}
                    >
                      <TableCell className={`${dtCell} font-medium text-grey-900`}>
                        <div className="flex items-center gap-3">
                          {ws.logo_url ? (
                            <img
                              src={ws.logo_url}
                              alt={ws.name}
                              className="h-8 w-8 rounded-md object-contain border border-grey-100"
                            />
                          ) : (
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface text-grey-400 ring-1 ring-grey-100">
                              <Building2 className="h-4 w-4" />
                            </span>
                          )}
                          {ws.name}
                        </div>
                      </TableCell>
                      <TableCell className={`${dtCell} text-grey-600`}>
                        {ws.created_at
                          ? new Date(ws.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className={dtCellRight}>
                        <div
                          className="flex justify-end gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-grey-600 hover:bg-grey-100 hover:text-grey-900"
                            onClick={() => onSelect(ws)}
                            aria-label="View firm"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-grey-600 hover:bg-red-50 hover:text-destructive"
                            onClick={() => setDeleteId(ws.id)}
                            aria-label="Delete firm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-h6 font-semibold text-grey-900">Create Firm</DialogTitle>
            <DialogDescription className="text-small text-grey-700">
              Add a consultant firm workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="new-firm-name" className="text-small font-medium text-grey-900">
              Name
            </Label>
            <Input
              id="new-firm-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nordic Consulting Group"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="h-11 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this firm?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the firm workspace and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Workspace Panel (Detail View) ─────────────────────────────────────────────

function WorkspacePanel({
  workspaceId,
  onBack,
}: {
  workspaceId: string;
  onBack: () => void;
}) {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [editName, setEditName] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const { data: workspace, isLoading: wsLoading } = useQuery({
    queryKey: ['consultantWorkspaces', workspaceId],
    queryFn: () => reportAssessmentsService.getWorkspace(workspaceId),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['consultantWorkspaces', workspaceId, 'members'],
    queryFn: () => reportAssessmentsService.getWorkspaceMembers(workspaceId),
  });

  const updateMutation = useMutation({
    mutationFn: (name: string) => reportAssessmentsService.updateWorkspace(workspaceId, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces'] });
      toast.success('Name updated.');
      setEditName(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Update failed.'),
  });

  const uploadLogoMutation = useMutation({
    mutationFn: (file: File) => reportAssessmentsService.uploadWorkspaceLogo(workspaceId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces', workspaceId] });
      toast.success('Logo updated.');
    },
    onError: (e: Error) => toast.error(e.message || 'Logo upload failed.'),
  });

  const deleteLogoMutation = useMutation({
    mutationFn: () => reportAssessmentsService.deleteWorkspaceLogo(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces', workspaceId] });
      toast.success('Logo removed.');
    },
    onError: (e: Error) => toast.error(e.message || 'Logo removal failed.'),
  });

  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      reportAssessmentsService.inviteWorkspaceMember(workspaceId, { email, role: 'member' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces', workspaceId, 'members'] });
      toast.success('Invitation sent.');
      setInviteEmail('');
      setInviteOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Invite failed.'),
  });

  const removeMutation = useMutation({
    mutationFn: (uid: string) => reportAssessmentsService.removeWorkspaceMember(workspaceId, uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantWorkspaces', workspaceId, 'members'] });
      toast.success('Member removed.');
      setRemoveMemberId(null);
    },
    onError: (e: Error) => toast.error(e.message || 'Remove failed.'),
  });

  if (wsLoading) {
    return (
      <div className="p-6 w-full space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6">
        <p className="text-small text-grey-600">Workspace not found.</p>
        <Button variant="ghost" size="sm" className="mt-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
    );
  }

  const getMemberName = (m: ConsultantWorkspaceMember) => {
    const name = [m.first_name, m.last_name].filter(Boolean).join(' ');
    return name || m.email;
  };

  return (
    <div className="p-6 w-full space-y-6">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        All Firms
      </Button>

      {/* Header card */}
      <Card className="overflow-hidden shadow-sm">
        <CardContent className="">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Logo */}
            <div className="flex flex-col items-center gap-2">
              {workspace.logo_url ? (
                <img
                  src={workspace.logo_url}
                  alt={workspace.name}
                  className="h-20 w-20 rounded-xl object-contain border border-grey-100 bg-white"
                />
              ) : (
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-surface text-grey-400 ring-1 ring-grey-100">
                  <Building2 className="h-8 w-8" />
                </span>
              )}
              <div className="flex gap-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogoMutation.mutate(file);
                    e.target.value = '';
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-grey-600"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadLogoMutation.isPending}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {uploadLogoMutation.isPending ? 'Uploading…' : 'Upload'}
                </Button>
                {workspace.logo_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-grey-600 hover:text-destructive"
                    onClick={() => deleteLogoMutation.mutate()}
                    disabled={deleteLogoMutation.isPending}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Name */}
            <div className="flex-1 space-y-2">
              {editName !== null ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 rounded-lg"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') updateMutation.mutate(editName.trim());
                      if (e.key === 'Escape') setEditName(null);
                    }}
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => updateMutation.mutate(editName.trim())}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditName(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-grey-900">{workspace.name}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-grey-500 hover:text-grey-900"
                    onClick={() => setEditName(workspace.name)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              {workspace.created_at && (
                <p className="text-xs text-grey-500">
                  Created{' '}
                  {new Date(workspace.created_at).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card className="overflow-hidden border-grey-100/90 shadow-sm">
        <CardHeader className="flex flex-col gap-3  sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <CardTitle className="text-h6 font-semibold text-grey-900">Team Members</CardTitle>
          <Button size="sm" className="rounded-lg" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </CardHeader>
        <CardContent className="">
          {membersLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : members.length === 0 ? (
            <div className="px-5 py-10 text-left">
              <p className="text-small font-medium text-grey-900">No members yet</p>
              <p className="mt-1 text-xs text-grey-600">Invite team members to this firm.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-grey-100">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-grey-100 hover:bg-transparent">
                    <TableHead className={dtHead}>Name</TableHead>
                    <TableHead className={dtHead}>Email</TableHead>
                    <TableHead className={dtHead}>Role</TableHead>
                    <TableHead className={`${dtHead} text-right`}>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.uid} className={dtRow}>
                      <TableCell className={`${dtCell} font-medium text-grey-900`}>
                        {getMemberName(m)}
                      </TableCell>
                      <TableCell className={`${dtCell} text-grey-600`}>{m.email}</TableCell>
                      <TableCell className={dtCell}>
                        <Badge
                          variant="outline"
                          className={
                            m.role === 'workspaceAdmin'
                              ? 'border-blue-200 bg-blue-50 text-blue-900'
                              : 'border-grey-200 text-grey-700'
                          }
                        >
                          {m.role === 'workspaceAdmin' ? 'Admin' : 'Member'}
                        </Badge>
                      </TableCell>
                      <TableCell className={dtCellRight}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg text-grey-600 hover:bg-red-50 hover:text-destructive"
                          onClick={() => setRemoveMemberId(m.uid)}
                          aria-label="Remove member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-h6 font-semibold text-grey-900">Invite Member</DialogTitle>
            <DialogDescription className="text-small text-grey-700">
              Send an invite to join {workspace.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="invite-email" className="text-small font-medium text-grey-900">
              Email address
            </Label>
            <Input
              id="invite-email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@firm.com"
              onKeyDown={(e) => e.key === 'Enter' && inviteMutation.mutate(inviteEmail.trim())}
              className="h-11 rounded-lg"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => inviteMutation.mutate(inviteEmail.trim())}
              disabled={inviteMutation.isPending || !inviteEmail.trim()}
            >
              {inviteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirm */}
      <AlertDialog open={Boolean(removeMemberId)} onOpenChange={(o) => !o && setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this member?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to this firm's workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => removeMemberId && removeMutation.mutate(removeMemberId)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function FirmPage() {
  const { role } = useAppSelector((s) => s.session);
  const [selectedWorkspace, setSelectedWorkspace] = useState<ConsultantWorkspace | null>(null);

  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-md">
        <Card className="border border-grey-100 bg-white shadow-sm">
          <CardContent className="px-6 py-10 text-left">
            <p className="text-small leading-relaxed text-grey-700">
              Firm management is restricted to Altek admins. Contact your admin for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedWorkspace) {
    return (
      <WorkspacePanel
        workspaceId={selectedWorkspace.id}
        onBack={() => setSelectedWorkspace(null)}
      />
    );
  }

  return <WorkspaceList onSelect={setSelectedWorkspace} />;
}
