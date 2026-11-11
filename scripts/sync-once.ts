import { config } from "dotenv";
config({ path: ".env.local" });

import { runSync } from "../lib/gmail/sync.ts";

runSync()
  .then((result) => {
    console.log(`Sync complete (${result.mode}):`, result);
  })
  .catch((err) => {
    console.error("Sync failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
