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

## The privacy policy ships, and two things it made untrue are gone — 2026-09-26

`/privacy` now renders the real policy, verbatim from `docs/privacy-policy.md`, dated
September 26, 2026.

**The policy is held as data** (`src/config/privacy.ts`) in taboo-quiz's shape — sections
with paragraphs, leads and bullets — so the wording survives without JSX entity escaping,
and every occurrence of the contact address becomes a `mailto:` link automatically.

**`tests/privacy.test.ts` pins the page to the markdown.** It reconstructs the whole
document from the data structure and compares it to `docs/privacy-policy.md` word for
word, plus the heading order and the date. A legal document that quietly drifts from the
file it was written in is the specific failure worth preventing here; editing one without
the other now fails the build.

It lives beside `copy.ts` rather than inside it, which bends SPEC §0.4's "copy lives in
one file". The justification: this is a standalone legal document whose source of truth is
outside the app, pinned by a test — not part of the test's own copy, and not scattered
into a component either.

### Two claims in the policy were not yet true

The Cookies section says the test uses **one** cookie. Checking that before publishing
turned up `sessionStorage["tbt_attempt"]`, written on every respondent's browser by the
tracking helper — **and never read**: `/api/events` takes the attempt from the signed
cookie and its schema does not even accept a client-sent id. So it was storage on
someone's device that bought nothing and made the sentence false. Removed, along with
`getAttemptId`/`setAttemptId` and the `attemptId` field on the queued event.

The `tbt_admin` cookie stays and is out of scope for a respondent-facing policy, by
Marie-Elizabeth's decision: it is only ever set at `/admin/login` and never touches a
respondent's browser.

### `Scored.lowestStatementIndex` removed

Nothing consumed it once the `taboo_*_lowest_statement` payload fields went. SPEC §6 is
updated to match rather than left describing an invariant the code no longer keeps, with a
note saying why it went — the Medium Sex and Medium Cash copy asks the reader to identify
their own lowest-rated statement rather than being told it.

### I committed a file I should not have

Marie-Elizabeth's stray copy of the policy at the repo root was swept into the previous
commit by `git add -A`, and pushed. It is removed now, and it was byte-identical to
`docs/privacy-policy.md`, so nothing was lost or contradicted — but it is in the git
history and cannot be taken out of it without a force-push. The content is a
public-facing policy, so there is nothing sensitive in it. Stage explicit paths.

## GoHighLevel gets less: four tags, 23 fields — 2026-09-26

Marie-Elizabeth's call. Removed from the payload: the per-section level tags, the terrain
tags, `taboo_terrain`, `taboo_answers` and the three `taboo_*_lowest_statement` fields.
What remains is what the emails actually merge in — scores, levels, START HERE, the
terrain sentence, the change line, the previous scores and the result URL. 23 fields.

**Levels and terrain are fields, not segments.** Tagging them duplicated payload data as
GoHighLevel state that then had to be kept in step on every retake — two representations
of one fact, and the tag copy is the one that goes stale. `taboo_terrain` went for the
same reason: `taboo_terrain_line` is a complete sentence that already names the sections,
so the bare name had nothing left to do.

**The raw answer string no longer leaves Railway.** That is the change with the widest
reach: SPEC §12 previously had the privacy page say answers "are stored and sent to
GoHighLevel", and that is now wrong. §12 is updated to separate the two — stored in
Postgres, *not* shared with GHL. Whoever writes the policy needs that distinction.

`taboo_*_lowest_statement` went because the Medium Sex and Medium Cash copy asks the
reader to identify their own lowest-rated statement; being told it was never what the copy
does.

**Retired tags are stripped, not just stopped.** A contact carrying `taboo-test-sex-high`
from an earlier submission has it removed on their next one, so our record does not keep
tags we no longer emit. That only cleans up *our* side — tags already applied inside
GoHighLevel stay until removed there by hand, which GHL_SETUP.md now says in a callout.

**`PAYLOAD_FIELDS.length` is pinned at 23 in a test.** The field list is what Marie-Elizabeth
builds custom fields from; drift between the payload and that list is silent, and shows up
as an empty merge field in someone's email. Adding or trimming a field now has to be a
deliberate edit in two places.

Two pieces of code survive with no consumer: `Scored.lowestStatementIndex` and the
Medium-copy behaviour it supported. It stays because SPEC §6 specifies it as an invariant
and it is tested — removing it would need a §6 edit that was not asked for. Flagged rather
than deleted.

### GHL_SETUP.md: no tag branching, and a launch rule

The If/Else fallbacks on `_level` and terrain are gone — with four fixed tags there is
nothing to branch on. The field table is regenerated from `PAYLOAD_FIELDS`.

**"Launching The Provocations"** is new: test takers hear about a launch through Substack,
so the GHL send goes to contacts *without* `substack-subscriber`, excluding `substack-paid`.
Written down alongside it is why there is no terrain-based launch email — segmenting a
launch by how uptight someone scored about sex, death or money would turn a private
self-assessment into a marketing signal. Also flagged: the exclusion is only as current as
the last monthly import, so run it immediately before a launch send.

## The retake change line is final — 2026-09-26

*"Your results from your last test on {Month D} were: Sex {n}, Death {n}, Cash {n}."*
Email only, as SPEC §2 requires — past scores never appear on the results page, because
anyone can type any address into `/send`.

Same pattern as the terrain lines: the template stays a plain string in `copy.ts` so
`tests/copy.test.ts` can check it against SPEC.md word for word, and `changeLine()` in
`webhook-payload.ts` fills it. A template function would slip past that check.

**It reports last time's scores only, not a delta.** The email already carries the current
scores above it, so the arrow form sketched in the old §8.1 example
("Sex 12 → 17") would have repeated them.

**The date is formatted in UTC**, the same clock `submitted_at` is stored against, so the
date in the sentence always agrees with the date in the payload beside it. We do not know
the respondent's timezone, so a submission late in the evening in a western zone can read
as the following day. The alternative — guessing a zone — would produce a sentence that
contradicts our own record of when they took it, which is worse in a keepsake email.

**The year appears only across a year boundary**: "June 3" within the same year,
"December 31, 2025" otherwise. Tested at the boundary, including exactly one year apart to
the day, which is a different year and does take the year.

**One `[COPY TBD]` remains in `copy.ts`: `SEND.dataConsentLabel`.** It is the required
data-processing consent line, which only renders when `REQUIRE_DATA_CONSENT` is on — and
that stays off until whoever advises on the privacy policy says whether it is needed
(SPEC §12). So it is correctly unwritten rather than overlooked. The unused `COPY_TBD`
constant was removed at the same time; nothing referenced it.

Also still outstanding, outside `copy.ts`: the privacy policy itself, which is a stub.

## Sex statement 5 is final, replaced in place while still `v1` — 2026-09-26

*"I make my own pleasure a priority, without a trace of guilt."* Scored normally, not
reversed: agreeing means more freedom, like every other un-reversed statement, so a 5
raises the Sex score. Verified rather than assumed — rating it 1 gives Sex 13, rating it 5
gives 17.

It replaces the JotForm line SPEC §14.1 asked to be rid of, and it fixes what was wrong
with that line: it asks about the relationship with desire rather than about the news, it
asks one thing, and it does not route a survivor to Low copy about "shame and silence".
Still exactly one statement, because the 5–25 level ranges assume five per section.

**Editing locked content in place is normally forbidden**, and this is a deliberate,
authorised exception rather than a loosening of the rule. Marie-Elizabeth's call: no real
respondent has taken the test, and the database is wiped before launch (SPEC §15.5).

Worth being precise about what the risk actually was, because the rule's usual
justification does not apply here. `Attempt.answers` is positional, and what changed was
**only the wording** — not the order, not the section, not the reversal flag. So no stored
score is altered by this edit; every existing row still scores exactly as it did. What
changes is what position 5 *means*, which makes the attempts already in the database
semantically stale rather than numerically wrong. They are test and seed rows, and the
launch wipe removes them.

**The exception closes the moment a real respondent exists.** SPEC §5.2 and CLAUDE.md both
say so at the point where someone would be tempted to repeat it.

With this, **no statement carries a placeholder any more** — a test now asserts that
across all fifteen, so the `[COPY TBD]` check cannot quietly regress on a future edit.

## `/send` is first name and email only — 2026-09-26

Final copy for the step, and the optional mailing-list checkbox is gone. Takers are
already Substack subscribers; the results email and the quarterly retake are the service
they asked for by submitting, so there was no second list to opt into. The fine print now
says exactly that — *"sends your next steps by email, and the test again next quarter"* —
which is a factual description of what submitting triggers, and needs revisiting if that
stops being true.

**`REQUIRE_DATA_CONSENT` is untouched.** That checkbox is a different thing: consent to
*process* special-category data under the GDPR (SPEC §12), not consent to be marketed at.
It stays built and off by default.

**`Contact.consentAt` / `consentSource` are kept but no longer written.** Dropping columns
is irreversible and they record a real thing that a few historical rows may hold; the
schema now marks them LEGACY. What *did* change is the admin: the contacts list no longer
has a "Mailing list" column and the contact page no longer says "not on the mailing list",
because with nothing writing those fields, every row would read "no" and imply a list
state to manage that does not exist. The seed stopped writing them too, so seeded data
matches reality.

**`marketing_consent` is out of the GoHighLevel payload.** There is no box, so sending
`false` for everyone would be a field GHL could branch on that means nothing. List state
is carried by the `substack-subscriber` tag instead.

### Two tags that do work, not just label

Every submission now also tags `substack-subscriber` and `source-taboo-test`.

**`substack-subscriber` is load-bearing.** A GoHighLevel workflow removes the contact from
the Taboo Tango nurture sequence when it appears, so someone who came from the Substack
list is not courted as a new lead. The monthly Substack CSV import applies the same tag,
which is the point: the tag means "already on the list", whichever way we learned it.

That makes it dangerous to strip. `computeSubmission()` rebuilds level and terrain tags on
every submission, and a test now pins that it does **not** remove `substack-subscriber`
while doing so — dropping it on a retake would re-enrol someone in a sequence they had
already left. Both new tags are also added idempotently, so a retake does not duplicate
them.

### GHL_SETUP.md gained three workflows

Written up in the detail Marie-Elizabeth will need at the console, with the failure modes
called out rather than left to be discovered:

- **Leave Tango nurture** on `substack-subscriber`. Flagged: a sequence mid-send may still
  deliver a queued email after the contact is removed.
- **Quarterly retake**, 90 days after `taboo-test-completed`, using the stored
  `taboo_*_score` fields as "last time" scores. Flagged twice: those fields are overwritten
  by each submission, so the email must read as "your last result" rather than "your first";
  and the workflow needs re-enrolment enabled or a second retake never fires.
- **Monthly Substack CSV import** tagging `substack-subscriber` and `substack-paid`, with
  an If/Else that skips the upgrade block for paying subscribers. Flagged: GHL's import can
  be set to replace rather than add tags, which would strip `taboo-test-*` from everyone
  who has taken the test; and anyone who upgraded since the last import is still untagged
  and will be asked to upgrade again.

SPEC §4, §7.4, §8.1, §8.3, §9 and Appendix A updated to match.

## Landing page copy is final — 2026-09-26

Both `[COPY TBD]` slots on the landing page are filled, and the landing page no longer
renders a placeholder at all.

**"Nobody sees this but you" is removed, not reworded.** SPEC §14.2 flagged it as untrue
once answers are stored and sent to GoHighLevel, and the resolution is deletion: the intro
now ends at "Be honest." Nothing replaces it, so the page makes no privacy claim it cannot
keep. What it does say about storage lives on `/privacy`, where it belongs.

**The expectation line is softened rather than sourced:** "You may score lower than you
expect in at least one section" claims nothing about other people, where "Most people
score lower than they expect" was an empirical claim with nothing behind it. That is one
of the five unverified claims in SPEC §14.3 closed off; four remain, all of them inside
the results copy.

`introTbd` is gone from `copy.ts` rather than left as an empty string, and the landing
page no longer imports `Tbd` — the component is still used by `/send` and `/privacy`.

**SPEC §14 items 2 and 3 are marked resolved**, which is an edit Marie-Elizabeth did not
ask for. Leaving §14.2 saying the line "needs new wording" after the line has been deleted
would be a stale open item that reads as outstanding work.

## Final terrain lines, and the retake link is gone — 2026-09-25

Marie-Elizabeth's copy for all three terrain variants, and a product decision: retakes
come from her quarterly email, so the results page no longer offers "Take it again".

**`{Section}` placeholders are filled at render**, in Sex → Death → Cash order. The
templates stay in `copy.ts` as plain strings rather than becoming template functions, so
`tests/copy.test.ts` can still check them against SPEC.md word for word — a function body
would slip past that check silently. `terrainLine()` fills them; `tests/terrain.test.ts`
covers every terrain the scorer can produce and asserts no output ever contains a
surviving `{`.

**Ordering is enforced, not assumed.** `score()` happens to build `terrain` by filtering
`SECTIONS`, so it is already in Sex → Death → Cash order — but the two-tied line reads
wrong if that ever changes, so `terrain.ts` re-orders explicitly and a test passes
`["cash", "sex"]` to prove it comes back as "Sex and Cash".

### Removing the link forced a flow change

**Begin on `/` now starts a fresh attempt when the current one is already submitted.**
It used to redirect to the old results page, which was fine *because* the results page
carried a link that cleared the cookie. Remove that link and the 7-day attempt cookie
becomes a trap: anyone wanting to retake inside a week would be bounced to their old
results from every entry point, with nothing to click. The quarterly cadence means this
would rarely bite — which is exactly why it would have been missed. Their old attempt and
its results URL are untouched.

SPEC §4.1 and §4.5 are updated to match, since the old §4.5 described the link as the
mechanism for clearing the cookie.

**`tbt_retake_clicked` is removed** from `tracking.ts`, the `/api/events` whitelist and
SPEC §10. It measured the link that no longer exists; leaving it in the spec would
describe an event that can never fire. A retake now arrives as an ordinary
`tbt_landing_viewed` carrying the quarterly email's UTM parameters. **This is a §10 edit
Marie-Elizabeth did not ask for** — flagged rather than done quietly.

Still `[COPY TBD]` after this: the landing intro replacement and the "most people score
lower" line, the whole `/send` step except its heading, the retake change line, and Sex
statement 5.

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
