# Decisions and open items

Choices made where `SPEC.md` left room. Newest first.

## Phase 4: GoHighLevel delivery and the admin dashboard — 2026-09-25

**`buildPayload()` is pure and snapshot-tested**, so a change to any copy string shows up
as a diff in `tests/webhook-payload.test.ts` rather than as a wrong merge field in
someone's inbox. Every copy value goes through `flatten()`, which collapses newlines and
runs of whitespace — SPEC §8.1's "single paragraph of plain text" rule is enforced rather
than assumed to hold, and a test asserts no field contains a line break or HTML.

**Absent previous scores are sent as empty strings, not omitted keys.** GHL maps fields by
name; a key that vanishes on a first attempt leaves the *previous* run's value sitting in
the contact record, so someone's first-ever email could quote a stranger's numbers.

**`deliverWebhook()` checks `shouldDeliverWebhook()` itself** rather than trusting callers
to remember. The one deliberate exception is Settings → "Send test payload", which passes
`isSeed: false` because that send is meant to reach GHL — that is its whole purpose.

**The webhook is awaited, but wrapped.** SPEC §4.4 says it must never block and never
throw. Awaiting it means the outcome is in `DeliveryLog` before the redirect, which is
what makes the Health page trustworthy; the `try/catch` around it is what stops any of
that costing someone their results page.

**Admin excludes `isSeed` everywhere**, via a single `NOT_SEED` fragment. The failure mode
if that is forgotten in a future query is quiet — wrong numbers, not an error — so it is
written down in CLAUDE.md as an invariant rather than left as a habit.

**Deleting a contact deletes their attempts first.** `Attempt.contactId` is
`onDelete: SetNull`, so deleting the contact alone leaves the attempts behind with their
answers intact and merely detached. That is not deletion. The action also requires the
address to be typed, because it cannot be undone.

**`/admin/contacts/export` checks `isAdmin()` for itself**, even though the proxy
matcher already covers it — an unauthenticated caller is redirected to the login page and
never reaches the handler. A route returning a CSV of every contact should not depend on a
matcher pattern staying as it is, so it checks anyway and 404s. An e2e test pins the
redirect, and had to use a cookie-less request context to do it: Playwright's `request`
fixture inherits `storageState` from `use`, so the first version of that test was checking
an authenticated call and would have passed no matter what the route did.

**The seed now creates ~300 attempts, all flagged.** It deliberately leaves 22% unfinished
and 15% of finished ones unsubmitted, so the funnel on a seeded database has a shape worth
looking at instead of three equal bars.

**The Dockerfile's seed file list grew.** `prisma/seed.ts` imports `submit.ts` now, and
the runner image only carries the files it is told to. `start.sh` treats a seed failure as
non-fatal, so a missing import there fails *quietly* — the Dockerfile now says so where
the list lives.

### Two lint rules worth the argument

`react-hooks/purity` flagged `Date.now()` in the Health page. The rule is right in general
and wrong here — "the last 7 days" is relative to when someone looks, and a Server
Component render *is* a request. Moved to `healthWindowStart()` in `admin-stats.ts` with a
comment, rather than silenced inline.

`@next/next/no-html-link-for-pages` flagged the CSV link. Also right in general: a plain
anchor to an internal page skips client navigation. But the CSV is a download, and
`next/link` would client-navigate to it instead of letting the browser save it. Disabled
on that one line, with the reason.

## The results page's loop line has final copy — 2026-09-25

Marie-Elizabeth's words, replacing the placeholder: *"Check your inbox. I've sent you one
thing to do for each section."* `copy.ts` and SPEC.md Appendix A both updated, so
`tests/copy.test.ts` keeps checking the running page against the spec word for word.

**It is now the heaviest thing in the closing block** — 22px semibold, rising to 24px from
`sm`, against 16px for the deliverability note beneath it. It is the only thing the page
asks anyone to do, and the page deliberately has no button: the action is in their inbox,
so there is nothing here to click. Typographic weight is the whole mechanism.

The deliverability note moved from a 4-unit gap to 3 and stays at body size, so it reads
as a footnote to the loop line rather than a peer. That is the opposite of the problem
recorded in taboo-quiz's DECISIONS, where the note ended up at equal weight to the hook it
followed and the page's last words became an imperative about spam folders.

Still `[COPY TBD]` on this page: the terrain lines and the "Take it again" link text.

## Results page: an all-sea meter ramp and sea-soft section blocks — 2026-09-25

Marie-Elizabeth's design pass. The meter's zones become the three website sea tints —
Low `#ddebee`, Medium `#b6d3d8`, High `#9abcc1` — the thin marker becomes a bold red dot
with a white ring, and all three section blocks move into the sea-soft box, with the
terrain one marked by a 2px red border instead of being the only one tinted.

**The zone ramp is now monotonic and evenly stepped:** 1.22 / 1.58 / 2.03 against the
white page, 1.29 between neighbours. That is a real fix, not just a repaint. The previous
Low was a warm neutral sitting **1.02:1** from a cool-tint Medium — a gap luminance cannot
express, and precisely the case colour-vision deficiency flattens. Staying inside one hue
family is what removes the problem, so the note in CLAUDE.md now says to keep it there.

**The hairline dividers stay, with a different job.** They were rescuing an invisible
boundary; now they mark exactly where 11.5 and 18.5 fall, which is genuinely useful for
seeing which side of a level edge a score sits on. `mute` still draws them: 3.70 / 2.86 /
2.22 across the three zones — weakest on High, but the zones themselves now carry the
separation.

**The marker does not depend on its ring.** Red on the three zones is 10.95 / 8.47 / 6.58,
all clear of the 3:1 that SC 1.4.11 asks of a meaningful graphic, so the dot is legible
wherever it lands even if the white ring is lost against a pale zone. The ring is there to
keep it crisp at the darker end, not to make it visible.

The dot also had to move **out of the track**: the track clips to its rounded ends, and
the dot is deliberately taller than the track. It now sits in an unclipped wrapper over
the top.

**`sea-deep` changed value, from my invented `#a4c6cd` to the website's `#9abcc1`.** The
palette had two sea tints five percent apart for no reason — one of them mine. There is
now one, used for both the meter's High zone and the Begin button hover. That hover gets
slightly stronger as a side effect (1.15 → 1.29 step) and its label still passes
comfortably: aubergine on `#9abcc1` is 7.68:1, and the button against the red card is
6.58:1.

**Every section block is now sea-soft, so being tinted no longer means "this is your
terrain".** The red border carries that alone, which is why it is 2px rather than 1 —
10.95:1 against the fill, 13.38:1 against the page. Non-terrain blocks carry a transparent
border of the same width so the boxes stay identical in size and nothing shifts depending
on which section is lowest. The "Your most interesting terrain" label stays; with only one
visual device left, the words matter more.

## Phase 3: the email step and the real results page — 2026-09-25

`/send` carries every safeguard from taboo-quiz's unlock form (SPEC §7.4): honeypot,
2-second minimum time, Postgres-backed rate limit, the strict format check, and the
fail-open MX lookup. They run in that order, and **the rate limit sits after the cheap
checks and before the DNS lookup** — a malformed address never consumes someone's quota,
and the endpoint can never be used as an open DNS resolver.

**Every submitted value is echoed back on failure.** This is the last step before someone
gets their results; making them retype an email over a validation slip is how you lose
them. The form repopulates from the action's echoed values rather than from controlled
inputs, because React resets the form when the action resolves and a `checked` prop does
not re-assert — the same finding as Tango's DECISIONS.

**Tags are rebuilt, not accumulated.** `computeSubmission()` drops every level and terrain
tag it manages before adding this attempt's, so a retake never leaves a contact tagged
both `sex-high` and `sex-low`. Tags it does not manage — anything added by hand in
GoHighLevel — are left alone. One tag per terrain section, so a two-way tie yields two and
an all-equal result yields none, matching `Attempt.terrain`.

**`consentAt` is set only when the optional box is ticked.** It means marketing consent,
never consent to receive the results, which are the service being asked for. Tango had a
bug here once — passing `consent: true` unconditionally — and it is worth not repeating.

**The results page reads only the attempt.** `previousSubmission()` exists for Phase 4's
payload and is deliberately not wired to the page: anyone can type any address into
`/send`, so past scores there would expose someone else's results (SPEC §2). The page
renders no first name and no email either, and an e2e test greps the HTML for both.

**`/r/[id]` 404s for anything that is not a submitted attempt**, and checks the id's shape
before touching the database.

### Three e2e failures, all of them the test's fault

Worth recording because the pattern repeated: each looked like an app bug and none was.

1. Clicking through statements without waiting for each screen dropped answers. The card
   correctly ignores taps while a write is in flight.
2. Reloading immediately after the fifth answer raced the write. The screen only changes
   once the server has answered, so waiting for the advance is what proves it landed.
3. `submitSend()` read `page.url()` straight after clicking, before the server action's
   redirect, so a successful submission looked like it had stayed on `/send`.

The lesson each time: synchronise on the thing the app actually changes, not on a timer
or on the click returning.

## Test rows carry `isSeed`, set by a secret header — 2026-09-25

Marie-Elizabeth's call: no separate dev database for now. Instead, a Playwright run marks
itself with `E2E_TOKEN` sent as an `x-taboo-e2e` header, and every `Attempt` and `Contact`
created while it is present is flagged `isSeed` — kept out of admin stats, and never
delivered to GoHighLevel.

**`Contact` gained an `isSeed` column**, which SPEC §9 did not have; only `Attempt` did.
SPEC §9 and §13 are updated to match, because a flagged attempt whose contact is
unflagged would still reach GHL through the contact.

**The flag is set once at creation and read from the row thereafter**, never re-derived
per request. Submission happens in a different request from creation, and a run that lost
the header mid-flight would otherwise mail a real person from a test attempt.

**`isE2ERequest()` fails closed.** It is a privileged marker — it suppresses the webhook —
so: no token configured, or one under 16 characters, and it never matches whatever the
header says. The specific trap that rule closes is an unset `E2E_TOKEN` matching an absent
header, which would flag *every* real attempt as seed and quietly mail nobody. The
comparison is timing-safe. `tests/seed.test.ts` pins every branch.

**`shouldDeliverWebhook()` exists before the sender does.** Phase 4 builds delivery; the
guard and its test are written now so the rule is recorded rather than remembered.

**Wipe all data before launch** is now item one of SPEC §15.5, after the end-to-end inbox
test and before the link goes out. That is what clears the development traffic —
including the ~20 rows from today's Phase 2 runs, which predate the flag and are
therefore not seed-marked.

**`GHL_WEBHOOK_URL` stays unset**, on Railway and everywhere else, until Marie-Elizabeth
configures GoHighLevel herself in Phase 4. `webhookUrl()` already returns
`{ url: null, source: "none" }` in that state and the sender will simply not fire.

## Phase 2: the real test flow — 2026-09-25

The preview is gone. `Begin` on the landing page writes an `Attempt`, sets the signed
`tbt_attempt` cookie for 7 days and redirects to `/test`; every answer is written through
`/api/answer` as it is given; statement 15 marks the attempt `completed` and sends them to
`/send`. `TestPreview.tsx` is deleted.

**Answering a statement again overwrites it in place and does NOT truncate what follows.**
This is a deliberate departure from Taboo Tango, which truncates. Tango's key is positional
across the whole quiz, so a changed answer re-scores everything after it; here each
statement scores independently inside its own section, so there is nothing downstream to
invalidate — and truncating would silently throw away answers the person had already
given. `applyAnswer()` is pure and pinned by `tests/answers.test.ts`.

**Resume lands on the screen *after* the last answered statement, not on the next
statement's screen.** Those differ exactly at a section boundary: finishing Sex's fifth
statement and coming back must show the Death title card, not skip past it.
`resumeScreenIndex()` handles it and is unit-tested at every boundary.

**The attempt always comes from the signed cookie, never from the request body.** Both
`/api/answer` and `/api/events` ignore any client-supplied id. For the answer route that
stops anyone writing into someone else's attempt; for events it also avoids a foreign-key
error from an id that no longer exists. The client's `sessionStorage` attempt id is now
only used to correlate, never to address.

**`tbt_started` is recorded server-side**, inside `createAttempt()`, rather than from the
browser. It is the one event that must not be lost to a redirect, an ad blocker, or a
beacon that never fires; everything else in SPEC §10 is fine coming from the client.

**Begin resumes rather than restarting** when the browser already carries an attempt. A
second row for the same person would count as a second start in the funnel and orphan the
answers already given.

**The answer is applied optimistically in the client and then replaced by the server's
copy.** Back stays instant while a write is in flight, and the database stays
authoritative.

### `/send` is a stub, and there is no local database

`/send` exists because statement 15 has to land somewhere (SPEC §4.3). It shows the
settled heading and the `[COPY TBD]` slots; the form and its safeguards are Phase 3.

**There is no Docker or Postgres on this machine**, so the Playwright suite cannot run
locally — everything else (`npm run check`: typecheck, lint, 39 unit tests) can, because
the flow logic was deliberately written as pure functions. The suite runs against a
deployment instead: `E2E_BASE_URL=https://… npx playwright test`, which
`playwright.config.ts` now supports.

**Those runs left attempt rows in the live database, and they are still there.** Cleaning
them up needs a connection the environment does not have: `postgres.railway.internal`
resolves only inside Railway, the service has no public proxy, and `psql` is not
installed. Adding a public TCP proxy to the database is not something to do quietly, so
the rows stand. They are harmless now — roughly twenty attempts and their events, no
`Contact` rows, no personal data — but they are indistinguishable from real ones and will
skew the Phase 4 funnel if they survive that long.

Two things to settle before Phase 3, when e2e starts creating contacts and firing
webhooks:

- **A dev/test Postgres**, so the suite runs locally without touching live data or
  needing a deploy first.
- **Marking test-run attempts `isSeed: true`** behind an env flag. The column already
  exists for the seed (SPEC §9) and would make this class of row deletable in one
  statement.

## Landing button reads "Begin" — 2026-09-25

Marie-Elizabeth's copy change: the landing button is "Begin" rather than "Start", matching
the section title cards. `SPEC.md` Appendix A updated alongside `copy.ts`, so
`tests/copy.test.ts` still checks the running app against the spec word for word.

**The title card's "Begin" was hardcoded in `SectionTitleCard.tsx`**, which broke SPEC
§0.4 — copy lives in `src/config/copy.ts` and nowhere else. Fixed while aligning the two
labels. It is a separate entry (`SECTION_TITLE.button`) from `LANDING.button` rather than
one shared constant: they read the same today, but they are two different buttons and one
should be able to change without silently dragging the other.

## Section title cards move from aubergine to red — 2026-09-25

The Sex / Death / Cash title cards are now red `#62081b`. The headline stays white, the
subtitle stays sea glass, and the Begin button stays sea glass with aubergine text.
Measured on the new background:

| | on red |
|---|---|
| white headline | 13.38 ✅ |
| sea subtitle | 8.47 ✅ |
| sea Begin button, as a shape against the card | 8.47 ✅ |
| sea-deep, the button hovered | 7.35 ✅ |
| aubergine label on that sea button | 9.88 ✅ (unchanged — the label sits on sea, not on the card) |

Everything the card already used clears AA on red by a wide margin, so nothing needed
re-picking.

**The Begin button's justification changes, even though the button does not.** It was sea
glass because red on aubergine is 1.17:1. It is now sea glass because a red button on a
red card is invisible, and sea is 8.47:1 against it. Same answer, different reason — worth
recording, because the old reason no longer exists and someone reading the code later
might "simplify" it back to red.

**Aubergine is no longer a surface anywhere in the app.** `--color-aubergine` survives
only as the Begin button's label colour, and it is the same value as `--color-ink`. The
practical rule that replaces it: red is the app's only dark surface, and nothing from the
ink scale may sit on it — ink 1.17, ink-2 1.09, ink-3 1.91, mute 2.96 all fail. Only white
and the sea family are legible there.

**The headline moved from `text-paper` to `text-white`.** Identical output today, since
paper is `#ffffff`. But it is white because it sits on red, not because it matches the
page, and pinning it to `paper` would have let a future page-colour change drag it along
silently.

One thing to keep an eye on: red now carries a lot of the design — the Start button, the
answer cards on hover and selection, and three full-bleed title cards. That is a look
judgement rather than a contrast problem, and it is Marie-Elizabeth's to make at review.

## A check mark marks the saved answer — 2026-09-25

The saved answer's number circle carries a small white check on a red disc. This closes
the ambiguity logged below: with hover and selected both red, hovering a different option
on an already-answered statement put two red cards on screen with nothing to tell them
apart. Now only the saved one is checked.

Details worth keeping:

- **It keys on the saved answer, not the pending one**, and is additionally gated on the
  card actually being red. While a *different* card is mid-selection — the 260ms pause
  before the screen advances — the old answer drops its fill, so it drops the mark with
  it. Without that gate a red badge would float on a light card for a quarter second.
- **The disc sets `bg-red` and `text-white` explicitly rather than inheriting.** During
  that same 260ms the circle's own text colour reverts to `ink`, and an inherited check
  would have been ink on red: 1.17:1, the palette's worst pairing.
- **It is decorative.** It sits inside the `aria-hidden` circle, and `aria-checked` on the
  button already carries the state for assistive tech. The mark is redundancy for sighted
  users, not the accessible name.
- The number stays. The check is a badge on the circle, not a replacement for the rating.

## Answer cards go red on hover and keyboard focus — 2026-09-25

Marie-Elizabeth's call: hovering or keyboard-focusing an answer card gives it the full
selected look — red fill, white label, white number circle — and the selected state stays
red. The `paper-2` → `paper-3` hover step from earlier the same day is gone; the neutrals
still carry the card's resting state.

**Hover and selected are now deliberately indistinguishable, and that has one real
consequence.** Come back to a statement you have already answered — via Back, which SPEC
§4 allows — and hover a different option, and two cards are red at once. Nothing tells you
which one is your saved answer until you move the pointer away. This does not affect
touch, where there is no hover, and 390px is the primary target; on a mouse it is a
genuine ambiguity. Flagged, not worked around: she asked for red on hover knowing it
matches selected. **Resolved the same day** by the check mark above, which marks the saved
answer and leaves hover unmarked.

Implemented with the `hover:` and `focus-visible:` variants rather than React state, so
the keyboard case is genuinely keyboard-only and a mouse click does not leave a card looking
focused. Tailwind v4 gates `hover:` behind `@media (hover: hover)`, which also keeps the
state from sticking after a tap on touch. The class strings are written out in full in
`StatementCard.tsx`: Tailwind scans source text, so a class name assembled at runtime is
never generated.

### Correcting the focus ring, including one I got wrong yesterday

Making a card red on focus looked like it would hide the red focus ring, so the first
attempt gave those cards a white ring. **That was backwards.** `outline-offset: 3px` draws
the ring *outside* the element's border box, so it never touches the element's fill — it
lands on the page. On a white page a white ring is 1:1 and vanished completely; it was
verified as "white" by reading `outlineColor` off the DOM, which said nothing about
whether anyone could see it. Screenshotting it is what caught it.

The same mistake is in the change made the day before: **the `.on-aubergine` sea focus
ring was wrong and is now removed too.** Red on aubergine is 1.17:1, which is why the
Begin *button* had to change — that part stands, a filled button really does sit on the
aubergine. But the ring around the title card does not; it is drawn on the white header
area behind it, where sea is 1.58:1 and fails SC 1.4.11's 3:1, while the red it replaced
was 13.38:1. That override made the ring worse and shipped.

Both overrides are gone. There is one ring for the whole app, red, and `globals.css` now
says why a per-surface override is the wrong instinct. CLAUDE.md and SPEC §7.1 are
corrected to match.

## White page, and the knock-on effects — 2026-09-25

The page moves from cream `#faf8f5` to pure white `#ffffff` to match
marieelizabethmali.com, `sea-soft` becomes the website's `#ddebee`, and the Begin button
on the aubergine title cards becomes sea glass. `<meta name="theme-color">` follows the
page to `#ffffff`. SPEC §7.1 and CLAUDE.md now carry the recomputed numbers.

Three things fell out of it that were not in the brief:

**Red on aubergine is 1.17:1 — and that also breaks the focus ring.** The Begin button was
the visible symptom; `:focus-visible` is red too, so keyboard focus was equally invisible
anywhere on an aubergine card. Fixing only the button would have left the accessibility
half of the same bug in place. There is now an `.on-aubergine` class that swaps the ring
to sea (9.88:1), and the section title card uses it. Any future dark surface needs the
same treatment.

**An unselected answer card can no longer be white.** It was `bg-white` on a cream page —
on a white page that is no card at all, just a border. Unselected cards are now `paper-2`
at rest (1.09:1 against the page) stepping to `paper-3` on hover (1.10:1 against rest),
which is why those two neutrals were retuned rather than simply lightened: they now carry
figure/ground that the cream page used to provide for free. The selected state is
unchanged — red with white text.

**The meter's zone edges had to be drawn.** This is the one that would have shipped
silently. On white, `paper-3` against the new `sea-soft` is **1.02:1**. A warm neutral and
a cool tint at the same lightness cannot be separated by luminance, and colour-vision
deficiency makes it worse, so the Low and Medium zones read as one continuous band. No
choice of neutral fixes it — every candidate lands within 1.02–1.04 — because the
separation is hue, not lightness. So the track is outlined in `line` and its boundaries
are `mute` hairlines. `line` was the obvious first choice for the hairlines and is wrong:
it is 1.07:1 against `sea` and vanishes at the second edge. `mute` is 2.86–3.77:1 against
all three fills, and drawing a rule is one of the uses `mute` is still allowed.

The `/test` progress track moved from `paper-3` to `line` for the same reason: at 1.20:1 a
1px rule is near-invisible on white, and it is fully empty on statement 1.

**`mute` now passes AA on the page, and the rule stays absolute anyway.** On white, `mute`
is 4.52:1, which technically clears AA for body text; on cream it was 4.26:1 and failed.
It still fails on every tinted surface in the app (`paper-2` 4.15, `paper-3` 3.77,
`sea-soft` 3.70, `sea` 2.86). "Usable on the page, unusable on every card and panel" is a
rule nobody applies correctly, so CLAUDE.md keeps "never use `mute` for text" and now
states the real reason rather than the old, and now inaccurate, claim that it fails
everywhere.

**One pairing is newly worth knowing:** `ink-3` on `sea` is 4.42:1 — just under AA for
body text, large text only. Nothing uses it today (the terrain label is `ink-3` on
`sea-soft`, 5.72:1), but it is in the CLAUDE.md table as a trap.

**`paper` and `white` are now the same value.** Both tokens stay: `white` is the ink colour
on red fills, `paper` is the page. They are semantically distinct and will not always be
equal.

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
