import { NextResponse } from "next/server";
import { runSync } from "@/lib/gmail/sync";
import { db } from "@/lib/db";
import { isGmailConnected } from "@/lib/gmail/oauth";

export async function GET() {
  const [state, connected] = await Promise.all([
    db.syncState.findUnique({ where: { id: "singleton" } }),
    isGmailConnected(),
  ]);
  return NextResponse.json({ state, connected });
}

export async function POST() {
  const connected = await isGmailConnected();
  if (!connected) {
    return NextResponse.json(
      { error: "No Gmail account connected. Visit /api/auth/google first." },
      { status: 400 }
    );
  }

  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
