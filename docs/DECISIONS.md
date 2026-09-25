# Decisions and open items

Choices made where `SPEC.md` left room. Newest first.

## Railway: two things that diverge from the spec — 2026-09-25

**Postgres is 18, not the 16 SPEC §3 names.** Railway's PostgreSQL plugin now provisions
`postgres-ssl:18`; pinning 16 would mean building the database service from a custom
image. Nothing in this app is version-specific — there is no pgvector here — and the
initial migration applied cleanly on 18. Flagged rather than fought; say so if you want 16.

**`railway.json` is deprecated as of this deploy.** Railway's CLI now prefers
Infrastructure as Code (`.railway/railway.ts`) and warns that config-as-code files
"keep working until **2026-12-01**". SPEC §3 asks for taboo-quiz's `railway.json`, and it
is what is deployed and working, so it stays for the Phase 1 review. **It has to be
migrated before 2026-12-01** — `railway config migrate` does it. Best done in Phase 4 or
5, not in the middle of a look review.

## Phase 1: scaffold and look — 2026-09-25

What Phase 1 ships, per SPEC §15.1: the repo, the copied infrastructure, the design
tokens, the landing page, the section title card, the statement screens and the results
page with fake data, deployed to Railway with its own Postgres.

**Two files are explicitly Phase 1 scaffolding and are deleted later.** Both say so at
the top, so neither can quietly become permanent:

- `src/components/test/TestPreview.tsx` walks the 18 screens in local state and **saves
  nothing** — no `Attempt`, no `/api/answer`, no cookie, no resume. Phase 2 replaces it.
  It walks all 18 screens rather than the "one title card + one statement screen" the
  phase asks for, because seeing all three title cards and the progress bar moving costs
  nothing extra and makes the look review better.
- `src/lib/phase1-samples.ts` turns the id in `/r/{id}` into a plausible answer string so
  the results page renders against **real** scoring, levels and terrain logic rather than
  a hand-written mock. Phase 3 replaces it with the `Attempt` lookup and a 404.
  Named ids cover the cases worth looking at: `sample-mixed` (one of each level),
  `sample-tie` (two sections tied), `sample-equal` (all three tied, no terrain),
  `sample-low`, `sample-high` (all High, and Cash still the terrain).

**Scoring landed in Phase 1, not Phase 2.** SPEC §15.2 puts it in Phase 2, but the
results page cannot show levels or a terrain panel without it, and a mock would have to
be thrown away. `src/lib/scoring.ts` and the full §6 Vitest suite — 3,125 patterns per
section, both boundaries, the reversal totals, both tie cases, the lowest-statement
tie-break — are in place now. Phase 2 wires the flow to it rather than writing it.

**Statement wording lives in `copy.ts`, structure in `test.ts`.** SPEC §0.4 says copy
lives in one file; SPEC §6 says the reversal map lives in `src/config/test.ts`. So
`test.ts` owns order, sections and reversal flags — the things scoring depends on — and
imports the text from `copy.ts`. Neither rule bends.

**`[COPY TBD]` is rendered, not styled away.** `src/components/Tbd.tsx` draws each
unwritten slot in a dashed box with a `data-copy-tbd` attribute. A placeholder that
blends into the page is a placeholder that ships.

**`/privacy` is a stub, not a policy.** The footer links to it from every page, so it
exists; its content is the SPEC §12 requirements as visible placeholders. The policy is
copy and lands in Phase 5.

**No seed data yet.** `prisma/seed.ts` is a deliberate no-op: the flow lands in Phase 2
and the admin pages in Phase 4, so there is nothing worth faking. The script, its
`--conditions=react-server` invocation and the `SEED=false` guard are wired up now so the
container start sequence is the real one from day one.

## What was copied from taboo-quiz, and what changed — 2026-09-25

Copied essentially verbatim: `src/lib/crypto.ts`, `db.ts`, `ratelimit.ts`,
`email-domain.ts`, `request.ts`, `isValidEmail`/`normalizeEmail` and their tests, the
Dockerfile, `scripts/start.sh`, `railway.json`, `/api/health`, `Wordmark.tsx`,
`public/logo.png`, the app shell and footer, `QuestionCard`'s styling and interaction.

Changed on the way over:

- **Cookies renamed `tt_` → `tbt_`** (SPEC §3), so the two apps never collide.
- **No result cookie.** Tango's `tt_result` gated a shareable `/result/{type}` URL. Here
  the results page is private and its link must keep working from the email, so the guard
  is a 24-character crypto-random `publicId` (`src/lib/public-id.ts`, ~120 bits, base32
  with `l/1/0/o` removed) and nothing else.
- **`siteUrl()` falls back with `||`, not `??`**, as SPEC §3 asks — see CLAUDE.md for why
  the empty string is the case that matters.
- **`resultUrl()` / `emailResultUrl()` take a `publicId`**, not an archetype, and the
  email URL carries `utm_source=email&utm_medium=results` per SPEC §8.1.
- **`settings.ts` dropped the legacy `goplus_` key and env var.** This is a new install;
  there is nothing to keep working.
- **`src/proxy.ts` is admin auth only.** Tango's matcher was widened to every request for
  a legacy-domain redirect it no longer needs here, so the matcher is back to
  `/admin/:path*` — the narrowest thing that works.
- **No `Analytics.tsx`, no GA4, no Meta Pixel, no OG share card.** SPEC §2.
- **No pgvector, no recharts, no Resend, no `server-only` guard on scoring.** SPEC §3, §6.
- **`QuestionCard` → `StatementCard`**, with the 1–5 value in the circle where Tango
  shows a letter, and the answer text coming from the fixed `SCALE` rather than per-item
  answers.

## The section title card is not literally full-screen — 2026-09-25

SPEC §5.3 asks for "a full-screen card on aubergine". As built, the aubergine card fills
the viewport between the header wordmark and the footer rather than bleeding over them,
so the app shell stays continuous across all 18 screens. If Marie-Elizabeth wants true
edge-to-edge, the title card needs to escape the `(test)` layout — say a route segment of
its own — rather than a negative margin. Flagged for the Phase 1 look review.

## The results meter's zone edges sit on half-points — 2026-09-25

The meter runs 5–25 linearly. Its Low/Medium and Medium/High edges are drawn at 11.5 and
18.5, not 11 and 18, so a score of exactly 11 sits inside the Low zone rather than on its
boundary. The levels themselves are unchanged (SPEC §6).

## Needs input from Marie-Elizabeth

Everything in SPEC §14, plus:

- The `[COPY TBD]` slots now visible in the running app: the landing intro replacement and
  the "most people score lower than they expect" line; the whole `/send` step except its
  heading; all three terrain lines; the results-page loop line and "Take it again" link;
  the retake change line; Sex statement 5.
- The privacy policy (SPEC §12), and whether `/send` needs a required data-processing
  consent line. The checkbox is built behind `REQUIRE_DATA_CONSENT`, off by default.
- Whether the results page carries a quiet link to the paid tier, or only the email does.
