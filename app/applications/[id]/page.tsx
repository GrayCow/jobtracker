import { notFound } from "next/navigation";
import { getApplicationById } from "@/lib/applications/service";
import { updateApplication } from "@/app/actions";

export const instant = false;

const STAGE_LABELS: Record<string, string> = {
  APPLIED: "Applied",
  HEARD_BACK: "Heard back",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
};

const CATEGORY_LABELS: Record<string, string> = {
  APPLICATION_CONFIRMATION: "Application confirmation",
  RESPONSE_GENERIC: "Response",
  INTERVIEW_INVITE: "Interview invite",
  OFFER: "Offer",
  REJECTION: "Rejection",
  REPLY: "Reply",
  UNKNOWN: "Unclassified",
};

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application) notFound();

  const boundUpdate = updateApplication.bind(null, id);

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-semibold">{application.company}</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {application.position} · {STAGE_LABELS[application.stage]}
        </p>
      </div>

      <form action={boundUpdate} className="flex flex-col gap-4">
        <Field label="Company LinkedIn URL" name="companyLinkedInUrl" defaultValue={application.companyLinkedInUrl} placeholder="https://linkedin.com/company/..." />
        <Field label="Recruiter / hiring manager name" name="recruiterName" defaultValue={application.recruiterName} />
        <Field label="Recruiter LinkedIn URL" name="recruiterLinkedInUrl" defaultValue={application.recruiterLinkedInUrl} placeholder="https://linkedin.com/in/..." />
        <Field label="Recruiter email" name="recruiterEmail" defaultValue={application.recruiterEmail} />
        <div className="flex flex-col gap-1">
          <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Connection notes
          </label>
          <textarea
            name="connectionNotes"
            defaultValue={application.connectionNotes ?? ""}
            rows={3}
            className="rounded px-3 py-2 text-sm"
            style={{ border: "1px solid var(--border-hairline)", background: "var(--surface-1)" }}
          />
        </div>
        <button
          type="submit"
          className="self-start rounded px-4 py-2 text-sm font-medium"
          style={{ background: "var(--series-applied)", color: "#fff" }}
        >
          Save
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Linked emails ({application.emails.length})
        </h2>
        <ul className="flex flex-col gap-2">
          {application.emails.map((email) => (
            <li
              key={email.id}
              className="rounded-lg p-3 text-sm flex flex-col gap-1"
              style={{ background: "var(--surface-1)", border: "1px solid var(--border-hairline)" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {email.subject}
                </span>
                <span
                  className="text-xs rounded px-2 py-0.5"
                  style={{ background: "var(--background)", color: "var(--text-secondary)" }}
                >
                  {CATEGORY_LABELS[email.category] ?? email.category}
                </span>
              </div>
              <span style={{ color: "var(--text-muted)" }}>
                {new Date(email.internalDate).toLocaleString()} · {email.fromAddress}
              </span>
              {email.snippet && <span style={{ color: "var(--text-secondary)" }}>{email.snippet}</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {label}
      </label>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="rounded px-3 py-2 text-sm"
        style={{ border: "1px solid var(--border-hairline)", background: "var(--surface-1)" }}
      />
    </div>
  );
}
