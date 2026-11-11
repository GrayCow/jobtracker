import type { ParsedMessage } from "../gmail/parseMessage.ts";
import type { ClassificationResult } from "../classification/classifier.ts";

const GENERIC_SENDER_NAMES = [
  "greenhouse",
  "lever",
  "workday",
  "icims",
  "smartrecruiters",
  "workable",
  "ashby",
  "taleo",
  "successfactors",
  "jobvite",
  "bamboohr",
  "breezy",
  "recruitee",
  "no-reply",
  "noreply",
  "notifications",
];

const SUBJECT_COMPANY_PATTERNS = [
  /thank you for applying to ([^,.\n-]+)/i,
  /thanks for applying to ([^,.\n-]+)/i,
  /thanks for your interest in ([^,.\n-]+)/i,
  /your application to ([^,.\n-]+)/i,
  /application (?:received|to|for) ([^,.\n-]+)/i,
];

const SUBJECT_POSITION_PATTERNS = [
  /for the position of ([^,.\n-]+)/i,
  /application for ([^,.\n-]+?)(?: at | - |$)/i,
  /:\s*([^,.\n-]+?)(?: at | - |$)/i,
];

function titleCaseDomain(domain: string): string {
  const name = domain.split(".")[0] ?? domain;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function inferCompany(parsed: ParsedMessage): string {
  for (const pattern of SUBJECT_COMPANY_PATTERNS) {
    const match = parsed.subject.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  if (parsed.fromDisplayName) {
    const lower = parsed.fromDisplayName.toLowerCase();
    const looksGeneric = GENERIC_SENDER_NAMES.some((g) => lower.includes(g));
    if (!looksGeneric) return parsed.fromDisplayName;
  }

  return titleCaseDomain(parsed.fromDomain);
}

export function inferPosition(parsed: ParsedMessage): string | null {
  for (const pattern of SUBJECT_POSITION_PATTERNS) {
    const match = parsed.subject.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate.length > 2 && candidate.length < 100) return candidate;
    }
  }
  return null;
}

export type MatchResult =
  | { kind: "existing"; applicationId: string }
  | { kind: "new"; company: string; position: string | null }
  | { kind: "unmatched" };

/**
 * Decides which Application (if any) a parsed, classified email belongs to.
 * Does not touch the database — callers combine this with their own lookups.
 */
export function decideMatch(
  parsed: ParsedMessage,
  classification: ClassificationResult,
  existingApplicationIdForThread: string | null
): MatchResult {
  if (existingApplicationIdForThread) {
    return { kind: "existing", applicationId: existingApplicationIdForThread };
  }

  if (classification.category === "APPLICATION_CONFIRMATION") {
    return { kind: "new", company: inferCompany(parsed), position: inferPosition(parsed) };
  }

  return { kind: "unmatched" };
}
