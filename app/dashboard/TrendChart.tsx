"use client";

import { useState } from "react";

type TrendWeek = {
  weekStart: string;
  counts: Partial<Record<string, number>>;
};

type TrendChartProps = {
  trend: TrendWeek[];
  colorByStage: Record<string, string>;
  stageLabels: Record<string, string>;
  stages: string[];
};

const WIDTH = 720;
const HEIGHT = 260;
const PADDING = { top: 16, right: 16, bottom: 28, left: 32 };

export function TrendChart({ trend, colorByStage, stageLabels, stages }: TrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const maxValue = Math.max(
    1,
    ...trend.flatMap((week) => stages.map((stage) => week.counts[stage] ?? 0))
  );

  const xFor = (i: number) => PADDING.left + (i / Math.max(1, trend.length - 1)) * plotWidth;
  const yFor = (value: number) => PADDING.top + plotHeight - (value / maxValue) * plotHeight;

  const linePath = (stage: string) =>
    trend
      .map((week, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(week.counts[stage] ?? 0)}`)
      .join(" ");

  const yTicks = [0, Math.round(maxValue / 2), maxValue];

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIndex(null)}
        role="img"
        aria-label="Weekly funnel trend over the last 10 weeks"
      >
        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              stroke="var(--gridline)"
              strokeWidth={1}
            />
            <text x={PADDING.left - 8} y={yFor(tick) + 3} textAnchor="end" fontSize={10} fill="var(--text-muted)">
              {tick}
            </text>
          </g>
        ))}

        {stages.map((stage) => (
          <path key={stage} d={linePath(stage)} fill="none" stroke={colorByStage[stage]} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {stages.map((stage) =>
          trend.map((week, i) => (
            <circle
              key={`${stage}-${i}`}
              cx={xFor(i)}
              cy={yFor(week.counts[stage] ?? 0)}
              r={4}
              fill={colorByStage[stage]}
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          ))
        )}

        {hoverIndex !== null && (
          <line
            x1={xFor(hoverIndex)}
            x2={xFor(hoverIndex)}
            y1={PADDING.top}
            y2={HEIGHT - PADDING.bottom}
            stroke="var(--baseline)"
            strokeWidth={1}
          />
        )}

        {trend.map((week, i) => (
          <rect
            key={week.weekStart}
            x={xFor(i) - plotWidth / trend.length / 2}
            y={PADDING.top}
            width={plotWidth / trend.length}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setHoverIndex(i)}
          />
        ))}

        {trend.map((week, i) => {
          if (i % 2 !== 0 && trend.length > 6) return null;
          return (
            <text key={week.weekStart} x={xFor(i)} y={HEIGHT - 8} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
              {week.weekStart.slice(5)}
            </text>
          );
        })}
      </svg>

      {hoverIndex !== null && (
        <div
          className="text-xs rounded-md p-2 flex flex-col gap-1"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)", width: "fit-content" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>Week of {trend[hoverIndex].weekStart}</span>
          {stages.map((stage) => (
            <span key={stage} className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: colorByStage[stage] }} />
              <span style={{ color: "var(--text-primary)" }}>
                {stageLabels[stage]}: {trend[hoverIndex].counts[stage] ?? 0}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-4 flex-wrap text-xs">
        {stages.map((stage) => (
          <span key={stage} className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorByStage[stage] }} />
            <span style={{ color: "var(--text-secondary)" }}>{stageLabels[stage]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
