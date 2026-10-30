import { test, expect } from '@playwright/test';
import {
  CHANNELS,
  EMPTY_STATE,
  PREVIEW_PANEL,
  THREADS,
  channel,
  composer,
  openPreview,
  openThreadTitle,
  seedSettings,
  thread,
} from './helpers';

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
 * The grid, which has never been looked at at all — it was built from one frame of
 * a design export in a single pass. The calls worth a human eye are the ones the
 * export argued for and the code can only claim: whether a 2×2 card and a 1×1 rise
 * by visibly the *same* amount, whether the lift clears its neighbours rather than
 * shoving them, whether dense flow leaves holes, and whether a previewed card with
 * no ring still reads as selected.
 */
test.describe('grid states', () => {
  for (const theme of ['dark', 'light'] as const) {
    test(`grid at rest — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme, threadView: 'grid' });
      await page.goto('/');
      await expect(page.locator(thread(THREADS.pinned))).toBeVisible();

      await page.screenshot({ path: `${DIR}/grid-rest-${theme}.png`, animations: 'disabled' });
    });

    /** The 2×2 pinned card: ring kept, fill and lift carrying the held state. */
    test(`grid preview on a pinned card — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme, threadView: 'grid' });
      await page.goto('/');
      await openPreview(page, THREADS.pinned);

      await page.screenshot({
        path: `${DIR}/grid-preview-pinned-${theme}.png`,
        animations: 'disabled',
      });
    });
  }

  /**
   * The one place the card deliberately parts company with the bubble: a thread
   * with no state of its own gets *no* achromatic ring here, so fill, lift and the
   * raised shadow have to carry selection between them. A 1×1 card, so it is also
   * the shot that says whether the smallest slot rises as far as the largest.
   */
  test('grid preview on a plain card', async ({ page }) => {
    await seedSettings(page, { threadView: 'grid' });
    await page.goto('/');
    await openPreview(page, THREADS.plain);

    await page.screenshot({ path: `${DIR}/grid-preview-plain.png`, animations: 'disabled' });
  });

  /** The card's flat gallery against the panel's 3-up grid — neither is the fan. */
  test('grid preview with images', async ({ page }) => {
    await seedSettings(page, { threadView: 'grid' });
    await page.goto('/');
    await openPreview(page, THREADS.images);

    await page.screenshot({ path: `${DIR}/grid-preview-images.png`, animations: 'disabled' });
  });

  /** Both views, so the two can be compared in one pass. */
  for (const threadView of ['canvas', 'grid'] as const) {
    test(`empty channel — ${threadView}`, async ({ page }) => {
      await seedSettings(page, { threadView });
      await page.goto('/');
      await page.getByRole('button', { name: channel(CHANNELS.empty), exact: true }).click();
      await expect(page.getByText(EMPTY_STATE)).toBeVisible();

      await page.screenshot({ path: `${DIR}/empty-${threadView}.png`, animations: 'disabled' });
    });
  }
});

/**
 * The open thread view. Two of its calls were deliberately *not* settled from the
 * mockup and are waiting on exactly these pictures:
 *
 * - **The header scrolls away** rather than pinning under the back bar, on the
 *   grounds that a three-line description costs ~120px permanently.
 * - **The right panel becomes Thread info**, replacing 24 channel members with the
 *   seven people actually in the conversation.
 *
 * Everything else here is settled and just wants checking: the two reply layouts
 * against each other, the unread divider in Signal, a reply's attachments at both
 * tile sizes, and the composer's achromatic focus border in light mode — which is
 * the same Ink 24% that has never been looked at anywhere else either.
 */
test.describe('open thread', () => {
  const open = async (page: import('@playwright/test').Page, threadId: string) => {
    await page.goto('/');
    await openPreview(page, threadId);
    await page.locator(PREVIEW_PANEL).click();
    await expect(openThreadTitle(page)).toBeVisible();
    // Attachments are CSS background images, so there is no `complete` flag to
    // wait on and no element that reports itself loaded. Without this the shots
    // catch empty outlines — which is exactly the thing they exist to show.
    await page.waitForLoadState('networkidle');
  };

  for (const theme of ['dark', 'light'] as const) {
    /** Standard: the roomier grouped block, and what the app boots into. */
    test(`thread at rest, standard — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme });
      await open(page, THREADS.pinned);

      await page.screenshot({
        path: `${DIR}/thread-standard-${theme}.png`,
        animations: 'disabled',
      });
    });

    /** Compact: one row per reply, and roughly twice as many on screen. */
    test(`thread at rest, compact — ${theme}`, async ({ page }) => {
      await seedSettings(page, { theme, density: 'compact' });
      await open(page, THREADS.pinned);

      await page.screenshot({
        path: `${DIR}/thread-compact-${theme}.png`,
        animations: 'disabled',
      });
    });
  }

  /**
   * Scrolled past the header — the state the held decision is really about.
   * Whether the back bar alone carries enough context once the title is gone is
   * the whole question, and it cannot be answered from the top of the page.
   */
  test('thread scrolled past the header', async ({ page }) => {
    await seedSettings(page);
    await open(page, THREADS.pinned);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/thread-scrolled.png`, animations: 'disabled' });
  });

  /** A reply carrying images, at the grouped layout's 96px tiles. */
  test('reply attachments, standard', async ({ page }) => {
    await seedSettings(page);
    await open(page, THREADS.images);

    await page.screenshot({
      path: `${DIR}/thread-attachments-standard.png`,
      animations: 'disabled',
    });
  });

  /** The same reply at 64px, which is the only thing density changes about it. */
  test('reply attachments, compact', async ({ page }) => {
    await seedSettings(page, { density: 'compact' });
    await open(page, THREADS.images);

    await page.screenshot({
      path: `${DIR}/thread-attachments-compact.png`,
      animations: 'disabled',
    });
  });

  /**
   * The Signal divider, and the only shot where it can exist: opening the thread
   * is what clears the unread flag, so the view captures the position on entry
   * and the mark outlives the state that produced it.
   */
  test('unread divider', async ({ page }) => {
    await seedSettings(page);
    await open(page, THREADS.unread);

    // Only the last four of 31 replies are new, so the divider is near the
    // bottom. Wheeled in steps rather than one jump because Lenis eases each
    // one — a single large delta lands short of where it was aimed.
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(120);
    }
    await page.waitForTimeout(400);

    await page.screenshot({ path: `${DIR}/thread-unread.png`, animations: 'disabled' });
  });

  /** The composer focused and typed, plus the Reply pill leaving its disabled 45%. */
  test('composer focused — light', async ({ page }) => {
    await seedSettings(page, { theme: 'light' });
    await open(page, THREADS.pinned);
    await composer(page).fill('the gradient one is still winning honestly');

    await page.screenshot({ path: `${DIR}/thread-composer.png`, animations: 'disabled' });
  });
});

test.describe('open thread wide', () => {
  test.use({ viewport: { width: 1728, height: 900 } });

  for (const density of ['standard', 'compact'] as const) {
    test(`thread on a wide window — ${density}`, async ({ page }) => {
      await seedSettings(page, { density });
      await page.goto('/');
      await openPreview(page, THREADS.pinned);
      await page.locator(PREVIEW_PANEL).click();
      await expect(openThreadTitle(page)).toBeVisible();
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: `${DIR}/thread-wide-${density}.png`,
        animations: 'disabled',
      });
    });
  }
});

/**
 * Narrow enough that the region falls under the grid's 660px floor with both side
 * columns open. The grid holds four columns and scrolls sideways rather than
 * dropping to fewer, as the canvas plane does — and the drawn indicator appears,
 * because the panel has taken its half and there is more grid than fits.
 */
test.describe('grid floor', () => {
  test.use({ viewport: { width: 1180, height: 720 } });

  test('grid under the column floor', async ({ page }) => {
    await seedSettings(page, { threadView: 'grid' });
    await page.goto('/');
    await openPreview(page, THREADS.pinned);

    await page.screenshot({ path: `${DIR}/grid-narrow.png`, animations: 'disabled' });
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
