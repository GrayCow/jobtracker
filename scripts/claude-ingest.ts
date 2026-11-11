import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { db } from "../lib/db.ts";
import { ingestRawMessage, type RawEmailInput } from "../lib/gmail/ingestRaw.ts";

/**
 * Entry point for the "Claude-assisted" sync method: a Claude session with
 * Gmail connector access fetches messages itself (not via this app's Google
 * OAuth client), writes them to a JSON file matching RawEmailInput[], and
 * runs: node scripts/claude-ingest.ts <path-to-file>.json
 *
 * Every message still goes through the same classify/match/stage-derivation
 * pipeline as the Google-OAuth path (lib/gmail/ingestRaw.ts), so results are
 * identical regardless of which sync method produced them.
 */
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/claude-ingest.ts <messages.json>");
    process.exitCode = 1;
    return;
  }

  const raw = readFileSync(filePath, "utf8");
  const messages: RawEmailInput[] = JSON.parse(raw);

  let added = 0;
  let skipped = 0;
  let errors = 0;

  await db.syncState.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", status: "running" },
    update: { status: "running", lastError: null },
  });

  try {
    for (const message of messages) {
      try {
        const result = await ingestRawMessage(message);
        if (result === "added") added++;
        else skipped++;
      } catch (err) {
        errors++;
        console.error(`Failed to ingest ${message.gmailMessageId}:`, err instanceof Error ? err.message : err);
      }
    }

    await db.syncState.update({
      where: { id: "singleton" },
      data: { status: "idle", lastSyncAt: new Date() },
    });

    console.log(`Claude-assisted ingest complete: ${added} added, ${skipped} skipped, ${errors} errors.`);
  } catch (err) {
    await db.syncState.update({
      where: { id: "singleton" },
      data: { status: "error", lastError: err instanceof Error ? err.message : String(err) },
    });
    throw err;
  }
}

main().catch((err) => {
  console.error("Ingest failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
