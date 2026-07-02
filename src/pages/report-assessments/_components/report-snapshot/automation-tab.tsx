import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

import { toLabel, toPercent } from './helpers';
import { NarrativeText } from './narrative-text';
import { SectionHeader } from './section-header';
import { TierMiniBar } from './tier-mini-bar';
import { deriveRoadmap, roadmapStepTierBreakdown } from './roadmap-helpers';
import type { AutomationReadiness, ReportJson } from './types';

interface AutomationTabProps {
  auto: AutomationReadiness | null;
  rj: ReportJson;
}

export function AutomationTab({ auto, rj }: AutomationTabProps) {
  const [roadmapFilterDrafting, setRoadmapFilterDrafting] = useState(true);
  const [roadmapFilterAutomation, setRoadmapFilterAutomation] = useState(true);
  const [roadmapFilterHuman, setRoadmapFilterHuman] = useState(true);

  // Tier totals
  const automationAggregateTiers = (auto?.categories ?? []).filter(
    (c) => c.category === 'all',
  );
  const tierDrafting = automationAggregateTiers.find((c) => c.tier === 'ai_drafting');
  const tierE2e = automationAggregateTiers.find((c) => c.tier === 'end_to_end_automation');
  const tierHuman = automationAggregateTiers.find((c) => c.tier === 'human_required');

  const automationDraftingEmails =
    tierDrafting?.email_count ?? auto?.ai_drafting_count ?? auto?.ai_draft_count ?? 0;
  const automationE2eEmails = tierE2e?.email_count ?? auto?.end_to_end_count ?? 0;
  const automationHumanEmails = tierHuman?.email_count ?? auto?.human_required_count ?? 0;
  const automationTierTotal = Math.max(
    1,
    automationDraftingEmails + automationE2eEmails + automationHumanEmails,
  );
  const automationDraftingPct =
    tierDrafting?.percentage ?? (automationDraftingEmails / automationTierTotal) * 100;
  const automationE2ePct =
    tierE2e?.percentage ?? (automationE2eEmails / automationTierTotal) * 100;
  const automationHumanPct =
    tierHuman?.percentage ?? (automationHumanEmails / automationTierTotal) * 100;

  const integrationRoadmap = deriveRoadmap(rj);

  const roadmapTierFilter = useMemo(() => {
    const none = !roadmapFilterDrafting && !roadmapFilterAutomation && !roadmapFilterHuman;
    if (none) return { drafting: true, automation: true, human: true };
    return {
      drafting: roadmapFilterDrafting,
      automation: roadmapFilterAutomation,
      human: roadmapFilterHuman,
    };
  }, [roadmapFilterDrafting, roadmapFilterAutomation, roadmapFilterHuman]);

  const integrationRoadmapFiltered = useMemo(() => {
    const f = roadmapTierFilter;
    if (f.drafting && f.automation && f.human) return integrationRoadmap;
    return integrationRoadmap.filter((step) => {
      const b = roadmapStepTierBreakdown(step, auto);
      return (
        (f.drafting && b.drafting > 0) ||
        (f.automation && b.automation > 0) ||
        (f.human && b.human > 0)
      );
    });
  }, [integrationRoadmap, auto, roadmapTierFilter]);

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border-grey-100 shadow-sm">
        <CardHeader className="pb-2">
          <SectionHeader
            title="Guest inbox by automation tier"
            description="Three buckets: AI drafts with human review, automation once systems are connected, and cases that stay with staff."
          />
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border border-grey-100 border-l-4 border-l-blue-600 bg-blue-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
                AI drafting
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-blue-950">
                {automationDraftingEmails.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-blue-900/80">
                emails · {automationDraftingPct.toFixed(1)}% of guest volume
              </p>
              <p className="mt-2 text-xs leading-relaxed text-blue-950/90">
                Suggested replies, lookups — human sends.
              </p>
            </div>
            <div className="rounded-xl border border border-grey-100 border-l-4 border-l-emerald-600 bg-emerald-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Automation
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">
                {automationE2eEmails.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-emerald-900/80">
                emails · {automationE2ePct.toFixed(1)}% of guest volume
              </p>
              <p className="mt-2 text-xs leading-relaxed text-emerald-950/90">
                Needs integrations to complete actions in your systems.
              </p>
            </div>
            <div className="rounded-xl border border border-grey-100 border-l-4 border-l-amber-600 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-950">
                Human required
              </p>
              <p className="mt-2 text-2xl font-bold tabular-nums text-amber-950">
                {automationHumanEmails.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-amber-900/85">
                emails · {automationHumanPct.toFixed(1)}% of guest volume
              </p>
              <p className="mt-2 text-xs leading-relaxed text-amber-950/90">
                Judgment, exceptions, or sensitive threads.
              </p>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-grey-700">
              Share of assessed guest emails (width ∝ email count)
            </p>
            <div className="flex h-14 w-full overflow-hidden rounded-xl border border-grey-200">
              {automationDraftingEmails > 0 && (
                <div
                  className="flex min-w-[3rem] flex-col justify-center bg-blue-600 px-2 text-center text-xs font-semibold text-white"
                  style={{
                    flexGrow: automationDraftingEmails,
                    flexShrink: 1,
                    flexBasis: 0,
                  }}
                >
                  <span>Draft</span>
                  <span>{automationDraftingPct.toFixed(0)}%</span>
                </div>
              )}
              {automationE2eEmails > 0 && (
                <div
                  className="flex min-w-[3rem] flex-col justify-center bg-emerald-600 px-2 text-center text-xs font-semibold text-white"
                  style={{ flexGrow: automationE2eEmails, flexShrink: 1, flexBasis: 0 }}
                >
                  <span>Auto</span>
                  <span>{automationE2ePct.toFixed(0)}%</span>
                </div>
              )}
              {automationHumanEmails > 0 && (
                <div
                  className="flex min-w-[3rem] flex-col justify-center bg-amber-600 px-2 text-center text-xs font-semibold text-white"
                  style={{ flexGrow: automationHumanEmails, flexShrink: 1, flexBasis: 0 }}
                >
                  <span>Human</span>
                  <span>{automationHumanPct.toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {rj.roi_model?.narrative && (
        <Card className="rounded-2xl border-grey-100 shadow-sm">
          <CardHeader className="pb-2">
            <SectionHeader
              title="ROI estimate"
              description="Directional time impact from observed volume — not a staffing guarantee."
            />
          </CardHeader>
          <CardContent>
            <NarrativeText source={rj.roi_model.narrative} />
          </CardContent>
        </Card>
      )}

      {integrationRoadmap.length > 0 && (
        <Card className="rounded-2xl border-grey-100 shadow-sm">
          <CardHeader className="pb-2">
            <SectionHeader
              title="Integration roadmap"
              description="Filter which tiers appear in each step."
            />
          </CardHeader>
          <CardContent className="space-y-5">
            {auto?.narrative && <NarrativeText source={auto.narrative} />}
            <div className="flex flex-col gap-2 rounded-xl border border-grey-100 bg-muted/25 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
              <span className="text-sm font-medium text-grey-800">Tiers in steps</span>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {[
                  {
                    id: 'drafting',
                    label: 'AI drafting',
                    checked: roadmapFilterDrafting,
                    set: setRoadmapFilterDrafting,
                    color: 'text-blue-900',
                  },
                  {
                    id: 'automation',
                    label: 'Automation',
                    checked: roadmapFilterAutomation,
                    set: setRoadmapFilterAutomation,
                    color: 'text-emerald-900',
                  },
                  {
                    id: 'human',
                    label: 'Human required',
                    checked: roadmapFilterHuman,
                    set: setRoadmapFilterHuman,
                    color: 'text-amber-950',
                  },
                ].map(({ id, label, checked, set, color }) => (
                  <div key={id} className="flex items-center gap-2">
                    <Checkbox
                      id={`roadmap-tier-${id}`}
                      checked={checked}
                      onCheckedChange={(v) => set(v === true)}
                    />
                    <Label
                      htmlFor={`roadmap-tier-${id}`}
                      className={cn('cursor-pointer text-sm font-normal', color)}
                    >
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            {integrationRoadmapFiltered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No roadmap steps match the selected tiers for this report.
              </p>
            ) : (
              integrationRoadmapFiltered.map((step) => {
                const stepIdx = integrationRoadmap.indexOf(step);
                const tierB = roadmapStepTierBreakdown(step, auto);
                const f = roadmapTierFilter;
                return (
                  <div
                    key={`${stepIdx}-${step.system}`}
                    className="rounded-xl border border-grey-100 bg-background p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Step {stepIdx + 1}
                          </Badge>
                          <p className="text-sm font-medium">{toLabel(step.system)}</p>
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground">{step.note}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xl font-semibold">+{step.unlocked}</p>
                        <p className="text-xs text-muted-foreground">emails unlocked</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-grey-600">
                        By tier
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums">
                        {f.drafting && (
                          <span className="text-blue-900">
                            <span className="font-medium">AI drafting</span>{' '}
                            {tierB.drafting.toLocaleString()}
                          </span>
                        )}
                        {f.automation && (
                          <span className="text-emerald-900">
                            <span className="font-medium">Automation</span>{' '}
                            {tierB.automation.toLocaleString()}
                          </span>
                        )}
                        {f.human && (
                          <span className="text-amber-950">
                            <span className="font-medium">Human</span>{' '}
                            {tierB.human.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <TierMiniBar
                        drafting={tierB.drafting}
                        automation={tierB.automation}
                        human={tierB.human}
                        showDrafting={f.drafting}
                        showAutomation={f.automation}
                        showHuman={f.human}
                      />
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-end text-xs font-medium">
                        {toPercent(step.cumulative, 1)}
                      </div>
                      <Progress value={step.cumulative * 100} className="h-2" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
