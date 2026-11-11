import type { EmailCategory } from "@prisma/client";

/** Sender domains used by ATS platforms — a strong signal the email is application-related. */
export const ATS_DOMAINS = [
  "greenhouse.io",
  "lever.co",
  "myworkday.com",
  "icims.com",
  "smartrecruiters.com",
  "workable.com",
  "ashbyhq.com",
  "taleo.net",
  "successfactors.com",
  "jobvite.com",
  "bamboohr.com",
  "breezy.hr",
  "recruitee.com",
  "wellfound.com",
];

export type PhraseRule = {
  category: EmailCategory;
  phrases: string[];
};

/** Checked against the lowercased subject + first ~1000 chars of the body. */
export const PHRASE_RULES: PhraseRule[] = [
  {
    category: "REJECTION",
    phrases: [
      "unfortunately",
      "regret to inform",
      "not moving forward",
      "decided to move forward with other candidates",
      "will not be moving forward",
      "pursue other candidates",
      "move forward with other candidates",
    ],
  },
  {
    category: "OFFER",
    phrases: [
      "pleased to offer",
      "job offer",
      "offer letter",
      "excited to extend an offer",
      "welcome to the team",
    ],
  },
  {
    category: "INTERVIEW_INVITE",
    phrases: [
      "schedule a time",
      "schedule an interview",
      "pick a time",
      "interview invitation",
      "calendly.com",
      "available for a call",
      "phone screen",
      "set up a call",
      "set up a time",
    ],
  },
  {
    category: "RESPONSE_GENERIC",
    phrases: [
      "update on your application",
      "status of your application",
      "move forward",
      "moving forward",
      "next steps",
      "we'd like to",
      "we would like to",
    ],
  },
  {
    category: "APPLICATION_CONFIRMATION",
    phrases: [
      "thank you for applying",
      "we received your application",
      "application received",
      "your application to",
      "we've received your application",
      "thanks for your interest in",
    ],
  },
];

/**
 * Fixed precedence when multiple phrase sets match the same email — e.g. a
 * rejection arriving after an earlier "moving forward" phrase in a quoted
 * reply should resolve to REJECTION, not RESPONSE_GENERIC.
 */
export const CATEGORY_PRECEDENCE: EmailCategory[] = [
  "REJECTION",
  "OFFER",
  "INTERVIEW_INVITE",
  "RESPONSE_GENERIC",
  "APPLICATION_CONFIRMATION",
  "REPLY",
  "UNKNOWN",
];

/** Maps a resolved email category to the Application stage it implies, where applicable. */
export const STAGE_FOR_CATEGORY: Partial<Record<EmailCategory, "APPLIED" | "HEARD_BACK" | "INTERVIEW" | "OFFER" | "REJECTED">> = {
  APPLICATION_CONFIRMATION: "APPLIED",
  RESPONSE_GENERIC: "HEARD_BACK",
  INTERVIEW_INVITE: "INTERVIEW",
  OFFER: "OFFER",
  REJECTION: "REJECTED",
};
