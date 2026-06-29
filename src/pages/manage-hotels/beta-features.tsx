import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Settings, Building2, Search } from 'lucide-react';

import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { axiosApi } from '@/lib/axios';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

type BetaFeature = {
  id: string;
  name: string;
  organizations: string[];
};

type UpdateFeatureAccessPayload = {
  featureName: string;
  organizationId: string;
  enabled: boolean;
};

const getFeatureIcon = (featureName: string) => {
  const icons: Record<string, string> = {
    integrations: '🔌',
    emailSettings: '📧',
    aiEmail: '✉️',
    bookingAssistant: '🏨',
    default: '⚡',
  };
  return icons[featureName] || icons.default;
};

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function BetaFeaturesPage() {
  const qc = useQueryClient();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('all');
  const [orgSearchTerm, setOrgSearchTerm] = useState('');

  const {
    data: features = [],
    isLoading,
    error,
  } = useQuery<BetaFeature[]>({
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

  const { mutate, isPending } = useMutation({
    mutationFn: async (payload: UpdateFeatureAccessPayload) => {
      const { data } = await axiosApi.post('/api/beta-features/access', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beta-features'] });
    },
  });

  const filteredOrganizations = organizations
    .filter((org) => org.name.toLowerCase().includes(orgSearchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

  const handleToggleAccess = (featureName: string, orgId: string, enabled: boolean) => {
    mutate(
      { featureName, organizationId: orgId, enabled },
      {
        onSuccess: () => {
          toast.success(
            `${enabled ? 'Granted' : 'Revoked'} ${featureName} access for organization`,
          );
        },
        onError: (e: Error) => {
          toast.error(e.message || 'Failed to update feature access. Please try again.');
        },
      },
    );
  };

  const handleBulkToggle = (featureName: string, enabled: boolean) => {
    const feature = features.find((f) => f.name === featureName);
    if (!feature) return;

    if (enabled) {
      organizations.forEach((org) => {
        if (!feature.organizations.includes(org.id)) {
          handleToggleAccess(featureName, org.id, true);
        }
      });
    } else {
      feature.organizations.forEach((orgId) => {
        handleToggleAccess(featureName, orgId, false);
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <h2 className="text-2xl font-semibold">Beta Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
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
            <p className="text-red-600">
              Error loading beta features: {(error as Error).message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <h2 className="text-2xl font-semibold">Beta Features</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Features" value={features.length} />
        <StatCard
          label={selectedOrgId === 'all' ? 'With Any Access' : 'Enabled'}
          value={
            selectedOrgId === 'all'
              ? features.filter((f) => f.organizations.length > 0).length
              : features.filter((f) => f.organizations.includes(selectedOrgId)).length
          }
        />
        <StatCard
          label={selectedOrgId === 'all' ? 'No Access' : 'Disabled'}
          value={
            selectedOrgId === 'all'
              ? features.filter((f) => f.organizations.length === 0).length
              : features.filter((f) => !f.organizations.includes(selectedOrgId)).length
          }
        />
      </div>

      {/* Organization Selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Select organization" />
          </SelectTrigger>
          <SelectContent>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search organizations..."
                  value={orgSearchTerm}
                  onChange={(e) => setOrgSearchTerm(e.target.value)}
                  className="pl-8"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={(e) => e.stopPropagation()}
                  autoFocus={false}
                />
              </div>
            </div>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                All Organizations
              </div>
            </SelectItem>
            {filteredOrganizations.length === 0 && orgSearchTerm ? (
              <div className="px-2 py-3 text-sm text-gray-500">
                No organizations found matching &quot;{orgSearchTerm}&quot;
              </div>
            ) : (
              filteredOrganizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    {org.name}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {features.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No beta features found.</p>
            <p className="text-sm text-gray-400 mt-1">
              Create some beta features in Firestore to get started.
            </p>
          </CardContent>
        </Card>
      ) : selectedOrgId === 'all' ? (
        /* Feature-centric view */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const enabledOrgs = feature.organizations;
            const enabledCount = enabledOrgs.length;
            const totalOrgs = organizations.length;
            const enabledPercentage =
              totalOrgs > 0 ? Math.round((enabledCount / totalOrgs) * 100) : 0;

            return (
              <Card key={feature.name}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getFeatureIcon(feature.name)}</span>
                      <CardTitle className="text-lg capitalize">{feature.name}</CardTitle>
                    </div>
                  </div>

                  <div className="flex-col items-center mt-3">
                    <div className="flex justify-between items-center gap-2">
                      <Badge variant={enabledCount > 0 ? 'default' : 'secondary'}>
                        {enabledCount}/{totalOrgs} organizations
                      </Badge>
                      {enabledPercentage > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {enabledPercentage}%
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-4 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkToggle(feature.name, true)}
                        disabled={isPending || enabledCount === totalOrgs}
                        className="text-xs px-2 py-1"
                      >
                        Enable All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkToggle(feature.name, false)}
                        disabled={isPending || enabledCount === 0}
                        className="text-xs px-2 py-1"
                      >
                        Disable All
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {organizations.map((org) => {
                      const hasAccess = enabledOrgs.includes(org.id);
                      return (
                        <div
                          key={org.id}
                          className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                        >
                          <span className="text-sm font-medium truncate flex-1 mr-2">
                            {org.name}
                          </span>
                          <Switch
                            checked={hasAccess}
                            disabled={isPending}
                            onCheckedChange={(enabled) =>
                              handleToggleAccess(feature.name, org.id, enabled)
                            }
                            className="shrink-0"
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <EmailInboxCard selectedOrgId={selectedOrgId} />
        </div>
      ) : (
        /* Organization-centric view */
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">
              Managing features for: {selectedOrg?.name}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const hasAccess = feature.organizations.includes(selectedOrgId);
              return (
                <Card
                  key={feature.name}
                  className={
                    hasAccess ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFeatureIcon(feature.name)}</span>
                        <div>
                          <CardTitle className="text-lg capitalize">{feature.name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={hasAccess ? 'default' : 'secondary'}
                              className={
                                hasAccess ? 'bg-green-100 text-green-800 border-green-300' : ''
                              }
                            >
                              {hasAccess ? '✓ Enabled' : '✗ Disabled'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={hasAccess}
                        disabled={isPending}
                        onCheckedChange={(enabled) =>
                          handleToggleAccess(feature.name, selectedOrgId, enabled)
                        }
                        className="shrink-0"
                      />
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
            <EmailInboxCard selectedOrgId={selectedOrgId} />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                features.forEach((feature) => {
                  if (!feature.organizations.includes(selectedOrgId)) {
                    handleToggleAccess(feature.name, selectedOrgId, true);
                  }
                });
              }}
              disabled={isPending}
            >
              Enable All Features
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                features.forEach((feature) => {
                  if (feature.organizations.includes(selectedOrgId)) {
                    handleToggleAccess(feature.name, selectedOrgId, false);
                  }
                });
              }}
              disabled={isPending}
            >
              Disable All Features
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Email Inbox Card (v1/v2 routing) ────────────────────────────────────────

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

type ReadinessVisual = 'safe' | 'warn' | 'generating' | 'ready' | 'attention' | 'unavailable' | 'unknown';

function deriveReadinessVisual({ isV2, readiness }: { isV2: boolean; readiness?: ReadinessReport }): ReadinessVisual {
  if (!readiness) return 'unknown';
  if (readiness.unavailable) return 'unavailable';
  const checks = readiness.checks;
  if (!isV2) return readiness.ready ? 'safe' : 'warn';
  const taxonomyStatus = checks?.taxonomy?.status;
  if (taxonomyStatus === 'generating') return 'generating';
  if (readiness.ready && taxonomyStatus === 'ready') return 'ready';
  if (!readiness.ready) return 'attention';
  return 'ready';
}

function FlipReadinessIndicator({ isV2, readiness }: { isV2: boolean; readiness?: ReadinessReport }) {
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
  const tooltip = !checks ? (
    <span>{visual === 'unavailable' ? 'v2 service unavailable — readiness unknown' : 'Checks v2 readiness'}</span>
  ) : (
    <div className="space-y-1">
      {([
        { ok: checks.email_settings.ok, label: `Email settings${checks.email_settings.detail ? ` — ${checks.email_settings.detail}` : ''}` },
        { ok: checks.knowledge_base.ok, label: `Knowledge base${checks.knowledge_base.namespace ? ` (${checks.knowledge_base.namespace})` : ''}${checks.knowledge_base.detail ? ` — ${checks.knowledge_base.detail}` : ''}` },
        { ok: checks.pms_tools.ok, label: `PMS tools${checks.pms_tools.systems?.length ? ` (${checks.pms_tools.systems.join(', ')})` : ''}${checks.pms_tools.detail ? ` — ${checks.pms_tools.detail}` : ''}` },
        { ok: checks.taxonomy.status === 'ready' || checks.taxonomy.status === 'empty', label: `Taxonomy: ${checks.taxonomy.status} (${checks.taxonomy.count})${checks.taxonomy.detail ? ` — ${checks.taxonomy.detail}` : ''}` },
      ] as { ok: boolean; label: string }[]).map(({ ok, label }) => (
        <div key={label} className="flex items-start gap-1.5">
          {ok ? <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-green-500" /> : <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />}
          <span>{label}</span>
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex items-center justify-center" aria-label={`v2 readiness: ${visual}`}>
            {icon}
          </span>
        </TooltipTrigger>
        <TooltipContent className="text-start max-w-72 text-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HotelRoutingRow({
  hotel,
  isPending,
  onToggle,
}: {
  hotel: HotelEmailRouting;
  isPending: boolean;
  onToggle: (hotel: HotelEmailRouting, enabled: boolean) => void;
}) {
  const isV2 = hotel.processing_version === 'v2';
  const switchId = `email-inbox-${hotel.organization_id}`;

  const { data: readiness } = useQuery<ReadinessReport>({
    queryKey: ['email-inbox-readiness', hotel.organization_id],
    queryFn: async () => {
      const { data } = await axiosApi.get(
        `/api/email-inbox-routing/readiness?organization_id=${encodeURIComponent(hotel.organization_id)}`,
      );
      return data.data as ReadinessReport;
    },
    staleTime: 30_000,
  });

  return (
    <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50">
      <div className="flex flex-col flex-1 mr-2 min-w-0">
        <label htmlFor={switchId} className="text-sm font-medium truncate">
          {hotel.organization_name ?? hotel.organization_id}
        </label>
        {!hotel.has_email_settings && (
          <span className="text-xs text-gray-400">No email config</span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={isV2 ? 'default' : 'secondary'}>{isV2 ? 'v2' : 'v1'}</Badge>
        <Switch
          id={switchId}
          checked={isV2}
          disabled={!hotel.has_email_settings || isPending}
          onCheckedChange={(enabled) => onToggle(hotel, enabled)}
          className="shrink-0"
        />
        <FlipReadinessIndicator isV2={isV2} readiness={readiness} />
      </div>
    </div>
  );
}

function EmailInboxCard({ selectedOrgId }: { selectedOrgId: string }) {
  const qc = useQueryClient();
  const [pendingOrgIds, setPendingOrgIds] = useState<Set<string>>(new Set());

  const { data: hotels = [], isLoading, error } = useQuery<HotelEmailRouting[]>({
    queryKey: ['email-inbox-routing'],
    queryFn: async () => {
      const { data } = await axiosApi.get('/api/email-inbox-routing');
      return (data?.data?.hotels ?? []) as HotelEmailRouting[];
    },
    staleTime: 60_000,
  });

  const { mutate } = useMutation({
    mutationFn: async (payload: { organization_id: string; enabled: boolean }) => {
      const { data } = await axiosApi.post('/api/email-inbox-routing', payload);
      return data;
    },
    onSettled: (_data, _error, variables) => {
      qc.invalidateQueries({ queryKey: ['email-inbox-routing'] });
      qc.invalidateQueries({ queryKey: ['email-inbox-readiness', variables?.organization_id] });
    },
  });

  const visibleHotels =
    selectedOrgId === 'all' ? hotels : hotels.filter((h) => h.organization_id === selectedOrgId);

  const sortedHotels = [...visibleHotels].sort((a, b) =>
    (a.organization_name ?? a.organization_id).localeCompare(b.organization_name ?? b.organization_id),
  );

  const v2Count = hotels.filter((h) => h.processing_version === 'v2').length;
  const totalCount = hotels.length;
  const v2Percentage = totalCount > 0 ? Math.round((v2Count / totalCount) * 100) : 0;

  const handleToggle = (hotel: HotelEmailRouting, enabled: boolean) => {
    setPendingOrgIds((prev) => new Set(prev).add(hotel.organization_id));
    mutate(
      { organization_id: hotel.organization_id, enabled },
      {
        onSuccess: () => {
          toast.success(`${hotel.organization_name ?? 'Hotel'} email inbox set to ${enabled ? 'v2' : 'v1'}`);
        },
        onError: (e: Error) => {
          toast.error(e.message || 'Failed to update email inbox routing.');
        },
        onSettled: () => {
          setPendingOrgIds((prev) => {
            const next = new Set(prev);
            next.delete(hotel.organization_id);
            return next;
          });
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📥</span>
            <CardTitle className="text-lg">Email Inbox</CardTitle>
          </div>
        </div>
        <div className="flex-col items-center mt-3">
          <div className="flex justify-between items-center gap-2">
            <Badge variant={v2Count > 0 ? 'default' : 'secondary'}>
              {v2Count}/{totalCount} on v2
            </Badge>
            {v2Percentage > 0 && (
              <Badge variant="outline" className="text-xs">
                {v2Percentage}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <p className="text-sm text-gray-500 py-2">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600 py-2">
            Error loading email inbox routing: {(error as Error).message}
          </p>
        ) : sortedHotels.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">
            {selectedOrgId !== 'all'
              ? 'No email inbox routing available for the selected hotel.'
              : 'No hotels available.'}
          </p>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sortedHotels.map((hotel) => (
              <HotelRoutingRow
                key={hotel.organization_id}
                hotel={hotel}
                isPending={pendingOrgIds.has(hotel.organization_id)}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
