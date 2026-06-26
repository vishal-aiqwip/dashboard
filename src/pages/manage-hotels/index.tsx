import { useState } from 'react';
import { Link } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { IconBuildingSkyscraper, IconPlus, IconUsers } from '@tabler/icons-react';
import { Loader } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

import { useAppSelector } from '@/redux';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

/* ---------- constants ---------- */

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Europe/Athens',
  'Europe/Helsinki',
  'Europe/Lisbon',
  'Europe/Zurich',
  'Europe/Oslo',
  'Europe/Copenhagen',
  'Europe/Dublin',
  'Europe/Prague',
  'Europe/Vienna',
  'Europe/Budapest',
  'Europe/Bucharest',
  'Europe/Kiev',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Colombo',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Kuala_Lumpur',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Taipei',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
];

/* ---------- schema ---------- */

const hotelSchema = z.object({
  organization_name: z.string().min(1, 'Hotel name is required'),
  timezone: z.string().min(1, 'Timezone is required'),
  street_address: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state_province: z.string().min(1, 'State / Province is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});

type HotelFormValues = z.infer<typeof hotelSchema>;

/* ---------- column definitions ---------- */

const columns: ColumnDef<OrgBrief>[] = [
  {
    accessorKey: 'name',
    size: 280,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hotel Name" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <IconBuildingSkyscraper className="size-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'timezone',
    size: 200,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Timezone" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
        {row.original.timezone}
      </span>
    ),
  },
  {
    accessorKey: 'id',
    size: 180,
    header: 'ID',
    cell: ({ row }) => {
      const id = row.original.id;
      const short = id.length > 16 ? `${id.slice(0, 8)}…${id.slice(-4)}` : id;
      return (
        <span className="font-mono text-xs text-muted-foreground" title={id}>
          {short}
        </span>
      );
    },
  },
  {
    id: 'actions',
    size: 120,
    header: '',
    cell: ({ row }) => (
      <Link
        to={`/dashboard/manage-hotels/${row.original.id}/users`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        onClick={(e) => e.stopPropagation()}
      >
        <IconUsers className="size-3.5" />
        View Users
      </Link>
    ),
  },
];

/* ========================================================================== */

export default function ManageHotels() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { userSession } = useAppSelector(
    (state: { session: { userSession: Record<string, unknown> | null } }) => state.session,
  );
  const user = userSession?.user as Record<string, unknown> | null;

  /* -- fetch hotels -- */
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
  });

  /* -- form -- */
  const form = useForm<HotelFormValues>({
    resolver: zodResolver(hotelSchema),
    defaultValues: {
      organization_name: '',
      timezone: 'UTC',
      street_address: '',
      city: '',
      state_province: '',
      postal_code: '',
      country: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (values: HotelFormValues) =>
      organizationService.create({
        organization_name: values.organization_name,
        timezone: values.timezone,
        created_by: (user?.uid as string) || '',
        address: {
          street_address: values.street_address,
          city: values.city,
          state_province: values.state_province,
          postal_code: values.postal_code,
          country: values.country,
        },
      }),
    onSuccess: () => {
      toast.success('Hotel created successfully');
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create hotel');
    },
  });

  const uniqueTimezones = new Set(hotels.map((h) => h.timezone)).size;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Manage Hotels</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading…' : `${hotels.length} hotel${hotels.length !== 1 ? 's' : ''} registered`}
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <IconPlus className="mr-2 size-4" />
          Add Hotel
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Hotels" value={hotels.length} loading={isLoading} />
        <StatCard label="Unique Timezones" value={uniqueTimezones} loading={isLoading} />
      </div>

      {/* Data table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading hotels…
        </div>
      ) : (
        <Card>
          <CardContent>

          <DataTable
            columns={columns}
            data={hotels}
            filterPlaceholder="Search hotels…"
            emptyMessage="No hotels registered yet."
            enableColumnVisibilityToggle
          />
          </CardContent>

        </Card>
      )}

      {/* Create Hotel Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) form.reset();
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Hotel</DialogTitle>
            <DialogDescription>
              Register a new hotel / organization in the system.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((d) => createMutation.mutate(d))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hotel Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Seaside Grand Resort" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {COMMON_TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm font-medium">Address</p>

              <FormField
                control={form.control}
                name="street_address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Ocean Drive" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Miami" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state_province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="FL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="33101" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="United States" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                  Create Hotel
                </Button>
              </DialogFooter>
            </form>
          </Form>
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
