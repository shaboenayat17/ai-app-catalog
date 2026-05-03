# AI App Catalog

A curated, searchable directory of AI-powered apps with deep comparisons, workflow building, and persona-based recommendations.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build
```

## Project layout

- `app/` — Next.js App Router pages
- `components/` — UI components
- `lib/` — Shared types, data helpers, comparison engine
- `data/` — Source-of-truth JSON (`apps.json`, `comparisons.json`, `news.json`, `trending.json`)
- `hooks/` — Client-side hooks
- `scripts/` — Maintenance scripts (auto-update lives here)
- `.github/workflows/` — Scheduled jobs

## Environment variables

| Name | Where | What it does |
|---|---|---|
| `OPENAI_API_KEY` | GitHub repo secret | Used by the robot to call OpenAI. Required for the auto-update workflow. |
| `ADMIN_PASSWORD` | Vercel env var (and `.env.local` for dev) | Gates the `/admin` panel. Defaults to `admin123` in local dev when unset. **Set this before deploying.** |
| `NEXT_PUBLIC_SITE_URL` | Vercel env var | Public URL of your site, e.g. `https://catalog.example.com`. Shown in the admin Settings tab and used in PR descriptions. |
| `GITHUB_REPOSITORY` | Vercel env var | `owner/repo` — wires up the GitHub links in the admin Settings tab and the "Run robot now" button. |
| `SITE_URL` | GitHub Actions repository variable (Settings → Secrets and variables → Actions → Variables) | Lets the robot include a "review at /admin" link in its PR description. |

To set Vercel env vars: project → Settings → Environment Variables. Mark them as "Production" and re-deploy.

## Admin panel

A password-protected panel at [`/admin`](https://example.com/admin) lets you review and approve robot suggestions without leaving the site.

### What you can do
- **Pending Review** — see what the robot suggested, approve to add it to the catalog, or reject to drop it.
- **Recently Approved** — last 10 apps approved in the past 30 days.
- **Catalog** — search every app and remove anything you don't want anymore.
- **Settings** — links into GitHub Actions / PRs and the next scheduled run time.

### Setup

1. Set `ADMIN_PASSWORD` in your environment (Vercel env var or `.env.local` for dev). Without it the panel falls back to `admin123` in development and **does not appear in the header at all** in production.
2. Optionally set `NEXT_PUBLIC_SITE_URL` and `GITHUB_REPOSITORY` so the Settings tab can wire up links.
3. Deploy. Visit `/admin`, enter the password — you stay logged in via localStorage.

### Important: filesystem writes on Vercel

The admin's Approve/Reject/Remove actions write to JSON files via `fs.writeFile`. **This works perfectly when running locally or on a self-hosted Node host, but Vercel's runtime filesystem is read-only.** On Vercel, mutations will appear to succeed but won't persist between requests.

Two practical options:

- **Recommended for Vercel:** run the admin **locally** (`npm run dev`, visit `http://localhost:3000/admin`). Approvals modify your local `data/apps.json` and `data/pending-apps.json`. Commit and push — Vercel rebuilds with the new content.
- **For self-hosted deployments** (Render, Fly, your own Node server): writes persist normally; the panel works as you'd expect on the live site.

The auto-update workflow opens GitHub PRs as a parallel review path, so even on Vercel you can merge robot suggestions through GitHub if you prefer not to run admin locally.

## Auto-Update System

This catalog updates automatically every other day.

### How it works

A GitHub Action runs every 2 days at 09:00 UTC (and on demand). It asks the OpenAI API to research a few new AI apps that aren't already in the catalog, validates the suggestions, appends them to `data/pending-apps.json`, and opens a Pull Request. Suggestions sit in the pending queue — review and approve them at `/admin`, or merge the PR if you prefer GitHub. Nothing reaches the live catalog until you do one of those.

### One-time setup

1. Add a repository secret named **`OPENAI_API_KEY`** (Settings → Secrets and variables → Actions → New repository secret).
2. Allow GitHub Actions to open Pull Requests: Settings → Actions → General → Workflow permissions → enable **Allow GitHub Actions to create and approve pull requests**.

### To trigger a manual update

1. Go to the **Actions** tab in GitHub.
2. Click **Update AI App Catalog** in the sidebar.
3. Click **Run workflow**.
4. Wait 2–3 minutes.
5. Check the **Pull requests** tab for the suggestions.

### To review an update

1. Open the **Pull requests** tab.
2. Click the auto-update PR (titled `🤖 New AI apps to review (run …)`).
3. Review the diff under the **Files changed** tab.
4. Edit anything that looks wrong directly on the branch.
5. Click **Merge pull request** to accept, or **Close pull request** to reject.

### Safety rails

The update script ([`scripts/update-catalog.js`](scripts/update-catalog.js)) is append-only:

- Never modifies or deletes existing apps.
- Never adds more than 5 new apps per run.
- Skips any suggestion that fails validation (bad URL, duplicate id, wrong category, missing fields, etc.) and logs the reason.
- Exits cleanly with no PR if OpenAI is unreachable or returns invalid JSON — the workflow stays green.
- Uses `gpt-4o-mini` with `max_tokens: 2000` to keep costs low.

The PR body includes a summary of accepted suggestions and any rejected ones with their reasons. The full Action log shows every accept/skip decision.
