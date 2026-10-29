import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";

test("standalone HTML needs no external assets and persists preferences", async ({
  page,
}) => {
  const errors: string[] = [];
  const network: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (r.url().startsWith("http")) network.push(r.url());
  });
  const html = await readFile(
    resolve("downloads/First-Touch-Lab.html"),
    "utf8",
  );
  // This managed browser blocks file:// navigation. Serve the exact downloadable
  // bytes through an intercepted document request, without an HTTP server.
  const url = "http://localhost:5173/portable-preview";
  await page.route(url, (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto(url);
  await expect(
    page.getByRole("heading", { name: /Train with purpose/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start Training — Free" })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: /Let’s put in the work/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByLabel("Nickname").fill("Portable player");
  await page.getByRole("button", { name: "Save preferences" }).click();
  await page.reload();
  await expect(page.getByLabel("Nickname")).toHaveValue("Portable player");
  await page.getByRole("button", { name: "Dashboard", exact: true }).click();
  await page.getByRole("button", { name: "Log training", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save training log" })
    .click();
  await expect(page.getByRole("status")).toContainText("Training logged");
  expect(errors).toEqual([]);
  expect(
    network.every((url) => url === "http://localhost:5173/portable-preview"),
  ).toBe(true);
});
