import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ArrowLeft, FileDown, FileJson, Link2, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  buildPublicEmailReportUrl,
  getPublicAppOrigin,
  reportRowTimestampForPublicLink,
} from '@/lib/report-share';
import { reportAssessmentsService } from '@/services/reportAssessments/reportAssessments';
import {
  EmailReportSnapshotView,
  isValidReportJson,
  type EmailReportSnapshot,
} from './_components/report-snapshot';

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-grey-500">
        {label}
      </span>
      <span className="text-small text-grey-900">{value}</span>
    </div>
  );
}

export default function ReportDetailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const reportId = params.get('report_id') ?? '';
  const hotelId = params.get('hotel_id') ?? '';
  const [downloadBusy, setDownloadBusy] = useState<'json' | 'pdf' | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['emailReports', 'snapshot', reportId, hotelId],
    queryFn: () => reportAssessmentsService.getReportSnapshot(reportId, hotelId),
    enabled: Boolean(reportId && hotelId),
  });

  const publicLinkMutation = useMutation({
    mutationFn: (p: { report_id: string; hotel_id: string; generated_at: string }) =>
      reportAssessmentsService.createPublicLink(p),
  });

  const generatedAtForPublicLink = data
    ? reportRowTimestampForPublicLink(data.generated_at, data.created_at)
    : null;

  const handleDownloadJSON = () => {
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
          period_days: (data.report_json as { period_days?: number }).period_days ?? (data as { period_days?: number }).period_days ?? 0,
          generated_at: data.generated_at ?? '',
          report_json: data.report_json,
        }
      : null;

  return (
    <div className="p-6 w-full space-y-6 ">
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
              onClick={handleDownloadJSON}
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
        <>
          {/* Fallback: metadata + raw JSON viewer when report_json lacks expected shape */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-h6 font-semibold tracking-tight text-grey-900">
                {data.hotel_name ?? data.hotel_id}
              </h2>
              <p className="text-small text-grey-600">Report ID: {data.report_id}</p>
            </div>
          </div>

          <Card className="border-grey-100 shadow-sm">
            <CardHeader className="border-b border-grey-100 bg-surface/50 py-3 px-4">
              <CardTitle className="text-sm font-semibold text-grey-900">Details</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <MetaRow label="Hotel" value={data.hotel_name ?? data.hotel_id} />
              <MetaRow label="Hotel ID" value={data.hotel_id} />
              <MetaRow label="Period" value={data.period_days != null ? `${data.period_days} days` : '—'} />
              <MetaRow label="Generated" value={formatDate(data.generated_at)} />
              <MetaRow label="Created" value={formatDate(data.created_at)} />
            </CardContent>
          </Card>

          {data.report_json ? (
            <Card className="border-grey-100 shadow-sm">
              <CardHeader className="border-b border-grey-100 bg-surface/50 py-3 px-4">
                <CardTitle className="text-sm font-semibold text-grey-900">Report Data</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <pre className="text-xs text-grey-700 overflow-auto max-h-[60vh] whitespace-pre-wrap">
                  {JSON.stringify(data.report_json, null, 2)}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-grey-100 shadow-sm">
              <CardContent className="py-10 text-center">
                <p className="text-small text-grey-600">Report content is not available for this snapshot.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
