import { db } from "../db.ts";
import type { Stage } from "@prisma/client";
import { startOfWeek } from "../applications/service.ts";

const ALL_STAGES: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"];
const FUNNEL_STAGES: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER"];
const TREND_WEEKS = 10;

export type StageCount = {
  stage: Stage;
  count: number;
  newThisWeek: number;
};

export type TrendWeek = {
  weekStart: string; // ISO date
  counts: Partial<Record<Stage, number>>;
};

export type FunnelStats = {
  stageCounts: StageCount[];
  funnelOrdered: { stage: Stage; count: number }[];
  rejectedCount: number;
  newThisWeekCount: number;
  newThisWeekPreview: { id: string; company: string; position: string; stage: Stage }[];
  repliesThisWeek: number;
  totalReplies: number;
  trend: TrendWeek[];
};

export async function getFunnelStats(): Promise<FunnelStats> {
  const weekStart = startOfWeek();

  const [allApplications, allStatusEvents, repliesThisWeek, totalReplies] = await Promise.all([
    db.application.findMany({
      select: { id: true, company: true, position: true, stage: true, firstSeenAt: true, lastStatusChangeAt: true },
    }),
    db.statusEvent.findMany({ select: { toStage: true, occurredAt: true } }),
    db.emailMessage.count({ where: { isReply: true, internalDate: { gte: weekStart } } }),
    db.emailMessage.count({ where: { isReply: true } }),
  ]);

  const stageCounts: StageCount[] = ALL_STAGES.map((stage) => {
    const inStage = allApplications.filter((a) => a.stage === stage);
    const newThisWeek = inStage.filter(
      (a) => a.lastStatusChangeAt >= weekStart || a.firstSeenAt >= weekStart
    ).length;
    return { stage, count: inStage.length, newThisWeek };
  });

  const countByStage = (stage: Stage) => stageCounts.find((s) => s.stage === stage)?.count ?? 0;
  const funnelOrdered = FUNNEL_STAGES.map((stage) => ({ stage, count: countByStage(stage) }));
  const rejectedCount = countByStage("REJECTED");

  const newApps = allApplications.filter(
    (a) => a.lastStatusChangeAt >= weekStart || a.firstSeenAt >= weekStart
  );

  const trend = buildTrend(allStatusEvents, weekStart);

  return {
    stageCounts,
    funnelOrdered,
    rejectedCount,
    newThisWeekCount: newApps.length,
    newThisWeekPreview: newApps
      .slice(0, 5)
      .map((a) => ({ id: a.id, company: a.company, position: a.position, stage: a.stage })),
    repliesThisWeek,
    totalReplies,
    trend,
  };
}

function buildTrend(
  events: { toStage: Stage; occurredAt: Date }[],
  currentWeekStart: Date
): TrendWeek[] {
  const weeks: TrendWeek[] = [];
  for (let i = TREND_WEEKS - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weeks.push({ weekStart: weekStart.toISOString().slice(0, 10), counts: {} });
  }

  for (const event of events) {
    for (let i = weeks.length - 1; i >= 0; i--) {
      const weekStartDate = new Date(weeks[i].weekStart);
      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 7);
      if (event.occurredAt >= weekStartDate && event.occurredAt < weekEndDate) {
        weeks[i].counts[event.toStage] = (weeks[i].counts[event.toStage] ?? 0) + 1;
        break;
      }
    }
  }

  return weeks;
}
