import { config } from "dotenv";
config({ path: ".env.local" });

import prismaPkg from "@prisma/client";
import type { Stage, EmailCategory } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const { PrismaClient } = prismaPkg;
const adapter = new PrismaLibSql({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const db = new PrismaClient({ adapter });

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

type SeedEmail = {
  daysAgo: number;
  category: EmailCategory;
  subject: string;
  fromAddress: string;
  snippet: string;
  isReply?: boolean;
};

type SeedApp = {
  company: string;
  position: string;
  companyDomain: string;
  stage: Stage;
  appliedDaysAgo: number;
  companyLinkedInUrl?: string;
  recruiterName?: string;
  recruiterLinkedInUrl?: string;
  connectionNotes?: string;
  emails: SeedEmail[];
};

const seedApps: SeedApp[] = [
  {
    company: "Northwind Analytics",
    position: "Senior Product Designer",
    companyDomain: "northwindanalytics.com",
    stage: "INTERVIEW",
    appliedDaysAgo: 2,
    companyLinkedInUrl: "https://linkedin.com/company/northwind-analytics",
    recruiterName: "Dana Ruiz",
    recruiterLinkedInUrl: "https://linkedin.com/in/danaruiz",
    connectionNotes: "Met Dana at a design meetup last year, no 1st-degree connection yet.",
    emails: [
      { daysAgo: 2, category: "APPLICATION_CONFIRMATION", subject: "Thank you for applying to Northwind Analytics", fromAddress: "noreply@greenhouse.io", snippet: "We received your application for Senior Product Designer." },
      { daysAgo: 1, category: "INTERVIEW_INVITE", subject: "Let's schedule a time to chat", fromAddress: "dana.ruiz@northwindanalytics.com", snippet: "Hi! We'd love to schedule a time for a first call.", isReply: true },
    ],
  },
  {
    company: "Cobalt Robotics",
    position: "Staff Software Engineer",
    companyDomain: "cobaltrobotics.com",
    stage: "INTERVIEW",
    appliedDaysAgo: 18,
    companyLinkedInUrl: "https://linkedin.com/company/cobalt-robotics",
    emails: [
      { daysAgo: 18, category: "APPLICATION_CONFIRMATION", subject: "Application received: Staff Software Engineer", fromAddress: "careers@lever.co", snippet: "Thanks for your interest in Cobalt Robotics." },
      { daysAgo: 12, category: "RESPONSE_GENERIC", subject: "Update on your application", fromAddress: "recruiting@cobaltrobotics.com", snippet: "We'd like to move forward with next steps.", isReply: true },
      { daysAgo: 6, category: "INTERVIEW_INVITE", subject: "Interview invitation - Staff Software Engineer", fromAddress: "recruiting@cobaltrobotics.com", snippet: "Please pick a time for a technical interview.", isReply: true },
    ],
  },
  {
    company: "Harbor & Finch",
    position: "Engineering Manager",
    companyDomain: "harborfinch.com",
    stage: "OFFER",
    appliedDaysAgo: 34,
    companyLinkedInUrl: "https://linkedin.com/company/harbor-finch",
    recruiterName: "Priya Anand",
    recruiterLinkedInUrl: "https://linkedin.com/in/priyaanand",
    emails: [
      { daysAgo: 34, category: "APPLICATION_CONFIRMATION", subject: "We received your application", fromAddress: "talent@harborfinch.com", snippet: "Thank you for applying to Harbor & Finch." },
      { daysAgo: 27, category: "INTERVIEW_INVITE", subject: "Schedule your interview", fromAddress: "priya.anand@harborfinch.com", snippet: "Available for a call this week?", isReply: true },
      { daysAgo: 14, category: "RESPONSE_GENERIC", subject: "Great meeting you - next steps", fromAddress: "priya.anand@harborfinch.com", snippet: "We'd like to move forward to the final round.", isReply: true },
      { daysAgo: 3, category: "OFFER", subject: "We're pleased to offer you the role", fromAddress: "priya.anand@harborfinch.com", snippet: "We are excited to extend an offer for Engineering Manager.", isReply: true },
    ],
  },
  {
    company: "Fieldstone Health",
    position: "Data Scientist",
    companyDomain: "fieldstonehealth.com",
    stage: "HEARD_BACK",
    appliedDaysAgo: 9,
    companyLinkedInUrl: "https://linkedin.com/company/fieldstone-health",
    emails: [
      { daysAgo: 9, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "noreply@myworkday.com", snippet: "We received your application for Data Scientist." },
      { daysAgo: 4, category: "RESPONSE_GENERIC", subject: "Status of your application", fromAddress: "hr@fieldstonehealth.com", snippet: "We are still reviewing applications and will follow up soon.", isReply: true },
    ],
  },
  {
    company: "Gridline Energy",
    position: "Backend Engineer",
    companyDomain: "gridlineenergy.com",
    stage: "HEARD_BACK",
    appliedDaysAgo: 5,
    emails: [
      { daysAgo: 5, category: "APPLICATION_CONFIRMATION", subject: "Thanks for applying", fromAddress: "jobs@smartrecruiters.com", snippet: "Thank you for your interest in Gridline Energy." },
      { daysAgo: 1, category: "RESPONSE_GENERIC", subject: "Next steps for your application", fromAddress: "talent@gridlineenergy.com", snippet: "We'd like to set up a quick intro call.", isReply: true },
    ],
  },
  {
    company: "Paper Crane Studio",
    position: "UX Researcher",
    companyDomain: "papercranestudio.com",
    stage: "HEARD_BACK",
    appliedDaysAgo: 11,
    recruiterName: "Tomas Lindgren",
    emails: [
      { daysAgo: 11, category: "APPLICATION_CONFIRMATION", subject: "We've received your application", fromAddress: "careers@workable.com", snippet: "Thanks for applying to Paper Crane Studio." },
      { daysAgo: 8, category: "RESPONSE_GENERIC", subject: "Following up", fromAddress: "tomas@papercranestudio.com", snippet: "Thanks for your patience, update coming soon.", isReply: true },
      { daysAgo: 2, category: "RESPONSE_GENERIC", subject: "Re: Following up", fromAddress: "tomas@papercranestudio.com", snippet: "Still reviewing, appreciate your patience.", isReply: true },
    ],
  },
  {
    company: "Vantage Cloud Systems",
    position: "DevOps Engineer",
    companyDomain: "vantagecloud.com",
    stage: "HEARD_BACK",
    appliedDaysAgo: 3,
    emails: [
      { daysAgo: 3, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "no-reply@ashbyhq.com", snippet: "Thank you for applying to Vantage Cloud Systems." },
      { daysAgo: 1, category: "RESPONSE_GENERIC", subject: "Thanks for applying - quick question", fromAddress: "recruiting@vantagecloud.com", snippet: "Could you share your availability this week?", isReply: true },
    ],
  },
  {
    company: "Solace Partners",
    position: "Product Manager",
    companyDomain: "solacepartners.com",
    stage: "APPLIED",
    appliedDaysAgo: 1,
    emails: [
      { daysAgo: 1, category: "APPLICATION_CONFIRMATION", subject: "Thank you for applying to Solace Partners", fromAddress: "careers@lever.co", snippet: "We've received your application for Product Manager." },
    ],
  },
  {
    company: "Marrow Design Co",
    position: "Visual Designer",
    companyDomain: "marrowdesign.co",
    stage: "APPLIED",
    appliedDaysAgo: 2,
    emails: [
      { daysAgo: 2, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "jobs@greenhouse.io", snippet: "Thanks for your interest in Marrow Design Co." },
    ],
  },
  {
    company: "Tideline Robotics",
    position: "Firmware Engineer",
    companyDomain: "tidelinerobotics.com",
    stage: "APPLIED",
    appliedDaysAgo: 4,
    emails: [
      { daysAgo: 4, category: "APPLICATION_CONFIRMATION", subject: "We received your application", fromAddress: "talent@icims.com", snippet: "Thank you for applying to Tideline Robotics." },
    ],
  },
  {
    company: "Birchmark Capital",
    position: "Business Analyst",
    companyDomain: "birchmarkcapital.com",
    stage: "APPLIED",
    appliedDaysAgo: 15,
    emails: [
      { daysAgo: 15, category: "APPLICATION_CONFIRMATION", subject: "Thanks for applying", fromAddress: "hr@birchmarkcapital.com", snippet: "We've received your application for Business Analyst." },
    ],
  },
  {
    company: "Quill & Quartz",
    position: "Content Strategist",
    companyDomain: "quillquartz.com",
    stage: "APPLIED",
    appliedDaysAgo: 22,
    emails: [
      { daysAgo: 22, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "careers@breezy.hr", snippet: "Thank you for applying to Quill & Quartz." },
    ],
  },
  {
    company: "Summit Logistics",
    position: "Operations Lead",
    companyDomain: "summitlogistics.com",
    stage: "APPLIED",
    appliedDaysAgo: 29,
    emails: [
      { daysAgo: 29, category: "APPLICATION_CONFIRMATION", subject: "We received your application", fromAddress: "jobs@taleo.net", snippet: "Thanks for applying to Summit Logistics." },
    ],
  },
  {
    company: "Elmhurst Media",
    position: "Growth Marketer",
    companyDomain: "elmhurstmedia.com",
    stage: "REJECTED",
    appliedDaysAgo: 40,
    emails: [
      { daysAgo: 40, category: "APPLICATION_CONFIRMATION", subject: "Thanks for applying to Elmhurst Media", fromAddress: "jobs@lever.co", snippet: "We've received your application for Growth Marketer." },
      { daysAgo: 30, category: "REJECTION", subject: "Update on your application", fromAddress: "hr@elmhurstmedia.com", snippet: "Unfortunately we have decided to move forward with other candidates.", isReply: true },
    ],
  },
  {
    company: "Ferro Materials",
    position: "Mechanical Engineer",
    companyDomain: "ferromaterials.com",
    stage: "REJECTED",
    appliedDaysAgo: 48,
    emails: [
      { daysAgo: 48, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "talent@jobvite.com", snippet: "Thank you for your interest in Ferro Materials." },
      { daysAgo: 35, category: "REJECTION", subject: "Re: Mechanical Engineer application", fromAddress: "recruiting@ferromaterials.com", snippet: "We regret to inform you we will not be moving forward.", isReply: true },
    ],
  },
  {
    company: "Loom & Lattice",
    position: "Frontend Engineer",
    companyDomain: "loomlattice.com",
    stage: "REJECTED",
    appliedDaysAgo: 52,
    emails: [
      { daysAgo: 52, category: "APPLICATION_CONFIRMATION", subject: "We've received your application", fromAddress: "careers@ashbyhq.com", snippet: "Thanks for applying to Loom & Lattice." },
      { daysAgo: 44, category: "INTERVIEW_INVITE", subject: "Interview invitation", fromAddress: "recruiting@loomlattice.com", snippet: "Let's set up a phone screen.", isReply: true },
      { daysAgo: 38, category: "REJECTION", subject: "Following up on your interview", fromAddress: "recruiting@loomlattice.com", snippet: "Unfortunately we will not be moving forward at this time.", isReply: true },
    ],
  },
  {
    company: "Alder & Finch Legal",
    position: "Paralegal",
    companyDomain: "alderfinchlegal.com",
    stage: "REJECTED",
    appliedDaysAgo: 60,
    emails: [
      { daysAgo: 60, category: "APPLICATION_CONFIRMATION", subject: "Application received", fromAddress: "jobs@bamboohr.com", snippet: "Thank you for applying to Alder & Finch Legal." },
      { daysAgo: 50, category: "REJECTION", subject: "Thank you for your interest", fromAddress: "hr@alderfinchlegal.com", snippet: "We have decided to pursue other candidates for this role.", isReply: true },
    ],
  },
];

async function main() {
  console.log(`Seeding ${seedApps.length} applications...`);

  for (const app of seedApps) {
    const dateApplied = daysAgo(app.appliedDaysAgo);
    const sortedEmails = [...app.emails].sort((a, b) => b.daysAgo - a.daysAgo);
    const lastEmail = sortedEmails[sortedEmails.length - 1];
    const lastStatusChangeAt = daysAgo(lastEmail.daysAgo);

    const created = await db.application.create({
      data: {
        company: app.company,
        position: app.position,
        companyDomain: app.companyDomain,
        stage: app.stage,
        dateApplied,
        firstSeenAt: dateApplied,
        lastStatusChangeAt,
        lastEmailAt: lastStatusChangeAt,
        gmailThreadId: `seed-thread-${app.companyDomain}`,
        companyLinkedInUrl: app.companyLinkedInUrl,
        recruiterName: app.recruiterName,
        recruiterLinkedInUrl: app.recruiterLinkedInUrl,
        connectionNotes: app.connectionNotes,
        isRejected: app.stage === "REJECTED",
        rejectedAt: app.stage === "REJECTED" ? lastStatusChangeAt : null,
      },
    });

    let previousStage: Stage | null = null;
    for (let i = 0; i < sortedEmails.length; i++) {
      const email = sortedEmails[i];
      const isReply = email.isReply ?? i > 0;
      await db.emailMessage.create({
        data: {
          gmailMessageId: `seed-msg-${app.companyDomain}-${i}`,
          gmailThreadId: `seed-thread-${app.companyDomain}`,
          applicationId: created.id,
          fromAddress: email.fromAddress,
          fromDomain: email.fromAddress.split("@")[1] ?? "",
          subject: email.subject,
          snippet: email.snippet,
          bodyText: email.snippet,
          internalDate: daysAgo(email.daysAgo),
          isReply,
          category: email.category,
          classificationSource: "RULE",
          classificationConfidence: 0.9,
        },
      });

      const stageForCategory: Partial<Record<EmailCategory, Stage>> = {
        APPLICATION_CONFIRMATION: "APPLIED",
        RESPONSE_GENERIC: "HEARD_BACK",
        INTERVIEW_INVITE: "INTERVIEW",
        OFFER: "OFFER",
        REJECTION: "REJECTED",
      };
      const toStage = stageForCategory[email.category];
      if (toStage && toStage !== previousStage) {
        await db.statusEvent.create({
          data: {
            applicationId: created.id,
            fromStage: previousStage,
            toStage,
            occurredAt: daysAgo(email.daysAgo),
          },
        });
        previousStage = toStage;
      }
    }
  }

  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
