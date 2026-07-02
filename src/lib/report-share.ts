const REPORT_SHARE_FORMAT_VERSION = '1' as const;

export function reportRowTimestampForPublicLink(
  generatedAt: string | null | undefined,
  createdAt: string | null | undefined,
): string | null {
  if (typeof generatedAt === 'string' && generatedAt.trim() !== '') return generatedAt;
  if (typeof createdAt === 'string' && createdAt.trim() !== '') return createdAt;
  return null;
}

export function getPublicAppOrigin(): string {
  const env = (import.meta as { env?: Record<string, string> }).env?.VITE_PUBLIC_APP_ORIGIN;
  if (typeof env === 'string' && env.trim() !== '') return env.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function buildPublicEmailReportUrl(
  origin: string,
  params: { report_id: string; hotel_id: string; generated_at: string },
  signature: string,
): string {
  const p = new URLSearchParams();
  p.set('v', REPORT_SHARE_FORMAT_VERSION);
  p.set('rid', params.report_id);
  p.set('hid', params.hotel_id);
  p.set('at', params.generated_at);
  p.set('sig', signature);
  return `${origin.replace(/\/$/, '')}/email-reports/public?${p.toString()}`;
}
