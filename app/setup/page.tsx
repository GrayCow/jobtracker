import { connection } from "next/server";
import { getSyncMethod } from "@/lib/settings";
import { chooseSyncMethod } from "@/app/actions";

export const instant = false;

type Option = {
  method: "GOOGLE_OAUTH" | "CLAUDE_ASSISTED";
  title: string;
  recommended?: boolean;
  pros: string[];
  cons: string[];
};

const OPTIONS: Option[] = [
  {
    method: "GOOGLE_OAUTH",
    title: "Google OAuth",
    recommended: true,
    pros: [
      "Fully automatic — a \"Sync now\" button (or background sync) pulls directly from Gmail, any time, no Claude needed",
      "Your email content never leaves your machine or passes through any AI model — classification is plain local code",
      "One-time setup, then it's fire-and-forget",
    ],
    cons: [
      "Requires a one-time Google Cloud Console setup (~10 min): create a project, enable the Gmail API, configure the OAuth consent screen",
    ],
  },
  {
    method: "CLAUDE_ASSISTED",
    title: "Claude-assisted sync",
    pros: [
      "Skips the Google Cloud Console setup entirely",
      "Reuses the Gmail connection you've already granted to Claude",
    ],
    cons: [
      "Only syncs when you explicitly ask Claude to do it in a session — not an automatic background or one-click sync",
      "Your email content is read into a Claude conversation (sent to Anthropic's servers) in order to sync it",
      "More manual steps each time: open a Claude Code session in this project and ask it to sync",
    ],
  },
];

export default async function SetupPage() {
  await connection();
  const current = await getSyncMethod();

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">Choose how to sync Gmail</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Pick one. You can change this later — it only affects how new mail gets pulled in, not
          anything already in your tracker.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {OPTIONS.map((opt) => (
          <form key={opt.method} action={chooseSyncMethod.bind(null, opt.method)}>
            <div
              className="rounded-lg p-4 flex flex-col gap-3 h-full"
              style={{
                border: `1px solid ${current === opt.method ? "var(--series-applied)" : "var(--border-hairline)"}`,
                background: "var(--surface-1)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{opt.title}</h2>
                {opt.recommended && (
                  <span
                    className="text-xs rounded px-2 py-0.5 font-medium"
                    style={{ background: "var(--series-applied)", color: "#fff" }}
                  >
                    Recommended
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: "var(--success-text)" }}>
                  Pros
                </span>
                <ul className="text-sm flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>
                  {opt.pros.map((p) => (
                    <li key={p}>+ {p}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium" style={{ color: "var(--series-rejected)" }}>
                  Cons
                </span>
                <ul className="text-sm flex flex-col gap-1" style={{ color: "var(--text-secondary)" }}>
                  {opt.cons.map((c) => (
                    <li key={c}>– {c}</li>
                  ))}
                </ul>
              </div>

              <button
                type="submit"
                className="self-start rounded px-4 py-2 text-sm font-medium mt-auto"
                style={{
                  background: current === opt.method ? "var(--surface-1)" : "var(--series-applied)",
                  color: current === opt.method ? "var(--text-primary)" : "#fff",
                  border: "1px solid var(--series-applied)",
                }}
              >
                {current === opt.method ? "Currently selected" : "Choose this"}
              </button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
