import type { AutomationReadiness, OperationTierBreakdown, ReportJson } from './types';
import { toLabel } from './helpers';

export interface RoadmapStep {
  system: string;
  unlocked: number;
  cumulative: number;
  note: string;
  categoriesUnlocked: string[];
  isPhaseOne: boolean;
  operationTierBreakdown?: { drafting: number; automation: number; human: number };
}

function sumOpTier(b: OperationTierBreakdown | undefined): number {
  if (!b) return 0;
  return (b.ai_drafting ?? 0) + (b.end_to_end_automation ?? 0) + (b.human_required ?? 0);
}

function mapApiTier(
  b: OperationTierBreakdown | undefined,
): { drafting: number; automation: number; human: number } | undefined {
  if (!b) return undefined;
  const d = b.ai_drafting ?? 0;
  const a = b.end_to_end_automation ?? 0;
  const h = b.human_required ?? 0;
  if (d + a + h === 0) return undefined;
  return { drafting: d, automation: a, human: h };
}

export function deriveRoadmap(rj: ReportJson): RoadmapStep[] {
  const ar = rj.automation_readiness;
  if (!ar?.integration_roadmap) return [];
  const ir = ar.integration_roadmap;
  const p1Tier = ir.phase1_by_operation_tier;
  const legacyPhase1 = (ar.automate_now_count ?? 0) + (ar.ai_draft_count ?? 0);
  const phase1FromTiers = sumOpTier(p1Tier);
  const phase1 =
    ir.phase1_count ?? (phase1FromTiers > 0 ? phase1FromTiers : undefined) ?? legacyPhase1;

  const legacyDrafting = ar.ai_draft_count ?? 0;
  const legacyAutomation = ar.automate_now_count ?? 0;
  const phase1OpBreakdown =
    mapApiTier(p1Tier) ??
    (legacyDrafting + legacyAutomation > 0
      ? { drafting: legacyDrafting, automation: legacyAutomation, human: 0 }
      : phase1 > 0
        ? { drafting: phase1, automation: 0, human: 0 }
        : undefined);

  let phase1Note: string;
  if (p1Tier && phase1FromTiers > 0) {
    const d = p1Tier.ai_drafting ?? 0;
    const e = p1Tier.end_to_end_automation ?? 0;
    const h = p1Tier.human_required ?? 0;
    phase1Note = `${d} AI drafting + ${e} end-to-end + ${h} human-required`;
  } else if (legacyDrafting + legacyAutomation > 0) {
    phase1Note = `${legacyAutomation} automate-now + ${legacyDrafting} AI draft`;
  } else if (phase1 > 0) {
    phase1Note = `${phase1} emails at day 1`;
  } else {
    phase1Note = 'No automatable-without-integration volume in this sample';
  }

  const noIntegrationStep: RoadmapStep = {
    system: 'No integration',
    unlocked: phase1,
    cumulative: ir.phase1_share,
    note: phase1Note,
    categoriesUnlocked: [],
    isPhaseOne: true,
    operationTierBreakdown: phase1OpBreakdown,
  };

  const apiSteps: RoadmapStep[] = ir.steps.map((s) => ({
    system: s.system,
    unlocked: s.emails_unlocked,
    cumulative: s.cumulative_ai_share,
    note: s.categories_unlocked?.map(toLabel).join(', ') || '',
    categoriesUnlocked: s.categories_unlocked ?? [],
    isPhaseOne: false,
    operationTierBreakdown: mapApiTier(s.operation_tier_breakdown),
  }));

  return [noIntegrationStep, ...apiSteps];
}

export function roadmapStepTierBreakdown(
  step: RoadmapStep,
  ar: AutomationReadiness | null,
): { drafting: number; automation: number; human: number } {
  if (step.operationTierBreakdown) return step.operationTierBreakdown;
  if (step.isPhaseOne) {
    const d = ar?.ai_draft_count ?? 0;
    const a = ar?.automate_now_count ?? 0;
    if (d + a > 0) return { drafting: d, automation: a, human: 0 };
    if (step.unlocked > 0) return { drafting: step.unlocked, automation: 0, human: 0 };
    return { drafting: 0, automation: 0, human: 0 };
  }
  const cats = step.categoriesUnlocked;
  if (!cats.length) return { drafting: 0, automation: 0, human: 0 };
  const rows = (ar?.categories ?? []).filter(
    (c) => c.category !== 'all' && cats.includes(c.category),
  );
  const sumTier = (tier: string) =>
    rows.filter((r) => r.tier === tier).reduce((acc, r) => acc + r.email_count, 0);
  return {
    drafting: sumTier('ai_drafting'),
    automation: sumTier('end_to_end_automation'),
    human: sumTier('human_required'),
  };
}
