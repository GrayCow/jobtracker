import { db } from "../db.ts";
import type { Stage } from "@prisma/client";
import { startOfWeek } from "../applications/service.ts";

const ALL_STAGES: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"];

export type StageCount = {
  stage: Stage;
  count: number;
  newThisWeek: number;
};

export type FunnelStats = {
  stageCounts: StageCount[];
  newThisWeekCount: number;
  newThisWeekPreview: { id: string; company: string; position: string; stage: Stage }[];
  repliesThisWeek: number;
  totalReplies: number;
};

export async function getFunnelStats(): Promise<FunnelStats> {
  const weekStart = startOfWeek();

  const [allApplications, repliesThisWeek, totalReplies] = await Promise.all([
    db.application.findMany({
      select: { id: true, company: true, position: true, stage: true, firstSeenAt: true, lastStatusChangeAt: true },
    }),
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

  const newApps = allApplications.filter(
    (a) => a.lastStatusChangeAt >= weekStart || a.firstSeenAt >= weekStart
  );

  return {
    stageCounts,
    newThisWeekCount: newApps.length,
    newThisWeekPreview: newApps
      .slice(0, 5)
      .map((a) => ({ id: a.id, company: a.company, position: a.position, stage: a.stage })),
    repliesThisWeek,
    totalReplies,
  };
}
