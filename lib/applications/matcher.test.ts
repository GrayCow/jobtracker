import { test } from "node:test";
import assert from "node:assert/strict";
import { inferCompany, inferPosition, decideMatch } from "./matcher.ts";
import type { ParsedMessage } from "../gmail/parseMessage.ts";

function msg(overrides: Partial<ParsedMessage>): ParsedMessage {
  return {
    gmailMessageId: "m1",
    gmailThreadId: "t1",
    fromAddress: "noreply@greenhouse.io",
    fromDomain: "greenhouse.io",
    fromDisplayName: "Greenhouse",
    toAddress: null,
    subject: "Thank you for applying to Acme Corp",
    snippet: null,
    bodyText: "",
    internalDate: new Date(),
    ...overrides,
  };
}

test("infers company from a known subject pattern", () => {
  const company = inferCompany(msg({ subject: "Thank you for applying to Acme Corp" }));
  assert.equal(company, "Acme Corp");
});

test("falls back to display name when subject has no pattern and name isn't generic", () => {
  const company = inferCompany(
    msg({ subject: "Hello there", fromDisplayName: "Priya at Harbor & Finch", fromDomain: "harborfinch.com" })
  );
  assert.equal(company, "Priya at Harbor & Finch");
});

test("falls back to domain when sender name is a generic ATS name", () => {
  const company = inferCompany(
    msg({ subject: "Application received", fromDisplayName: "Greenhouse", fromDomain: "acmecorp.com" })
  );
  assert.equal(company, "Acmecorp");
});

test("infers position from subject when present", () => {
  const position = inferPosition(msg({ subject: "Application for Senior Engineer at Acme" }));
  assert.equal(position, "Senior Engineer");
});

test("decideMatch returns existing when thread already matched", () => {
  const result = decideMatch(
    msg({}),
    { category: "REPLY", confidence: 0.6, matchedSignals: [], source: "RULE" },
    "app-123"
  );
  assert.deepEqual(result, { kind: "existing", applicationId: "app-123" });
});

test("decideMatch creates new application for a confirmation on an unknown thread", () => {
  const result = decideMatch(
    msg({ subject: "Thank you for applying to Acme Corp" }),
    { category: "APPLICATION_CONFIRMATION", confidence: 0.85, matchedSignals: [], source: "RULE" },
    null
  );
  assert.equal(result.kind, "new");
});

test("decideMatch leaves non-confirmation on unknown thread unmatched", () => {
  const result = decideMatch(
    msg({}),
    { category: "UNKNOWN", confidence: 0, matchedSignals: [], source: "RULE" },
    null
  );
  assert.deepEqual(result, { kind: "unmatched" });
});
