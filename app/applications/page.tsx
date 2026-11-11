import Link from "next/link";
import { connection } from "next/server";
import { listApplications } from "@/lib/applications/service";
import type { Stage } from "@prisma/client";

export const instant = false;

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  HEARD_BACK: "Heard back",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const STAGE_COLOR_VARS: Record<string, string> = {
  APPLIED: "var(--series-applied)",
  HEARD_BACK: "var(--series-heard-back)",
  INTERVIEW: "var(--series-interview)",
  OFFER: "var(--series-offer)",
  REJECTED: "var(--series-rejected)",
};

const STAGES: Stage[] = ["APPLIED", "HEARD_BACK", "INTERVIEW", "OFFER", "REJECTED"];

function relativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  return `${weeks} weeks ago`;
}

type SearchParams = {
  stage?: string;
  newThisWeek?: string;
  q?: string;
  sort?: "lastStatusChangeAt" | "dateApplied" | "company" | "stage";
  dir?: "asc" | "desc";
};

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await connection();
  const params = await searchParams;
  const stage = params.stage as Stage | undefined;
  const newThisWeek = params.newThisWeek === "true";
  const search = params.q;
  const sortBy = params.sort ?? "lastStatusChangeAt";
  const sortDir = params.dir ?? "desc";

  const applications = await listApplications({ stage, newThisWeek, search, sortBy, sortDir });

  const buildHref = (overrides: Partial<SearchParams>) => {
    const next = { ...params, ...overrides };
    const qs = new URLSearchParams();
    if (next.stage) qs.set("stage", next.stage);
    if (next.newThisWeek) qs.set("newThisWeek", next.newThisWeek);
    if (next.q) qs.set("q", next.q);
    if (next.sort) qs.set("sort", next.sort);
    if (next.dir) qs.set("dir", next.dir);
    const str = qs.toString();
    return `/applications${str ? `?${str}` : ""}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Applications</h1>

      <form className="flex gap-3 items-center flex-wrap" action="/applications" method="get">
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Search company or position"
          className="rounded px-3 py-1.5 text-sm"
          style={{ border: "1px solid var(--border-hairline)", background: "var(--surface-1)" }}
        />
        <label className="flex items-center gap-1.5 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" name="newThisWeek" value="true" defaultChecked={newThisWeek} />
          New this week
        </label>
        <button
          type="submit"
          className="text-sm rounded px-3 py-1.5"
          style={{ background: "var(--series-applied)", color: "#fff" }}
        >
          Filter
        </button>
      </form>

      <div className="flex gap-2 flex-wrap text-sm">
        <Link
          href={buildHref({ stage: undefined })}
          className="rounded px-3 py-1"
          style={{
            background: !stage ? "var(--surface-1)" : "transparent",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-primary)",
          }}
        >
          All
        </Link>
        {STAGES.map((s) => (
          <Link
            key={s}
            href={buildHref({ stage: s })}
            className="rounded px-3 py-1"
            style={{
              background: stage === s ? "var(--surface-1)" : "transparent",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
            }}
          >
            {STAGE_LABELS[s]}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--border-hairline)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "var(--surface-1)", color: "var(--text-secondary)" }}>
              <th className="text-left px-3 py-2">Company</th>
              <th className="text-left px-3 py-2">Position</th>
              <th className="text-left px-3 py-2">
                <Link href={buildHref({ sort: "dateApplied", dir: sortDir === "asc" ? "desc" : "asc" })}>
                  Date applied
                </Link>
              </th>
              <th className="text-left px-3 py-2">
                <Link href={buildHref({ sort: "stage", dir: sortDir === "asc" ? "desc" : "asc" })}>Stage</Link>
              </th>
              <th className="text-left px-3 py-2">Recruiter</th>
              <th className="text-left px-3 py-2">Notes</th>
              <th className="text-left px-3 py-2">Replies</th>
              <th className="text-left px-3 py-2">
                <Link href={buildHref({ sort: "lastStatusChangeAt", dir: sortDir === "asc" ? "desc" : "asc" })}>
                  Last activity
                </Link>
              </th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} style={{ borderTop: "1px solid var(--border-hairline)" }}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/applications/${app.id}`} className="font-medium" style={{ color: "var(--text-primary)" }}>
                      {app.company}
                    </Link>
                    {app.companyLinkedInUrl && (
                      <a href={app.companyLinkedInUrl} target="_blank" rel="noreferrer" title="Company LinkedIn" style={{ color: "var(--text-muted)" }}>
                        in
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {app.position}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {app.dateApplied ? new Date(app.dateApplied).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-medium"
                    style={{ background: STAGE_COLOR_VARS[app.stage], color: "#fff" }}
                  >
                    {STAGE_LABELS[app.stage]}
                  </span>
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  <div className="flex items-center gap-1.5">
                    <span>{app.recruiterName ?? "—"}</span>
                    {app.recruiterLinkedInUrl && (
                      <a href={app.recruiterLinkedInUrl} target="_blank" rel="noreferrer" title="Recruiter LinkedIn" style={{ color: "var(--text-muted)" }}>
                        in
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 max-w-[200px] truncate" style={{ color: "var(--text-secondary)" }} title={app.connectionNotes ?? undefined}>
                  {app.connectionNotes ?? "—"}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {app.replyCount}
                </td>
                <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                  {relativeTime(app.lastStatusChangeAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {applications.length === 0 && (
          <div className="p-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No applications match these filters.
          </div>
        )}
      </div>
    </div>
  );
}
