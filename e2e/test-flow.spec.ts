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

const answer = async (p: Page, rating: number) => {
  await p.getByRole("radio").nth(rating - 1).click();
};

/** Walk the whole test, answering every statement with `rating`. */
async function runAll(p: Page, rating: (i: number) => number) {
  for (let i = 0; i < 15; i++) {
    if (i % 5 === 0) await passTitleCard(p);
    await expect(p.getByText(`${i + 1} of 15`)).toBeVisible();
    await answer(p, rating(i));
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
  await answer(page, 2); // statement 1 -> Rarely
  await expect(page.getByText("2 of 15")).toBeVisible();

  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByText("1 of 15")).toBeVisible();

  // The saved answer is marked, and only that one.
  const checks = page.locator('[role="radio"] svg');
  await expect(checks).toHaveCount(1);
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "true");

  await answer(page, 5); // change it to Always
  await expect(page.getByText("2 of 15")).toBeVisible();

  await page.getByRole("button", { name: "← Back" }).click();
  await expect(page.getByRole("radio").nth(4)).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radio").nth(1)).toHaveAttribute("aria-checked", "false");
});

test("leaving and coming back resumes where they were", async ({ page }) => {
  await begin(page);
  await passTitleCard(page);
  for (let i = 0; i < 3; i++) await answer(page, 3);
  await expect(page.getByText("4 of 15")).toBeVisible();

  await page.reload();
  await expect(page.getByText("4 of 15")).toBeVisible();
  await expect(page.getByRole("heading", { name: "I completely embrace how my body is changing with age." })).toBeVisible();
});

test("finishing a section resumes on the next section's title card, not past it", async ({ page }) => {
  await begin(page);
  await passTitleCard(page);
  for (let i = 0; i < 5; i++) await answer(page, 3); // all of Sex

  await page.reload();
  // The Death title card, not Death's first statement.
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
