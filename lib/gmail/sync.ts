import type { gmail_v1 } from "googleapis";
import { db } from "../db.ts";
import { getGmailClient, withRetry } from "./client.ts";
import { parseGmailMessage, parseSignature } from "./parseMessage.ts";
import { ruleBasedClassifier } from "../classification/classifier.ts";
import { ATS_DOMAINS } from "../classification/rules.ts";
import { ingestEmail } from "./../applications/service.ts";

const MAX_PAGES = 20;

const SUBJECT_KEYWORDS = ["application", "interview", "offer", "position", "candidacy", "candidate"];

function buildFullScanQuery(): string {
  const fromClause = ATS_DOMAINS.map((d) => `from:${d}`).join(" OR ");
  const subjectClause = SUBJECT_KEYWORDS.map((k) => `subject:${k}`).join(" OR ");
  return `(${fromClause}) OR (${subjectClause})`;
}

export function isLikelyJobRelated(fromDomain: string, subject: string): boolean {
  const lowerSubject = subject.toLowerCase();
  if (ATS_DOMAINS.some((d) => fromDomain.endsWith(d))) return true;
  return SUBJECT_KEYWORDS.some((k) => lowerSubject.includes(k));
}

export type SyncResult = {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  mode: "full" | "incremental";
};

export async function runSync(): Promise<SyncResult> {
  const gmail = await getGmailClient();
  const state = await db.syncState.findUnique({ where: { id: "singleton" } });

  await db.syncState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", status: "running" },
    update: { status: "running", lastError: null },
  });

  try {
    const result = state?.lastHistoryId
      ? await runIncrementalSync(gmail, state.lastHistoryId)
      : await runFullScan(gmail);

    await db.syncState.update({
      where: { id: "singleton" },
      data: { status: "idle", lastSyncAt: new Date() },
    });

    return result;
  } catch (err) {
    await db.syncState.update({
      where: { id: "singleton" },
      data: { status: "error", lastError: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}

async function runFullScan(gmail: gmail_v1.Gmail): Promise<SyncResult> {
  const query = buildFullScanQuery();
  const messageIds: string[] = [];
  let pageToken: string | undefined;
  let pages = 0;

  do {
    const res = await withRetry(() =>
      gmail.users.messages.list({ userId: "me", q: query, maxResults: 100, pageToken })
    );
    for (const m of res.data.messages ?? []) {
      if (m.id) messageIds.push(m.id);
    }
    pageToken = res.data.nextPageToken ?? undefined;
    pages++;
  } while (pageToken && pages < MAX_PAGES);

  const result = await processMessageIds(gmail, messageIds);

  const profile = await withRetry(() => gmail.users.getProfile({ userId: "me" }));
  await db.syncState.update({
    where: { id: "singleton" },
    data: { lastHistoryId: profile.data.historyId ?? null, lastFullSyncAt: new Date() },
  });

  return { ...result, mode: "full" };
}

async function runIncrementalSync(gmail: gmail_v1.Gmail, startHistoryId: string): Promise<SyncResult> {
  const messageIds: string[] = [];
  let pageToken: string | undefined;
  let pages = 0;
  let latestHistoryId = startHistoryId;

  try {
    do {
      const res = await withRetry(() =>
        gmail.users.history.list({
          userId: "me",
          startHistoryId,
          historyTypes: ["messageAdded"],
          pageToken,
        })
      );
      for (const h of res.data.history ?? []) {
        for (const added of h.messagesAdded ?? []) {
          if (added.message?.id) messageIds.push(added.message.id);
        }
      }
      if (res.data.historyId) latestHistoryId = res.data.historyId;
      pageToken = res.data.nextPageToken ?? undefined;
      pages++;
    } while (pageToken && pages < MAX_PAGES);
  } catch (err) {
    const status = (err as { code?: number })?.code;
    if (status === 404) {
      // History expired (Gmail purges after ~1 week) — fall back to a full scan.
      return runFullScan(gmail);
    }
    throw err;
  }

  const result = await processMessageIds(gmail, messageIds);

  await db.syncState.update({ where: { id: "singleton" }, data: { lastHistoryId: latestHistoryId } });

  return { ...result, mode: "incremental" };
}

async function processMessageIds(gmail: gmail_v1.Gmail, messageIds: string[]): Promise<Omit<SyncResult, "mode">> {
  let added = 0;
  const updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const id of messageIds) {
    try {
      const existing = await db.emailMessage.findUnique({ where: { gmailMessageId: id }, select: { id: true } });
      if (existing) {
        skipped++;
        continue;
      }

      const metadata = await withRetry(() =>
        gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject"] })
      );
      const headers = metadata.data.payload?.headers ?? [];
      const from = headers.find((h) => h.name === "From")?.value ?? "";
      const subject = headers.find((h) => h.name === "Subject")?.value ?? "";
      const domain = from.match(/@([\w.-]+)/)?.[1]?.toLowerCase() ?? "";

      if (!isLikelyJobRelated(domain, subject)) {
        skipped++;
        continue;
      }

      const full = await withRetry(() => gmail.users.messages.get({ userId: "me", id, format: "full" }));
      const parsed = parseGmailMessage(full.data);

      const threadMessageCount = await db.emailMessage.count({ where: { gmailThreadId: parsed.gmailThreadId } });
      const isFirstMessageInThread = threadMessageCount === 0;

      const classification = await ruleBasedClassifier.classify({
        fromDomain: parsed.fromDomain,
        subject: parsed.subject,
        bodyText: parsed.bodyText,
        isFirstMessageInThread,
      });

      const signature = parseSignature(parsed.bodyText);

      await ingestEmail(parsed, classification, signature);
      added++;
    } catch {
      errors++;
    }
  }

  return { added, updated, skipped, errors };
}
