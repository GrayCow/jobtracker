# JobTracker

A personal job-application tracker that scans your Gmail, classifies application-related
emails into funnel stages (Applied → Heard back → Interview → Offer / Rejected), and gives
you a colorful dashboard plus a list view for tracking recruiter contacts, LinkedIn URLs,
and connection notes by hand.

## Status

The app, dashboard, list view, and detail/edit view are fully built and working against
**seed data** (17 realistic sample applications spanning every stage). Everything described
below under "Running it" works right now with no further setup.

**Gmail sync is built but not yet connected to a real inbox.** Visit `/setup` (or the "Sync
setup" link in the nav) to pick how you want to sync — see "Connecting Gmail" below.

## Running it

```bash
npm install          # if you haven't already
npm run dev
```

Open http://localhost:3000 — it redirects to the dashboard. The list view is at
`/applications`; click any row for the detail/edit page.

The app currently runs against seed data in `dev.db` (SQLite). To reset and reseed it:

```bash
rm -f dev.db dev.db-journal
npx prisma migrate deploy
node prisma/seed.ts
```

### Other commands

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # eslint
npm test             # node --test over lib/**/*.test.ts
npm run build        # production build
```

## Connecting Gmail

Visit `/setup` to choose between two sync methods. Each shows its pros/cons in-app; the short
version:

- **Google OAuth (recommended)** — fully automatic, your email never passes through any AI
  model, but needs a one-time ~10 minute Google Cloud setup (below).
- **Claude-assisted** — skips the Google Cloud setup, but only syncs when you ask a Claude Code
  session to do it, and your email content is read into that conversation.

Your choice is stored in `SyncState.syncMethod`; both paths write into the same
`Application`/`EmailMessage` tables through the same classify → match → ingest pipeline
(`lib/gmail/ingestRaw.ts`), so the dashboard/list/detail views behave identically either way.

### Google OAuth setup (one-time, ~10 minutes)

The app needs its own Google Cloud OAuth client — it does **not** reuse any other Google
sign-in. Read-only Gmail access only (`gmail.readonly` scope); it never sends, labels, or
modifies anything in your mailbox.

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and create a new
   project (or reuse one you already have).
2. In **APIs & Services → Library**, search for "Gmail API" and enable it.
3. In **APIs & Services → OAuth consent screen**:
   - User type: **External**
   - Fill in the required app name/email fields
   - Leave publishing status as **Testing** (this skips Google's verification review
     entirely, since only you will ever use this)
   - Under "Test users," add your own Gmail address
4. In **APIs & Services → Credentials**, click **Create Credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy the generated **Client ID** and **Client Secret**.
6. Open `.env.local` in this project and fill in:
   ```
   GOOGLE_CLIENT_ID="<paste here>"
   GOOGLE_CLIENT_SECRET="<paste here>"
   ```
   (`TOKEN_ENCRYPTION_KEY` is already generated — leave it as is. It encrypts your stored
   Gmail tokens at rest.)
7. Restart `npm run dev`, open the dashboard, and click **Connect Gmail**. After granting
   access you'll land back on the dashboard — click **Sync now** to pull your mail.

The first sync scans for application-related mail (known ATS senders like Greenhouse/Lever/
Workday, plus subject keywords like "application"/"interview"/"offer"). Later syncs are
incremental and only fetch what's new.

If you ever see a "refresh token revoked" type error: go to
[myaccount.google.com/permissions](https://myaccount.google.com/permissions), remove this
app's access, then click **Connect Gmail** again so Google issues a fresh token.

### Claude-assisted sync (no Google Cloud setup)

If you picked this method on `/setup`: open a Claude Code session in this project with Gmail
connected, and ask it to sync your job-application emails. Claude will search/read the relevant
messages with its own Gmail tools, write them to a JSON file matching `RawEmailInput[]`
(`lib/gmail/ingestRaw.ts`), and run:

```bash
node scripts/claude-ingest.ts <path-to-messages.json>
```

That script runs every message through the exact same classifier/matcher/stage-derivation
pipeline as the Google-OAuth path, so results are identical regardless of which method produced
them. You can switch methods at any time from `/setup` without losing anything already synced.

## What's manual by design

- **LinkedIn**: no automation. There's no legitimate API for "am I connected to this
  person," and scraping LinkedIn risks a ToS ban on your account. You paste in a company
  LinkedIn URL and, optionally, a recruiter's name/LinkedIn URL/notes on the detail page.
- **Recruiter / hiring manager info**: the app tries to pick up a name + LinkedIn URL from
  email signatures automatically (and never overwrites a value you've entered by hand), but
  there's no paid lookup API wired in yet — see Roadmap below.

## Roadmap (tracked as GitHub issues, labeled `[future]`)

- LLM-assisted email classification for cases the rule-based classifier misses
- A paid recruiter/hiring-manager enrichment API (Apollo.io/Hunter.io/etc.) — held off
  pending familiarity with LLM/API billing
- AI-generated company/CEO news briefs for interview prep — same cost consideration
- Interview-notes → follow-up-email drafting — same cost consideration
- A browser extension to save postings from any site, not just LinkedIn
- An integration bridge with the sibling `job_search` project (job discovery)
- An Electron desktop app with a floating always-on-top widget
- Background sync via `cron`/`launchd` so syncing continues when the app isn't open

See the full list at https://github.com/GrayCow/jobtracker/issues.

## Project structure

- `app/` — Next.js App Router pages, API routes, and server actions
- `lib/` — framework-agnostic business logic (Gmail sync, classification, matching, stats).
  Nothing in here imports from `next/*`, so it's portable to an Electron app later.
- `prisma/` — database schema, migrations, and the seed script
- `scripts/sync-once.ts` — run a sync from the command line: `node scripts/sync-once.ts`
