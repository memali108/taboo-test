import { test, expect, type Page } from "@playwright/test";

/**
 * Phase 2 of the Playwright coverage SPEC §15 asks for, at 390px:
 * a full run through all 15 statements, Back and change an answer, and resume
 * after a reload. The rest (the /send form, retakes, webhook failure, no PII on
 * the results page) arrives with Phases 3 and 4.
 */

const begin = async (p: Page) => {
  await p.goto("/");
  await p.getByRole("button", { name: "Begin" }).click();
  await expect(p).toHaveURL(/\/test$/);
};

/** Advance past a section title card. */
const passTitleCard = async (p: Page) => {
  await p.getByRole("button", { name: "Begin" }).click();
};

/**
 * Answer statement `index` (0-based), waiting for its screen first.
 *
 * The wait is not optional. A card ignores taps while its answer is being written and
 * auto-advances 260ms after the tap, so clicking straight through without synchronising
 * on the screen silently drops answers — which is correct app behaviour and a broken
 * test.
 */
const answer = async (p: Page, index: number, rating: number) => {
  await expect(p.getByText(`${index + 1} of 15`)).toBeVisible();
  await p.getByRole("radio").nth(rating - 1).click();
};

/** Walk the whole test, answering every statement. */
async function runAll(p: Page, rating: (i: number) => number) {
  for (let i = 0; i < 15; i++) {
    if (i % 5 === 0) await passTitleCard(p);
    await answer(p, i, rating(i));
  }
}

test("a full run reaches the send step with all 15 answers saved", async ({ page }) => {
  await begin(page);
  await runAll(page, (i) => (i % 5) + 1);
  await expect(page).toHaveURL(/\/send$/);
  await expect(page.getByRole("heading", { name: "Where should I send your results?" })).toBeVisible();
});

test("Back returns to the previous statement and the answer can be changed", async ({ page }) => {
  await begin(page);
  await passTitleCard(page);
  await answer(page, 0, 2); // statement 1 -> Rarely
  await expect(page.getByText("2 of 15")).toBeVisible();

  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByText("1 of 15")).toBeVisible();

  // The saved answer is marked, and only that one.
  const checks = page.locator('[role="radio"] svg');
  await expect(checks).toHaveCount(1);
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");

  await answer(page, 0, 5); // change it to Always
  await expect(page.getByText("2 of 15")).toBeVisible();

  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("radio").nth(4)).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "false");
});

test("leaving and coming back resumes where they were", async ({ page }) => {
  await begin(page);
  await passTitleCard(page);
  for (let i = 0; i < 3; i++) await answer(page, i, 3);
  await expect(page.getByText("4 of 15")).toBeVisible();

  await page.reload();
  await expect(page.getByText("4 of 15")).toBeVisible();
  await expect(page.getByRole("heading", { name: "I completely embrace how my body is changing with age." })).toBeVisible();
});

test("the section name is a real heading, not swallowed by a button", async ({ page }) => {
  // The card used to be one big <button>, which flattened the headline, the subtitle and
  // Begin into a single accessible name and removed the heading from the a11y tree.
  await begin(page);
  await expect(page.getByRole("heading", { name: "Sex" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
});

test("finishing a section resumes on the next section's title card, not past it", async ({ page }) => {
  await begin(page);
  await passTitleCard(page);
  for (let i = 0; i < 5; i++) await answer(page, i, 3); // all of Sex

  // Wait for the advance before reloading: the screen only changes once the answer has
  // been written, so this is what guarantees the fifth one is saved.
  await expect(page.getByRole("heading", { name: "Death" })).toBeVisible();

  await page.reload();
  // Still the Death title card, not Death's first statement.
  await expect(page.getByRole("heading", { name: "Death" })).toBeVisible();
  await expect(page.getByText("Your relationship with impermanence.")).toBeVisible();
});

test("a completed attempt cannot go back to the test", async ({ page }) => {
  await begin(page);
  await runAll(page, () => 3);
  await expect(page).toHaveURL(/\/send$/);
  await page.goto("/test");
  await expect(page).toHaveURL(/\/send$/);
});

/**
 * The suite writes to a real database, so the rows it creates must be flagged `isSeed`:
 * excluded from admin stats and never delivered to GoHighLevel. `/api/answer` echoes the
 * flag back to a caller holding E2E_TOKEN, which is the only way to see it from outside
 * the database.
 */
test("rows created by this run are flagged isSeed", async ({ page }) => {
  test.skip(!process.env.E2E_TOKEN, "E2E_TOKEN not set — this run's rows are NOT flagged");

  await begin(page);
  await passTitleCard(page);

  const [res] = await Promise.all([
    page.waitForResponse((r) => r.url().includes("/api/answer") && r.request().method() === "POST"),
    page.getByRole("radio").first().click(),
  ]);
  const body = await res.json();
  expect(body.ok).toBe(true);
  expect(body.isSeed, "the attempt was created without the seed flag").toBe(true);
});
