import { test } from "node:test";
import assert from "node:assert/strict";
import { ruleBasedClassifier } from "./classifier.ts";

test("classifies a plain application confirmation", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "greenhouse.io",
    subject: "Thank you for applying to Acme Corp",
    bodyText: "We received your application for Senior Engineer.",
    isFirstMessageInThread: true,
  });
  assert.equal(result.category, "APPLICATION_CONFIRMATION");
});

test("classifies an interview invite", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "acme.com",
    subject: "Let's schedule a time to chat",
    bodyText: "We'd love to schedule an interview for next week.",
    isFirstMessageInThread: false,
  });
  assert.equal(result.category, "INTERVIEW_INVITE");
});

test("rejection takes precedence over an earlier quoted 'moving forward' phrase", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "acme.com",
    subject: "Re: Your interview",
    bodyText:
      "Unfortunately we have decided to move forward with other candidates for this role. " +
      "> On Monday you said: we'd like to move forward to the next round.",
    isFirstMessageInThread: false,
  });
  assert.equal(result.category, "REJECTION");
});

test("offer beats a generic next-steps phrase", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "acme.com",
    subject: "Next steps",
    bodyText: "We are pleased to offer you the position of Staff Engineer.",
    isFirstMessageInThread: false,
  });
  assert.equal(result.category, "OFFER");
});

test("unrecognized first message from a non-ATS domain is UNKNOWN", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "randomnewsletter.com",
    subject: "Weekly digest",
    bodyText: "Here is this week's roundup.",
    isFirstMessageInThread: true,
  });
  assert.equal(result.category, "UNKNOWN");
});

test("unrecognized first message from an ATS domain defaults to application confirmation", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "boards.greenhouse.io",
    subject: "Your submission",
    bodyText: "Some unusual phrasing with no matched keywords.",
    isFirstMessageInThread: true,
  });
  assert.equal(result.category, "APPLICATION_CONFIRMATION");
});

test("unrecognized reply defaults to REPLY", async () => {
  const result = await ruleBasedClassifier.classify({
    fromDomain: "acme.com",
    subject: "Quick question",
    bodyText: "Do you have availability on Thursday?",
    isFirstMessageInThread: false,
  });
  assert.equal(result.category, "REPLY");
});
