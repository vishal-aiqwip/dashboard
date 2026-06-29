import { useMemo, useState, useCallback } from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  CheckCircle2, AlertTriangle, Circle, Search,
  Plug, Mail, Bot, CalendarCheck, Star, Users, Inbox,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { axiosApi } from '@/lib/axios';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

// ─── Types ────────────────────────────────────────────────────────────────────

type BetaFeature = {
  id: string;
  name: string;
  organizations: string[];
};

type HotelEmailRouting = {
  organization_id: string;
  organization_name: string | null;
  processing_version: 'v1' | 'v2';
  has_email_settings: boolean;
};

type ReadinessReport = {
  organization_id: string;
  ready: boolean;
  unavailable?: boolean;
  checks?: {
    email_settings: { ok: boolean; detail?: string };
    knowledge_base: { ok: boolean; namespace?: string | null; detail?: string };
    pms_tools: { ok: boolean; systems?: string[]; detail?: string };
    taxonomy: { status: 'ready' | 'generating' | 'empty' | 'error'; count: number; detail?: string };
  };
};

type ReadinessVisual =
  | 'safe' | 'warn' | 'generating' | 'ready' | 'attention' | 'unavailable' | 'unknown';

type OrgTableRow = {
  org: OrgBrief;
  featureAccess: Record<string, boolean>;
  hotel?: HotelEmailRouting;
};

const FEATURE_ICONS: Record<string, LucideIcon> = {
  integrations: Plug,
  emailSettings: Mail,
  aiEmail: Bot,
  bookingAssistant: CalendarCheck,
  reviewsReports: Star,
  users: Users,
};
const getFeatureIcon = (name: string): LucideIcon => FEATURE_ICONS[name] ?? Star;

// ─── Readiness helpers ────────────────────────────────────────────────────────

function deriveReadinessVisual({ isV2, readiness }: { isV2: boolean; readiness?: ReadinessReport }): ReadinessVisual {
  if (!readiness) return 'unknown';
  if (readiness.unavailable) return 'unavailable';
  if (!isV2) return readiness.ready ? 'safe' : 'warn';
  const tax = readiness.checks?.taxonomy?.status;
  if (tax === 'generating') return 'generating';
  if (readiness.ready && tax === 'ready') return 'ready';
  if (!readiness.ready) return 'attention';
  return 'ready';
}

// ─── Sub-components ───────────────────────────────────────────────────────────


function ReadinessIcon({ isV2, readiness }: { isV2: boolean; readiness?: ReadinessReport }) {
  const visual = deriveReadinessVisual({ isV2, readiness });

  const icon = (() => {
    switch (visual) {
      case 'safe':
      case 'ready':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warn':
      case 'attention':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'generating':
        return <Spinner className="size-4" />;
      case 'unavailable':
        return <Circle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  })();

  if (!icon) return null;

  const checks = readiness?.checks;
  const tip = !checks ? (
    <span>{visual === 'unavailable' ? 'v2 service unavailable' : 'Checks v2 readiness'}</span>
  ) : (
    <div className="space-y-1">
      {(
        [
          { ok: checks.email_settings.ok, label: `Email settings${checks.email_settings.detail ? ` — ${checks.email_settings.detail}` : ''}` },
          { ok: checks.knowledge_base.ok, label: `Knowledge base${checks.knowledge_base.namespace ? ` (${checks.knowledge_base.namespace})` : ''}` },
          { ok: checks.pms_tools.ok, label: `PMS tools${checks.pms_tools.systems?.length ? ` (${checks.pms_tools.systems.join(', ')})` : ''}` },
          { ok: checks.taxonomy.status === 'ready' || checks.taxonomy.status === 'empty', label: `Taxonomy: ${checks.taxonomy.status} (${checks.taxonomy.count})` },
        ] as { ok: boolean; label: string }[]
      ).map(({ ok, label }) => (
        <div key={label} className="flex items-start gap-1.5">
          {ok
            ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" />
            : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center">{icon}</span>
        </TooltipTrigger>
        <TooltipContent className="text-start max-w-72 text-xs">{tip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// EmailInboxCell is a component so it can call useQuery
function EmailInboxCell({
  orgId,
  hotel,
  emailPending,
  onToggle,
}: {
  orgId: string;
  hotel?: HotelEmailRouting;
  emailPending: boolean;
  onToggle: (hotel: HotelEmailRouting, enabled: boolean) => void;
}) {
  const { data: readiness } = useQuery<ReadinessReport>({
    queryKey: ['email-inbox-readiness', orgId],
    queryFn: async () => {
      const { data } = await axiosApi.get(
        `/api/email-inbox-routing/readiness?organization_id=${encodeURIComponent(orgId)}`,
      );
      return data.data as ReadinessReport;
    },
    enabled: !!hotel,
    staleTime: 30_000,
  });

  if (!hotel) return <span className="flex justify-center text-xs text-muted-foreground">—</span>;

  const isV2 = hotel.processing_version === 'v2';
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Badge variant={isV2 ? 'default' : 'secondary'} className="text-xs">
        {isV2 ? 'v2' : 'v1'}
      </Badge>
      <Switch
        checked={isV2}
        disabled={!hotel.has_email_settings || emailPending}
        onCheckedChange={(enabled) => onToggle(hotel, enabled)}
      />
      <ReadinessIcon isV2={isV2} readiness={readiness} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BetaFeaturesPage() {
  const qc = useQueryClient();
  const [featurePending, setFeaturePending] = useState<Set<string>>(new Set());
  const [pendingOrgIds, setPendingOrgIds] = useState<Set<string>>(new Set());
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // ── Queries ──
  const { data: features = [], isLoading, error } = useQuery<BetaFeature[]>({
    queryKey: ['beta-features'],
    queryFn: async () => {
      const { data } = await axiosApi.get('/api/beta-features');
      return (data?.data?.features ?? []) as BetaFeature[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: organizations = [] } = useQuery<OrgBrief[]>({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });

  const { data: hotels = [] } = useQuery<HotelEmailRouting[]>({
    queryKey: ['email-inbox-routing'],
    queryFn: async () => {
      const { data } = await axiosApi.get('/api/email-inbox-routing');
      return (data?.data?.hotels ?? []) as HotelEmailRouting[];
    },
    staleTime: 60_000,
  });

  // ── Mutations ──
  const featureMutation = useMutation({
    mutationFn: async (p: { featureName: string; organizationId: string; enabled: boolean }) => {
      const { data } = await axiosApi.post('/api/beta-features/access', p);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['beta-features'] }),
  });

  const emailMutation = useMutation({
    mutationFn: async (p: { organization_id: string; enabled: boolean }) => {
      const { data } = await axiosApi.post('/api/email-inbox-routing', p);
      return data;
    },
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ['email-inbox-routing'] });
      qc.invalidateQueries({ queryKey: ['email-inbox-readiness', v?.organization_id] });
    },
  });

  // ── Handlers ──
  const handleFeatureToggle = useCallback(
    (featureName: string, orgId: string, enabled: boolean) => {
      const key = `${featureName}:${orgId}`;
      setFeaturePending((p) => new Set(p).add(key));
      featureMutation.mutate(
        { featureName, organizationId: orgId, enabled },
        {
          onSuccess: () => toast.success(`${enabled ? 'Granted' : 'Revoked'} ${featureName} access`),
          onError: (e: Error) => toast.error(e.message || 'Failed to update feature'),
          onSettled: () =>
            setFeaturePending((p) => {
              const n = new Set(p);
              n.delete(key);
              return n;
            }),
        },
      );
    },
    [featureMutation],
  );

  const handleEmailToggle = useCallback(
    (hotel: HotelEmailRouting, enabled: boolean) => {
      setPendingOrgIds((p) => new Set(p).add(hotel.organization_id));
      emailMutation.mutate(
        { organization_id: hotel.organization_id, enabled },
        {
          onSuccess: () =>
            toast.success(`${hotel.organization_name ?? 'Hotel'} set to ${enabled ? 'v2' : 'v1'}`),
          onError: (e: Error) => toast.error(e.message || 'Failed to update email inbox routing'),
          onSettled: () =>
            setPendingOrgIds((p) => {
              const n = new Set(p);
              n.delete(hotel.organization_id);
              return n;
            }),
        },
      );
    },
    [emailMutation],
  );

  // ── Table data ──
  const tableData = useMemo<OrgTableRow[]>(
    () =>
      organizations.map((org) => ({
        org,
        featureAccess: Object.fromEntries(
          features.map((f) => [f.name, f.organizations.includes(org.id)]),
        ),
        hotel: hotels.find((h) => h.organization_id === org.id),
      })),
    [organizations, features, hotels],
  );

  // ── Column defs ──
  const columns = useMemo<ColumnDef<OrgTableRow>[]>(
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
        size: 200,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.org.name}</span>
        ),
      },
      ...features.map((f): ColumnDef<OrgTableRow> => ({
        id: f.name,
        size: 130,
        enableSorting: false,
        header: () => <span className="flex justify-center capitalize">{f.name}</span>,
        cell: ({ row }) => {
          const hasAccess = row.original.featureAccess[f.name] ?? false;
          const key = `${f.name}:${row.original.org.id}`;
          return (
            <div className="flex justify-center">
              <Switch
                checked={hasAccess}
                disabled={featurePending.has(key)}
                onCheckedChange={(enabled) =>
                  handleFeatureToggle(f.name, row.original.org.id, enabled)
                }
              />
            </div>
          );
        },
      })),
      {
        id: 'emailInbox',
        size: 160,
        enableSorting: false,
        header: () => <span className="flex justify-center">Email Inbox</span>,
        cell: ({ row }) => (
          <EmailInboxCell
            orgId={row.original.org.id}
            hotel={row.original.hotel}
            emailPending={pendingOrgIds.has(row.original.org.id)}
            onToggle={handleEmailToggle}
          />
        ),
      },
    ],
    [features, featurePending, pendingOrgIds, handleFeatureToggle, handleEmailToggle],
  );

  // ── TanStack Table ──
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { rowSelection, sorting, globalFilter },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const someSelected = selectedRows.length > 0;

  const handleBulkEmailEnable = () => {
    selectedRows.forEach((row) => {
      const hotel = row.original.hotel;
      if (hotel && hotel.processing_version !== 'v2') handleEmailToggle(hotel, true);
    });
  };

  const handleBulkEmailDisable = () => {
    selectedRows.forEach((row) => {
      const hotel = row.original.hotel;
      if (hotel && hotel.processing_version !== 'v1') handleEmailToggle(hotel, false);
    });
  };

  const handleBulkEnableFeature = (featureName: string) => {
    selectedRows.forEach((row) => {
      if (!row.original.featureAccess[featureName]) {
        handleFeatureToggle(featureName, row.original.org.id, true);
      }
    });
  };

  const handleBulkDisableFeature = (featureName: string) => {
    selectedRows.forEach((row) => {
      if (row.original.featureAccess[featureName]) {
        handleFeatureToggle(featureName, row.original.org.id, false);
      }
    });
  };

  // ── Derived stats ──
  const v2Count = hotels.filter((h) => h.processing_version === 'v2').length;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h2 className="text-2xl font-semibold">Beta Features</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-20" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h2 className="text-2xl font-semibold">Beta Features</h2>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading beta features: {(error as Error).message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>

        <h2 className="text-2xl font-semibold">Beta Features</h2>
        <p className="text-sm text-muted-foreground">
          This page allows you to manage access to beta features for organizations. You can toggle access for individual features or enable/disable all features for selected organizations. Additionally, you can manage the email inbox routing version (v1 or v2) for hotels.
        </p>
      </div>

      {/* Per-feature stat cards */}
      <div className="grid gap-4 grid-cols-3">
        {features.map((f) => {
          const Icon = getFeatureIcon(f.name);
          const count = f.organizations.length;
          const total = organizations.length;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <Card key={f.name}>
              <CardContent className="p-0 px-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium capitalize truncate">{f.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-xs">
                    {count}/{total} organizations
                  </Badge>
                  {pct > 0 && <span className="text-xs text-muted-foreground">{pct}%</span>}
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card>
          <CardContent className="p-0 px-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                <Inbox className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Email Inbox</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Badge variant={v2Count > 0 ? 'default' : 'secondary'} className="text-xs">
                {v2Count}/{hotels.length} on v2
              </Badge>
              {hotels.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  {Math.round((v2Count / hotels.length) * 100)}%
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="">

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter organizations..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8"
              />
            </div>

          </div>

          {/* Data table */}
          <div className="overflow-x-auto rounded-md border mt-3">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} style={{ width: header.getSize() }}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Floating bulk-action bar */}
      {someSelected && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-4 border-t bg-white px-6 py-3 shadow-xl">
          <Badge className="shrink-0 text-sm">{selectedRows.length} selected</Badge>
          <div className="flex flex-1 items-center gap-x-3 overflow-x-auto">
            {features.map((f, i) => (
              <>
                {i > 0 && <div key={`sep-${f.name}`} className="h-5 w-px shrink-0 bg-border" />}
                <div key={f.name} className="flex shrink-0 items-center gap-1.5">
                  <span className="text-xs font-medium capitalize text-muted-foreground">{f.name}</span>
                  <Button
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleBulkEnableFeature(f.name)}
                    disabled={featureMutation.isPending}
                  >
                    Enable
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleBulkDisableFeature(f.name)}
                    disabled={featureMutation.isPending}
                  >
                    Disable
                  </Button>
                </div>
              </>
            ))}
            <div className="h-5 w-px shrink-0 bg-border" />
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">Email Inbox</span>
              <Button
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleBulkEmailEnable}
                disabled={emailMutation.isPending}
              >
                v2
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={handleBulkEmailDisable}
                disabled={emailMutation.isPending}
              >
                v1
              </Button>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="shrink-0" onClick={() => table.resetRowSelection()}>
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
