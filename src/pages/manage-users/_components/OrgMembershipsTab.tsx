import { useState, useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/data-table/data-table';
import { organizationService, type OrgMember } from '@/services/organizations/organizations';
import { type OrgRole } from '@/services/manageUsers/manageUsers';

import { useUsersData } from './types';
import { UserCell } from './UserCell';
import { SearchableSelect } from './SearchableSelect';

export function OrgMembershipsTab() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | undefined>(undefined);
  const qc = useQueryClient();

  const { data: usersData, isLoading: orgsLoading } = useUsersData();
  const orgs = usersData?.orgs ?? [];

  const { data: members = [], isLoading: membersLoading } = useQuery<OrgMember[]>({
    queryKey: ['org-members', selectedOrgId],
    queryFn: () => organizationService.getMembers(selectedOrgId!),
    enabled: !!selectedOrgId,
    staleTime: 30_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: OrgRole }) =>
      organizationService.updateMemberRole(selectedOrgId!, uid, role),
    onSuccess: (_, { uid, role }) => {
      toast.success('Role updated');
      qc.setQueryData<OrgMember[]>(['org-members', selectedOrgId], (prev) =>
        prev?.map((m) => (m.uid === uid ? { ...m, role } : m)) ?? [],
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update role'),
  });

  const removeMutation = useMutation({
    mutationFn: (uid: string) => organizationService.removeMember(selectedOrgId!, uid),
    onSuccess: (_, uid) => {
      toast.success('Member removed');
      qc.setQueryData<OrgMember[]>(['org-members', selectedOrgId], (prev) =>
        prev?.filter((m) => m.uid !== uid) ?? [],
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to remove member'),
  });

  const columns = useMemo<ColumnDef<OrgMember>[]>(
    () => [
      {
        id: 'user',
        accessorFn: (r) => `${r.first_name ?? ''} ${r.last_name ?? ''} ${r.email ?? ''}`,
        header: 'User',
        size: 280,
        cell: ({ row }) => {
          const { first_name, last_name, email } = row.original;
          const name = [first_name, last_name].filter(Boolean).join(' ') || email?.split('@')[0] || '—';
          return <UserCell displayName={name} email={email ?? ''} />;
        },
      },
      {
        id: 'status',
        header: 'Status',
        size: 100,
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'} className="text-xs">
            {row.original.status}
          </Badge>
        ),
      },
      {
        id: 'role',
        header: 'Role',
        size: 160,
        cell: ({ row }) => {
          const { uid, role } = row.original;
          return (
            <Select
              value={role}
              onValueChange={(v) => roleMutation.mutate({ uid, role: v as OrgRole })}
              disabled={roleMutation.isPending}
            >
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="orgAdmin">Org Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
              </SelectContent>
            </Select>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        size: 90,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => removeMutation.mutate(row.original.uid)}
            disabled={removeMutation.isPending}
          >
            Remove
          </Button>
        ),
      },
    ],
    [roleMutation.isPending, removeMutation.isPending],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Organization</span>
        <SearchableSelect
          value={selectedOrgId ?? ''}
          onValueChange={(v) => setSelectedOrgId(v || undefined)}
          options={orgs.map((o) => ({ value: o.id, label: o.name }))}
          placeholder="Select an organization..."
          searchPlaceholder="Search organizations..."
          emptyMessage="No organizations found."
          disabled={orgsLoading}
          className="w-72"
        />
      </div>

      {!selectedOrgId && (
        <p className="text-sm text-muted-foreground">Select an organization to view its members.</p>
      )}

      {selectedOrgId && membersLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading members…
        </div>
      )}

      {selectedOrgId && !membersLoading && (
        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={members}
              filterPlaceholder="Filter members..."
              emptyMessage="No members found."
              enableGlobalFilter={true}
              enablePagination={false}
              getRowId={(row) => row.uid}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
