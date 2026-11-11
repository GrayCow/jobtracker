import type { EmailCategory } from "@prisma/client";
import { ATS_DOMAINS, PHRASE_RULES, CATEGORY_PRECEDENCE } from "./rules.ts";

export type ClassificationInput = {
  fromDomain: string;
  subject: string;
  bodyText: string;
  isFirstMessageInThread: boolean;
};

export type ClassificationResult = {
  category: EmailCategory;
  confidence: number;
  matchedSignals: string[];
  source: "RULE" | "LLM";
};

export type Classifier = {
  classify(input: ClassificationInput): Promise<ClassificationResult>;
};

function matchPhrases(haystack: string): Map<EmailCategory, string[]> {
  const matches = new Map<EmailCategory, string[]>();
  for (const rule of PHRASE_RULES) {
    const hits = rule.phrases.filter((phrase) => haystack.includes(phrase));
    if (hits.length > 0) {
      matches.set(rule.category, hits);
    }
  }
  return matches;
}

export const ruleBasedClassifier: Classifier = {
  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const haystack = `${input.subject}\n${input.bodyText.slice(0, 1000)}`.toLowerCase();
    const matches = matchPhrases(haystack);
    const isAtsDomain = ATS_DOMAINS.some((domain) => input.fromDomain.endsWith(domain));

    for (const category of CATEGORY_PRECEDENCE) {
      const hits = matches.get(category);
      if (hits && hits.length > 0) {
        return {
          category,
          confidence: 0.85,
          matchedSignals: hits,
          source: "RULE",
        };
      }
    }

    if (!input.isFirstMessageInThread) {
      return {
        category: "REPLY",
        confidence: 0.6,
        matchedSignals: isAtsDomain ? ["ats_domain", "thread_reply"] : ["thread_reply"],
        source: "RULE",
      };
    }

    if (isAtsDomain) {
      return {
        category: "APPLICATION_CONFIRMATION",
        confidence: 0.5,
        matchedSignals: ["ats_domain"],
        source: "RULE",
      };
    }

    return {
      category: "UNKNOWN",
      confidence: 0,
      matchedSignals: [],
      source: "RULE",
    };
  },
};
