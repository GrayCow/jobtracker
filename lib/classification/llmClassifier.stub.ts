/**
 * Extension point only — not implemented in v1 (see jobtracker issue #13).
 *
 * The intent: when `ruleBasedClassifier` (classifier.ts) returns `UNKNOWN` or a
 * low-confidence result, a `compositeClassifier` could fall back to an LLM call
 * implementing the same `Classifier` interface, so `sync.ts` never needs to
 * change — it depends on the interface, not on `ruleBasedClassifier` directly.
 *
 * Deliberately held off until there's real-world evidence (from running the
 * rule-based classifier against a real mailbox) of how often rules fall short,
 * and until LLM API costs/billing are something the project owner is
 * comfortable enabling.
 */
import type { Classifier } from "./classifier.ts";

export type LlmClassifier = Classifier;
