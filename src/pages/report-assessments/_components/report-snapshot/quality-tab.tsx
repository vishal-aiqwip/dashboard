import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { NarrativeText } from './narrative-text';
import type { BenchmarkScores, BrandVoiceAnalysis, CommunicationProfile } from './types';

interface QualityTabProps {
  brandVoice: BrandVoiceAnalysis | null;
  bench: BenchmarkScores | null;
  profile: CommunicationProfile | null;
}

export function QualityTab({ brandVoice, bench, profile }: QualityTabProps) {
  const brandVoiceChartData = profile
    ? [
        {
          dimension: 'Warmth',
          score: profile.warmth?.score ?? 0,
          target: profile.warmth?.target ?? 3,
        },
        {
          dimension: 'Personalisation',
          score: profile.personalisation?.score ?? 0,
          target: profile.personalisation?.target ?? 3,
        },
        {
          dimension: 'Structure',
          score: profile.structure?.score ?? 0,
          target: profile.structure?.target ?? 3,
        },
        {
          dimension: 'Completeness',
          score: profile.completeness?.score ?? 0,
          target: profile.completeness?.target ?? 3,
        },
        {
          dimension: 'Formality',
          score: profile.formality?.score ?? 0,
          target: profile.formality?.target ?? 3,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-grey-100 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-grey-900">Brand voice</CardTitle>
          <p className="text-xs text-grey-600">
            How replies scored across key dimensions (sample of assessed messages).
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {brandVoice?.narrative && <NarrativeText source={brandVoice.narrative} />}

          {profile || bench?.brand_voice_avg != null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-grey-100 bg-surface/50 p-3">
                <p className="text-xs text-grey-600">Brand voice avg</p>
                <p className="mt-0.5 text-lg font-semibold text-grey-900">
                  {bench?.brand_voice_avg != null
                    ? `${bench.brand_voice_avg.toFixed(2)} / 4`
                    : '—'}
                </p>
              </div>
              {profile ? (
                (
                  [
                    ['Warmth', 'warmth'],
                    ['Personalisation', 'personalisation'],
                    ['Structure', 'structure'],
                    ['Completeness', 'completeness'],
                    ['Formality', 'formality'],
                  ] as const
                ).map(([label, key]) => (
                  <div key={key} className="rounded-xl border border-grey-100 bg-surface/50 p-3">
                    <p className="text-xs text-grey-600">{label}</p>
                    <p className="mt-0.5 text-lg font-semibold text-grey-900">
                      {(profile[key]?.score ?? 0).toFixed(2)} / 4
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-grey-200 bg-surface/40 p-4 text-xs text-grey-600 sm:col-span-2 lg:col-span-5">
                  Per-dimension brand voice scores were not included in this export.
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-grey-600">
              Brand voice metrics were not included in this report.
            </p>
          )}

          {brandVoiceChartData.length > 0 && (
            <div className="mx-auto h-96 max-w-2xl">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={brandVoiceChartData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fontSize: 10 }} />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)} / 4`, 'Score']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
