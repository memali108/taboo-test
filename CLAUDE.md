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

Every statement now has final copy. Sex statement 5 was replaced **in place, still `v1`**,
on 2026-09-26 — the one authorised exception, taken when no real respondent existed and
the database was due to be wiped before launch (SPEC §5.2, §15.5). Position, order and
reversal flags were untouched, so no stored score changed; only what position 5 *means*
did. **Once a real respondent exists, that exception is closed: bump `TEST_VERSION`.**

Any section must stay at exactly five statements — the 5–25 level ranges assume it.

## Sea Glass contrast rules (measured)

The palette is Tango's with the blue family replaced by Sea Glass, and the cream page
replaced by **pure white** to match marieelizabethmali.com (`src/app/globals.css`).
Every number below is a recomputed WCAG ratio against the current tokens.

| Pairing | Ratio | Use |
|---|---|---|
| white on red `#62081b` | 13.38 | ✅ the section title card's headline |
| sea on red | 8.47 | ✅ its subtitle, and the Begin button's fill against the card |
| sea-deep `#9abcc1` on red | 6.58 | ✅ that button, hovered |
| aubergine `#2e1f2a` on sea | 9.88 | ✅ the Begin button's label |
| aubergine on sea-deep `#9abcc1` | 7.68 | ✅ the same label, hovered |
| ink `#2e1f2a` on sea | 9.88 | ✅ text on sea panels |
| red on sea | 8.47 | ✅ |
| red on sea-soft `#ddebee` | 10.95 | ✅ every results section title, and the terrain border |
| ink on sea-soft | 12.78 | ✅ results section body copy |
| ink-2 on sea-soft | 10.08 | ✅ the italic section subtitle |
| ink-3 `#685363` on sea-soft | 5.72 | ✅ the "most interesting terrain" label |
| red on sea-deep | 6.58 | ✅ the meter's marker on its darkest zone |
| ink-3 on sea | 4.42 | ⚠️ large text only — just under AA for body |
| **ink on red** | **1.17** | ❌ **never** — and the same for ink-2, ink-3 (1.91) and mute (2.96) |
| white on sea | 1.58 | ❌ never |
| sea on paper (white) | 1.58 | ❌ never as text, icons, or a meaningful mark on the page |

**Red is the app's only dark surface.** The section title cards are red; there is no
aubergine surface any more. `--color-aubergine` survives as a *label* colour — it is what
the Begin button's text is — and it is the same value as `--color-ink`.

**So nothing from the ink scale may sit on a title card.** ink is 1.17:1 on red, ink-2
1.09, ink-3 1.91, mute 2.96 — all of them fail, and ink is the worst pairing in the whole
palette. Only white and the sea family are legible there. The Begin button is sea glass
for exactly this reason: a red button on a red card would be invisible, and sea is 8.47:1
against it.

The headline is `text-white`, not `text-paper`, even though the two are the same value
today. It is white because it sits on red, not because it matches the page — so a future
change to `paper` must not drag it along.

**The focus ring is the exception, and it is one ring for the whole app: red.**
`:focus-visible` uses `outline-offset: 3px`, which draws the ring **outside** the
element's border box — so it always sits on the page, which is white, never on the
element's own fill. Red is 13.38:1 there. An aubergine card and a red answer card get
the same red ring, and it reads on both.

Do not add a per-surface ring override. Two were tried and both were wrong: sea for the
aubergine title card (1.58:1 on white) and white for the red answer cards (1:1 — it
disappeared entirely). Each reasoned about the colour of the element instead of the
colour the ring is actually drawn against. This only changes if `outline-offset` ever
goes to 0 or negative.

### Never use `mute` for text

`--color-mute` (`#7a766f`) fails WCAG AA for body text against every **tinted** surface in
this app, and clears it on the white page only barely:

| Background | `mute` | `ink-3` `#685363` | `ink` `#2e1f2a` |
|---|---|---|---|
| paper (white) `#ffffff` | 4.52 | 6.99 | 15.61 |
| `paper-2` `#f7f5f1` | **4.15** | 6.42 | 14.33 |
| `paper-3` `#eeeae2` | **3.77** | 5.82 | 13.01 |
| `sea-soft` `#ddebee` | **3.70** | 5.72 | 12.78 |
| `sea` `#b6d3d8` | **2.86** | 4.42 | 9.88 |

AA needs 4.5:1 for body text, 3:1 for large text. **The white page is the one background
`mute` now passes on, at 4.52 — and every card, panel and meter zone sits on a tint where
it does not.** Treating it as usable on the page and unusable everywhere else is a rule
nobody will apply correctly, so the rule stays absolute: **never put `text-mute` on text a
person is meant to read.**

- **`ink` for content** — prose, values, counts, links, placeholders. Anything read rather
  than scanned past.
- **`ink-3` for a repeated label layer** — column headers, the uppercase label on a tile,
  `<dt>` terms. It clears AA on every surface except `sea`, where it is large-text only.

`mute` keeps its legitimate non-text uses — borders, rules, decorative marks — where
contrast minimums do not apply. It is what draws the meter's zone dividers. `ink-2`
(`#422f3d`, 12.31:1 on white) is also fine; it is not a low-contrast tone.

### The results page is sea-soft throughout

All three section blocks sit in a `sea-soft` box with a red title (10.95:1). The terrain
one is singled out by a **2px red border** — 10.95:1 against the fill, 13.38:1 against the
page — plus its "Your most interesting terrain" label. The other two carry a transparent
border of the same width, so every box is the same size and nothing shifts when the
terrain moves.

Only the terrain block is bordered. If a second thing here ever needs emphasis, give it a
different device rather than a second red border, or the one signal the page has stops
meaning anything.

### Neutrals have to work harder on a white page

The page is `#ffffff`, so a white card is no card at all. The tints carry all the
figure/ground the cream page used to:

| Token | Value | vs the white page | Role |
|---|---|---|---|
| `paper-2` | `#f7f5f1` | 1.09 | an unselected answer card, at rest |
| `paper-3` | `#eeeae2` | 1.20 | that card hovered; the meter's Low zone |
| `line` | `#d9d4cb` | 1.48 | every border and rule |

**The meter's three zones are the three sea tints**, and they step evenly: 1.22 / 1.58 /
2.03 against the white page, 1.29 between neighbours. That replaced a warm-neutral Low
against a cool-tint Medium sitting **1.02:1** apart — indistinguishable by luminance,
which is exactly what colour-vision deficiency makes worse. Keep the ramp inside one hue
family; the moment Low goes back to a neutral, that problem comes back with it.

The `mute` hairlines stay, but their job has changed: they now mark exactly where 11.5 and
18.5 fall, rather than rescuing a boundary that was otherwise invisible. The marker is a
red dot with a white ring and clears 3:1 on all three zones (10.95 / 8.47 / 6.58), so it
never depends on the ring to be seen — the ring only keeps it crisp at the darker end.

None of this carries meaning on its own. The level is always written out in text beside
the meter.

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

## Test rows are flagged `isSeed`, and that flag is load-bearing

There is no separate dev database. Playwright drives a real deployment, so its rows have
to be distinguishable from real ones. The suite sends `E2E_TOKEN` as an `x-taboo-e2e`
header (`src/lib/e2e.ts`), and every `Attempt` and `Contact` created while it is present
is flagged `isSeed`.

Two invariants hang off it (`src/lib/seed.ts`):

1. **A seed row NEVER triggers the GoHighLevel webhook.** `shouldDeliverWebhook()` is the
   guard, and the sender must call it. A test run that mails a real person, or burns a
   real GHL contact, is the failure this exists to prevent.
2. **Admin stats exclude seed rows.** Every admin query starts from `NOT_SEED`.

The flag is set **once, at creation**, and read from the stored row from then on — never
re-derived from whichever request happens to be in flight. An attempt flagged at the
start stays flagged through submission even if that later request arrives without the
header.

`isE2ERequest()` **fails closed** in every ambiguous case: no `E2E_TOKEN`, or one under 16
characters, and it never matches, whatever the header says. That is what stops an unset
variable matching an absent header and silently marking every real attempt as seed —
which would mail nobody and look like nothing was wrong. `tests/seed.test.ts` pins all of
it. The token only ever *adds* a flag: it reads nothing, skips no rate limit, and does not
reach admin.

**Wipe the database before launch** (SPEC §15.5), so none of this development traffic —
seed-flagged or not — is present when the first real subscriber arrives.

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
  retry after 2s, every outcome in `DeliveryLog`.
- **`deliverWebhook()` takes the attempt and checks `shouldDeliverWebhook()` itself**, so
  a seed row cannot be delivered by a caller who forgot. The only deliberate exception is
  Settings → Send test payload, which passes `isSeed: false` because that send is *meant*
  to reach GHL.
- `buildPayload()` is pure and snapshot-tested. Every copy field goes through `flatten()`,
  which collapses newlines — the single-paragraph rule is enforced, not assumed.
- **Previous scores are read at send time**, from `previousSubmission()`. They exist only
  in the email; the results page must never show them.

## Admin excludes seed rows, everywhere

Every query in `src/lib/admin-stats.ts` and every admin page starts from `NOT_SEED`.
Test-run and demo rows must never appear in the funnel, the level distribution, the
statement means, the contact list, the CSV or the retake stats. If you add an admin query
and forget it, the numbers quietly become wrong rather than visibly broken.

The seed (`prisma/seed.ts`) also flags everything it creates, so a seeded database gives a
shaped dashboard without polluting real numbers. **`SEED=false` in production** is still
the real guard; the "bail if seed rows exist" check only stops it running twice.

Admin mutations re-check `isAdmin()` themselves. `src/proxy.ts` is a redirect for
unauthenticated humans, not the only guard.

The proxy matcher (`/admin/:path*`) does cover `/admin/contacts/export`, so an
unauthenticated caller gets a 307 to the login page and never reaches the handler. The
handler checks `isAdmin()` anyway and 404s — a backstop for the day someone narrows that
matcher, which is exactly the kind of change whose blast radius is invisible. An e2e test
pins the 307 using a cookie-less request context.

**Deleting a contact deletes their attempts first.** `Attempt.contactId` is
`onDelete: SetNull`, so deleting the contact alone would orphan the attempts — the answers
would survive, detached. That is not what someone asking to be deleted means.

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
