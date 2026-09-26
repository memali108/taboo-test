# Setting up GoHighLevel for The Taboo Test

Marie-Elizabeth does this in GoHighLevel. Nothing here is done by the app.

**The app sends every piece of copy in the payload.** That is deliberate and it reverses
the decision taken for the Taboo Tango quiz, where the long-form copy lives in GHL: 27
combinations (3 sections × 3 levels) are unmanageable as GHL branches, whereas 5
archetypes were fine. So one email template merges the fields in, and the copy stays
versioned in `src/config/copy.ts`.

**A webhook failure means someone completed the test and received nothing.** There is no
second delivery path. Failures are written to `DeliveryLog` and shown at the top of
**Admin → Health**, which also warns when no URL is configured at all.

---

## 1. Create the custom fields

One per row. Use **Multi-line text** wherever the table says so — those carry sentences
and paragraphs.

| Field | GHL field type |
|---|---|
| `first_name` | Single line text |
| `email` | Single line text |
| `submitted_at` | Single line text |
| `source` | Single line text |
| `taboo_test_version` | Single line text |
| `taboo_sex_score` | Single line text |
| `taboo_sex_level` | Single line text |
| `taboo_sex_start_here` | Multi-line text |
| `taboo_death_score` | Single line text |
| `taboo_death_level` | Single line text |
| `taboo_death_start_here` | Multi-line text |
| `taboo_cash_score` | Single line text |
| `taboo_cash_level` | Single line text |
| `taboo_cash_start_here` | Multi-line text |
| `taboo_terrain_line` | Multi-line text |
| `taboo_result_url` | Single line text |
| `taboo_attempt_number` | Single line text |
| `taboo_prev_taken_at` | Single line text |
| `taboo_prev_sex_score` | Single line text |
| `taboo_prev_death_score` | Single line text |
| `taboo_prev_cash_score` | Single line text |
| `taboo_change_line` | Multi-line text |
| `taboo_tags` | Single line text |

Every copy field arrives as a **single paragraph of plain text**: no HTML, no line
breaks. The app enforces that, so you can drop them straight into the template.

## 2. Create the workflow

1. New workflow, **"Taboo Test – Results"**. Trigger: **Inbound Webhook**.
2. Copy the webhook URL GHL gives you.
3. Paste it into the app at **Admin → Settings → Inbound webhook URL**, and click
   **Save**.
4. Click **Send test payload**. That sends one realistic fake result so GHL can see every
   field and let you map them. Do this before building the email — GHL can only map
   fields it has seen.

## 3. Create/Update Contact

Add a **Create/Update Contact** action, matching on **email**. Map every field from the
table above.

## 4. Tags

`taboo_tags` arrives comma-separated and holds **four fixed strings**:

`taboo-test-completed, substack-subscriber, source-taboo-test` — plus `taboo-test-retaken`
when it is not their first time.

They are all fixed, so no If/Else branching is needed: map `taboo_tags` straight into an
**Add Tag** action.

**There are no level or terrain tags.** Scores, levels and the terrain sentence travel as
*fields* — `taboo_sex_level`, `taboo_terrain_line` and the rest — which the email merges
in directly. Tagging the same information would duplicate it as GHL state that then has to
be kept in step on every retake.

Two of these tags do work beyond labelling: `substack-subscriber` triggers the workflow in
§6, and `taboo-test-completed` triggers the quarterly retake in §7.

> **If you set this up earlier with level or terrain tags**, remove them in GoHighLevel by
> hand. The app stops sending them and clears them from its own record, but it cannot
> delete a tag that already exists on a GHL contact.

## 5. Send the results email

Structure (§8.4 of SPEC.md — all wording still to be written):

- Subject → greeting with `{{first_name}}` → one-line opener
- Three score lines: `Sex {{taboo_sex_score}}/25 · {{taboo_sex_level}}`, and the same for Death and Cash
- `{{taboo_change_line}}` — **empty on a first attempt**, so the email simply shows nothing there
- `{{taboo_terrain_line}}` — a complete sentence covering every tie case, so the template needs no logic
- **START HERE** × 3: section name + `{{taboo_sex_start_here}}` / `{{taboo_death_start_here}}` / `{{taboo_cash_start_here}}`
- A "See your full results" button linking to `{{taboo_result_url}}`
- The EXPAND YOUR LIBERATION block with the Substack upgrade link (static, lives in GHL) — skipped for `substack-paid` contacts, see §8
- A retake note, then the sign-off

**Link `{{taboo_result_url}}` as-is.** It already carries
`?utm_source=email&utm_medium=results`; rebuilding it in GHL breaks attribution.

## 6. Workflow: "Substack subscriber – leave Tango nurture"

Every submission tags the contact `substack-subscriber`. Someone taking The Taboo Test
came from the Substack list, so they are not a cold lead and should stop receiving the
Taboo Tango nurture sequence.

1. New workflow, **"Substack subscriber – leave Tango nurture"**.
2. Trigger: **Contact Tag Added**, tag = `substack-subscriber`.
3. Action: **Remove from Workflow** → the Taboo Tango nurture sequence. If that sequence
   is a campaign rather than a workflow, use **Remove from Campaign**.
4. Optional but worth it: also **Remove Tag** for whatever tag enrols people in that
   sequence, so a later automation cannot put them back.

**Order matters.** The results workflow (§2) adds the tags *and* sends the results email.
If this workflow removes them from a sequence that is mid-send, GHL may still deliver a
queued email — check the sequence has no message already scheduled for that contact.

The monthly Substack import (§8) applies the same tag, so a subscriber who never takes the
test leaves the nurture sequence too. Both paths agreeing is the point: `substack-subscriber`
means "already on the list", whichever way we learned it.

## 7. Workflow: "Taboo Test – Quarterly retake"

1. New workflow, **"Taboo Test – Quarterly retake"**.
2. Trigger: **Contact Tag Added**, tag = `taboo-test-completed`.
3. Action: **Wait** 90 days.
4. Action: **Send Email** — the retake email, with the test link back to the landing page.

**Use the stored `taboo_*_score` fields as their "last time" scores.** The contact record
still holds the scores from their most recent submission, so the retake email can say
*"Last time: Sex 14/25, Death 21/25, Cash 9/25"* using `{{taboo_sex_score}}`,
`{{taboo_death_score}}` and `{{taboo_cash_score}}` — no extra fields needed.

Two things to get right:

- **The custom fields are overwritten on every submission**, so by the time the *next*
  retake email goes out these will hold the newer scores. That is what you want, but it
  means the email must be read as "your last result", never "your first result".
- **Someone who retakes resets the clock**, because `taboo-test-completed` is re-added.
  Check the workflow is set to **re-enrol** contacts, or a second retake never fires.

The app does not send this email and has no 90-day timer of its own. If you would rather
send retakes from Substack, skip this workflow entirely — nothing in the app depends on it.

## 8. Monthly: import the Substack CSV

Keeps GoHighLevel's view of the list current, including who is paying.

1. Export subscribers from Substack (Dashboard → Subscribers → Export).
2. In GHL: **Contacts → Import**, matching on **email** so existing contacts update rather
   than duplicate.
3. Tag every imported row `substack-subscriber`.
4. Tag paying subscribers `substack-paid`. If the export separates free and paid, import
   them as two files with different tags; otherwise filter the CSV before importing.

**Do not let the import clear tags.** GHL's import can be set to replace tags rather than
add them — that would strip `taboo-test-*` tags from people who have taken the test.

### The upgrade block is skipped for paying subscribers

In the **"Taboo Test – Results"** workflow (§2), wrap the EXPAND YOUR LIBERATION block in
an If/Else so paying subscribers are not asked to upgrade to something they already have:

- **If** contact has tag `substack-paid` → send the results email **without** the upgrade
  block.
- **Else** → send it **with** the block.

In GHL that is two Send Email actions on the two branches, using two copies of the
template. The only difference between them is that block.

**This depends on the import being current.** Someone who upgraded since the last import
is still untagged and will be asked to upgrade again. Monthly is usually fine; run the
import before a send if you have just announced a paid tier.

## 9. Launching The Provocations

**Test takers hear about a launch through Substack, not through GoHighLevel.** They are
already on the list; announcing to them from GHL as well means the same person gets the
same news twice from two systems.

So the GHL launch send goes to **contacts who are not on the Substack list**:

1. Build a segment: contacts **without** the tag `substack-subscriber`.
2. Exclude anyone tagged `substack-paid` — they already have the paid tier, so a general
   invitation is the wrong message.
3. Send the general invitation to what remains.

That is the whole rule. There is no per-section or per-terrain launch email: the app no
longer sends level or terrain tags (§4), and segmenting a launch by how uptight someone
scored about sex, death or money would use a private self-assessment as a marketing
signal. The scores exist to be told back to the person who gave them.

**The exclusion depends on the monthly import being current** (§8). Someone who subscribed
or upgraded since the last import is still untagged in GHL and will receive the general
invitation. Run the import immediately before a launch send.

## 10. Before launch

- Take the test yourself on the live site and check the email end to end, **including on a
  phone**.
- Check **Admin → Health** shows no alerts.
- Confirm the custom domain is set *before* the first real send. Result links in inboxes
  are permanent and cannot be reissued.
- **Wipe the database** (SPEC §15.5) so no development data is present when the first real
  subscriber arrives.

## What never reaches GoHighLevel

Rows created by an automated test run are flagged `isSeed` and are **never** delivered —
see `src/lib/seed.ts`. That is what lets the Playwright suite run against the live site
without mailing anyone or burning a GHL contact record.
