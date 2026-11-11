import type { gmail_v1 } from "googleapis";

export type ParsedMessage = {
  gmailMessageId: string;
  gmailThreadId: string;
  fromAddress: string;
  fromDomain: string;
  fromDisplayName: string | null;
  toAddress: string | null;
  subject: string;
  snippet: string | null;
  bodyText: string;
  internalDate: Date;
};

export type ParsedSignature = {
  name: string | null;
  title: string | null;
  linkedInUrl: string | null;
};

function getHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string | null {
  const header = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value ?? null;
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function extractPlainText(part: gmail_v1.Schema$MessagePart | undefined): string {
  if (!part) return "";

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }

  if (part.parts) {
    const plainPart = part.parts.find((p) => p.mimeType === "text/plain");
    if (plainPart?.body?.data) {
      return decodeBase64Url(plainPart.body.data);
    }
    for (const sub of part.parts) {
      const text = extractPlainText(sub);
      if (text) return text;
    }
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return decodeBase64Url(part.body.data).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  return "";
}

function parseFromAddress(rawFrom: string): { fromAddress: string; fromDomain: string; fromDisplayName: string | null } {
  const match = rawFrom.match(/<([^>]+)>/);
  const address = (match ? match[1] : rawFrom).trim().toLowerCase();
  const domain = address.split("@")[1] ?? "";
  const displayName = match ? rawFrom.slice(0, match.index).replace(/"/g, "").trim() || null : null;
  return { fromAddress: address, fromDomain: domain, fromDisplayName: displayName };
}

export function parseGmailMessage(message: gmail_v1.Schema$Message): ParsedMessage {
  const headers = message.payload?.headers;
  const rawFrom = getHeader(headers, "From") ?? "";
  const { fromAddress, fromDomain, fromDisplayName } = parseFromAddress(rawFrom);

  return {
    gmailMessageId: message.id ?? "",
    gmailThreadId: message.threadId ?? "",
    fromAddress,
    fromDomain,
    fromDisplayName,
    toAddress: getHeader(headers, "To"),
    subject: getHeader(headers, "Subject") ?? "(no subject)",
    snippet: message.snippet ?? null,
    bodyText: extractPlainText(message.payload).slice(0, 20_000),
    internalDate: message.internalDate ? new Date(Number(message.internalDate)) : new Date(),
  };
}

const TITLE_WORDS = [
  "recruiter",
  "talent acquisition",
  "talent partner",
  "hiring manager",
  "people operations",
  "hr business partner",
];

/**
 * Best-effort extraction of a sender's name/title/LinkedIn URL from an email
 * signature. Looks at the last ~500 characters of the body, which is where
 * sign-offs usually live.
 */
export function parseSignature(bodyText: string): ParsedSignature {
  const tail = bodyText.slice(-500);
  const lines = tail
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const linkedInMatch = tail.match(/https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/);
  const linkedInUrl = linkedInMatch ? linkedInMatch[0] : null;

  let title: string | null = null;
  let name: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();
    const matchedTitle = TITLE_WORDS.find((t) => lower.includes(t));
    if (matchedTitle) {
      title = line;
      const prevLine = lines[i - 1];
      if (prevLine && prevLine.length < 60 && /^[A-Za-z.' -]+$/.test(prevLine)) {
        name = prevLine;
      }
      break;
    }
  }

  return { name, title, linkedInUrl };
}
