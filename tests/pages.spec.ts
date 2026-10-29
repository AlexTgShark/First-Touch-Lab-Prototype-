import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

test("GitHub Pages build works at the repository subpath", async ({ page }) => {
  const root = resolve("docs");
  const prefix = "/First-Touch-Lab-Prototype-/";
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("http://localhost:5173" + prefix + "**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const relative =
      decodeURIComponent(pathname.slice(prefix.length)) || "index.html";
    const file = resolve(root, relative);
    if (!file.startsWith(root + sep)) {
      await route.abort();
      return;
    }
    const contentType = file.endsWith(".js")
      ? "application/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : "text/html";
    try {
      await route.fulfill({ contentType, body: await readFile(file) });
    } catch {
      await route.fulfill({ status: 404, body: "Not found" });
    }
  });
  await page.goto("http://localhost:5173" + prefix);
  await expect(
    page.getByRole("heading", { name: /Train with purpose/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start Training — Free" })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Drill Library", exact: true })
    .click();
  await page.getByRole("tab", { name: "4 Players", exact: true }).click();
  await expect(page.locator(".drill-card")).toHaveCount(8);
  await page
    .locator(".drill-card")
    .filter({
      has: page.getByRole("heading", { name: "3v1 Rondo", exact: true }),
    })
    .getByRole("button", { name: "Add to Dashboard", exact: true })
    .click();
  await expect(page.locator(".selected-drill h3")).toHaveText("3v1 Rondo");
  await page.reload();
  await expect(page.locator(".selected-drill h3")).toHaveText("3v1 Rondo");
  await page.screenshot({
    path: "tests/updated-dashboard.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
