/**
 * Captures screenshots of the running chat demo for docs/.
 *
 * Prerequisites:
 *   - Dev servers running (`npm run dev`)
 *   - playwright installed (`npm i -g playwright`)
 *   - Chromium available (set CHROME_PATH or defaults to system)
 *
 * Usage:
 *   node scripts/screenshots.mjs
 */
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", "docs");
const BASE = process.env.BASE_URL || "http://localhost:5199";
const CHROME = process.env.CHROME_PATH || undefined;

const browser = await chromium.launch({
  ...(CHROME ? { executablePath: CHROME } : {}),
  args: ["--no-sandbox", "--disable-gpu"],
});

const ctx = await browser.newContext({
  viewport: { width: 1200, height: 800 },
  deviceScaleFactor: 2,
  colorScheme: "light",
});

const page = await ctx.newPage();
const input = () => page.locator('textarea[placeholder*="Send a message"]');

async function allowAllPermissions() {
  let allowed = 0;
  for (let i = 0; i < 20; i++) {
    const btn = page.locator("button:has-text('allow')");
    const count = await btn.count();
    if (count > 0) {
      await btn.first().click();
      allowed++;
      console.log(`  Clicked allow (#${allowed})`);
      await page.waitForTimeout(2000);
    } else {
      const stopBtn = await page.locator("button:has-text('Stop')").count();
      if (stopBtn === 0) break;
      try {
        await page.waitForSelector("text=awaiting approval", { timeout: 8000 });
      } catch {
        const stopBtn2 = await page.locator("button:has-text('Stop')").count();
        if (stopBtn2 === 0) break;
      }
    }
  }
  return allowed;
}

// 1. Empty state
await page.goto(BASE);
await page.waitForTimeout(1000);
await page.screenshot({ path: `${OUT}/screenshot-empty.png` });
console.log("✓ screenshot-empty.png");

// 2. First query
await input().fill(
  "What tables are in the CORTEX_ANALYST_DEMO.REVENUE_TIMESERIES schema? Use a SQL query to find out.",
);
await page.locator("button:has-text('Send')").click();
console.log("Sent first query...");

// Wait for first permission prompt for screenshot
try {
  await page.waitForSelector("text=awaiting approval", { timeout: 60000 });
  console.log("Permission prompt detected");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/screenshot-permission-prompt.png` });
  console.log("✓ screenshot-permission-prompt.png");
} catch {
  console.log("No permission prompt found");
}

// Allow everything and wait for agent to finish
console.log("Allowing all permissions...");
await allowAllPermissions();

console.log("Waiting for agent to finish...");
try {
  await page.waitForSelector("button:has-text('Send')", { timeout: 120000 });
  console.log("Agent finished");
} catch {
  console.log("Agent may still be running, continuing...");
}
await page.waitForTimeout(1500);

await page.screenshot({ path: `${OUT}/screenshot-conversation.png` });
console.log("✓ screenshot-conversation.png");

// 3. Second query for SQL result table
await input().fill("Run this exact SQL: SELECT 42 AS answer, 'hello' AS greeting, 3.14 AS pi_value");
await page.locator("button:has-text('Send')").click();
console.log("Sent second query...");

console.log("Allowing permissions for second query...");
await allowAllPermissions();

try {
  await page.waitForSelector("button:has-text('Send')", { timeout: 120000 });
} catch {
  console.log("Timed out waiting for agent");
}
await page.waitForTimeout(1500);

// Scroll to bottom to show the SQL result
await page.evaluate(() => {
  const els = document.querySelectorAll("div");
  for (const el of els) {
    if (el.style.overflowY === "auto" && el.scrollHeight > el.clientHeight) {
      el.scrollTop = el.scrollHeight;
    }
  }
});
await page.waitForTimeout(500);

await page.screenshot({ path: `${OUT}/screenshot-sql-result.png` });
console.log("✓ screenshot-sql-result.png");

await browser.close();
console.log("\nAll screenshots captured!");
