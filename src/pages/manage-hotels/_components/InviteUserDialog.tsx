import { useEffect } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PlusCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form } from '@/components/ui/form';
import { organizationService } from '@/services/organizations/organizations';
import { useQuery, useMutation } from '@tanstack/react-query';
import { SearchableSelect } from './SearchableSelect';
import { axiosApi } from '@/lib/axios';

const inviteSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Invalid email address'),
  role: z.enum(['orgAdmin', 'member']),
  org_id: z.string().min(1, 'Organization is required'),
});

const formSchema = z.object({
  invites: z.array(inviteSchema).min(1),
});

type FormSchema = z.infer<typeof formSchema>;

type InviteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInviteSuccess?: () => void;
  initialInvite?: Partial<{
    first_name: string;
    last_name: string;
    email: string;
    role: 'orgAdmin' | 'member';
    org_id: string;
  }>;
};

const ROLE_OPTIONS = [
  { value: 'orgAdmin', label: 'Organization Admin' },
  { value: 'member', label: 'Member' },
];

export function InviteUserDialog({
  open,
  onOpenChange,
  onInviteSuccess,
  initialInvite,
}: InviteUserDialogProps) {
  const { data: orgsRaw = [] } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });

  const orgOptions = orgsRaw
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((o) => ({ value: o.id, label: o.name }));

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invites: [
        {
          first_name: initialInvite?.first_name ?? '',
          last_name: initialInvite?.last_name ?? '',
          email: initialInvite?.email ?? '',
          role: initialInvite?.role ?? 'member',
          org_id: initialInvite?.org_id ?? '',
        },
      ],
    },
  });

  useEffect(() => {
    if (open && initialInvite) {
      form.reset({
        invites: [
          {
            first_name: initialInvite.first_name ?? '',
            last_name: initialInvite.last_name ?? '',
            email: initialInvite.email ?? '',
            role: initialInvite.role ?? 'member',
            org_id: initialInvite.org_id ?? '',
          },
        ],
      });
    }
  }, [open, initialInvite]);

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'invites' });

  const inviteMutation = useMutation({
    mutationFn: async (data: FormSchema) => {
      const { data: res } = await axiosApi.post('/invite-users', { invites: data.invites });
      return res;
    },
    onSuccess: (res) => {
      const accepted = res?.data?.jobs?.length ?? 0;
      const failed = res?.data?.failed_invites?.length ?? 0;
      toast.success(
        failed > 0
          ? `${accepted} invite(s) accepted. ${failed} failed.`
          : `${accepted} invite(s) sent.`,
      );
      form.reset();
      onOpenChange(false);
      onInviteSuccess?.();
    },
    onError: (e: Error) => toast.error(e.message || 'Failed to send invites'),
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) form.reset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[760px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite New Users</DialogTitle>
          <DialogDescription>Fill in the details for the users you want to invite.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => inviteMutation.mutate(d))} className="space-y-6">
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="relative rounded-md border p-4 space-y-3">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 text-destructive hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <XCircle className="size-5" />
                    </Button>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name={`invites.${index}.first_name`}
                      render={({ field, fieldState }) => (
                        <div className="space-y-1">
                          <Label>First Name</Label>
                          <Input placeholder="Jane" {...field} />
                          {fieldState.error && (
                            <p className="text-xs text-destructive">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`invites.${index}.last_name`}
                      render={({ field, fieldState }) => (
                        <div className="space-y-1">
                          <Label>Last Name</Label>
                          <Input placeholder="Doe" {...field} />
                          {fieldState.error && (
                            <p className="text-xs text-destructive">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                  <Controller
                    control={form.control}
                    name={`invites.${index}.email`}
                    render={({ field, fieldState }) => (
                      <div className="space-y-1">
                        <Label>Email</Label>
                        <Input type="email" placeholder="jane@hotel.com" {...field} />
                        {fieldState.error && (
                          <p className="text-xs text-destructive">{fieldState.error.message}</p>
                        )}
                      </div>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Controller
                      control={form.control}
                      name={`invites.${index}.org_id`}
                      render={({ field, fieldState }) => (
                        <div>
                          <SearchableSelect
                            label="Organization"
                            placeholder="Select an organization…"
                            options={orgOptions}
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.error && (
                            <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name={`invites.${index}.role`}
                      render={({ field, fieldState }) => (
                        <div>
                          <SearchableSelect
                            label="Role"
                            placeholder="Select a role…"
                            options={ROLE_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                          />
                          {fieldState.error && (
                            <p className="text-xs text-destructive mt-1">{fieldState.error.message}</p>
                          )}
                        </div>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({ first_name: '', last_name: '', email: '', role: 'member', org_id: '' })
              }
            >
              <PlusCircle className="mr-2 size-4" />
              Add Another Invite
            </Button>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => handleOpenChange(false)}
                disabled={inviteMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending}>
                {inviteMutation.isPending
                  ? 'Sending…'
                  : `Send Invite${fields.length > 1 ? 's' : ''}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
