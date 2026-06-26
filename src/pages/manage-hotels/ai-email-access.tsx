import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

/* ---------- types ---------- */

type Tenant = {
  id: string;
  requestedBy: string;
  tenantId: string;
  status: 'active' | 'inactive' | 'pending';
  pendingRequests: number;
  activatedAt: string;
};

type AccessRequest = {
  id: string;
  email: string;
  mailbox: string;
  suggestedOrg: string;
  requestedOn: string;
  lastUpdated: string;
};

/* ---------- mock data ---------- */

const MOCK_TENANTS: Tenant[] = [
  {
    id: '1',
    requestedBy: 'joffen@altekai.onmicrosoft.com',
    tenantId: 'f342c17c-82e2-44a5-8245-688606cb0c9d',
    status: 'active',
    pendingRequests: 0,
    activatedAt: '2025-01-15',
  },
];

/* ========================================================================== */

export default function AiEmailAccessPage() {
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(MOCK_TENANTS[0]);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);

  /* tenant policy state */
  const [policyStatus, setPolicyStatus] = useState<'active' | 'inactive'>('active');
  const [autoLink, setAutoLink] = useState(false);
  const [allowlistDomains, setAllowlistDomains] = useState('hotel.com, brand.com');

  const accessRequests: AccessRequest[] = [];

  const filteredTenants = MOCK_TENANTS.filter(
    (t) =>
      t.requestedBy.toLowerCase().includes(search.toLowerCase()) ||
      t.tenantId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-1 gap-4 p-6">
      {/* ── Left column ── */}
      <div className="flex flex-1 min-w-0 flex-col gap-4">

        {/* Tenants */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <p className="font-semibold">Tenants</p>
            <p className="text-sm text-muted-foreground">Manage IdP tenant status and policy</p>
          </div>
          <div className="p-4 space-y-3">
            <Input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-6 text-left font-medium">Requested by</th>
                    <th className="py-2 pr-6 text-left font-medium">Tenant</th>
                    <th className="py-2 pr-6 text-left font-medium">Status</th>
                    <th className="py-2 pr-6 text-left font-medium">Pending Requests</th>
                    <th className="py-2 text-left font-medium">Activated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No tenants found.
                      </td>
                    </tr>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        onClick={() => setSelectedTenant(tenant)}
                        className={`cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50 ${
                          selectedTenant?.id === tenant.id ? 'bg-muted/50' : ''
                        }`}
                      >
                        <td className="py-3 pr-6 text-xs">{tenant.requestedBy}</td>
                        <td className="py-3 pr-6">
                          <span className="font-mono text-xs text-muted-foreground">
                            {tenant.tenantId}
                          </span>
                        </td>
                        <td className="py-3 pr-6">
                          <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                            {tenant.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-6 text-xs">{tenant.pendingRequests}</td>
                        <td className="py-3 text-xs text-muted-foreground">{tenant.activatedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Access Requests */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <p className="font-semibold">Access Requests</p>
            <p className="text-sm text-muted-foreground">Recent requests for selected tenant</p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="py-2 pr-6 text-left font-medium">Email</th>
                    <th className="py-2 pr-6 text-left font-medium">Mailbox</th>
                    <th className="py-2 pr-6 text-left font-medium">Suggested Org</th>
                    <th className="py-2 pr-6 text-left font-medium">Requested on</th>
                    <th className="py-2 text-left font-medium">Last updated</th>
                  </tr>
                </thead>
                <tbody>
                  {accessRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No pending requests
                      </td>
                    </tr>
                  ) : (
                    accessRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/50 ${
                          selectedRequest?.id === req.id ? 'bg-muted/50' : ''
                        }`}
                      >
                        <td className="py-3 pr-6 text-xs">{req.email}</td>
                        <td className="py-3 pr-6 text-xs">{req.mailbox}</td>
                        <td className="py-3 pr-6 text-xs">{req.suggestedOrg}</td>
                        <td className="py-3 pr-6 text-xs">{req.requestedOn}</td>
                        <td className="py-3 text-xs">{req.lastUpdated}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Access Request Detail */}
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <p className="font-semibold">Access Request Detail</p>
            <p className="text-sm text-muted-foreground">
              Link identity, user, and org; set tenant policy
            </p>
          </div>
          <div className="p-4">
            {selectedRequest ? (
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Email:</span> {selectedRequest.email}
                </p>
                <p>
                  <span className="text-muted-foreground">Mailbox:</span> {selectedRequest.mailbox}
                </p>
                <p>
                  <span className="text-muted-foreground">Suggested Org:</span>{' '}
                  {selectedRequest.suggestedOrg}
                </p>
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground">Select a request to proceed</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Right column — Tenant Policy ── */}
      <div className="w-72 shrink-0">
        <div className="rounded-lg border bg-card">
          <div className="border-b p-4">
            <p className="font-semibold">Tenant Policy</p>
            <p className="text-sm text-muted-foreground">Activate tenant and set policy</p>
          </div>
          <div className="space-y-4 p-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={policyStatus}
                onValueChange={(v) => setPolicyStatus(v as 'active' | 'inactive')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label>Enable Auto-Link</Label>
              <Switch checked={autoLink} onCheckedChange={setAutoLink} />
            </div>

            <div className="space-y-1.5">
              <Label>Allowlist Domains (comma separated)</Label>
              <Textarea
                value={allowlistDomains}
                onChange={(e) => setAllowlistDomains(e.target.value)}
                placeholder="hotel.com, brand.com"
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={() => toast.success('Tenant policy saved')}>
              Save Tenant Policy
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
