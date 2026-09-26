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

const FIRST_NAME = "Testy";
const testEmail = () => `taboo-e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

/**
 * Fill and submit /send, for the cases that are meant to succeed. The 2-second
 * minimum-time guard is real, so wait it out; and wait for the redirect before
 * returning, or a caller reading `page.url()` gets /send back.
 */
async function submitSend(page: Page, email: string, firstName = FIRST_NAME) {
  await page.getByLabel("First name").fill(firstName);
  await page.getByLabel("Email").fill(email);
  await page.waitForTimeout(2100);
  await page.getByRole("button", { name: /.+/ }).last().click();
  await page.waitForURL(RESULTS_URL);
}

const RESULTS_URL = /\/r\/[a-z2-9]{24}$/;

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

test("submitting reaches a private results page with real scores and no personal data", async ({ page }) => {
  await begin(page);
  // All 3s -> 15 / 15 / 15, every section Medium, all three tied so no terrain.
  await runAll(page, () => 3);
  await expect(page).toHaveURL(/\/send$/);

  const email = testEmail();
  await submitSend(page, email);
  await expect(page).toHaveURL(RESULTS_URL);

  await expect(page.getByRole("heading", { name: "HERE ARE YOUR TABOO TEST RESULTS" })).toBeVisible();
  for (const line of ["15 / 25"]) await expect(page.getByText(line).first()).toBeVisible();

  // SPEC §7.5 / §2: no first name, no email address anywhere in the HTML.
  const html = await page.content();
  expect(html).not.toContain(email);
  expect(html).not.toContain(FIRST_NAME);
  // And it must not be indexable.
  expect(html).toContain("noindex");
});

test("/send keeps what was typed when validation fails", async ({ page }) => {
  await begin(page);
  await runAll(page, () => 4);
  await expect(page).toHaveURL(/\/send$/);

  await page.getByLabel("First name").fill("Wilhelmina");
  await page.getByLabel("Email").fill("not-an-email");
  await page.waitForTimeout(2100);
  await page.getByRole("button", { name: /.+/ }).last().click();

  // Still on /send, with an error and both fields intact.
  await expect(page).toHaveURL(/\/send$/);
  await expect(page.getByText(/check your email address/i).first()).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Wilhelmina");
  await expect(page.getByLabel("Email")).toHaveValue("not-an-email");
});

test("the minimum-time guard rejects an instant submission", async ({ page }) => {
  await begin(page);
  await runAll(page, () => 2);
  await page.getByLabel("First name").fill(FIRST_NAME);
  await page.getByLabel("Email").fill(testEmail());
  await page.getByRole("button", { name: /.+/ }).last().click(); // no wait
  await expect(page.getByText(/take a moment/i).first()).toBeVisible();
  await expect(page).toHaveURL(/\/send$/);
});

test("a submitted attempt redirects away from /test and /send", async ({ page }) => {
  await begin(page);
  await runAll(page, () => 5);
  await submitSend(page, testEmail());
  await expect(page).toHaveURL(RESULTS_URL);
  const resultsUrl = page.url();

  await page.goto("/test");
  await expect(page).toHaveURL(resultsUrl);
  await page.goto("/send");
  await expect(page).toHaveURL(resultsUrl);
});

test("a retake with the same email gets its own results page", async ({ page }) => {
  const email = testEmail();

  await begin(page);
  await runAll(page, () => 1);
  await submitSend(page, email);
  const first = page.url();

  // "Take it again" clears the cookie and starts a fresh attempt.
  await page.getByRole("button", { name: /.+/ }).last().click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("button", { name: "Begin" }).click();
  // Wait for the navigation before runAll's first click: the landing button and the
  // title card's button are both called "Begin", so without this the next click can
  // resolve against the page we are leaving.
  await expect(page).toHaveURL(/\/test$/);
  await runAll(page, () => 5);
  await submitSend(page, email);
  const second = page.url();

  expect(second).not.toBe(first);
  // The earlier results stay reachable at their own URL — every attempt is kept.
  await page.goto(first);
  await expect(page.getByRole("heading", { name: "HERE ARE YOUR TABOO TEST RESULTS" })).toBeVisible();
});

/**
 * Admin smoke test. Gated on ADMIN_PASSWORD so a normal run skips it; supply the value
 * the deployment uses to exercise the dashboard against real data.
 *
 * **Logs in exactly once per run**, then reuses the cookie. `/admin/login` is rate
 * limited to 8 attempts per 15 minutes per IP — correct for production, and enough to
 * make a suite that logs in per test fail on its second run of the afternoon. Only the
 * deliberate wrong-password test spends another attempt.
 */
const ADMIN_STATE = "test-results/.admin-auth.json";

test.describe("admin", () => {
  test.skip(!process.env.ADMIN_PASSWORD, "ADMIN_PASSWORD not set");

  test.beforeAll(async ({ browser, baseURL }) => {
    // `storageState: undefined` explicitly: browser.newContext() inherits context
    // options from `use`, so without this the hook that CREATES the auth file tries to
    // read it first.
    const ctx = await browser.newContext({ baseURL, storageState: undefined });
    const p = await ctx.newPage();
    await p.goto("/admin/login");
    await p.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
    await p.getByRole("button", { name: /Log in/ }).click();
    await p.waitForURL(/\/admin$/);
    await ctx.storageState({ path: ADMIN_STATE });
    await ctx.close();
  });

  test("/admin redirects to the login page when signed out", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("a wrong password does not get in", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Password").fill("definitely-not-the-password");
    await page.getByRole("button", { name: /Log in/ }).click();
    await expect(page.getByText(/Wrong password|Too many attempts/i)).toBeVisible();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test.describe("signed in", () => {
    test.use({ storageState: ADMIN_STATE });

    test("every dashboard page renders", async ({ page }) => {
      await page.goto("/admin");
      await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();

      for (const [path, heading] of [
        ["/admin/levels", "Levels"],
        ["/admin/statements", "Statements"],
        ["/admin/contacts", "Contacts"],
        ["/admin/retakes", "Retakes"],
        ["/admin/settings", "Settings"],
        ["/admin/health", "Health"],
      ] as const) {
        await page.goto(path);
        await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
      }
    });

    test("Health warns that no webhook is configured", async ({ page }) => {
      await page.goto("/admin/health");
      // GoHighLevel is not set up yet, so this alert is the expected state for now.
      await expect(page.getByText(/No GoHighLevel webhook is configured/i)).toBeVisible();
    });

    test("the CSV export is served to an admin and hidden from everyone else", async ({ page, request }) => {
      const ok = await page.request.get("/admin/contacts/export");
      expect(ok.status()).toBe(200);
      expect(ok.headers()["content-type"]).toContain("text/csv");
      expect(await ok.text()).toContain("email,first_name");

      // `request` is a fresh context with no admin cookie.
      const denied = await request.get("/admin/contacts/export", { maxRedirects: 0 });
      expect(denied.status()).not.toBe(200);
    });
  });
});
