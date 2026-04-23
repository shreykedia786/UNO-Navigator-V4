import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '../public/navigator-competitor-intelligence-preview.png');
const url = process.env.PREVIEW_URL || 'http://localhost:5173/';

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 2
});
await context.addInitScript(() => {
  localStorage.setItem('unoNavigatorSubscribed', 'true');
  localStorage.setItem('unoNavigatorGateCompleted', 'true');
  localStorage.setItem('onboardingTourCompleted', 'true');
});
const page = await context.newPage();
// Chart columns use a clip-path “reveal” animation from width 0 → 100%. Screenshots taken
// before it finishes look empty; reduced-motion skips animation and shows full paths immediately.
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 });
const skip = page.getByRole('button', { name: /Skip Tour/i });
try {
  await skip.waitFor({ state: 'visible', timeout: 5000 });
  await skip.click();
} catch {
  /* tour not shown */
}
await page.getByRole('button', { name: /Standard Room/i }).click();
const row = page.locator('[data-tour="competitor-analysis-row"]');
await row.waitFor({ state: 'visible', timeout: 30000 });
await row.scrollIntoViewIfNeeded();
const hScroll = page.locator('.overflow-x-auto').first();
try {
  await hScroll.evaluate((el) => {
    el.scrollLeft = 0;
  });
} catch {
  /* no horizontal scroller */
}
// Candlestick columns animate a clip-path reveal (~0.6s + stagger). Reduced-motion should skip it;
// keep a short buffer so rasterization always includes the blue “my rate” path.
await page.waitForFunction(
  () => {
    const col = document.querySelector('[data-tour="rate-chart"]');
    if (!col) return false;
    const path = col.querySelector('circle[fill="#2196F3"]');
    if (!path) return false;
    const r = path.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  },
  { timeout: 20000 }
);
await page.waitForTimeout(400);
await row.screenshot({ path: outPath, type: 'png' });
await browser.close();
console.log('Wrote', outPath);
