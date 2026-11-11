import { NextRequest, NextResponse } from "next/server";
import { listApplications } from "@/lib/applications/service";
import type { Stage } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stage = params.get("stage") as Stage | null;
  const newThisWeek = params.get("newThisWeek") === "true";
  const search = params.get("q") ?? undefined;
  const sortBy = params.get("sort") as "lastStatusChangeAt" | "dateApplied" | "company" | "stage" | null;
  const sortDir = params.get("dir") as "asc" | "desc" | null;

  const applications = await listApplications({
    stage: stage ?? undefined,
    newThisWeek,
    search,
    sortBy: sortBy ?? undefined,
    sortDir: sortDir ?? undefined,
  });

  return NextResponse.json(applications);
}
