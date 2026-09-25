@AGENTS.md

# The Taboo Test

A 15-statement self-assessment in three sections — Sex, Death, Cash — with a private
results page and an admin dashboard.
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6 · Postgres 16 · Railway.

`SPEC.md` is the brief and the authority. `README.md` covers setup and deploy;
`docs/DECISIONS.md` records why things are the way they are. This file covers the
invariants that are easy to break by accident.

## Workflow

- Work directly on `main`. Never create branches.
- `git pull` before starting any task.
- After finishing a task: `npm run check`, commit with a clear message, then `git push`.
- Never end a session with uncommitted or unpushed work.
- Build in the phases in SPEC §15. Stop at the end of each and give Marie-Elizabeth
  the Railway URL before continuing.

## Never write user-facing copy

This is the rule that matters most here (SPEC §0.4). Copy is Marie-Elizabeth's.

- Every word a respondent reads lives in `src/config/copy.ts` and **nowhere else**.
- Use Appendix A of `SPEC.md` exactly as written. Do not reword, tighten, fix a
  typo, or "improve" anything in it.
- Slots still marked `[COPY TBD: …]` render **as-is, brackets included**, so they are
  visible in review. `src/components/Tbd.tsx` is what draws them. Never invent
  placeholder prose to fill one in.
- `tests/copy.test.ts` enforces this: every written string in `copy.ts` must appear
  in `SPEC.md` word for word. If that test fails, the copy was edited, not the test.

## Scoring (SPEC §6)

`src/lib/scoring.ts` is a pure function and the single source of truth.

- **`Attempt.answers` holds RAW ratings** — a 15-character string of digits 1–5, e.g.
  `"431254322153414"`. Never store pre-reversed values.
- Item score = the rating, or `6 − rating` for a reversed statement.
- Section total = sum of its 5 item scores → **5–25**.
- Level: **Low 5–11 · Medium 12–18 · High 19–25.**
- **Terrain = the section(s) with the LOWEST total.** Two tied → both are terrain.
  All three tied → `terrain` is empty and the page uses the all-equal copy variant.
  Terrain is the lowest score even when all three sections are High.
- **Lowest statement per section** = lowest *item* score in that section; ties resolve
  to the first in statement order. The Medium Sex and Medium Cash copy refers to it.
- Scoring runs server-side at `/send` submit and is saved on the Attempt. Never trust
  a client-computed score.

Nothing here is secret, so there is no `server-only` guard like Tango's. That is a
deliberate difference, not an oversight.

## Statement order, wording and reversal flags are locked

`STATEMENTS` (`src/config/test.ts`, text from `src/config/copy.ts`) is fixed content for
`TEST_VERSION`. `REVERSED_BY_VERSION.v1` is `[1, 8, 11, 12, 14]` — zero-based, i.e.
statements 2, 9, 12, 13 and 15.

`Attempt.answers` is **positional**. Reordering statements, moving one between sections,
or changing a reversal flag silently re-scores every historical row. If the test genuinely
changes, **bump `TEST_VERSION`** rather than editing in place.

Sex statement 5 is still `[COPY TBD]` pending SPEC §14.1. It must stay exactly one
statement — the 5–25 level ranges assume five per section.

## Sea Glass contrast rules (measured)

The palette is Tango's with the blue family replaced by Sea Glass (`src/app/globals.css`).

| Pairing | Ratio | Use |
|---|---|---|
| ink `#2e1f2a` on sea | 9.88 | ✅ text on sea panels |
| red `#62081b` on sea | 8.47 | ✅ |
| sea on aubergine `#2e1f2a` | 9.88 | ✅ sea text or marks on dark cards |
| white on sea | 1.58 | ❌ never |
| sea on paper | 1.49 | ❌ never as text, icons, or a meaningful mark on paper |

`:focus-visible` is **red**, not sea — 12.6:1 on paper.

**Never use `mute` for text.** `--color-mute` (`#7a766f`) fails WCAG AA against every
background in this app. Use `ink` for content and `ink-3` for a repeated label layer
(5.56:1 or better everywhere). `mute` is fine for borders, rules and decorative marks.

On the results page the level is **always written out in text**, so colour never carries
the meaning alone — the meter's three zones are decoration over a labelled value.

## Privacy is a product constraint, not a nice-to-have

These are personal answers about sex, death and money.

- **Past scores never appear on the results page** — only in the email. Anyone can type
  any address into `/send`, so the page would otherwise expose someone else's results.
  The email only reaches the address's owner (SPEC §2).
- The results page renders **no first name and no email**, and is `noindex, nofollow`
  with `Referrer-Policy: no-referrer` (set for `/r/*` in `next.config.ts`).
- `/r/{publicId}` is guarded by a 24-character crypto-random id (`src/lib/public-id.ts`),
  because the link has to keep working from the email. There is no result cookie.
- **No share buttons, no OG result cards, no GA4, no Meta Pixel.** Tracking is
  first-party only, in the `Event` table.

## Cookies are `tbt_`, not `tt_`

Deliberately different from the Taboo Tango quiz so the two never collide.
HMAC-SHA256-signed JSON with an expiry (`src/lib/crypto.ts`, Web Crypto so the same code
runs in the proxy). There is no session table.

| Cookie | Set by | TTL |
|---|---|---|
| `tbt_attempt` | Start, on `/` | 7 days |
| `tbt_admin` | `/admin/login` | 7 days |

Rotating `SESSION_SECRET` invalidates admin sessions and every in-progress attempt.
Prefer a quiet moment.

Next 16 renamed `middleware.ts` to `proxy.ts`. `src/proxy.ts` matches `/admin/:path*` and
redirects to `/admin/login`. The proxy is a redirect for unauthenticated humans, not the
only guard — server actions that mutate admin state must re-check `isAdmin()` themselves.

## GoHighLevel owns the results email

- **The app sends each person's copy to GHL in custom fields** (SPEC §8.1), prefixed
  `taboo_` — deliberately different from Tango's `tt_` so the custom fields never collide.
  This reverses Tango's decision to keep copy in GHL: 27 combinations (3 sections × 3
  levels) are unmanageable as GHL branches, so copy stays versioned in `copy.ts`.
- **Every copy field sent to GHL must be a single paragraph of plain text** — no HTML,
  no line breaks — so it renders cleanly as a merge field.
- `taboo_terrain_line` is a full pre-written sentence covering every tie case, so GHL
  needs no logic of its own. Same for `taboo_change_line`, which is empty on a first
  attempt.
- The webhook fires on every `/send` submit, **never blocks and never throws**. A failure
  is logged to `DeliveryLog`; the person still sees their results page either way.
- **A webhook failure means someone got no email.** `/admin/health` leads with an alert
  if any webhook failed in the last 7 days, or if no URL is set. Don't quietly downgrade
  that.
- URL comes from admin Settings, falling back to `GHL_WEBHOOK_URL`. Timeout 8s, one
  retry after 2s.

## `siteUrl()` falls back with `||`, not `??`

The Dockerfile sets `ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL`, which is the
**empty string** when no build arg is passed. `??` catches `undefined` but not `""`, and
`new URL("")` throws. `NEXT_PUBLIC_*` is inlined at build time, so changing the origin
needs a redeploy, and Railway only exposes a build arg to a stage that declares `ARG`.
(Lesson from Tango's domain move.)

**Set the custom domain before the first real email goes out.** Result links in inboxes
are permanent and cannot be reissued.

## Container start order

`scripts/start.sh` is the Railway start command (`railway.json`) and the Dockerfile `CMD`:

1. `prisma migrate deploy`
2. seed — **skipped when `SEED=false`**, and non-fatal if it fails
3. `exec node server.js`

**Set `SEED=false` in production.** The runner image is Next's `standalone` output, so the
app's own `node_modules` are not present: Prisma CLI and tsx live at `./tools/node_modules`
and `start.sh` invokes them by path. Anything added to the start sequence has to be
reachable from there.

## Conventions

- `npm run check` = typecheck + lint + Vitest.
- E2E is separate: `npm run test:e2e`, Playwright at 390px, needs a database.
- Rate limits live in Postgres (`RateLimit`) so they hold across instances.
- Webhook delivery never throws into the request path — it logs to `DeliveryLog`, which
  feeds the admin Health page.
