import { connection } from "next/server";
import { getFunnelStats } from "@/lib/stats/funnel";
import { getStageFlow } from "@/lib/stats/flow";

export const instant = false;
import { StatTile } from "@/app/components/StatTile";
import { StageFlowDiagram } from "@/app/dashboard/StageFlowDiagram";
import { SyncBar } from "@/app/components/SyncBar";
import Link from "next/link";

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  HEARD_BACK: "Heard back",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STAGE_COLOR_VARS: Record<string, string> = {
  APPLIED: "var(--series-applied)",
  HEARD_BACK: "var(--series-heard-back)",
  INTERVIEW: "var(--series-interview)",
  OFFER: "var(--series-offer)",
  REJECTED: "var(--series-rejected)",
};

export default async function DashboardPage() {
  await connection();
  const [stats, flow] = await Promise.all([getFunnelStats(), getStageFlow()]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <SyncBar />

      <section className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            New activity this week
          </span>
          <span className="font-semibold" style={{ fontSize: 48, color: "var(--text-primary)" }}>
            {stats.newThisWeekCount}
          </span>
        </div>
        {stats.newThisWeekPreview.length > 0 && (
          <ul className="flex flex-col gap-2 text-sm pt-6 w-full sm:w-96">
            {stats.newThisWeekPreview.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-2 truncate">
                  <span
                    className="inline-block w-2 h-2 rounded-full shrink-0"
                    style={{ background: STAGE_COLOR_VARS[a.stage] }}
                  />
                  <Link href={`/applications/${a.id}`} className="truncate" style={{ color: "var(--text-primary)" }}>
                    {a.company}
                  </Link>
                </span>
                <span className="text-right truncate" style={{ color: "var(--text-muted)" }}>
                  {a.position}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid sm:grid-cols-2 gap-4">
        <div
          className="rounded-lg p-4"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
        >
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Replies this week
          </span>
          <div className="font-semibold" style={{ fontSize: 32, color: "var(--text-primary)" }}>
            {stats.repliesThisWeek}
          </div>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {stats.totalReplies} total replies tracked
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.stageCounts.map((s) => (
          <StatTile
            key={s.stage}
            label={STAGE_LABELS[s.stage]}
            value={s.count}
            delta={s.newThisWeek}
            deltaIsGood={s.stage !== "REJECTED"}
            accentColor={STAGE_COLOR_VARS[s.stage]}
          />
        ))}
      </section>

      <section
        className="rounded-lg p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <h2 className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Pipeline flow
        </h2>
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          Every application that&apos;s ever entered your pipeline, and how it moved between
          stages. Band width = number of applications; a band is colored by the stage it moved
          <em> from</em>. Rejected sits on its own since it&apos;s an exit, not a step forward.
        </p>
        <StageFlowDiagram nodes={flow.nodes} links={flow.links} totalApplications={flow.totalApplications} />
      </section>
    </div>
  );
}
