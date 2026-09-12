import { expect, test, type Page } from '@playwright/test';
import {
  PREVIEW_PANEL,
  THREADS,
  channel,
  collectBrowserErrors,
  openPreview,
  thread,
} from './helpers';

/**
 * A smoke suite, not a spec suite. It drives the paths a person actually takes and
 * asserts the browser stayed quiet — it does not try to pin down what anything
 * looks like. Visual judgement lives in `shots.spec.ts`, which produces pictures
 * for a human rather than assertions.
 *
 * Everything here runs against mock data, so it will need revisiting when Supabase
 * lands in Phase 3 and there is auth and seeded state to arrange first.
 */

/** Scoped to the panel: the bubble carries the same title and would match too. */
const previewTitle = (page: Page) =>
  page.locator(PREVIEW_PANEL).getByRole('heading', {
    name: 'logo direction: bubble vs bolt',
  });

test.describe('thread canvas', () => {
  test('loads without the browser complaining', async ({ page }) => {
    const errors = collectBrowserErrors(page);

    await page.goto('/');
    await expect(page.locator(thread(THREADS.pinned))).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('previews on the first click and opens on the second', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    // The second click's only outward sign until 2.4 builds the open thread view.
    const opened: string[] = [];
    page.on('console', (message) => {
      if (message.text().startsWith('Open thread:')) opened.push(message.text());
    });

    await page.goto('/');

    const node = page.locator(thread(THREADS.pinned));
    await node.click();
    await expect(previewTitle(page)).toBeVisible();
    expect(opened).toEqual([]);

    await node.click();
    await expect.poll(() => opened).toEqual([`Open thread: ${THREADS.pinned}`]);

    expect(errors).toEqual([]);
  });

  test('dismisses with Escape and with the X', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    await page.keyboard.press('Escape');
    await expect(previewTitle(page)).toBeHidden();

    await openPreview(page, THREADS.pinned);
    await page.getByLabel('Dismiss preview').click();
    await expect(previewTitle(page)).toBeHidden();

    expect(errors).toEqual([]);
  });

  test('clears the preview when the channel changes', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    await expect(previewTitle(page)).toBeVisible();

    await page.getByRole('button', { name: channel('random'), exact: true }).click();
    await expect(previewTitle(page)).toBeHidden();

    expect(errors).toEqual([]);
  });
});

test.describe('settings', () => {
  /**
   * The regression test for the settings Context, and the reason it was written.
   *
   * Density is *set* in the Settings tab inside the rail and *read* by the channel
   * info panel on the opposite side of the app — sibling subtrees under `App`.
   * While each hook held its own state this only worked because `useSidebarMode`
   * dispatched a synthetic `StorageEvent` at itself to reach across. If the panel
   * stops responding to the toggle, that bridge has broken.
   *
   * Asserted as "some computed length changed" rather than against specific
   * classes, so a restyle doesn't fail a test about state propagation.
   */
  test('density set in the rail reaches the channel info panel', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    const panelHeading = page.getByRole('heading', { name: 'Channel info' });
    await expect(panelHeading).toBeVisible();
    const standard = await panelHeading.evaluate((el) => getComputedStyle(el).fontSize);

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Compact', exact: true }).click();

    await expect
      .poll(() => panelHeading.evaluate((el) => getComputedStyle(el).fontSize))
      .not.toBe(standard);

    expect(errors).toEqual([]);
  });

  test('theme, density and thread view all survive a reload', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    await page.getByRole('button', { name: 'Settings' }).click();
    await page.getByRole('button', { name: 'Light', exact: true }).click();
    await page.getByRole('button', { name: 'Compact', exact: true }).click();
    await page.getByRole('button', { name: 'Grid', exact: true }).click();

    await page.reload();
    await page.getByRole('button', { name: 'Settings' }).click();

    // The segmented control paints the selected option with Spark behind it, so
    // "which one is selected" is readable without a test id. Light-mode Spark is
    // #D98F1F. `threadView` is the one that matters most here — it had never
    // persisted at all before the Context, being local `useState`.
    for (const label of ['Light', 'Compact', 'Grid']) {
      const option = page.getByRole('button', { name: label, exact: true });
      await expect(option).toHaveCSS('background-color', 'rgb(217, 143, 31)');
    }

    expect(errors).toEqual([]);
  });
});
