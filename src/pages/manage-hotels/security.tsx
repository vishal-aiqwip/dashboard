import { useMemo, useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, Loader } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DataTable } from '@/components/data-table/data-table';
import { securityService } from '@/services/security/security';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgMFARow = {
  org: OrgBrief;
  require2fa: boolean;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const qc = useQueryClient();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState<Set<string>>(new Set());

  // ── Single query: fetch all orgs + their MFA settings in parallel ──
  const { data: tableData = [], isLoading, error } = useQuery<OrgMFARow[]>({
    queryKey: ['security-orgs-mfa'],
    queryFn: async () => {
      const orgs = await organizationService.listAll();
      const rows = await Promise.all(
        orgs.map(async (org) => {
          try {
            const { require_2fa } = await securityService.getMFASettings(org.id);
            return { org, require2fa: require_2fa };
          } catch {
            return { org, require2fa: false };
          }
        }),
      );
      return rows;
    },
    staleTime: 60_000,
  });

  // ── Mutation ──
  const mfaMutation = useMutation({
    mutationFn: ({ orgId, require2fa }: { orgId: string; require2fa: boolean }) =>
      securityService.updateMFASettings(orgId, require2fa),
    onSuccess: (result, { orgId, require2fa }) => {
      toast.success(
        `MFA ${require2fa ? 'enabled' : 'disabled'} — ${result.users_updated} user${result.users_updated === 1 ? '' : 's'} affected`,
      );
      qc.setQueryData<OrgMFARow[]>(['security-orgs-mfa'], (prev) =>
        prev?.map((r) => (r.org.id === orgId ? { ...r, require2fa } : r)) ?? [],
      );
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to update MFA settings'),
  });

  const handleToggle = (orgId: string, require2fa: boolean) => {
    setPending((p) => new Set(p).add(orgId));
    mfaMutation.mutate(
      { orgId, require2fa },
      {
        onSettled: () =>
          setPending((p) => {
            const n = new Set(p);
            n.delete(orgId);
            return n;
          }),
      },
    );
  };

  // ── Selected rows ──
  const selectedRows = useMemo(
    () => tableData.filter((row) => rowSelection[row.org.id] === true),
    [tableData, rowSelection],
  );
  const someSelected = selectedRows.length > 0;

  const handleBulkEnable = () =>
    selectedRows.forEach((row) => {
      if (!row.require2fa) handleToggle(row.org.id, true);
    });

  const handleBulkDisable = () =>
    selectedRows.forEach((row) => {
      if (row.require2fa) handleToggle(row.org.id, false);
    });

  // ── Stats ──
  const mfaEnabledCount = tableData.filter((r) => r.require2fa).length;

  // ── Column defs ──
  const columns = useMemo<ColumnDef<OrgMFARow>[]>(
    () => [
      {
        id: 'select',
        size: 40,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label={`Select ${row.original.org.name}`}
          />
        ),
      },
      {
        id: 'organization',
        accessorFn: (r) => r.org.name,
        header: 'Organization',
        size: 360,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.org.name}</span>
        ),
      },
      {
        id: 'mfa',
        size: 180,
        enableSorting: false,
        header: () => <span className="flex justify-center">MFA Required</span>,
        cell: ({ row }) => {
          const { org, require2fa } = row.original;
          const isPending = pending.has(org.id);
          return (
            <div className="flex items-center justify-center gap-2">
              <Badge variant={require2fa ? 'default' : 'secondary'} className="text-xs w-16 justify-center">
                {require2fa ? 'On' : 'Off'}
              </Badge>
              <Switch
                checked={require2fa}
                disabled={isPending}
                onCheckedChange={(enabled) => handleToggle(org.id, enabled)}
              />
            </div>
          );
        },
      },
    ],
    [pending],
  );

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h2 className="text-2xl font-semibold">Security</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading security settings: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h2 className="text-2xl font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground">
          Manage two-factor authentication requirements per organization. Select multiple organizations to bulk-enable or disable MFA.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">MFA Enabled</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Badge variant={mfaEnabledCount > 0 ? 'default' : 'secondary'} className="text-xs">
                {mfaEnabledCount}/{tableData.length} organizations
              </Badge>
              {tableData.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {Math.round((mfaEnabledCount / tableData.length) * 100)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <ShieldOff className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">MFA Disabled</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Badge variant="secondary" className="text-xs">
                {tableData.length - mfaEnabledCount}/{tableData.length} organizations
              </Badge>
              {tableData.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(((tableData.length - mfaEnabledCount) / tableData.length) * 100)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2  text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading security settings…
        </div>
      )}

      {!isLoading && (
        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={tableData}
              filterPlaceholder="Filter organizations..."
              emptyMessage="No organizations found."
              enableGlobalFilter={true}
              enablePagination={false}
              rowSelection={rowSelection}
              onRowSelectionChange={setRowSelection}
              getRowId={(row) => row.org.id}
              enableRowSelection={true}
              toolbarContent={
                someSelected ? (
                  <>
                    <Badge className="text-sm">{selectedRows.length} selected</Badge>
                    <div className="h-5 w-px bg-border" />
                    <span className="text-xs font-medium text-muted-foreground">MFA</span>
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={handleBulkEnable}
                      disabled={mfaMutation.isPending}
                    >
                      Enable
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs"
                      onClick={handleBulkDisable}
                      disabled={mfaMutation.isPending}
                    >
                      Disable
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRowSelection({})}>
                      Clear
                    </Button>
                  </>
                ) : undefined
              }
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
