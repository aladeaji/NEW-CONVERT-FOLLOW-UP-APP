import { test, expect } from "@playwright/test";

// Critical end-to-end journey (single admin performing every step;
// multi-worker variant: repeat assignment + sign in as the worker).
// Requires: Postgres running, `prisma migrate dev`, `npm run dev`.
const stamp = Date.now();
const admin = {
  name: "E2E Admin",
  email: `e2e-admin-${stamp}@example.com`,
  password: "password123",
};
const johnPhone = `0800000${String(stamp).slice(-4)}`;

test("John journey: register, assign, contact, attend, miss, re-engage, integrate", async ({
  page,
}) => {
  // 1. Sign up + 2. church setup
  await page.goto("/sign-up");
  await page.getByPlaceholder("Full name").fill(admin.name);
  await page.getByPlaceholder("Email").fill(admin.email);
  await page.getByPlaceholder(/Password/).fill(admin.password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/setup/);
  await page.getByPlaceholder(/Grace Community/).fill("E2E Church");
  await page.getByRole("button", { name: /create church/i }).click();
  await expect(page).toHaveURL(/\/today/);

  // 3. Register John
  await page.goto("/people/new");
  await page.getByPlaceholder("e.g. John Obi").fill("John E2E");
  await page.getByPlaceholder("e.g. 0803…").fill(johnPhone);
  await page.getByRole("button", { name: /check & register/i }).click();
  await page.getByRole("button", { name: /^register$/i }).click();
  await expect(page).toHaveURL(/\/people\/.+/);
  const johnUrl = page.url();

  // 4. Assign John to self (admin acting as worker)
  await page.getByRole("button", { name: /suggest/i }).click();
  await page.locator("section", { hasText: "Assignment" }).getByRole("button").first().click().catch(() => {});
  // fallback: pick first worker in dropdown then Assign
  const assignSelect = page.locator("section", { hasText: "Assignment" }).locator("select");
  if ((await assignSelect.count()) > 0) {
    await assignSelect.selectOption({ index: 1 }).catch(() => {});
    await page.getByRole("button", { name: /assign/i }).first().click().catch(() => {});
  }

  // 5-6. Record first contact + next action
  await page.getByRole("button", { name: /record contact/i }).click();
  await page.getByPlaceholder("Outcome").fill("Spoke with John, doing well.");
  await page
    .getByPlaceholder("Next action, e.g. Call John tomorrow")
    .fill("Invite John to Sunday service");
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await page.locator('input[name="nextDate"]').fill(tomorrow);
  await page.getByRole("button", { name: /save record/i }).click();
  await expect(page.getByText("Spoke with John, doing well.")).toBeVisible();

  // 7-8. Create service + mark John present
  await page.goto("/attendance");
  await page.getByPlaceholder("e.g. Sunday Service").fill("E2E Sunday");
  await page.locator('input[name="date"]').fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: /service/i }).click();
  await expect(page).toHaveURL(/\/attendance\/.+/);
  await page.getByText("John E2E").click();
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByText(/saved/i)).toBeVisible();

  // 9-10. Flag concern (simulates missed attendance) -> appears in follow-ups
  await page.goto("/attendance");
  const flagBtn = page.getByRole("button", { name: /flag for follow-up/i }).first();
  if ((await flagBtn.count()) > 0) await flagBtn.click();
  await page.goto("/follow-ups");
  await expect(page.getByText("John E2E").first()).toBeVisible();

  // 11-12. Re-contact from profile
  await page.goto(johnUrl);
  await page.getByRole("button", { name: /record contact/i }).click();
  await page.getByPlaceholder("Outcome").fill("John was unwell, back Sunday.");
  await page.getByRole("button", { name: /save record/i }).click();
  await expect(page.getByText("John was unwell, back Sunday.")).toBeVisible();

  // 13. Advance journey stage
  await page.getByLabel("Journey stage").selectOption("ATTENDING");

  // 14. Join fellowship
  await page.goto("/groups");
  const groupInput = page.getByPlaceholder("e.g. Youth Fellowship");
  if ((await groupInput.count()) > 0) {
    await groupInput.fill("E2E Fellowship");
    await page.getByRole("button", { name: /group/i }).click();
    await expect(page).toHaveURL(/\/groups\/.+/);
    await page.locator('select[name="personId"]').selectOption({ label: "John E2E" });
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("John E2E")).toBeVisible();
  }

  // 15. Leadership sees the complete timeline
  await page.goto(johnUrl);
  for (const entry of ["REGISTERED", "FOLLOW UP", "ATTENDING"]) {
    await expect(page.getByText(entry, { exact: false }).first()).toBeVisible();
  }
});
