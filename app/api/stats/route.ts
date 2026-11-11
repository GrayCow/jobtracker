import { NextResponse } from "next/server";
import { getFunnelStats } from "@/lib/stats/funnel";

export async function GET() {
  const stats = await getFunnelStats();
  return NextResponse.json(stats);
}
