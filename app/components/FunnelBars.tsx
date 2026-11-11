const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  HEARD_BACK: "Heard back",
  INTERVIEW: "Interview",
  OFFER: "Offer",
};

type FunnelBarsProps = {
  funnel: { stage: string; count: number }[];
  colorByStage: Record<string, string>;
};

export function FunnelBars({ funnel, colorByStage }: FunnelBarsProps) {
  const max = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <div className="flex flex-col gap-3" role="img" aria-label="Application funnel by stage">
      {funnel.map((f) => {
        const widthPct = Math.max(4, (f.count / max) * 100);
        return (
          <div key={f.stage} className="flex items-center gap-3">
            <span className="w-24 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
              {STAGE_LABELS[f.stage] ?? f.stage}
            </span>
            <div className="flex-1 flex items-center" style={{ height: 24 }}>
              <div
                className="rounded-r-md h-6 flex items-center justify-end pr-2"
                style={{ width: `${widthPct}%`, background: colorByStage[f.stage], minWidth: 28 }}
              >
                <span className="text-xs font-medium" style={{ color: "#ffffff" }}>
                  {f.count}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
