import { connection } from "next/server";
import { getFunnelStats } from "@/lib/stats/funnel";

export const instant = false;
import { StatTile } from "@/app/components/StatTile";
import { FunnelBars } from "@/app/components/FunnelBars";
import { SyncBar } from "@/app/components/SyncBar";
import { TrendChart } from "@/app/dashboard/TrendChart";
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
  const stats = await getFunnelStats();

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-8">
      <SyncBar />

      <section className="flex flex-col gap-2">
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
          New this week
        </span>
        <span className="font-semibold" style={{ fontSize: 48, color: "var(--text-primary)" }}>
          {stats.newThisWeekCount}
        </span>
        {stats.newThisWeekPreview.length > 0 && (
          <ul className="flex flex-col gap-1 mt-2 text-sm">
            {stats.newThisWeekPreview.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ background: STAGE_COLOR_VARS[a.stage] }}
                />
                <Link href={`/applications/${a.id}`} style={{ color: "var(--text-primary)" }}>
                  {a.company}
                </Link>
                <span style={{ color: "var(--text-muted)" }}>— {a.position}</span>
              </li>
            ))}
          </ul>
        )}
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

      <section
        className="rounded-lg p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <h2 className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Funnel
        </h2>
        <FunnelBars
          funnel={stats.funnelOrdered}
          colorByStage={{
            APPLIED: "var(--series-applied)",
            HEARD_BACK: "var(--series-heard-back)",
            INTERVIEW: "var(--series-interview)",
            OFFER: "var(--series-offer)",
          }}
        />
      </section>

      <section
        className="rounded-lg p-4"
        style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
      >
        <h2 className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          Last 10 weeks
        </h2>
        <TrendChart
          trend={stats.trend}
          stages={["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"]}
          stageLabels={STAGE_LABELS}
          colorByStage={{
            APPLIED: "#2a78d6",
            HEARD_BACK: "#eb6834",
            INTERVIEW: "#1baf7a",
            OFFER: "#eda100",
            REJECTED: "#e87ba4",
          }}
        />
      </section>
    </div>
  );
}
