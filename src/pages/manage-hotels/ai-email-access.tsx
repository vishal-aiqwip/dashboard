import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isToday, isYesterday, differenceInDays } from 'date-fns';
import { Loader } from 'lucide-react';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

import {
  aiEmailAccessService,
  type AccessRequest,
  type IdpTenant,
  type TenantStatus,
} from '@/services/aiEmailAccess/aiEmailAccess';
import { organizationService } from '@/services/organizations/organizations';
import { SearchableSelect } from './_components/SearchableSelect';
import { InviteUserDialog } from './_components/InviteUserDialog';

/* ---------- helpers ---------- */

function fmtTs(ts?: string): string {
  if (!ts) return '—';
  try {
    const d = parseISO(ts);
    let datePart: string;
    if (isToday(d)) datePart = 'Today';
    else if (isYesterday(d)) datePart = 'Yesterday';
    else if (differenceInDays(new Date(), d) < 7) datePart = format(d, 'EEEE');
    else datePart = format(d, 'yyyy-MM-dd');
    return `${datePart} • ${format(d, 'HH:mm')}`;
  } catch {
    return ts;
  }
}

/* ---------- form type ---------- */

type ApprovalsForm = {
  userId: string;
  orgId: string;
  memberRole: 'orgAdmin' | 'member';
  tenantStatus: TenantStatus;
  tenantAutoLink: boolean;
  tenantAllowlist: string;
};

/* ========================================================================== */

export default function AiEmailAccessPage() {
  const qc = useQueryClient();

  const [tenantSearch, setTenantSearch] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false);

  /* ── data fetching ── */
  const tenantsQuery = useQuery({
    queryKey: ['ai-email', 'tenants', 'all'],
    queryFn: () => aiEmailAccessService.listTenants(),
  });
  const tenants: IdpTenant[] = tenantsQuery.data ?? [];

  const accessRequestsQuery = useQuery({
    queryKey: ['ai-email', 'access-requests', 'all', 'pending'],
    queryFn: () => aiEmailAccessService.listAccessRequests(undefined, 'pending'),
  });
  const allRequests: AccessRequest[] = accessRequestsQuery.data ?? [];

  const orgsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });
  const orgOptions = useMemo(
    () =>
      (orgsQuery.data ?? [])
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((o) => ({ value: o.id, label: o.name })),
    [orgsQuery.data],
  );

  const usersQuery = useQuery({
    queryKey: ['users-with-claims'],
    queryFn: aiEmailAccessService.listUsersWithClaims,
  });
  const userOptions = useMemo(
    () =>
      (usersQuery.data ?? [])
        .slice()
        .sort((a, b) => a.email.localeCompare(b.email))
        .map((u) => ({ value: u.uid, label: u.email })),
    [usersQuery.data],
  );

  /* ── derived state ── */
  const filteredTenants = useMemo(() => {
    if (!tenantSearch.trim()) return tenants;
    const q = tenantSearch.toLowerCase();
    return tenants.filter(
      (t) =>
        t.key.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        (t.requested_by_email ?? '').toLowerCase().includes(q),
    );
  }, [tenants, tenantSearch]);

  const pendingCountByTenant = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of allRequests) {
      if (r.state === 'pending') {
        const id = `msal:${r.tenant_id}`;
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [allRequests]);

  const selectedTenant = useMemo(
    () => tenants.find((t) => t.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId],
  );

  const tenantRequests = useMemo(
    () =>
      allRequests.filter(
        (r) => selectedTenant && `msal:${r.tenant_id}` === selectedTenant.id && r.state === 'pending',
      ),
    [allRequests, selectedTenant],
  );

  const selectedRequest = useMemo(
    () => tenantRequests.find((r) => r.id === selectedRequestId) ?? null,
    [tenantRequests, selectedRequestId],
  );

  /* ── form ── */
  const form = useForm<ApprovalsForm>({
    defaultValues: {
      userId: '',
      orgId: '',
      memberRole: 'member',
      tenantStatus: 'pending',
      tenantAutoLink: false,
      tenantAllowlist: '',
    },
  });

  const hydrateTenantPolicy = (tenant: IdpTenant | null) => {
    form.reset({
      ...form.getValues(),
      tenantStatus: tenant?.status ?? 'pending',
      tenantAutoLink: tenant?.auto_link ?? false,
      tenantAllowlist: (tenant?.allowlist_domains ?? []).join(', '),
    });
  };

  const onSelectTenant = (id: string) => {
    setSelectedTenantId(id);
    setSelectedRequestId(null);
    hydrateTenantPolicy(tenants.find((t) => t.id === id) ?? null);
  };

  useEffect(() => {
    if (selectedTenant) hydrateTenantPolicy(selectedTenant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenantId]);

  /* ── mutations ── */
  const updatePolicyMutation = useMutation({
    mutationFn: aiEmailAccessService.updateTenantPolicy,
    onSuccess: () => {
      toast.success('Tenant policy saved');
      qc.invalidateQueries({ queryKey: ['ai-email', 'tenants'] });
      setPolicyDialogOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRequestMutation = useMutation({
    mutationFn: aiEmailAccessService.updateAccessRequestState,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai-email', 'access-requests'] }),
  });

  const identityLinkMutation = useMutation({
    mutationFn: aiEmailAccessService.createIdentityLink,
  });

  const roleGrantMutation = useMutation({
    mutationFn: aiEmailAccessService.upsertRoleGrant,
  });

  /* ── save policy only ── */
  const onSavePolicyOnly = () => {
    if (!selectedTenant) return;
    const v = form.getValues();
    updatePolicyMutation.mutate({
      tenant_id: selectedTenant.id,
      status: v.tenantStatus,
      auto_link: v.tenantAutoLink,
      allowlist_domains: v.tenantAllowlist
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  /* ── approve ── */
  const onApprove = async () => {
    if (!selectedRequest || !selectedTenant) return;
    const v = form.getValues();
    if (!v.orgId || !v.userId || !v.memberRole) {
      toast.error('Select organization, user, and role first');
      return;
    }
    let desiredStatus = v.tenantStatus;
    if (v.tenantStatus === 'pending') {
      if (!window.confirm('Tenant is currently pending. Set tenant to Active and continue approval?')) return;
      desiredStatus = 'active';
      form.setValue('tenantStatus', 'active');
    }
    setIsApproving(true);
    try {
      await identityLinkMutation.mutateAsync({
        provider: 'msal',
        tenant_id: selectedTenant.id,
        user_oid: selectedRequest.user_oid,
        uid: v.userId,
        idp_email: selectedRequest.idp_email,
        idp_display_name: selectedRequest.idp_display_name,
      });
      await roleGrantMutation.mutateAsync({
        uid: v.userId,
        scope_type: 'org',
        scope_id: v.orgId,
        role: v.memberRole,
      });
      await aiEmailAccessService.updateTenantPolicy({
        tenant_id: selectedTenant.id,
        status: desiredStatus,
        auto_link: v.tenantAutoLink,
        allowlist_domains: v.tenantAllowlist.split(',').map((s) => s.trim()).filter(Boolean),
      });
      await updateRequestMutation.mutateAsync({ request_id: selectedRequest.id, state: 'approved' });
      toast.success('Request approved');
      qc.invalidateQueries({ queryKey: ['ai-email'] });
      setSelectedRequestId(null);
    } catch (e) {
      toast.error((e as Error).message ?? 'Approval failed');
    } finally {
      setIsApproving(false);
    }
  };

  /* ── reject ── */
  const onConfirmReject = async () => {
    if (!selectedRequest) return;
    const prevId = selectedRequest.id;
    setIsRejecting(true);
    try {
      await updateRequestMutation.mutateAsync({ request_id: prevId, state: 'rejected' });
      toast.success('Request rejected');
      setSelectedRequestId(null);
      qc.invalidateQueries({ queryKey: ['ai-email', 'access-requests'] });
    } catch (e) {
      toast.error((e as Error).message ?? 'Failed to reject');
    } finally {
      setIsRejecting(false);
      setRejectDialogOpen(false);
    }
  };

  /* ── render ── */
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Tenants */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tenants</CardTitle>
              <CardDescription>Manage IdP tenant status and policy</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!selectedTenant}
              onClick={() => setPolicyDialogOpen(true)}
            >
              Edit Policy
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <Input
                placeholder="Search tenants..."
                value={tenantSearch}
                onChange={(e) => setTenantSearch(e.target.value)}
              />
            </div>
            <div className="w-full overflow-x-auto">
              <div className="max-h-120 overflow-y-auto">
                <Table className="min-w-225">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Requested by</TableHead>
                      <TableHead className="w-72">Tenant</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pending Requests</TableHead>
                      <TableHead>Activated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenantsQuery.isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                          <Loader className="inline mr-2 size-4 animate-spin" />Loading tenants…
                        </TableCell>
                      </TableRow>
                    ) : filteredTenants.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-muted-foreground">
                          No tenants match your search
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTenants.map((t) => (
                        <TableRow
                          key={t.id}
                          className={selectedTenantId === t.id ? 'bg-muted/40' : 'cursor-pointer'}
                          onClick={() => onSelectTenant(t.id)}
                        >
                          <TableCell className="max-w-50 wrap-break-word py-3 text-sm">
                            {t.requested_by_email ?? '—'}
                          </TableCell>
                          <TableCell className="w-72 max-w-72 wrap-break-word py-3 font-mono text-xs text-muted-foreground">
                            {t.key}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant={
                                t.status === 'blocked'
                                  ? 'destructive'
                                  : t.status === 'active'
                                    ? 'default'
                                    : 'secondary'
                              }
                            >
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 text-sm">
                            {pendingCountByTenant[t.id] ?? 0}
                          </TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {t.activated_at
                              ? `${fmtTs(t.activated_at)}${t.activated_by ? ` • by ${t.activated_by}` : ''}`
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Requests */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Access Requests</CardTitle>
            <CardDescription>Recent requests for selected tenant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-x-auto">
              <div className="max-h-120 overflow-y-auto">
                <Table className="min-w-250">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Mailbox</TableHead>
                      <TableHead>Suggested Org</TableHead>
                      <TableHead>Requested on</TableHead>
                      <TableHead>Last updated</TableHead>
                      <TableHead>Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!selectedTenant ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-muted-foreground">
                          Select a tenant to view requests
                        </TableCell>
                      </TableRow>
                    ) : tenantRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-8 text-muted-foreground">
                          No pending requests
                        </TableCell>
                      </TableRow>
                    ) : (
                      tenantRequests.map((r) => (
                        <TableRow
                          key={r.id}
                          className={selectedRequestId === r.id ? 'bg-muted/40' : 'cursor-pointer'}
                          onClick={() => setSelectedRequestId(r.id)}
                        >
                          <TableCell className="max-w-45 wrap-break-word py-3 text-sm">{r.idp_email}</TableCell>
                          <TableCell className="max-w-45 wrap-break-word py-3 text-sm">{r.mailbox_email ?? '—'}</TableCell>
                          <TableCell className="max-w-37.5 wrap-break-word py-3 text-sm">{r.requested_org_name ?? r.domain ?? '—'}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">{fmtTs(r.created_at)}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">{fmtTs(r.updated_at)}</TableCell>
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            {r.approved_at ? `${fmtTs(r.approved_at)}${r.approved_by ? ` • by ${r.approved_by}` : ''}` : '—'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Request Detail */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Access Request Detail</CardTitle>
            <CardDescription>Link identity, user, and org; set tenant policy</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!selectedRequest ? (
              <p className="text-muted-foreground">Select a request to proceed</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <span>
                    <span className="font-medium">Requested by:</span>{' '}
                    {selectedRequest.idp_display_name ?? ''} ({selectedRequest.idp_email})
                  </span>
                  <span>
                    <span className="font-medium">Mailbox:</span>{' '}
                    {selectedRequest.mailbox_email ?? '—'}
                  </span>
                  <span>
                    <span className="font-medium">Tenant:</span> {selectedRequest.tenant_id}
                  </span>
                  <span>
                    <span className="font-medium">Domain:</span> {selectedRequest.domain ?? '—'}
                  </span>
                  <span>
                    <span className="font-medium">Requested on:</span> {fmtTs(selectedRequest.created_at)}
                  </span>
                </div>

                <Form {...form}>
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Controller
                        control={form.control}
                        name="orgId"
                        render={({ field }) => (
                          <SearchableSelect
                            label="Select Organization"
                            placeholder="Select an organization…"
                            options={orgOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                          <SearchableSelect
                            label="Select User"
                            placeholder="Select a user…"
                            options={userOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                      <Controller
                        control={form.control}
                        name="memberRole"
                        render={({ field }) => (
                          <SearchableSelect
                            label="Select Role"
                            placeholder="Select a role…"
                            options={[
                              { value: 'orgAdmin', label: 'Organization Admin' },
                              { value: 'member', label: 'Member' },
                            ]}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    {(!form.watch('orgId') || !form.watch('userId') || !form.watch('memberRole')) && (
                      <p className="text-xs text-muted-foreground">
                        Select organization, user, and role to enable approval
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" onClick={() => setInviteOpen(true)}>
                        Invite New User
                      </Button>

                      <Button
                        type="button"
                        disabled={
                          !selectedTenant ||
                          !form.watch('orgId') ||
                          !form.watch('userId') ||
                          !form.watch('memberRole') ||
                          isApproving
                        }
                        onClick={onApprove}
                      >
                        {isApproving && <Loader className="mr-2 size-4 animate-spin" />}
                        Approve Request
                      </Button>

                      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                        <AlertDialogTrigger asChild>
                          <Button type="button" variant="destructive" disabled={isRejecting}>
                            {isRejecting && <Loader className="mr-2 size-4 animate-spin" />}
                            Reject Request
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject this access request?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will mark the request as rejected. You can re-approve later by
                              changing its state from the backend if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={onConfirmReject} disabled={isRejecting}>
                              Confirm Reject
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </form>
                </Form>

                <InviteUserDialog
                  open={inviteOpen}
                  onOpenChange={setInviteOpen}
                  onInviteSuccess={() => usersQuery.refetch()}
                  initialInvite={{
                    first_name: selectedRequest.idp_display_name?.split(' ')[0] ?? '',
                    last_name: selectedRequest.idp_display_name?.split(' ').slice(1).join(' ') ?? '',
                    email: selectedRequest.idp_email,
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>

      {/* Tenant Policy Dialog */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tenant Policy</DialogTitle>
            <DialogDescription>
              {selectedTenant ? `Editing policy for: ${selectedTenant.key}` : 'Activate tenant and set policy'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <Controller
                control={form.control}
                name="tenantStatus"
                render={({ field }) => (
                  <SearchableSelect
                    label="Status"
                    placeholder="Select status"
                    options={[
                      { value: 'pending', label: 'Pending' },
                      { value: 'active', label: 'Active' },
                      { value: 'blocked', label: 'Blocked' },
                    ]}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <Controller
                control={form.control}
                name="tenantAutoLink"
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <Switch
                      id="auto-link"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <label htmlFor="auto-link" className="text-sm cursor-pointer">
                      Enable Auto-Link
                    </label>
                  </div>
                )}
              />

              <Controller
                control={form.control}
                name="tenantAllowlist"
                render={({ field }) => (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">
                      Allowlist Domains (comma separated)
                    </label>
                    <Textarea placeholder="hotel.com, brand.com" rows={3} {...field} />
                  </div>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setPolicyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={onSavePolicyOnly}
                  disabled={updatePolicyMutation.isPending}
                >
                  {updatePolicyMutation.isPending && <Loader className="mr-2 size-4 animate-spin" />}
                  Save Policy
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
