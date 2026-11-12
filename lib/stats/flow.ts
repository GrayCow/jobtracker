import { db } from "../db.ts";
import type { Stage } from "@prisma/client";

const STAGES: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"];

export type FlowNode = { stage: Stage; count: number };
export type FlowLink = { from: Stage; to: Stage; count: number };

export type StageFlow = {
  nodes: FlowNode[];
  links: FlowLink[];
  totalApplications: number;
};

/**
 * Builds the data for the pipeline-flow diagram from the StatusEvent audit
 * log: node size = how many distinct applications have ever reached that
 * stage (not just how many sit there today), link width = how many actually
 * made that specific transition. Both are real counts, not derived/guessed.
 */
export async function getStageFlow(): Promise<StageFlow> {
  const events = await db.statusEvent.findMany({
    select: { fromStage: true, toStage: true, applicationId: true },
  });

  const reached = new Map<Stage, Set<string>>(STAGES.map((s) => [s, new Set<string>()]));
  for (const e of events) {
    reached.get(e.toStage)?.add(e.applicationId);
  }

  const nodes: FlowNode[] = STAGES.map((stage) => ({ stage, count: reached.get(stage)?.size ?? 0 }));

  const linkCounts = new Map<string, number>();
  for (const e of events) {
    if (!e.fromStage) continue;
    const key = `${e.fromStage}->${e.toStage}`;
    linkCounts.set(key, (linkCounts.get(key) ?? 0) + 1);
  }

  const links: FlowLink[] = [...linkCounts.entries()].map(([key, count]) => {
    const [from, to] = key.split("->") as [Stage, Stage];
    return { from, to, count };
  });

  return { nodes, links, totalApplications: reached.get("APPLIED")?.size ?? 0 };
}
