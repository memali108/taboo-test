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
| `marketing_consent` | Single line text |
| `source` | Single line text |
| `taboo_test_version` | Single line text |
| `taboo_sex_score` | Single line text |
| `taboo_sex_level` | Single line text |
| `taboo_sex_start_here` | Multi-line text |
| `taboo_sex_lowest_statement` | Multi-line text |
| `taboo_death_score` | Single line text |
| `taboo_death_level` | Single line text |
| `taboo_death_start_here` | Multi-line text |
| `taboo_death_lowest_statement` | Multi-line text |
| `taboo_cash_score` | Single line text |
| `taboo_cash_level` | Single line text |
| `taboo_cash_start_here` | Multi-line text |
| `taboo_cash_lowest_statement` | Multi-line text |
| `taboo_terrain` | Single line text |
| `taboo_terrain_line` | Multi-line text |
| `taboo_result_url` | Single line text |
| `taboo_attempt_number` | Single line text |
| `taboo_prev_taken_at` | Single line text |
| `taboo_prev_sex_score` | Single line text |
| `taboo_prev_death_score` | Single line text |
| `taboo_prev_cash_score` | Single line text |
| `taboo_change_line` | Multi-line text |
| `taboo_answers` | Single line text |
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

Try adding tags from `taboo_tags` directly — it arrives comma-separated, e.g.
`taboo-test-completed, taboo-test-sex-low, taboo-test-death-high, taboo-test-cash-medium, taboo-test-terrain-sex`.

If GHL will not take dynamic tags, use **three If/Else blocks** on the `_level` fields
(three branches each) plus one on `taboo_terrain`.

A retake also carries `taboo-test-retaken`.

## 5. Send the results email

Structure (§8.4 of SPEC.md — all wording still to be written):

- Subject → greeting with `{{first_name}}` → one-line opener
- Three score lines: `Sex {{taboo_sex_score}}/25 · {{taboo_sex_level}}`, and the same for Death and Cash
- `{{taboo_change_line}}` — **empty on a first attempt**, so the email simply shows nothing there
- `{{taboo_terrain_line}}` — a complete sentence covering every tie case, so the template needs no logic
- **START HERE** × 3: section name + `{{taboo_sex_start_here}}` / `{{taboo_death_start_here}}` / `{{taboo_cash_start_here}}`
- A "See your full results" button linking to `{{taboo_result_url}}`
- The EXPAND YOUR LIBERATION block with the Substack upgrade link (static, lives in GHL)
- A retake note, then the sign-off

**Link `{{taboo_result_url}}` as-is.** It already carries
`?utm_source=email&utm_medium=results`; rebuilding it in GHL breaks attribution.

## 6. Optional: quarterly retake

A second workflow, **"Taboo Test – Quarterly retake"**: wait 90 days after the
`taboo-test-completed` tag is added, then send the retake email with the test link. Skip
it if you would rather send retakes from Substack.

## 7. Before launch

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
