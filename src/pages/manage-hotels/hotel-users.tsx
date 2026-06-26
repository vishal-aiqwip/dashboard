import { useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  IconBuildingSkyscraper,
  IconCheck,
  IconDots,
  IconMail,
  IconUserPlus,
  IconX,
} from '@tabler/icons-react';
import { Loader, Trash } from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';

import { organizationService, type OrgMember } from '@/services/organizations/organizations';
import { cn } from '@/lib/utils';

/* ---------- helpers ---------- */

function getMemberInitials(m: OrgMember) {
  const f = m.first_name?.charAt(0) ?? '';
  const l = m.last_name?.charAt(0) ?? '';
  if (f || l) return `${f}${l}`.toUpperCase();
  return m.email?.charAt(0)?.toUpperCase() ?? '?';
}

function getMemberName(m: OrgMember) {
  const name = `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim();
  return name || m.email || m.uid;
}

/* ---------- invite schema ---------- */

const inviteSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Enter a valid email'),
  role: z.enum(['orgAdmin', 'member']),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

/* ---------- badge components ---------- */

function RoleBadge({ role }: { role: OrgMember['role'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        role === 'orgAdmin'
          ? 'bg-violet-500/15 text-violet-700'
          : 'bg-secondary text-secondary-foreground',
      )}
    >
      {role === 'orgAdmin' ? 'Admin' : 'Member'}
    </span>
  );
}

function StatusBadge({ status }: { status: OrgMember['status'] }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        status === 'active'
          ? 'bg-emerald-500/15 text-emerald-700'
          : 'bg-amber-500/15 text-amber-700',
      )}
    >
      {status === 'active' ? <IconCheck className="size-3" /> : <IconMail className="size-3" />}
      {status === 'active' ? 'Active' : 'Pending'}
    </span>
  );
}

/* ========================================================================== */

export default function HotelUsers() {
  const { orgId } = useParams<{ orgId: string }>();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);

  /* -- hotel name: fetch org list if not cached (handles direct page reload) -- */
  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });
  const hotelName = orgs?.find((o) => o.id === orgId)?.name ?? orgId ?? 'Hotel';

  /* -- fetch members -- */
  const { data: members = [], isLoading, isError } = useQuery({
    queryKey: ['org-members', orgId],
    queryFn: () => organizationService.getMembers(orgId!),
    enabled: !!orgId,
  });

  /* -- role update -- */
  const rolesMutation = useMutation({
    mutationFn: ({ uid, role }: { uid: string; role: 'orgAdmin' | 'member' }) =>
      organizationService.updateMemberRole(orgId!, uid, role),
    onSuccess: () => {
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* -- remove member -- */
  const removeMutation = useMutation({
    mutationFn: (uid: string) => organizationService.removeMember(orgId!, uid),
    onSuccess: () => {
      toast.success('Member removed');
      setRemoveTarget(null);
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* -- invite -- */
  const inviteForm = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { first_name: '', last_name: '', email: '', role: 'member' },
  });

  const inviteMutation = useMutation({
    mutationFn: (values: InviteFormValues) =>
      organizationService.inviteMembers(orgId!, [values]),
    onSuccess: () => {
      toast.success('Invite sent');
      setInviteOpen(false);
      inviteForm.reset();
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* -- column definitions (closes over mutation handlers) -- */
  const columns = useMemo<ColumnDef<OrgMember>[]>(
    () => [
      {
        id: 'member',
        accessorFn: (row) => getMemberName(row),
        size: 240,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Member" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="size-8 border">
              <AvatarImage src={row.original.photo_url ?? undefined} />
              <AvatarFallback className="text-xs font-semibold">
                {getMemberInitials(row.original)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{getMemberName(row.original)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        size: 240,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.email ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'role',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
      },
      {
        accessorKey: 'status',
        size: 120,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'actions',
        size: 60,
        header: '',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <IconDots className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={rolesMutation.isPending}
                  onClick={() =>
                    rolesMutation.mutate({
                      uid: member.uid,
                      role: member.role === 'orgAdmin' ? 'member' : 'orgAdmin',
                    })
                  }
                >
                  {member.role === 'orgAdmin' ? 'Demote to Member' : 'Promote to Admin'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setRemoveTarget(member)}
                >
                  <Trash className="mr-2 text-inherit size-4" />
                  Remove from hotel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [rolesMutation.isPending, rolesMutation],
  );

  /* -- counts -- */
  const adminCount = members.filter((m) => m.role === 'orgAdmin').length;
  const pendingCount = members.filter((m) => m.status === 'pending').length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconBuildingSkyscraper className="size-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl capitalize font-semibold tracking-tight">{hotelName} <span className="text-sm text-muted-foreground">
          (  {isLoading ? 'Loading…' : `${members.length} member${members.length !== 1 ? 's' : ''}`})
          </span></h2>
          </div>
          
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          <IconUserPlus className="mr-2 size-4" />
          Invite User
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Members" value={members.length} loading={isLoading} />
        <StatCard label="Admins" value={adminCount} loading={isLoading} />
        <StatCard label="Pending Invites" value={pendingCount} loading={isLoading} />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading members…
        </div>
      ) : isError ? (
        <p className="py-12 text-center text-sm text-destructive">
          Failed to load members. You may not have permission to view this organization's members.
        </p>
      ) : (
        <Card>
          <CardContent>

            <DataTable
              columns={columns}
              data={members}
              filterPlaceholder="Search members…"
              emptyMessage="No members yet. Invite someone to get started."
              enableColumnVisibilityToggle
            />
          </CardContent>
        </Card>
      )}

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) inviteForm.reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join <strong>{hotelName}</strong>.
            </DialogDescription>
          </DialogHeader>
          <Form {...inviteForm}>
            <form
              onSubmit={inviteForm.handleSubmit((d) => inviteMutation.mutate(d))}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={inviteForm.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl><Input placeholder="Jane" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={inviteForm.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={inviteForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="jane@hotel.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={inviteForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="orgAdmin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setInviteOpen(false); inviteForm.reset(); }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={inviteMutation.isPending}>
                  {inviteMutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Send Invite
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <strong>{removeTarget ? getMemberName(removeTarget) : ''}</strong> from{' '}
              <strong>{hotelName}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.uid)}
            >
              {removeMutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- stat card ---------- */
function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {loading ? <span className="opacity-30">—</span> : value}
      </p>
    </Card>
  );
}
