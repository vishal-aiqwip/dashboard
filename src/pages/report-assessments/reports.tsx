import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Download, Eye, FileDown, FileJson, FileText, Link2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/data-table/data-table';
import {
  buildPublicEmailReportUrl,
  getPublicAppOrigin,
  reportRowTimestampForPublicLink,
} from '@/lib/report-share';
import { useAppSelector } from '@/redux';
import {
  reportAssessmentsService,
  type EmailReportRow,
} from '@/services/reportAssessments/reportAssessments';
import {
  EmailReportSnapshotView,
  isValidReportJson,
  type EmailReportSnapshot,
} from './_components/report-snapshot';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: EmailReportRow[]): string {
  const headers = ['report_id', 'hotel_name', 'hotel_id', 'period_days', 'generated_at', 'created_at'];
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) =>
    [r.report_id, r.hotel_name, r.hotel_id, r.period_days, r.generated_at, r.created_at]
      .map(escape)
      .join(','),
  );
  return [headers.join(','), ...lines].join('\n');
}

// ── Report detail (inline, same page) ────────────────────────────────────────

function ReportDetailView({ reportId, hotelId }: { reportId: string; hotelId: string }) {
  const navigate = useNavigate();
  const [downloadBusy, setDownloadBusy] = useState<'json' | 'pdf' | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emailReports', 'snapshot', reportId, hotelId],
    queryFn: () => reportAssessmentsService.getReportSnapshot(reportId, hotelId),
    enabled: Boolean(reportId && hotelId),
  });

  const publicLinkMutation = useMutation({
    mutationFn: (params: { report_id: string; hotel_id: string; generated_at: string }) =>
      reportAssessmentsService.createPublicLink(params),
  });

  const generatedAtForPublicLink = data
    ? reportRowTimestampForPublicLink(data.generated_at, data.created_at)
    : null;

  const handleDownloadJson = () => {
    if (!data) return;
    setDownloadBusy('json');
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadBusy(null);
    }
  };

  const handleDownloadPdf = () => {
    setDownloadBusy('pdf');
    window.print();
    setDownloadBusy(null);
  };

  const handleCopyPublicLink = async () => {
    if (!generatedAtForPublicLink || !data) return;
    try {
      const { signature } = await publicLinkMutation.mutateAsync({
        report_id: data.report_id,
        hotel_id: data.hotel_id,
        generated_at: generatedAtForPublicLink,
      });
      const origin = getPublicAppOrigin();
      if (!origin) {
        toast.error('Could not determine the app URL for this link.');
        return;
      }
      const url = buildPublicEmailReportUrl(
        origin,
        { report_id: data.report_id, hotel_id: data.hotel_id, generated_at: generatedAtForPublicLink },
        signature,
      );
      await navigator.clipboard.writeText(url);
      toast.success('Link copied — recipients can open this without signing in.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create a public link.');
    }
  };

  const snapshot: EmailReportSnapshot | null =
    data && isValidReportJson(data.report_json)
      ? {
          report_id: data.report_id,
          hotel_id: data.hotel_id,
          hotel_name: data.hotel_name ?? null,
          period_days:
            (data.report_json as { period_days?: number }).period_days ??
            (data as { period_days?: number }).period_days ??
            0,
          generated_at: data.generated_at ?? '',
          report_json: data.report_json,
        }
      : null;

  return (
    <div className="p-6 w-full max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-9 rounded-lg text-grey-600 hover:text-grey-900"
          onClick={() => navigate('/dashboard/report-assessments/reports')}
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Reports
        </Button>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg gap-2"
              disabled={
                downloadBusy !== null ||
                publicLinkMutation.isPending ||
                generatedAtForPublicLink == null
              }
              title={
                generatedAtForPublicLink == null
                  ? 'This report has no timestamp — public link is unavailable.'
                  : 'Copy a link anyone can use without signing in'
              }
              onClick={() => void handleCopyPublicLink()}
            >
              {publicLinkMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Copy link
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg gap-2"
              disabled={downloadBusy !== null}
              onClick={handleDownloadJson}
            >
              {downloadBusy === 'json' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4" />
              )}
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-lg gap-2"
              disabled={downloadBusy !== null}
              onClick={handleDownloadPdf}
            >
              {downloadBusy === 'pdf' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              PDF
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError || !data ? (
        <Card className="border-grey-100 shadow-sm">
          <CardContent className="py-12 text-center">
            <p className="text-small font-medium text-grey-900">Failed to load report</p>
            <p className="mt-1 text-xs text-grey-600">
              The report may not exist or you may not have access.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg"
              onClick={() => navigate('/dashboard/report-assessments/reports')}
            >
              Go back
            </Button>
          </CardContent>
        </Card>
      ) : snapshot ? (
        <EmailReportSnapshotView snapshot={snapshot} />
      ) : (
        <Card className="border-grey-100 shadow-sm">
          <CardContent className="p-4">
            <pre className="text-xs text-grey-700 overflow-auto max-h-[60vh] whitespace-pre-wrap">
              {JSON.stringify(data.report_json ?? data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Reports list ──────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const navigate = useNavigate();
  const { role } = useAppSelector((s) => s.session);
  const [searchParams] = useSearchParams();

  const reportId = searchParams.get('report_id');
  const hotelId = searchParams.get('hotel_id');

  // Always call hooks before any early return
  const { data, isLoading, isError, error, refetch } = useQuery<
    { reports: EmailReportRow[]; total: number },
    Error
  >({
    queryKey: ['emailReports', 'list'],
    queryFn: () => reportAssessmentsService.listEmailReports({ limit: 10, offset: 0 }),
    enabled: role === 'admin' && !reportId && !hotelId,
    retry: 1,
  });

  // Render detail view inline when query params are present
  if (reportId && hotelId) {
    return <ReportDetailView reportId={reportId} hotelId={hotelId} />;
  }

  const reports = data?.reports ?? [];

  const columns: ColumnDef<EmailReportRow>[] = [
    {
      accessorKey: 'hotel_name',
      header: 'Hotel',
      size: 220,
      cell: ({ row }) => (
        <span className="font-medium text-grey-900">
          {row.original.hotel_name ?? row.original.hotel_id}
        </span>
      ),
    },
    {
      accessorKey: 'period_days',
      header: 'Period',
      size: 100,
      cell: ({ row }) =>
        row.original.period_days != null ? `${row.original.period_days} days` : '—',
    },
    {
      accessorKey: 'generated_at',
      header: 'Generated',
      size: 130,
      cell: ({ row }) => formatDate(row.original.generated_at),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      size: 130,
      cell: ({ row }) => formatDate(row.original.created_at),
    },
    {
      id: 'actions',
      header: '',
      size: 90,
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          onClick={() =>
            navigate(
              `/dashboard/report-assessments/reports?report_id=${row.original.report_id}&hotel_id=${row.original.hotel_id}`,
            )
          }
        >
          <Eye className="h-3.5 w-3.5 mr-1.5" />
          View
        </Button>
      ),
    },
  ];

  const toolbar = (
    <div className="flex gap-2 ml-auto">
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-lg"
        disabled={!reports.length}
        onClick={() => downloadBlob(toCSV(reports), 'reports.csv', 'text/csv')}
      >
        <Download className="h-4 w-4 mr-2" />
        CSV
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-9 rounded-lg"
        disabled={!reports.length}
        onClick={() =>
          downloadBlob(JSON.stringify(reports, null, 2), 'reports.json', 'application/json')
        }
      >
        <Download className="h-4 w-4 mr-2" />
        JSON
      </Button>
    </div>
  );

  if (role !== 'admin') {
    return (
      <div className="p-6 max-w-md">
        <Card className="border border-grey-100 bg-white shadow-sm">
          <CardContent className="px-6 py-10">
            <p className="text-small leading-relaxed text-grey-700">
              Reports are available once your inbox assessment is complete. Contact your Altek
              consultant for access.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 w-full space-y-6">
      <div className="space-y-1">
        <h2 className="text-h6 font-semibold tracking-tight text-grey-900">Reports</h2>
        <p className="text-small leading-relaxed text-grey-700">
          Email assessment reports across all organizations.
        </p>
      </div>

      <Card className="overflow-hidden shadow-sm">
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="py-12 space-y-3">
              <p className="text-small font-medium text-grey-900">Failed to load reports</p>
              {error?.message && (
                <p className="text-xs text-grey-600 font-mono bg-surface px-3 py-2 rounded-lg border border-grey-100 max-w-lg">
                  {error.message}
                </p>
              )}
              <Button size="sm" variant="outline" className="rounded-lg" onClick={() => void refetch()}>
                Retry
              </Button>
            </div>
          ) : reports.length === 0 ? (
            <div className="py-12">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="h-5 w-5 text-grey-400" />
                <p className="text-small font-medium text-grey-900">No reports yet</p>
              </div>
              <p className="text-xs text-grey-600">
                Reports appear here once inbox assessments are completed and processed.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={reports}
              filterPlaceholder="Search hotels..."
              toolbarContent={toolbar}
              enablePagination
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
