export function TierMiniBar({
  drafting,
  automation,
  human,
  showDrafting,
  showAutomation,
  showHuman,
}: {
  drafting: number;
  automation: number;
  human: number;
  showDrafting: boolean;
  showAutomation: boolean;
  showHuman: boolean;
}) {
  const d = showDrafting ? drafting : 0;
  const a = showAutomation ? automation : 0;
  const h = showHuman ? human : 0;
  const total = d + a + h;
  if (total <= 0) {
    return (
      <div className="rounded-lg border border-dashed border-grey-200 px-3 py-2 text-xs text-grey-500">
        No emails in the selected tier view for this step.
      </div>
    );
  }
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-lg border border-grey-200">
      {d > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-blue-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: d, flexShrink: 1, flexBasis: 0 }}
          title={`AI drafting: ${d}`}
        >
          {d}
        </div>
      )}
      {a > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-emerald-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: a, flexShrink: 1, flexBasis: 0 }}
          title={`Automation: ${a}`}
        >
          {a}
        </div>
      )}
      {h > 0 && (
        <div
          className="flex min-w-[2rem] items-center justify-center bg-amber-600 px-1 text-[10px] font-semibold text-white"
          style={{ flexGrow: h, flexShrink: 1, flexBasis: 0 }}
          title={`Human: ${h}`}
        >
          {h}
        </div>
      )}
    </div>
  );
}
