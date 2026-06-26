import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { IconMessageChatbot, IconPlus } from '@tabler/icons-react';
import { Loader } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { organizationService, type OrgBrief } from '@/services/organizations/organizations';

type ChatbotRow = {
  id: string;
  name: string;
  hotel: string;
  hotelId: string;
  status: 'active' | 'inactive' | 'training';
  language: string;
};

function buildChatbots(hotels: OrgBrief[]): ChatbotRow[] {
  return hotels.slice(0, 8).map((h, i) => ({
    id: `bot-${h.id}`,
    name: `${h.name} Assistant`,
    hotel: h.name,
    hotelId: h.id,
    status: i % 3 === 0 ? 'inactive' : i % 5 === 0 ? 'training' : 'active',
    language: i % 4 === 0 ? 'Spanish' : i % 6 === 0 ? 'French' : 'English',
  }));
}

const STATUS_STYLES: Record<ChatbotRow['status'], string> = {
  active: 'bg-emerald-500/15 text-emerald-700',
  inactive: 'bg-secondary text-secondary-foreground',
  training: 'bg-amber-500/15 text-amber-700',
};

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

const columns: ColumnDef<ChatbotRow>[] = [
  {
    accessorKey: 'name',
    size: 260,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Chatbot" />,
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
          <IconMessageChatbot className="size-4 text-muted-foreground" />
        </div>
        <span className="font-medium">{row.original.name}</span>
      </div>
    ),
  },
  {
    accessorKey: 'hotel',
    size: 220,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Hotel" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.hotel}</span>
    ),
  },
  {
    accessorKey: 'language',
    size: 120,
    header: ({ column }) => <DataTableColumnHeader column={column} title="Language" />,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
        {row.original.language}
      </span>
    ),
  },
  {
    accessorKey: 'status',
    size: 120,
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[row.original.status]}`}
      >
        {row.original.status}
      </span>
    ),
  },
];

export default function ChatbotsPage() {
  const { data: hotels = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: organizationService.listAll,
    staleTime: 5 * 60 * 1000,
  });

  const chatbots = buildChatbots(hotels);
  const activeCount = chatbots.filter((c) => c.status === 'active').length;
  const trainingCount = chatbots.filter((c) => c.status === 'training').length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
              <IconMessageChatbot className="size-4 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Chatbots</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage AI chatbot assistants across all hotels.
          </p>
        </div>
        <Button>
          <IconPlus className="mr-2 size-4" />
          New Chatbot
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Chatbots" value={chatbots.length} loading={isLoading} />
        <StatCard label="Active" value={activeCount} loading={isLoading} />
        <StatCard label="In Training" value={trainingCount} loading={isLoading} />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          Loading chatbots…
        </div>
      ) : (
        <Card>
          <CardContent>
            <DataTable
              columns={columns}
              data={chatbots}
              filterPlaceholder="Search chatbots…"
              emptyMessage="No chatbots configured yet."
              enableColumnVisibilityToggle
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
