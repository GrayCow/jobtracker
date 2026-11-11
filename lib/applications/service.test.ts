import { test } from "node:test";
import assert from "node:assert/strict";
import { startOfWeek } from "./service.ts";

test("startOfWeek returns the most recent Monday at midnight", () => {
  const wednesday = new Date("2026-11-11T15:30:00"); // a Wednesday
  const result = startOfWeek(wednesday);
  assert.equal(result.getDay(), 1); // Monday
  assert.equal(result.getHours(), 0);
  assert.equal(result.getMinutes(), 0);
  assert.ok(result.getTime() <= wednesday.getTime());
});

test("startOfWeek on a Monday returns that same day at midnight", () => {
  const monday = new Date("2026-11-09T08:00:00");
  const result = startOfWeek(monday);
  assert.equal(result.getDate(), 9);
  assert.equal(result.getHours(), 0);
});

test("startOfWeek on a Sunday returns the preceding Monday", () => {
  const sunday = new Date("2026-11-15T23:00:00");
  const result = startOfWeek(sunday);
  assert.equal(result.getDay(), 1);
  assert.equal(result.getDate(), 9);
});
