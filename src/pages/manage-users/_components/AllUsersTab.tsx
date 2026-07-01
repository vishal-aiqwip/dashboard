import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Users, ShieldCheck, Briefcase, Loader } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/data-table/data-table';
import { SearchableSelect } from './SearchableSelect';
import { manageUsersService, type GlobalRole, type OrgRole } from '@/services/manageUsers/manageUsers';

import { type MergedUser, type UsersData, USERS_QUERY_KEY, useUsersData } from './types';
import { StatCard } from './StatCard';
import { UserCell } from './UserCell';
import { OrgBadges } from './OrgBadges';

export function AllUsersTab() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useUsersData();
  const users = data?.users ?? [];
  const orgs = data?.orgs ?? [];
  const orgMap = data?.orgMap ?? new Map<string, string>();

  const adminCount = users.filter((u) => u.global_role === 'admin').length;
  const consultantCount = users.filter((u) => u.is_consultant).length;

  // ── Assign global role form state ──
  const [grUid, setGrUid] = useState('');
  const [grRole, setGrRole] = useState<GlobalRole>('user');

  // ── Assign org role form state ──
  const [orOrgId, setOrOrgId] = useState('');
  const [orUid, setOrUid] = useState('');
  const [orRole, setOrRole] = useState<OrgRole | ''>('');

  const globalRoleMutation = useMutation({
    mutationFn: () =>
      manageUsersService.upsertRoleGrant({ uid: grUid, scope_type: 'global', scope_id: 'global', role: grRole }),
    onSuccess: () => {
      toast.success('Global role assigned');
      qc.setQueryData<UsersData>(USERS_QUERY_KEY, (prev) =>
        prev ? { ...prev, users: prev.users.map((u) => (u.uid === grUid ? { ...u, global_role: grRole } : u)) } : prev,
      );
      setGrUid('');
      setGrRole('user');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to assign role'),
  });

  const orgRoleMutation = useMutation({
    mutationFn: () =>
      manageUsersService.upsertRoleGrant({ uid: orUid, scope_type: 'org', scope_id: orOrgId, role: orRole as OrgRole }),
    onSuccess: () => {
      toast.success('Organization role assigned');
      qc.invalidateQueries({ queryKey: ['org-members', orOrgId] });
      setOrOrgId('');
      setOrUid('');
      setOrRole('');
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to assign org role'),
  });

  // ── Inline table mutations ──
  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: GlobalRole }) =>
      manageUsersService.upsertRoleGrant({ uid, scope_type: 'global', scope_id: 'global', role }),
    onSuccess: (_, { uid, role }) => {
      toast.success('Role updated');
      qc.setQueryData<UsersData>(USERS_QUERY_KEY, (prev) =>
        prev ? { ...prev, users: prev.users.map((u) => (u.uid === uid ? { ...u, global_role: role } : u)) } : prev,
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update role'),
  });

  const consultantMutation = useMutation({
    mutationFn: ({ uid, is_consultant }: { uid: string; is_consultant: boolean }) =>
      manageUsersService.toggleConsultant(uid, is_consultant),
    onSuccess: (_, { uid, is_consultant }) => {
      toast.success(is_consultant ? 'Consultant enabled' : 'Consultant removed');
      qc.setQueryData<UsersData>(USERS_QUERY_KEY, (prev) =>
        prev ? { ...prev, users: prev.users.map((u) => (u.uid === uid ? { ...u, is_consultant } : u)) } : prev,
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update consultant status'),
  });

  const columns = useMemo<ColumnDef<MergedUser>[]>(
    () => [
      {
        id: 'user',
        accessorFn: (r) => `${r.displayName} ${r.email}`,
        header: 'User',
        size: 260,
        cell: ({ row }) => <UserCell displayName={row.original.displayName} email={row.original.email} />,
      },
      {
        id: 'global_role',
        header: 'Global Role',
        size: 160,
        cell: ({ row }) => {
          const { uid, global_role } = row.original;
          return (
            <Select
              value={global_role}
              onValueChange={(role) => roleMutation.mutate({ uid, role: role as GlobalRole })}
              disabled={roleMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        id: 'consultant',
        header: 'Consultant',
        size: 110,
        cell: ({ row }) => {
          const { uid, is_consultant } = row.original;
          return (
            <Switch
              checked={is_consultant}
              onCheckedChange={(v) => consultantMutation.mutate({ uid, is_consultant: v })}
              disabled={consultantMutation.isPending}
            />
          );
        },
      },
      {
        id: 'organizations',
        header: 'Organizations',
        cell: ({ row }) => <OrgBadges orgIds={Object.keys(row.original.org_roles)} orgMap={orgMap} />,
      },
    ],
    [roleMutation.isPending, consultantMutation.isPending, orgMap],
  );

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-600">Error loading users: {(error as Error).message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 grid-cols-3 ">
        <StatCard icon={Users} label="Total Users" value={users.length} />
        <StatCard icon={ShieldCheck} label="Admins" value={adminCount} />
        <StatCard icon={Briefcase} label="Consultants" value={consultantCount} />
      </div>

      {/* Assign Global Role */}
      <Card>
        <CardContent className="">
          <p className="font-semibold text-base mb-0.5">Assign Global Role</p>
          <p className="text-sm text-muted-foreground mb-4">Set global admin or user role for any user.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5 min-w-48 flex-1">
              <label className="text-sm font-medium">Select User</label>
              <SearchableSelect
                value={grUid}
                onValueChange={setGrUid}
                options={users.map((u) => ({ value: u.uid, label: `${u.displayName} — ${u.email}` }))}
                placeholder="Select a user..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found."
              />
            </div>
            <div className="grid gap-1.5 min-w-40 flex-1">
              <label className="text-sm font-medium">Select Global Role</label>
              <Select value={grRole} onValueChange={(v) => setGrRole(v as GlobalRole)}>
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => globalRoleMutation.mutate()} disabled={!grUid || globalRoleMutation.isPending}>
                {globalRoleMutation.isPending && <Loader className="h-4 w-4 animate-spin" />}
                Assign Global Role
              </Button>
              <Button variant="outline" onClick={() => { setGrUid(''); setGrRole('user'); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assign Org Role */}
      <Card>
        <CardContent className="">
          <p className="font-semibold text-base mb-0.5">Assign Organization Role</p>
          <p className="text-sm text-muted-foreground mb-4">Select organization, user and role, then assign.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5 min-w-48 flex-1">
              <label className="text-sm font-medium">Select Organization</label>
              <SearchableSelect
                value={orOrgId}
                onValueChange={setOrOrgId}
                options={orgs.map((o) => ({ value: o.id, label: o.name }))}
                placeholder="Select an organization..."
                searchPlaceholder="Search organizations..."
                emptyMessage="No organizations found."
              />
            </div>
            <div className="grid gap-1.5 min-w-48 flex-1">
              <label className="text-sm font-medium">Select User</label>
              <SearchableSelect
                value={orUid}
                onValueChange={setOrUid}
                options={users.map((u) => ({ value: u.uid, label: `${u.displayName} — ${u.email}` }))}
                placeholder="Select a user..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found."
              />
            </div>
            <div className="grid gap-1.5 min-w-40 flex-1">
              <label className="text-sm font-medium">Select Org Role</label>
              <Select value={orRole} onValueChange={(v) => setOrRole(v as OrgRole)}>
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder="Select a role..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="orgAdmin">Org Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => orgRoleMutation.mutate()}
                disabled={!orOrgId || !orUid || !orRole || orgRoleMutation.isPending}
              >
                {orgRoleMutation.isPending && <Loader className="h-4 w-4 animate-spin" />}
                Assign Org Role
              </Button>
              <Button variant="outline" onClick={() => { setOrOrgId(''); setOrUid(''); setOrRole(''); }}>Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading users…
        </div>
      )}
      {!isLoading && (
        <Card>
          <CardContent>
            <div>
              <h2 className="text-xl font-semibold">Users List </h2>
              
            </div>
            <DataTable
              columns={columns}
              data={users}
              filterPlaceholder="Filter users..."
              emptyMessage="No users found."
              enableGlobalFilter={true}
              enablePagination={true}
              getRowId={(row) => row.uid}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
