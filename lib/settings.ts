import { db } from "./db.ts";
import type { SyncMethod } from "@prisma/client";

export async function getSyncMethod(): Promise<SyncMethod | null> {
  const state = await db.syncState.findUnique({ where: { id: "singleton" }, select: { syncMethod: true } });
  return state?.syncMethod ?? null;
}

export async function setSyncMethod(method: SyncMethod): Promise<void> {
  await db.syncState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", syncMethod: method },
    update: { syncMethod: method },
  });
}
