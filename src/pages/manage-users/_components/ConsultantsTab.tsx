import { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/data-table/data-table';
import { manageUsersService } from '@/services/manageUsers/manageUsers';

import { type MergedUser, type UsersData, USERS_QUERY_KEY, useUsersData } from './types';
import { UserCell } from './UserCell';
import { OrgBadges } from './OrgBadges';

export function ConsultantsTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useUsersData();
  const consultants = useMemo(() => data?.users.filter((u) => u.is_consultant) ?? [], [data]);
  const orgMap = data?.orgMap ?? new Map<string, string>();

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
        size: 280,
        cell: ({ row }) => <UserCell displayName={row.original.displayName} email={row.original.email} />,
      },
      {
        id: 'organizations',
        header: 'Organizations',
        cell: ({ row }) => <OrgBadges orgIds={Object.keys(row.original.org_roles)} orgMap={orgMap} />,
      },
      {
        id: 'consultant',
        header: 'Consultant',
        size: 120,
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
    ],
    [consultantMutation.isPending, orgMap],
  );

  return (
    <>
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading consultants…
        </div>
      )}
      {!isLoading && (
        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={consultants}
              filterPlaceholder="Filter consultants..."
              emptyMessage="No consultants found."
              enableGlobalFilter={true}
              enablePagination={false}
              getRowId={(row) => row.uid}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
