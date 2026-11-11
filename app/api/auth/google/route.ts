import { NextResponse, connection } from "next/server";
import { buildAuthUrl } from "@/lib/gmail/oauth";

export async function GET() {
  await connection();
  const url = buildAuthUrl();
  return NextResponse.redirect(url);
}
