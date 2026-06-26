import { useState } from 'react';
import { IconShieldCheck } from '@tabler/icons-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </Card>
  );
}

export default function SecurityPage() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [passwordExpiry, setPasswordExpiry] = useState('90');
  const [ipWhitelist, setIpWhitelist] = useState(false);
  const [auditLog, setAuditLog] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);

  const handleSave = () => {
    toast.success('Security settings saved');
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconShieldCheck className="size-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Security</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Configure platform-wide security policies and access controls.
          </p>
        </div>
        <Button onClick={handleSave}>Save Changes</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="2FA Status" value={twoFactor ? 'Enforced' : 'Optional'} />
        <StatCard label="Session Timeout" value={`${sessionTimeout} min`} />
        <StatCard label="Password Expiry" value={`${passwordExpiry} days`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Authentication</CardTitle>
            <CardDescription>Control how users sign in to the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enforce Two-Factor Authentication</Label>
                <p className="text-xs text-muted-foreground">
                  Require all users to set up 2FA before accessing the dashboard.
                </p>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Login Alerts</Label>
                <p className="text-xs text-muted-foreground">
                  Email admins when a new device logs in.
                </p>
              </div>
              <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Session */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Session Management</CardTitle>
            <CardDescription>Configure how user sessions are handled.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Session Timeout (minutes)</Label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                  <SelectItem value="480">8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Password Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Password Policy</CardTitle>
            <CardDescription>Set minimum password requirements for all accounts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Password Expiry (days)</Label>
              <Select value={passwordExpiry} onValueChange={setPasswordExpiry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Access Control</CardTitle>
            <CardDescription>Restrict platform access by network or IP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">IP Allowlist</Label>
                <p className="text-xs text-muted-foreground">
                  Only allow logins from specific IP addresses.
                </p>
              </div>
              <Switch checked={ipWhitelist} onCheckedChange={setIpWhitelist} />
            </div>
            {ipWhitelist && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allowed IPs</Label>
                <Input placeholder="e.g. 192.168.1.0/24, 10.0.0.1" />
                <p className="text-xs text-muted-foreground">Comma-separated CIDR ranges or IPs.</p>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Audit Log</Label>
                <p className="text-xs text-muted-foreground">
                  Record all admin actions for compliance.
                </p>
              </div>
              <Switch checked={auditLog} onCheckedChange={setAuditLog} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
