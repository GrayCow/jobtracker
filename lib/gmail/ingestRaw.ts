import { db } from "../db.ts";
import { ruleBasedClassifier } from "../classification/classifier.ts";
import { parseSignature } from "./parseMessage.ts";
import { isLikelyJobRelated } from "./sync.ts";
import { ingestEmail } from "../applications/service.ts";
import type { ParsedMessage } from "./parseMessage.ts";

/**
 * Minimal shape needed to ingest one already-fetched email, independent of
 * *how* it was fetched. The Google-API path (sync.ts) builds this from a
 * `gmail.users.messages.get` response; the Claude-assisted path builds it
 * from Gmail MCP tool output. Either way it lands here and goes through the
 * exact same classify -> match -> ingestEmail pipeline.
 */
export type RawEmailInput = {
  gmailMessageId: string;
  gmailThreadId: string;
  fromAddress: string;
  toAddress?: string | null;
  subject: string;
  snippet?: string | null;
  bodyText: string;
  internalDate: string | Date;
};

export type IngestRawResult = "added" | "skipped";

export async function ingestRawMessage(input: RawEmailInput): Promise<IngestRawResult> {
  const existing = await db.emailMessage.findUnique({
    where: { gmailMessageId: input.gmailMessageId },
    select: { id: true },
  });
  if (existing) return "skipped";

  const fromAddress = input.fromAddress.trim().toLowerCase();
  const fromDomain = fromAddress.split("@")[1] ?? "";
  const subject = input.subject || "(no subject)";

  if (!isLikelyJobRelated(fromDomain, subject)) return "skipped";

  const internalDate = input.internalDate instanceof Date ? input.internalDate : new Date(input.internalDate);
  const bodyText = input.bodyText.slice(0, 20_000);

  const parsed: ParsedMessage = {
    gmailMessageId: input.gmailMessageId,
    gmailThreadId: input.gmailThreadId,
    fromAddress,
    fromDomain,
    fromDisplayName: null,
    toAddress: input.toAddress ?? null,
    subject,
    snippet: input.snippet ?? null,
    bodyText,
    internalDate,
  };

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
  return "added";
}
