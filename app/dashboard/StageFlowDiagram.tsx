type Stage = "APPLIED" | "HEARD_BACK" | "INTERVIEW" | "OFFER" | "REJECTED";

type StageFlowDiagramProps = {
  nodes: { stage: Stage; count: number }[];
  links: { from: Stage; to: Stage; count: number }[];
  totalApplications: number;
};

const STAGE_LABELS: Record<Stage, string> = {
  APPLIED: "Applied",
  HEARD_BACK: "Heard back",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STAGE_COLOR_VARS: Record<Stage, string> = {
  APPLIED: "var(--series-applied)",
  HEARD_BACK: "var(--series-heard-back)",
  INTERVIEW: "var(--series-interview)",
  OFFER: "var(--series-offer)",
  REJECTED: "var(--series-rejected)",
};

const COLUMN_OF: Record<Stage, number> = {
  APPLIED: 0,
  HEARD_BACK: 1,
  INTERVIEW: 2,
  OFFER: 3,
  REJECTED: 3,
};

// Fixed draw order within a column / for deterministic link stacking.
const STAGE_ORDER: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"];

const VIEW_W = 820;
const VIEW_H = 300;
const MARGIN_TOP = 40;
const MARGIN_BOTTOM = 12;
const PLOT_H = VIEW_H - MARGIN_TOP - MARGIN_BOTTOM;
const NODE_W = 14;
const STACK_GAP = 10;
const COL_X = [40, 270, 500, 620];

function ribbonPath(x0: number, y0top: number, y0bot: number, x1: number, y1top: number, y1bot: number): string {
  const midX = (x0 + x1) / 2;
  return [
    `M ${x0},${y0top}`,
    `C ${midX},${y0top} ${midX},${y1top} ${x1},${y1top}`,
    `L ${x1},${y1bot}`,
    `C ${midX},${y1bot} ${midX},${y0bot} ${x0},${y0bot}`,
    "Z",
  ].join(" ");
}

export function StageFlowDiagram({ nodes, links, totalApplications }: StageFlowDiagramProps) {
  const countByStage = new Map(nodes.map((n) => [n.stage, n.count]));
  const visibleStages = STAGE_ORDER.filter((s) => (countByStage.get(s) ?? 0) > 0);

  if (visibleStages.length === 0 || totalApplications === 0) {
    return (
      <div className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
        No applications yet — this fills in once you have some history to show.
      </div>
    );
  }

  const columns: Stage[][] = [[], [], [], []];
  for (const s of visibleStages) columns[COLUMN_OF[s]].push(s);

  // Scale shared across every column so sizes are comparable; the most
  // cramped column (accounting for its stacking gaps) sets the ceiling.
  let scale = Infinity;
  for (const col of columns) {
    if (col.length === 0) continue;
    const sum = col.reduce((acc, s) => acc + (countByStage.get(s) ?? 0), 0);
    const available = PLOT_H - (col.length - 1) * STACK_GAP;
    scale = Math.min(scale, available / Math.max(1, sum));
  }
  if (!Number.isFinite(scale)) scale = 1;

  type Placed = { stage: Stage; x: number; yTop: number; height: number; outCursor: number; inCursor: number };
  const placed = new Map<Stage, Placed>();

  columns.forEach((col, colIndex) => {
    if (col.length === 0) return;
    const heights = col.map((s) => (countByStage.get(s) ?? 0) * scale);
    const totalHeight = heights.reduce((a, b) => a + b, 0) + (col.length - 1) * STACK_GAP;
    let y = MARGIN_TOP + (PLOT_H - totalHeight) / 2;
    col.forEach((stage, i) => {
      const height = heights[i];
      placed.set(stage, { stage, x: COL_X[colIndex], yTop: y, height, outCursor: y, inCursor: y });
      y += height + STACK_GAP;
    });
  });

  const orderedLinks = [...links]
    .filter((l) => placed.has(l.from) && placed.has(l.to) && l.count > 0)
    .sort((a, b) => COLUMN_OF[a.from] - COLUMN_OF[b.from] || STAGE_ORDER.indexOf(a.to) - STAGE_ORDER.indexOf(b.to));

  const ribbons = orderedLinks.map((link) => {
    const src = placed.get(link.from)!;
    const dst = placed.get(link.to)!;
    const h = link.count * scale;
    const srcY0 = src.outCursor;
    const srcY1 = srcY0 + h;
    src.outCursor = srcY1;
    const dstY0 = dst.inCursor;
    const dstY1 = dstY0 + h;
    dst.inCursor = dstY1;

    return {
      key: `${link.from}->${link.to}`,
      path: ribbonPath(src.x + NODE_W, srcY0, srcY1, dst.x, dstY0, dstY1),
      color: STAGE_COLOR_VARS[link.from],
      title: `${STAGE_LABELS[link.from]} → ${STAGE_LABELS[link.to]}: ${link.count}`,
    };
  });

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="w-full h-auto" role="img" aria-label="Application pipeline flow">
      {ribbons.map((r) => (
        <path key={r.key} d={r.path} fill={r.color} fillOpacity={0.45}>
          <title>{r.title}</title>
        </path>
      ))}
      {[...placed.values()].map((n) => {
        const pct = totalApplications > 0 ? Math.round(((countByStage.get(n.stage) ?? 0) / totalApplications) * 100) : 0;
        const col = COLUMN_OF[n.stage];
        const isLastColumn = col === 3;
        const labelX = isLastColumn ? n.x + NODE_W + 8 : n.x + NODE_W / 2;
        const anchor = isLastColumn ? "start" : "middle";
        return (
          <g key={n.stage}>
            <rect x={n.x} y={n.yTop} width={NODE_W} height={Math.max(2, n.height)} rx={2} fill={STAGE_COLOR_VARS[n.stage]}>
              <title>{`${STAGE_LABELS[n.stage]}: ${countByStage.get(n.stage)} (${pct}% of ${totalApplications})`}</title>
            </rect>
            <text
              x={labelX}
              y={isLastColumn ? n.yTop + n.height / 2 - 2 : n.yTop - 10}
              textAnchor={anchor}
              className="text-xs font-medium"
              style={{ fill: "var(--text-primary)" }}
            >
              {STAGE_LABELS[n.stage]}
            </text>
            <text
              x={labelX}
              y={isLastColumn ? n.yTop + n.height / 2 - 2 : n.yTop - 10}
              dy={12}
              textAnchor={anchor}
              className="text-xs"
              style={{ fill: "var(--text-muted)" }}
            >
              {countByStage.get(n.stage)} · {pct}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
