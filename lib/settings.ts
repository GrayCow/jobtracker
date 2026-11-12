import { db } from "./db.ts";
import type { SyncMethod, AccentTheme } from "@prisma/client";

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

export async function getAccentTheme(): Promise<AccentTheme> {
  const settings = await db.appSettings.findUnique({ where: { id: "singleton" }, select: { accentTheme: true } });
  return settings?.accentTheme ?? "TAN";
}

export async function setAccentTheme(theme: AccentTheme): Promise<void> {
  await db.appSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", accentTheme: theme },
    update: { accentTheme: theme },
  });
}
