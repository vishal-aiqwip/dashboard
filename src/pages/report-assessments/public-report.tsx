import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';

import { Skeleton } from '@/components/ui/skeleton';
import { reportAssessmentsService } from '@/services/reportAssessments/reportAssessments';

import {
  EmailReportSnapshotView,
  isValidReportJson,
  type EmailReportSnapshot,
} from './_components/report-snapshot';

export default function PublicReportPage() {
  const [searchParams] = useSearchParams();

  const v = searchParams.get('v') ?? '';
  const rid = searchParams.get('rid') ?? '';
  const hid = searchParams.get('hid') ?? '';
  const at = searchParams.get('at') ?? '';
  const sig = searchParams.get('sig') ?? '';

  const missingParams = !v || !rid || !hid || !at || !sig;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['publicReport', v, rid, hid, at, sig],
    queryFn: () => reportAssessmentsService.getPublicReport({ v, rid, hid, at, sig }),
    enabled: !missingParams,
    retry: false,
  });

  const reportJson = (() => {
    if (!data) return null;
    const raw = data.report_json;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) as Record<string, unknown>; } catch { return null; }
    }
    return raw ?? null;
  })();

  const snapshot: EmailReportSnapshot | null =
    data && isValidReportJson(reportJson)
      ? {
          report_id: data.report_id,
          hotel_id: data.hotel_id,
          hotel_name: data.hotel_name ?? null,
          period_days:
            (reportJson as { period_days?: number }).period_days ??
            (data as { period_days?: number }).period_days ??
            0,
          generated_at: data.generated_at ?? '',
          report_json: reportJson,
        }
      : null;

  if (missingParams) {
    return <ErrorState message="Invalid link — required parameters are missing." />;
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Could not load this report.';
    const detail =
      msg.includes('forbidden') || msg.includes('403')
        ? 'This link may have expired or is invalid.'
        : msg.includes('404')
          ? 'The report could not be found.'
          : msg;
    return <ErrorState message={detail} />;
  }

  if (!snapshot) {
    return <ErrorState message="Report data is unavailable or in an unexpected format." />;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <EmailReportSnapshotView snapshot={snapshot} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-2">
        <p className="text-base font-semibold text-grey-900">Report unavailable</p>
        <p className="text-sm text-grey-600">{message}</p>
      </div>
    </div>
  );
}
