# The Taboo Test

A 15-statement self-assessment in three sections — Sex, Death, Cash — with a private
results page, a GoHighLevel results email, and an admin dashboard.
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 · PostgreSQL 16 · Railway.

`SPEC.md` is the brief and the authority. `CLAUDE.md` holds the invariants;
`docs/DECISIONS.md` records why things are the way they are.

**Status: Phase 1 of 5** (SPEC §15). The landing page, the section title cards, the
statement screens and the results page are built and deployed for a look review. The test
flow saves nothing yet, and the results page renders sample scores derived from the URL —
both are clearly marked in the code and replaced in Phases 2 and 3.

## Local setup

Requirements: Node 20+, Postgres 16 (the easiest is Docker). No pgvector needed.

```bash
docker run -d --name tbt-pg -e POSTGRES_PASSWORD=tbt -e POSTGRES_DB=tabootest -p 5440:5432 postgres:16
cp .env.example .env         # then edit SESSION_SECRET and ADMIN_PASSWORD
npm install
npx prisma migrate dev       # applies migrations
npm run dev                  # http://localhost:3000
```

`.env` is gitignored. `.env.example` lists every variable with a one-line note; its
default `DATABASE_URL` already matches the Docker command above, so only `SESSION_SECRET`
and `ADMIN_PASSWORD` need filling in.

### Scripts

| Script | What it does |
|---|---|
| `npm run check` | typecheck + lint + Vitest (including the 3,125-pattern-per-section scoring verification) |
| `npm run test:e2e` | Playwright suite at 390px (starts `next dev` on port 3100 if nothing is listening) |
| `npm run build` / `npm start` | production build (standalone output) |
| `npm run db:seed` | demo data — a no-op until Phase 4 |

## Routes

| Route | Purpose |
|---|---|
| `/` | landing: title, intro, Start |
| `/test` | 3 section title cards + 15 statement screens |
| `/send` | first name + email (Phase 3) |
| `/r/[id]` | private results page; `id` is a 24-character random, `noindex`, `no-referrer` |
| `/privacy` | privacy policy (stub until Phase 5) |
| `/admin/*` | password-protected dashboard (Phase 4) |
| `/api/health` | 200 + DB ping (Railway healthcheck) |

While Phase 1 is live, these render the results page against real scoring with sample
answers: `/r/sample-mixed`, `/r/sample-tie`, `/r/sample-equal`, `/r/sample-low`,
`/r/sample-high`.

## Railway deploy

1. **Create a project** and add the **PostgreSQL** plugin.
2. **Add a service from this repo.** `railway.json` selects the Dockerfile builder, sets
   the start command to `./scripts/start.sh` and the healthcheck to `/api/health`.
3. **Set environment variables** on the service (see `.env.example`):
   - `DATABASE_URL` → reference the plugin: `${{Postgres.DATABASE_URL}}`
   - `SESSION_SECRET` (32+ random chars, e.g. `openssl rand -hex 32`), `ADMIN_PASSWORD`
   - `NEXT_PUBLIC_SITE_URL` → the public URL, no trailing slash. **Baked in at build
     time**, so redeploy after changing it.
   - `GHL_WEBHOOK_URL` → the GoHighLevel inbound webhook (Phase 4)
   - `SEED=false` in production
4. **Deploy.** On every start the container runs `prisma migrate deploy`, then the seed
   (skipped when `SEED=false`), then the Node server.
5. **Generate a domain** under Settings → Networking and set `NEXT_PUBLIC_SITE_URL` to it.

**Set the custom domain (`tabootest.marieelizabethmali.com`) before the first real email
goes out.** Result links in inboxes are permanent and cannot be reissued.

## Copy

Every word a respondent reads lives in `src/config/copy.ts`, verbatim from `SPEC.md`
Appendix A. Slots still marked `[COPY TBD: …]` render as-is, brackets included, so they
are visible in review. `tests/copy.test.ts` checks every written string against the spec
word for word. Nobody but Marie-Elizabeth writes copy — see CLAUDE.md.

## Privacy

No GA4, no Meta Pixel, no share buttons, no OG result cards. Tracking is first-party only,
in the `Event` table. The results page is `noindex, nofollow` with
`Referrer-Policy: no-referrer`, shows no name or email, and never shows past scores —
those go in the email, which only reaches the address's owner.
