import { test, expect } from '@playwright/test';
import { THREADS, openPreview, seedSettings, thread } from './helpers';

/**
 * Not a test suite — a screenshot generator that happens to run on the test
 * runner, so it inherits the dev server and the browser for free.
 *
 * These states are the ones 2.2 shipped without anyone ever seeing: the panel and
 * the canvas compression were built from two design exports and reconciled on
 * paper. `npx playwright test shots` drops the set in `e2e/shots/` for a human to
 * look through in one pass.
 *
 * It asserts almost nothing on purpose. Whether the 45% dim sits right against the
 * dot grid, or whether the tether reads as a pointer, is a judgement call — the
 * job here is to put it in front of someone, not to have an opinion about it.
 */

const DIR = 'e2e/shots';

test.describe('canvas states', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`canvas at rest — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme });
      await page.goto('/');
      await expect(page.locator(thread(THREADS.pinned))).toBeVisible();

      await page.screenshot({ path: `${DIR}/canvas-rest-${theme}.png`, animations: 'disabled' });
    });

    /**
     * Previewed *and* pinned — the combination neither design export drew. The
     * rule being checked: one outset ring per bubble, so the Spark pinned ring
     * survives and the held treatment is carried by fill, lift and shadow alone.
     */
    test(`preview on a pinned thread — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme });
      await page.goto('/');
      await openPreview(page, THREADS.pinned);

      await page.screenshot({
        path: `${DIR}/preview-pinned-${theme}.png`,
        animations: 'disabled',
      });
    });

    /**
     * A thread with no state of its own, which is the only case where the
     * achromatic `--ring-held` appears. The light-mode one is Ink at 24% and is
     * specifically on the list of things nobody has looked at.
     */
    test(`preview on a plain thread — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme });
      await page.goto('/');
      await openPreview(page, THREADS.plain);

      await page.screenshot({
        path: `${DIR}/preview-plain-${theme}.png`,
        animations: 'disabled',
      });
    });
  }

  /** The only thread with images — the panel's 3-up grid rather than the fan. */
  test('preview with images', async ({ page }) => {
    await seedSettings(page);
    await page.goto('/');
    await openPreview(page, THREADS.images);

    await page.screenshot({ path: `${DIR}/preview-images.png`, animations: 'disabled' });
  });
});

/**
 * Short enough that the 0.72 scale floor binds once the panel takes its half —
 * the plane stops shrinking, the canvas genuinely overflows, and the two things
 * that only exist for that case appear: the drawn scroll indicator standing in for
 * the hidden native bar, and a tether long enough to cross a zoomed-out field.
 */
test.describe('scale floor', () => {
  test.use({ viewport: { width: 1280, height: 640 } });

  test('preview on a short viewport', async ({ page }) => {
    await seedSettings(page);
    await page.goto('/');
    await openPreview(page, THREADS.pinned);

    await page.screenshot({ path: `${DIR}/scale-floor.png`, animations: 'disabled' });
  });
});
