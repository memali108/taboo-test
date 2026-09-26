# The Taboo Test: Build Spec

**Owner:** Marie-Elizabeth Mali · **Spec version:** 1.0 (2026-09-25)
**Build with:** Claude Code in a terminal → GitHub (`memali108/taboo-test`) → Railway
**Reference implementation:** `~/Development/taboo-quiz` (The Taboo Tango Quiz, live at quiz.marieelizabethmali.com)

---

## 0. How to use this spec (for Claude Code)

1. Before writing any code, read these files in the reference repo, `~/Development/taboo-quiz`:
   `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/DECISIONS.md`, `src/app/globals.css`, `src/app/layout.tsx`, `src/lib/*`, `src/app/(quiz)/unlock/*`, `src/components/quiz/QuestionCard.tsx`, `Dockerfile`, `scripts/start.sh`, `railway.json`.
   The Taboo Test follows that app's stack, conventions, design tokens and safeguards unless this spec says otherwise. **Copy** the modules you need into the new repo. **Do not import them, and do not modify anything in `taboo-quiz`.**
2. This is Next.js 16. Read the relevant guide in `node_modules/next/dist/docs/` before writing routing, proxy or server-action code (`middleware.ts` is now `proxy.ts`).
3. Build in the phases in §15. Stop at the end of each phase and give Marie-Elizabeth the Railway URL so she can review before you continue.
4. **Never write, rewrite or "improve" user-facing copy.** Use the copy in Appendix A exactly as written. Anywhere marked `[COPY TBD]`, render the bracketed placeholder text as-is so it's visible in review. Copy lives in `src/config/copy.ts` and nowhere else.
5. Create a `CLAUDE.md` for the new repo recording the invariants in §6 and §8. Also create `docs/DECISIONS.md`, and log every choice you make where this spec leaves room.
6. Workflow (same as taboo-quiz): work on `main`, `git pull` before each task, then `npm run check`, commit and `git push` after each task. Never end a session with unpushed work.

---

## 1. What we're building

The Taboo Test is a 15-statement self-assessment with three sections of five: **Sex, Death, Cash**. Respondents rate each statement 1–5. Each section totals 5–25 and lands in **Low, Medium or High**. The section with the lowest score is their **most interesting terrain**.

It replaces the JotForm at `form.jotform.com/marieelizabethmali/the-taboo-test` and the planned PDF. Each person sees only their own three results on a private results page. GoHighLevel sends a personalized results email.

**Who takes it:** Substack subscribers only, clicking one shared link. The link goes out in the Substack welcome email and in a post to existing subscribers. It is not promoted publicly. The link can't be personalized, so the app asks for first name and email once, after the last question, under the heading **"Where should I send your results?"** The results show right after that step. They are not locked away. The spam safeguards in §3 stay in place anyway, because a shared link can travel.

**Retakes:** Marie-Elizabeth will send the test again every quarter. Every attempt is stored. When someone retakes with the same email, the results email shows how their scores moved.

---

## 2. Decisions already made (and why)

| Decision | Why |
|---|---|
| New repo `taboo-test` and its own Railway service + Postgres. Patterns copied from taboo-quiz. | taboo-quiz is live, tuned, and assumes 5 archetypes throughout. A separate app keeps it safe. |
| **One scale on every statement** (1 = Never … 5 = Always). Reversed statements are flipped in scoring, never in the UI. | On the JotForm, reversed items flipped the scale and warned people to "pay attention." That pushes the math onto the respondent and invites mistakes. |
| Email is asked **after** the last statement, first name + email only (not full name). | People are most invested at the end. Matches Tango. No personalized link is possible from Substack. |
| Results show immediately after the email step on a private, unguessable URL. | They're subscribers, not leads, so there's no "unlock" language. The URL goes in the email so they can come back to it. |
| **The page gives scores and meaning. The email gives the practices and the invitation.** | The page is read once, in the moment. The email is the keepsake they return to, and it gives them a reason to open it (same logic as Tango's "email heading your way"). |
| **The app sends each person's copy to GHL in custom fields.** One GHL email template merges them in. | 27 result combinations (3 sections × 3 levels) are unmanageable as GHL branches. This deliberately reverses the Tango decision to move copy into GHL, which works for 5 types but not 27. Copy stays versioned in one file. |
| Score comparisons from past attempts appear **only in the email**, never on the page. | Anyone can type any email into the form. Showing past scores on the page would expose someone else's results. The email only reaches the address's owner. |
| No share buttons, no OG result cards. The results page is `noindex`. | These are personal answers about sex, death and money. |
| No GA4 / Meta Pixel. | Same privacy stance as taboo-quiz. |

---

## 3. Stack

Identical to taboo-quiz, minus pgvector and recharts unless a need arises:
Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 6.x (pinned to 6, **not** the 8 RC) · Postgres 16 · Zod · Vitest · Playwright (390px) · Dockerfile build on Railway with the `standalone` output and `scripts/start.sh` (migrate → optional seed → `node server.js`).

**Copy from taboo-quiz and adapt** (rename cookies from `tt_` to `tbt_`):
- `src/lib/crypto.ts`, `session.ts`: HMAC-signed cookies
- `src/lib/ratelimit.ts` + `RateLimit` model
- `src/lib/email-domain.ts`: MX check, fails open
- `isValidEmail` / `normalizeEmail` from `src/lib/contact.ts`, with their tests
- `src/lib/request.ts`: ipHash, device, country, UTM capture
- `src/lib/site.ts`: `siteUrl()`. Use `||`, not `??`, for the fallback (see Tango DECISIONS "Domain move").
- `src/lib/settings.ts` + `Setting` model: webhook URL editable in admin
- Webhook sender + `DeliveryLog` + the Health alert pattern
- `src/proxy.ts` admin auth, `/admin/login`, and the admin shell/nav/ui components
- The unlock form's safeguards: honeypot, 2-second minimum time, rate limit, MX check, echoing values back on failure
- `Dockerfile` (including the `ARG NEXT_PUBLIC_SITE_URL` fix), `scripts/start.sh`, `railway.json`, healthcheck route
- `Wordmark.tsx` + `public/logo.png`, the privacy page as a starting structure, and the footer

---

## 4. Routes and flow

```
/            Landing: title, intro, Start
/test        15 statements, one per screen; a title card opens each section
/send        First name + email → submit
/r/[id]      Private results page (id = 24-char random, unguessable)
/privacy     Privacy policy (see §12)
/admin/*     Password-protected dashboard (see §11)
/api/answer  Records one answer (signed attempt cookie)
/api/events  Batched tracking events
/api/health  Railway healthcheck
```

**Flow:**
1. `/`: Begin creates an `Attempt` and sets the signed `tbt_attempt` cookie (7 days). An unfinished attempt resumes; a **submitted** one starts a fresh attempt, because the cookie outlives a submission and there is no longer a link on the results page to clear it.
2. `/test`: 3 section title cards + 15 statement screens = 18 screens. A progress bar counts statements only ("4 of 15"). Tapping an answer auto-advances after ~260ms, like Tango. Back is allowed. Answering statement *n* again overwrites it. Leaving and returning resumes where they were (cookie).
3. After statement 15, the attempt is `completed` and they go to `/send`.
4. `/send` submit → validate → score → upsert Contact → save → **fire the GHL webhook (never blocks, never throws)** → redirect to `/r/{publicId}`.
   - The webhook sends in the background of the request, and a failure is logged. The person still sees their results either way.
5. `/r/[id]` renders from the database. Visiting `/test` or `/send` with a submitted attempt redirects to its results page. **There is no "Take it again" link** — retakes come from the quarterly email, which links back to `/`.

---

## 5. Content: the test

### 5.1 Scale (identical on every statement, shown on every card)

| Value | Label |
|---|---|
| 1 | Never |
| 2 | Rarely |
| 3 | Sometimes |
| 4 | Often |
| 5 | Always |

Render as five full-width answer cards, stacked, using Tango's `QuestionCard` styling with the number in the circle where Tango shows a letter. Keyboard 1–5 selects. `role="radiogroup"`.

### 5.2 Statements: locked content, version `v1`

`R` = reversed (scored as `6 − rating`). Order, wording and reversal flags are locked per `TEST_VERSION`. Changing any of them means bumping the version, never editing in place (same rule as Tango's `QUIZ_VERSION`).

*Sex statement 5 was replaced in place on 2026-09-26 while still `v1`, by Marie-Elizabeth's decision: no real respondent has taken the test, and the database is wiped before launch (§15.5). Position, order and reversal flags did not change, so no stored score is altered — only what position 5 means. This is the one authorised exception; once a real respondent exists, bump the version.*

**SEX**
1. I feel sexy AF.
2. I have regrets about my sexual history. **R**
3. I'm fully comfortable expressing my sexual desires.
4. I completely embrace how my body is changing with age.
5. I make my own pleasure a priority, without a trace of guilt.

**DEATH**
6. I could die today and feel complete.
7. Knowing I will die one day inspires me to live full-out in each moment.
8. I allow myself to fully grieve.
9. I'm terrified of feeling pain, getting sick, and dying in agony. **R**
10. I have my affairs in order, so my loved ones know where to find what they need if I suddenly die.

**CASH**
11. I am fully confident I have everything I need.
12. I'm up at night worrying about money. **R**
13. I'm secretly jealous of folks who have more money than I do. **R**
14. I'm totally on top of my finances, accounting, and even taxes.
15. I feel guilty and unworthy when I indulge myself. **R**

### 5.3 Section title cards

A full-screen card on red (`#62081b`) before each section: section name in Bebas Neue in white, subtitle beneath in sea glass. Subtitles come from the results doc: *Your relationship with desire.* / *Your relationship with impermanence.* / *Your relationship with enough.* A "Begin" button, or tap anywhere.

---

## 6. Scoring (invariants)

- Store the **raw** ratings as a 15-character string of digits 1–5 (`Attempt.answers`, e.g. `"431254322153414"`). Never store pre-reversed values.
- Item score = rating, or `6 − rating` if reversed. The reversal map lives in `src/config/test.ts` keyed by `TEST_VERSION`.
- Section total = sum of its 5 item scores → 5–25.
- Level: **Low 5–11 · Medium 12–18 · High 19–25.**
- **Terrain** = the section(s) with the lowest total.
  - If two tie for lowest, both are terrain.
  - If all three tie, there's no single terrain and the page uses the all-equal variant line (Appendix A).
  - Terrain is chosen by lowest score even when every section is High.
- **Lowest statement per section** = the statement with the lowest *item score* in that section. If several tie, use the first in order. Used by the Medium Sex and Medium Cash copy ("the one statement you rated lowest").
- Scoring runs on the server at `/send` submit and is saved on the Attempt. The same pure function is unit-tested. (Nothing here is secret, so no server-only guard like Tango's is needed. Still, never trust a client-computed score.)

**Tests (Vitest):**
- Brute-force all 3,125 answer patterns per section and assert every total is 5–25 with the correct level.
- Boundaries: 11/12 and 18/19.
- Reversal: all-5s gives Sex 21, Death 21, Cash 13. All-1s gives Sex 9, Death 9, Cash 17.
- Terrain ties (two-way and three-way).
- Lowest-statement tie-break.

---

## 7. Screens and design

### 7.1 Design tokens

Start from taboo-quiz `globals.css` (Bebas Neue display, Montserrat body, ink scale, status colors, animations, reduced-motion, safe-area helpers). Then **replace the blue family with Sea Glass**, and **replace the cream page with pure white** to match marieelizabethmali.com:

```css
/* Brand */
--color-red: #62081b;        /* Primary Red */
--color-red-deep: #4a0614;
--color-red-soft: #f6e9ec;
--color-aubergine: #2e1f2a;  /* Secondary Deep Aubergine (same value as --color-ink) */
/* Three sea tints from the website, stepping evenly: 1.22 / 1.58 / 2.03
   against the white page, 1.29 between neighbours. */
--color-sea-soft: #ddebee;   /* results section blocks, the meter's Low zone */
--color-sea: #b6d3d8;        /* Accent Sea Glass — the meter's Medium zone */
--color-sea-deep: #9abcc1;   /* the meter's High zone, and the Begin button hovered */
/* remove --color-blue, --color-blue-deep, --color-blue-soft, --color-accent */

/* Neutrals. The page is white, so the tints carry all the figure/ground. */
--color-paper: #ffffff;
--color-paper-2: #f7f5f1;    /* an unselected answer card, at rest */
--color-paper-3: #eeeae2;    /* that card hovered; the meter's Low zone */
--color-line: #d9d4cb;       /* every border and rule */
```
`:focus-visible` outline → `var(--color-red)`, everywhere, with `outline-offset: 3px`. The offset puts the ring outside the element's border box, so it is always drawn against the white page (13.38:1), never against the element's own fill — no per-surface override is needed or wanted, on aubergine or on the red answer cards.

`<meta name="theme-color">` → `#ffffff`.

**Sea Glass contrast rules (measured). Put these in CLAUDE.md:**

| Pairing | Ratio | Use |
|---|---|---|
| ink `#2e1f2a` on sea | 9.88 | ✅ text on sea panels |
| aubergine on sea | 9.88 | ✅ the Begin button's label |
| red on sea | 8.47 | ✅ |
| aubergine on sea-deep `#9abcc1` | 7.68 | ✅ the Begin button, hovered |
| sea on aubergine | 9.88 | ✅ sea text or marks on dark cards |
| ink on sea-soft | 12.78 | ✅ terrain panel body copy |
| ink-3 on sea-soft | 5.72 | ✅ the "most interesting terrain" label |
| ink-3 on sea | 4.42 | ⚠️ large text only |
| white on sea | 1.58 | ❌ never |
| sea on paper (white) | 1.58 | ❌ never as text, icons, or a meaningful mark on the page |
| **red on aubergine** | **1.17** | ❌ **never** — a red button on an aubergine card is a button-shaped hole |

Tango's rule carries over: **never use `mute` for text.** On the white page `mute` reaches 4.52 and technically clears AA for body text, but it fails on every tinted surface in the app (`paper-2` 4.15, `paper-3` 3.77, `sea-soft` 3.70, `sea` 2.86), so the rule stays absolute. `mute` keeps its non-text uses — it is what draws the meter's zone dividers.

**The meter's zone edges must be drawn, not implied.** `paper-3` against `sea-soft` is 1.02:1: a warm neutral and a cool tint at the same lightness cannot be separated by luminance, which is exactly what colour-vision deficiency makes worse. The track is outlined in `line` and its boundaries are `mute` hairlines. (`line` is wrong for the hairlines — 1.07:1 against `sea`.)

### 7.2 Landing `/`
Wordmark → display headline → intro → "15 statements · about 3 minutes" → red pill button → footer. Match the Tango landing layout.

### 7.3 Test `/test`
- Section title cards: red background, white headline (13.38:1), sea glass subtitle (8.47:1), sea glass "Begin" button with aubergine text (button against card 8.47:1, label on button 9.88:1). Nothing from the ink scale goes on this card — ink is 1.17:1 on red, ink-3 1.91, mute 2.96.
- Statement screens: paper background, statement in Bebas `clamp(1.75rem, 6vw, 3rem)`, five answer cards.
- Selected card = red with white text. Thin progress bar at top (red fill on `paper-3` track), with the section name as a small label.
- A Back control sits top-left.

### 7.4 Email step `/send`
Same form as Tango's `UnlockForm`, with the same safeguards — honeypot, 2-second minimum time, rate limit, MX check, values echoed back on failure. Copy from Appendix A; the button label comes from copy (not "Unlock").

**First name and email only. There is no mailing-list checkbox.** Takers are already Substack subscribers, and the results email plus the quarterly retake are the service they asked for by submitting — so there is no separate list to opt into. The only checkbox that can appear is the required data-processing one behind `REQUIRE_DATA_CONSENT` (§12), off by default.

### 7.5 Results `/r/[id]`

Top to bottom:
1. Wordmark, then the "HERE ARE YOUR TABOO TEST RESULTS" heading + intro paragraph.
2. **Summary strip:** three rows (Sex, Death, Cash). Each row has:
   - the section name
   - a score like `14 / 25`
   - a level label
   - a horizontal meter: track from 5 to 25 split into three zones, zone labels Low / Medium / High under it, and a red marker at the score.

   Zones are the three sea tints — Low `#ddebee` / Medium `#b6d3d8` / High `#9abcc1` — which step evenly (1.22 / 1.58 / 2.03 against the white page, 1.29 between neighbours). Hairline dividers mark where 11.5 and 18.5 fall. The marker is a bold red dot with a white ring, which clears 3:1 on every zone (10.95 / 8.47 / 6.58) so it never depends on the ring to be seen. The level is always written in text, so color never carries the meaning alone.
3. **Terrain line** naming their lowest section(s).
4. **Three section blocks** in fixed order (Sex, Death, Cash). Each has:
   - title and italic subtitle
   - the section description paragraph
   - their level as a subhead
   - that level's paragraph(s) only

   **All three blocks sit in a sea-soft (`#ddebee`) box with a red title** (10.95:1). The terrain one is additionally marked with a **2px red border** (10.95:1 against the fill, 13.38:1 against the page) and its small "Your most interesting terrain" label (ink-3 on sea-soft, 5.72:1). The other two carry a transparent border of the same width so every box is the same size. Do **not** show the other levels' copy.
5. **Closing:** the loop line pointing to the email — the page's call to action, set larger and heavier than body copy — then the deliverability note (reuse Tango's `DELIVERABILITY_NOTE`) beneath it at body size. Nothing after that: no retake link.

No first name, email, or past scores on this page. `robots: noindex, nofollow`. `Referrer-Policy: no-referrer`.

---

## 8. GoHighLevel integration

### 8.1 Webhook payload (flat JSON, POST on every `/send` submit)

The prefix is `taboo_`, deliberately different from Tango's `tt_` so the GHL custom fields never collide.

| Field | Example | Notes |
|---|---|---|
| `first_name`, `email` | | normalized email |
| `submitted_at` | ISO 8601 | |
| `source` | `"taboo-test"` | |
| `taboo_test_version` | `"v1"` | |
| `taboo_sex_score` / `taboo_death_score` / `taboo_cash_score` | `14` | 5–25 |
| `taboo_sex_level` / `…_death_level` / `…_cash_level` | `"Medium"` | |
| `taboo_sex_start_here` / `…death…` / `…cash…` | text | that level's START HERE paragraph (Appendix A) |
| `taboo_terrain_line` | text | full sentence from copy, naming the section(s) and handling every tie case, so GHL needs no logic |
| `taboo_result_url` | absolute URL | `/r/{id}?utm_source=email&utm_medium=results` |
| `taboo_attempt_number` | `2` | per email |
| `taboo_prev_taken_at` | ISO or empty | |
| `taboo_prev_sex_score` / `…death…` / `…cash…` | `12` or empty | |
| `taboo_change_line` | text or empty | pre-written sentence: "Your results from your last test on {Month D} were: Sex {n}, Death {n}, Cash {n}." — e.g. "Your results from your last test on June 3 were: Sex 12, Death 15, Cash 9." Empty on a first attempt, so the email shows nothing. |
| `taboo_tags` | comma-separated | `taboo-test-completed, substack-subscriber, source-taboo-test` (+ `taboo-test-retaken` on retakes) |

**Four tags, and no more.** There are no per-section level tags and no terrain tags: the emails read `taboo_*_level` and `taboo_terrain_line` directly, so tagging the same thing would duplicate payload data as GoHighLevel state that then has to be kept in step. Levels and terrain are fields, not segments.

`substack-subscriber` and `source-taboo-test` are applied to everyone who submits. `substack-subscriber` is load-bearing: a GoHighLevel workflow removes the contact from the Taboo Tango nurture sequence when it appears, so a subscriber is not courted as a new lead. The monthly Substack CSV import applies the same tag (§8.3).

**The raw answer string never leaves Railway.** GoHighLevel receives scores, levels and the copy the email needs — not the 15 ratings themselves.

**Rule:** every copy field sent to GHL must be a **single paragraph of plain text** (no HTML, no line breaks), so it renders cleanly as a GHL merge field. The START HERE blocks already are.

### 8.2 Delivery rules (copied from Tango)
- Webhook URL comes from admin Settings, falling back to `GHL_WEBHOOK_URL`.
- Timeout 8s, one retry after 2s. Log every outcome to `DeliveryLog`. Never throw into the request.
- `/admin/health` leads with an alert if any webhook failed in the last 7 days, or if no URL is set.
- Admin Settings has "Send test payload" with a realistic fake result.
- A failed delivery gets a "Resend" button on the contact's detail page, so one person can be fixed by hand.

### 8.3 GHL setup (Marie-Elizabeth does this in GHL, not Claude Code)
Claude Code: generate this as `docs/GHL_SETUP.md` with the full field list.

1. Create custom fields for each `taboo_*` field. Use Multi-line text for the `_start_here`, `_statement`, and `_line` fields.
2. Workflow **"Taboo Test – Results"**, trigger = Inbound Webhook. Paste the URL into the app's Admin → Settings and click "Send test payload" so GHL can map the fields.
3. Action: Create/Update Contact (match by email), mapping all fields.
4. Tags: add tags from `taboo_tags` — four of them, all fixed strings, so no branching is needed.
5. Action: Send Email, using the "Taboo Test Results" template (§8.4).
6. **"Substack subscriber – leave Tango nurture"**: trigger on the `substack-subscriber` tag being added, remove the contact from the Taboo Tango nurture sequence. Someone taking this test came from the Substack list and is not a cold lead.
7. **"Taboo Test – Quarterly retake"**: wait 90 days after the `taboo-test-completed` tag is added, then send the retake email with the test link, using the stored `taboo_*_score` fields as their "last time" scores. Skip this if you'll send retakes from Substack instead.
8. **Monthly Substack CSV import**, matching on email: tag `substack-subscriber`, and tag paying subscribers `substack-paid`. An If/Else on `substack-paid` in the results workflow skips the EXPAND YOUR LIBERATION upgrade block for people who already pay.
9. **Launching The Provocations:** test takers hear about it through Substack, so the GoHighLevel send goes only to contacts *without* `substack-subscriber`, excluding anyone tagged `substack-paid`. There is no per-section or per-terrain launch email — a private self-assessment is not a marketing segment.
10. **Before launch:** take the test yourself on the live site and check the email end to end, including on a phone.

### 8.4 Results email structure (all wording `[COPY TBD]`, refined with Marie-Elizabeth)
Subject → greeting with `{{first_name}}` → one-line opener → three score lines (`Sex {{taboo_sex_score}}/25 · {{taboo_sex_level}}` …) → `{{taboo_change_line}}` → `{{taboo_terrain_line}}` → **START HERE** × 3 (section name + `{{…_start_here}}`) → "See your full results" button (`{{taboo_result_url}}`) → EXPAND YOUR LIBERATION block with the Substack upgrade link (static) → retake note ("I'll send you The Taboo Test again next quarter") → sign-off.

---

## 9. Data model (Prisma)

```prisma
enum AttemptStatus { started completed submitted }
enum Level { low medium high }

model Contact {
  id              String    @id @default(cuid())
  email           String    @unique
  firstName       String
  consentAt       DateTime? // LEGACY — no mailing-list box exists; nothing writes these
  consentSource   String?
  attemptCount    Int       @default(0)
  lastSubmittedAt DateTime?
  tags            String[]  @default([])
  isSeed          Boolean   @default(false)  // created by a test run; see §13 E2E_TOKEN
  attempts        Attempt[]
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Attempt {
  id            String        @id @default(cuid())
  publicId      String        @unique            // 24-char random, used in /r/[id]
  contactId     String?
  contact       Contact?      @relation(fields: [contactId], references: [id], onDelete: SetNull)
  status        AttemptStatus @default(started)
  answers       String        @default("")      // raw 1–5 digits, up to 15
  testVersion   String
  attemptNumber Int?
  sexScore      Int?
  deathScore    Int?
  cashScore     Int?
  sexLevel      Level?
  deathLevel    Level?
  cashLevel     Level?
  terrain       String[]      @default([])      // ["cash"] or ["sex","cash"] or []
  startedAt     DateTime      @default(now())
  completedAt   DateTime?
  submittedAt   DateTime?
  resultViewedAt DateTime?
  utmSource String? utmMedium String? utmCampaign String? utmContent String?
  referrer String? device String? country String? ipHash String?
  isSeed        Boolean       @default(false)
  events        Event[]
  @@index([startedAt]) @@index([status]) @@index([contactId])
}
```
Plus `Event`, `RateLimit`, `DeliveryLog` and `Setting`, as in Tango. The seed creates ~300 fake submitted attempts flagged `isSeed`. Production sets `SEED=false`.

---

## 10. Tracking (first-party only, `Event` table)
`tbt_landing_viewed`, `tbt_started`, `tbt_answered` (index, value, elapsed_ms), `tbt_section_completed`, `tbt_completed`, `tbt_send_viewed`, `tbt_submitted`, `tbt_result_viewed` (with `source=submit|email`).

*(`tbt_retake_clicked` is gone with the retake link it measured. A retake now arrives as an ordinary `tbt_landing_viewed` from the quarterly email's UTM parameters.)*

---

## 11. Admin (lean v1, reuse the Tango admin shell)
- **Overview:** started → completed → submitted funnel, completion rate, median time to complete, date range picker.
- **Levels:** Low/Medium/High distribution per section, and how often each section is the terrain. This is the data that could eventually back a claim like "most people score lower than they expect in…".
- **Statements:** mean item score per statement (after reversal), lowest first. This shows which statements hit hardest, which is useful for writing.
- **Contacts:** list, detail with every attempt and the score history, webhook resend, CSV export.
- **Retakes:** people with 2+ attempts and their average movement per section.
- **Settings:** webhook URL, test send, payload field list. **Health:** delivery alerts, config warnings.
- Every chart gets a table with the numbers, as in Tango.

---

## 12. Privacy and legal (flags for Marie-Elizabeth, not legal advice)
- Answers about someone's sex life are "special category" data under the GDPR (EU/UK). With EU/UK subscribers, that category may need explicit consent to process. **Check with whoever advises on your privacy policy** whether the `/send` step needs a required plain-language consent line (e.g. "I agree to Marie-Elizabeth storing my answers to send my results"). Claude Code: build the checkbox behind a config flag (`REQUIRE_DATA_CONSENT`), off by default, so it can be switched on without a rebuild.
- The privacy page must say plainly what is stored and what is shared, and the two are no longer the same thing. **Answers and scores are stored** in Postgres on Railway. **GoHighLevel receives scores, levels and the copy for the email — not the raw answers.** Both are kept until the person asks for deletion. There are no third-party cookies.
- Admin gets a "Delete contact and attempts" action for deletion requests.

---

## 13. Environment variables
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_SITE_URL` (build-time), `GHL_WEBHOOK_URL`, `SEED`, `REQUIRE_DATA_CONSENT`, `E2E_PORT`, `E2E_TOKEN`. Commit `.env.example` with a one-line note per variable.

**`E2E_TOKEN`** is a shared secret marking an automated test run. There is no separate dev database, so Playwright drives a real deployment; the suite sends the token as an `x-taboo-e2e` header, and every `Attempt` and `Contact` created while it is present is flagged `isSeed`. Two invariants follow, and both are load-bearing:

- **A seed row never triggers the GoHighLevel webhook.** A test run must not mail a real person or consume a real GHL contact.
- **Admin stats exclude `isSeed` rows**, so test traffic never appears in the funnel.

The flag is set once at creation and read from the stored row thereafter, so it survives a later request that lacks the header. The check fails closed: no token, or one under 16 characters, and it never matches.

**Domain:** `tabootest.marieelizabethmali.com` (CNAME to Railway, set wherever marieelizabethmali.com's DNS is managed). Set this *before* the first real email goes out, because result links in inboxes are permanent (lesson from Tango's domain move).

---

## 14. Open items (Marie-Elizabeth to decide in the copy session)
1. ~~**Sex statement 5.** Replace it. As written, it measures reactions to the news rather than the relationship with desire, asks two things at once, and a survivor who rates it low lands on Low copy about "shame and silence." Needs a new statement you write. Because the level ranges assume 5 statements, it must stay one statement.~~ **Resolved 2026-09-26:** replaced with "I make my own pleasure a priority, without a trace of guilt." — one statement, scored normally (not reversed), asking about the relationship with desire rather than about the news.
2. ~~**"Nobody sees this but you"** (JotForm intro) isn't true once answers are stored and sent to GHL. It needs new wording.~~ **Resolved 2026-09-26:** removed entirely rather than reworded. The intro now ends at "Be honest."
3. **Unverified claims.** Keep, source, or soften each.
   - ~~"Most people score lower than they expect in at least one section"~~ **Resolved 2026-09-26:** softened on the landing page to "You may score lower than you expect in at least one section", which claims nothing about other people.
   - Still open: "Most people score lower here than they expect" (Death), "The research on this is consistent" (Sex Low), "Research on financial anxiety consistently shows" (Cash Low), and terror management theory as "one of the more robust frameworks" (Death Low).
4. **"money" vs "cash":** the results doc uses "sex, death, and money" in the opening line and the upgrade block.
5. **Absolute words + frequency scale:** "Often: I am *fully* confident…", "Sometimes: I *completely* embrace…" Consider dropping "fully / completely / totally" so the scale does the measuring.
6. Email step body line, button, and fine print (heading is settled); terrain lines; change line; loop line; results email subject and opener.
7. Whether the page carries a quiet link to the paid tier, or only the email does.

---

## 15. Build phases (stop and show a Railway URL after each)

1. **Scaffold and look:** repo, copied infrastructure, tokens, landing + one title card + one statement screen + results page with fake data. Deploy to Railway with Postgres. *Review: does it look like Tango's sibling?*
2. **Test flow:** Attempt model, `/api/answer`, resume, back, progress, all 15 statements, scoring + Vitest suite.
3. **Email step + results:** `/send` with every Tango safeguard, Contact upsert, attempt numbering and previous scores, `/r/[id]`, redirects.
4. **GHL + admin:** payload builder (unit-tested with a snapshot), delivery + retry + log, Settings, Health, admin pages, CSV, delete, `docs/GHL_SETUP.md`. *Marie-Elizabeth sets up GHL, sends a test payload, and builds the email.*
5. **Copy + launch:** paste the final copy, privacy page, Playwright suite green, `SEED=false`, custom domain, end-to-end test with a real inbox.
   - **Wipe all data before launch.** Every `Attempt`, `Contact`, `Event` and `DeliveryLog` row from development and testing is deleted, so the database is empty when the first real subscriber arrives. Do this *after* the end-to-end inbox test and *before* the link goes out, and confirm the app still starts clean afterwards.
   - Only then does the link go into Substack.

**Playwright at 390px must cover:**
- full run to results
- back and change an answer
- resume after reload
- `/send` validation keeping typed values
- a retake with the same email producing `taboo_prev_*` fields and no past scores on the page
- a webhook failure still showing results and logging to `DeliveryLog`
- the results page having no first name or email in its HTML

---

## Appendix A: Copy (`src/config/copy.ts`)

Verbatim from *Taboo_Test_Results.docx* unless marked `[COPY TBD]`. Each "(Where: …)" label says where that piece renders.

### Landing (`/`)
- Title: **The Taboo Test: How Uptight Are You About Sex, Death & Cash?**
- Intro: "Read each statement and rate how true it is for you, right now — not who you want to be, not who you used to be. Be honest."
  *(The intro ends there. The JotForm's "Nobody sees this but you" is removed, not reworded — see §14.2 — and nothing replaces it.)*
- Second line: "You may score lower than you expect in at least one section. That's where you could stand to loosen up."
- Meta line: "15 statements · about 3 minutes" · Button: "Begin"
- *(Removed: the scale legend, which now appears on every card, and "A few statements are reversed — pay attention.")*

### Email step (`/send`)
- Heading: **Where should I send your results?**
- Body: "Your results show up on the next screen. Your next step for each section goes to your inbox."
- Button: "Show my results"
- Fine print: "Submitting sends your next steps by email, and the test again next quarter. Every email has an unsubscribe link, and I don't sell or share your information." followed by the Privacy Policy link.
- *(No mailing-list checkbox. First name and email only — see §7.4.)*

### Results page: intro (Where: page)
**HERE ARE YOUR TABOO TEST RESULTS**
You just did something courageous and honest. You took The Taboo Test. Take a breath and notice what you're feeling in your body: tension, relief, resistance, surprise, or something you might not have a name for yet.
*(Removed: "Add up your scores in each section…". The app adds them up.)*

### Terrain line (Where: page + `taboo_terrain_line`), three variants
`{Section}` is filled with the section name, in Sex → Death → Cash order.
- One lowest section: "Your lowest score is in {Section}. That's your most interesting terrain right now, and where a real shift is possible."
- Two tied: "{Section} and {Section} tied for your lowest score. Both are interesting terrain right now. Start with the one you'd rather avoid."
- All three tied: "All three sections scored the same. Your terrain is whichever one you'd most like to skip. Start there."

### SEX (Where: page)
*Your relationship with desire.*
Your sex score reflects how at home you feel in your desires. Not only what happens in bed, but how freely you inhabit your body, your history, and your wants. It's one of the most loaded categories because so much conspires to make us feel wrong about it.

**Low (5–11)**
Something's contracted here, and you probably already know it. Maybe it's your history, your body image, something picked up from culture or family, a relationship, and most likely some combination. The research on this is consistent: shame and silence don't protect us; they only keep us stuck.
Desire that has nowhere to go doesn't disappear; it goes underground and shows up sideways. For example, in manipulating to get what you want instead of being direct, flirting in an awkward (or creepy) way, or pushing away what would make you happy.
The good news: awareness is the first step. Get curious instead of critical. Ask yourself what it would mean to feel sexy AF. What's actually in the way?
**START HERE** (Where: email): Write down the three words you most wish someone would use to describe you sexually. Example: Hot, luscious, creative. Don't edit. Notice what comes up for you when you read them over and decide on the first step you could take to embody the first word. Then take that step.

**Medium (12–18)**
You've done some good work. There are places where you feel at home in your skin and others where you're not quite there yet. This is actually a rich zone, because you know enough to know what's unhealed. The question isn't what's wrong with you; it's what you're still protecting yourself from liberating.
**START HERE** (Where: email): Identify the one statement in this section you rated lowest. Journal on what informed your answer and what a high score might look like for you in that area. For example, feeling comfortable enough to be loud in bed, or asking for a vulnerable desire, or finally feeling zero shame about the fumbling around you did in your teens.

**High (19–25)**
You're living in your body and owning your desire without much apology. That's rarer than it should be. Whatever got you here — therapy, a mentor, experience, sheer tenacity — it's working. This isn't a place to coast, though. The question worth sitting with: how openly do you talk about this with the people closest to you? Freedom that stays private has a ceiling.
**START HERE** (Where: email): Journal about a desire you'd normally keep to yourself. Notice what happens in your body as you write about it. Plan to have a conversation about it with someone this month.

### DEATH (Where: page)
*Your relationship with impermanence.*
Your death score measures how much you've made peace with the fact that this all ends. Not in a morbid way, but in the way that changes how you spend your downtime, what you tolerate, and what you stop tolerating. Most people score lower here than they expect, because we live in a culture that treats death as a failure rather than a fact.

**Low (5–11)**
You're not alone. Most people haven't looked at death directly. But avoidance has a cost, and it usually shows up as low-grade anxiety that seems unrelated to mortality. Terror management theory, one of the more robust frameworks in psychology, suggests that much of what drives human behavior — the status-seeking, the busyness, the unexamined relationships — is death anxiety in a suit.
One concrete place to start: get your affairs in order. Will, healthcare proxy, end-of-life wishes, basically the folder your people would need if you died tomorrow. It won't dissolve the existential dread, but it removes one layer of it and signals to your nervous system that you're willing to look.
**START HERE** (Where: email): Set a timer for 10 minutes and write the answer to these questions: If I knew I had one year left, what would I stop doing? What would I start doing? If it's not coming easily, try writing your answer with your non-dominant hand (it works to access a different part of your brain).

**Medium (12–18)**
You've thought about death more than most. You can talk about it, maybe even joke about it. But there's still some uptightness around pain, incompleteness, legacy, and the people you'd leave behind. Your work here isn't intellectual; you've clearly done that part. It's about letting the reality of death land in your body, not just your head, and letting that change something about how you're actually living now.
**START HERE** (Where: email): Pick one thing you've been putting off that you'd regret leaving undone if you were to unexpectedly die, choose a date to do it, and do it on that date.

**High (19–25)**
You've sat with mortality, and it hasn't broken you; it's sharpened you. There's a specific freedom that comes from that, and it shows in how people like you make decisions, end things, and begin things. The question worth asking now: Are you living accordingly?
**START HERE** (Where: email): Journal about where you could bring your life into greater alignment with how you define a well-lived and well-rounded life. For example, who you want to spend time with, what you spend your money on, how much you allow yourself to rest, how much time you spend outdoors, and how much you create.

### CASH (Where: page)
*Your relationship with enough.*
Your cash score isn't about how much money you have. It's about your relationship to it: the anxiety, the resentment, the avoidance, the indulgence, the desire. Money is one of the last real taboos, and most of us carry more charge around it than we realize, regardless of what our account balance says.

**Low (5–11)**
There's real distress here, whether it's practical, psychological, or both. The resentment and the 3:00 am worry are signals worth taking seriously, not as moral failures, but as information. Research on financial anxiety consistently shows that the emotional weight of money stress is usually only loosely tied to your actual finances. The money story you're running is probably inherited and outdated.
**START HERE** (Where: email): Write down the first money memory you have. How old were you? What's the feeling in it? Who and where did it come from? What else does it bring up for you? You're probably still living out some version of that story.

**Medium (12–18)**
You're functional but not free. The basics are mostly handled, which is saying a lot, but something still nags. Maybe it's the indulgence question; maybe it's the resentment and jealousy you don't fully admit to; maybe it's that the taxes are filed, but you feel behind in ways that are harder to name. Pick the one question in this section that stung the most. That's the thread to follow.
**START HERE** (Where: email): Write about the last 3 purchases you made. What motivated you? How do you feel about them in your head and your body? The answer might be something like, Tylenol, pickles, and a thrifted top, and even so, there's good information there for you to unpack.

**High (19–25)**
You've built a genuinely healthy relationship with money. You're confident, clear, and not losing sleep over it. That's hard to hold and worth acknowledging. The flex here isn't your account balance; it's the absence of the mental noise around money most people carry.
The question for you now is how to use this freedom well. Money ease, like physical health, is most interesting when it becomes a foundation for something greater rather than an end in itself.
**START HERE** (Where: email): Pick someone in your life who could benefit from your confident relationship with money. This is not about giving advice; it's about modeling presence and ease around money conversations. Here's a great way to kick-start a money conversation: Ask them: If you never needed to earn another dime and had more money than you could ever spend, what would you do differently with your life?

### Results page closing (Where: page)
- Loop line, the page's call to action, pointing to the email with their practices: **"Check your inbox. I've sent you one thing to do for each section."**
  Rendered above the deliverability note and larger than body text, because it is the only thing the page asks them to do.
- Then the deliverability note: "If it lands in Promotions or Spam, make sure to drag it to your Inbox."
- Nothing after that. The retake link is removed; retakes come from the quarterly email.

### Change line (Where: email only, `taboo_change_line`)
"Your results from your last test on {Month D} were: Sex {n}, Death {n}, Cash {n}."

`{Month D}` is the date of their previous test; the three `{n}` are Sex, Death and Cash in that order. The date reads "June 3", gaining a year — "December 31, 2025" — only when the previous test fell in a different year from this one. **Empty string on a first attempt**, so the email shows nothing rather than an empty sentence.

*(These are last time's scores only. This line sits next to the current ones already in the email, so it does not repeat them.)*

### EXPAND YOUR LIBERATION (Where: email only, lives in the GHL template, not the app)
Verbatim from the doc, including the "Upgrade to paid here" link to `https://marieelizabethmali.substack.com/subscribe`. To be refined in the copy session.

---

## Appendix B: Kickoff prompt to paste into Claude Code

> Create a new Next.js project at `~/Development/taboo-test` and a GitHub repo `memali108/taboo-test`. Put `SPEC.md` (this file) in the repo root. Read SPEC.md in full, then read the reference files listed in §0 from `~/Development/taboo-quiz`, without modifying that repo. Build Phase 1 only, deploy it to a new Railway service with its own Postgres, and give me the URL. Don't write or change any user-facing copy. Use Appendix A as written and show `[COPY TBD]` placeholders as-is.
