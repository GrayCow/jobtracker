import { db } from "../db.ts";
import type { Stage } from "@prisma/client";
import type { ParsedMessage, ParsedSignature } from "../gmail/parseMessage.ts";
import type { ClassificationResult } from "../classification/classifier.ts";
import { decideMatch } from "./matcher.ts";
import { STAGE_FOR_CATEGORY } from "../classification/rules.ts";

const STAGE_RANK: Record<Stage, number> = {
  APPLIED: 0,
  HEARD_BACK: 1,
  INTERVIEW: 2,
  OFFER: 3,
  REJECTED: 3,
};

const TERMINAL_STAGES: Stage[] = ["OFFER", "REJECTED"];

/**
 * Persists one synced email: finds or creates its Application (via the
 * thread-matching rules in matcher.ts), writes the EmailMessage row, derives
 * a stage transition if warranted, and pre-fills recruiter info from the
 * signature parse only when those fields are still empty.
 */
export async function ingestEmail(
  parsed: ParsedMessage,
  classification: ClassificationResult,
  signature: ParsedSignature
): Promise<void> {
  const existing = await db.application.findUnique({
    where: { gmailThreadId: parsed.gmailThreadId },
    select: { id: true },
  });

  const match = decideMatch(parsed, classification, existing?.id ?? null);

  let applicationId: string | null = null;

  if (match.kind === "existing") {
    applicationId = match.applicationId;
  } else if (match.kind === "new") {
    const created = await db.application.create({
      data: {
        company: match.company,
        position: match.position ?? "(unknown position)",
        companyDomain: parsed.fromDomain,
        gmailThreadId: parsed.gmailThreadId,
        dateApplied: parsed.internalDate,
        firstSeenAt: parsed.internalDate,
        lastStatusChangeAt: parsed.internalDate,
        lastEmailAt: parsed.internalDate,
        stage: "APPLIED",
      },
    });
    applicationId = created.id;
    await db.statusEvent.create({
      data: { applicationId: created.id, fromStage: null, toStage: "APPLIED", occurredAt: parsed.internalDate },
    });
  }

  const isFirstInThread = applicationId !== null && match.kind === "new";

  await db.emailMessage.upsert({
    where: { gmailMessageId: parsed.gmailMessageId },
    create: {
      gmailMessageId: parsed.gmailMessageId,
      gmailThreadId: parsed.gmailThreadId,
      applicationId,
      fromAddress: parsed.fromAddress,
      fromDomain: parsed.fromDomain,
      toAddress: parsed.toAddress,
      subject: parsed.subject,
      snippet: parsed.snippet,
      bodyText: parsed.bodyText,
      internalDate: parsed.internalDate,
      isReply: !isFirstInThread,
      category: classification.category,
      classificationSource: classification.source,
      classificationConfidence: classification.confidence,
      matchedSignals: JSON.stringify(classification.matchedSignals),
      parsedSenderName: signature.name,
      parsedSenderTitle: signature.title,
    },
    update: {
      category: classification.category,
      classificationSource: classification.source,
      classificationConfidence: classification.confidence,
      matchedSignals: JSON.stringify(classification.matchedSignals),
    },
  });

  if (!applicationId) return;

  await db.application.update({
    where: { id: applicationId },
    data: { lastEmailAt: parsed.internalDate },
  });

  await maybeAdvanceStage(applicationId, classification.category, parsed.internalDate);
  await maybePrefillRecruiterInfo(applicationId, signature);
}

async function maybeAdvanceStage(
  applicationId: string,
  category: ClassificationResult["category"],
  occurredAt: Date
): Promise<void> {
  const toStage = STAGE_FOR_CATEGORY[category];
  if (!toStage) return;

  const application = await db.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { stage: true },
  });

  if (toStage === application.stage) return;

  // Stage only ever moves forward. The one exception is swapping between the
  // two terminal outcomes (e.g. a rescinded offer arriving as a rejection) —
  // both rank equal, so that's allowed; any other equal-or-lower-rank email
  // (a stray confirmation, a generic reply after an interview invite) is
  // ignored rather than dragging the stage backward.
  const isTerminalSwap = TERMINAL_STAGES.includes(application.stage) && TERMINAL_STAGES.includes(toStage);
  const isForwardMove = STAGE_RANK[toStage] > STAGE_RANK[application.stage];
  if (!isForwardMove && !isTerminalSwap) {
    return;
  }

  await db.application.update({
    where: { id: applicationId },
    data: {
      stage: toStage,
      lastStatusChangeAt: occurredAt,
      isRejected: toStage === "REJECTED",
      rejectedAt: toStage === "REJECTED" ? occurredAt : undefined,
    },
  });

  await db.statusEvent.create({
    data: { applicationId, fromStage: application.stage, toStage, occurredAt },
  });
}

async function maybePrefillRecruiterInfo(applicationId: string, signature: ParsedSignature): Promise<void> {
  if (!signature.name && !signature.linkedInUrl) return;

  const application = await db.application.findUniqueOrThrow({
    where: { id: applicationId },
    select: { recruiterName: true, recruiterLinkedInUrl: true },
  });

  const data: { recruiterName?: string; recruiterLinkedInUrl?: string } = {};
  if (!application.recruiterName && signature.name) data.recruiterName = signature.name;
  if (!application.recruiterLinkedInUrl && signature.linkedInUrl) data.recruiterLinkedInUrl = signature.linkedInUrl;

  if (Object.keys(data).length > 0) {
    await db.application.update({ where: { id: applicationId }, data });
  }
}

export type ListApplicationsFilters = {
  stage?: Stage;
  newThisWeek?: boolean;
  search?: string;
  sortBy?: "lastStatusChangeAt" | "dateApplied" | "company" | "stage";
  sortDir?: "asc" | "desc";
};

export function startOfWeek(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // days since most recent Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function listApplications(filters: ListApplicationsFilters = {}) {
  const where: Record<string, unknown> = {};
  if (filters.stage) where.stage = filters.stage;
  if (filters.newThisWeek) {
    const weekStart = startOfWeek();
    where.OR = [{ firstSeenAt: { gte: weekStart } }, { lastStatusChangeAt: { gte: weekStart } }];
  }
  if (filters.search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      {
        OR: [
          { company: { contains: filters.search } },
          { position: { contains: filters.search } },
        ],
      },
    ];
  }

  const applications = await db.application.findMany({
    where,
    orderBy: { [filters.sortBy ?? "lastStatusChangeAt"]: filters.sortDir ?? "desc" },
    include: { _count: { select: { emails: { where: { isReply: true } } } } },
  });

  return applications.map((app) => ({
    ...app,
    replyCount: app._count.emails,
  }));
}

export async function getApplicationById(id: string) {
  return db.application.findUnique({
    where: { id },
    include: { emails: { orderBy: { internalDate: "asc" } } },
  });
}

export type UpdateApplicationInput = Partial<{
  companyLinkedInUrl: string | null;
  recruiterName: string | null;
  recruiterLinkedInUrl: string | null;
  recruiterEmail: string | null;
  connectionNotes: string | null;
  stage: Stage;
}>;

export async function updateApplication(id: string, input: UpdateApplicationInput) {
  return db.application.update({ where: { id }, data: input });
}
