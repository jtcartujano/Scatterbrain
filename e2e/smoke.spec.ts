import { expect, test, type Page } from '@playwright/test';
import {
  CHANNELS,
  EMPTY_STATE,
  PREVIEW_PANEL,
  THREADS,
  channel,
  collectBrowserErrors,
  openPreview,
  seedSettings,
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

  test('previews on the first click and closes on the second', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    const node = page.locator(thread(THREADS.pinned));
    await node.click();
    await expect(previewTitle(page)).toBeVisible();

    await node.click();
    await expect(previewTitle(page)).toBeHidden();

    expect(errors).toEqual([]);
  });

  /** A different thread swaps the panel over rather than closing it. */
  test('a second thread swaps the preview rather than closing it', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    await expect(previewTitle(page)).toBeVisible();

    await page.locator(thread(THREADS.plain)).click();
    await expect(previewTitle(page)).toBeHidden();
    await expect(
      page.locator(PREVIEW_PANEL).getByRole('heading', { name: 'new emoji pack: rough sketches' }),
    ).toBeVisible();

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

/**
 * The same paths again, against the other view.
 *
 * Worth repeating rather than trusting the canvas run, because `ThreadGrid` brings
 * its own `ResizeObserver` and its own effects, and this suite exists precisely for
 * the class of failure `tsc` and `oxlint` cannot see. The interaction it is
 * checking is deliberately identical — preview once, open twice, Esc or the X —
 * so if these ever need to diverge from the canvas block above, something has gone
 * wrong with the idea rather than the code.
 */
test.describe('thread grid', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page, { threadView: 'grid' });
  });

  test('loads without the browser complaining', async ({ page }) => {
    const errors = collectBrowserErrors(page);

    await page.goto('/');
    await expect(page.locator(thread(THREADS.pinned))).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('previews on the first click and closes on the second', async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await page.goto('/');

    const card = page.locator(thread(THREADS.pinned));
    await card.click();
    await expect(previewTitle(page)).toBeVisible();

    await card.click();
    await expect(previewTitle(page)).toBeHidden();

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
});

/**
 * Switching views is not a navigation: the panel, the row and the previewed thread
 * all belong to `ChannelView` rather than to either view, so a preview open on a
 * bubble is still open on the card. The unmount is the risky half — this is where a
 * `ResizeObserver` that throws on teardown would show up.
 */
test('the preview survives a switch from canvas to grid', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto('/');

  await openPreview(page, THREADS.pinned);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Grid', exact: true }).click();

  await expect(page.locator(thread(THREADS.pinned))).toBeVisible();
  await expect(previewTitle(page)).toBeVisible();

  expect(errors).toEqual([]);
});

/**
 * The panel is the one door to the thread in full, in either view. Its only
 * outward sign until 2.4 builds the open thread view is the log — which is also
 * why the dismiss X is checked here: it sits inside the panel, so without
 * `stopPropagation` it would open the thread on its way to closing the preview.
 */
for (const threadView of ['canvas', 'grid'] as const) {
  test(`clicking the preview panel opens the thread — ${threadView}`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    const opened: string[] = [];
    page.on('console', (message) => {
      if (message.text().startsWith('Open thread:')) opened.push(message.text());
    });

    await seedSettings(page, { threadView });
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    expect(opened).toEqual([]);

    await page.locator(PREVIEW_PANEL).click();
    await expect.poll(() => opened).toEqual([`Open thread: ${THREADS.pinned}`]);
    // Opening is not dismissing: the panel stays put until the thread view exists.
    await expect(previewTitle(page)).toBeVisible();

    await page.getByLabel('Dismiss preview').click();
    await expect(previewTitle(page)).toBeHidden();
    expect(opened).toHaveLength(1);

    expect(errors).toEqual([]);
  });
}

/** A channel with nothing in it. Both views draw the same two lines. */
for (const threadView of ['canvas', 'grid'] as const) {
  test(`an empty channel says so — ${threadView}`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await seedSettings(page, { threadView });
    await page.goto('/');

    await page.getByRole('button', { name: channel(CHANNELS.empty), exact: true }).click();
    await expect(page.getByText(EMPTY_STATE)).toBeVisible();
    await expect(page.locator(thread(THREADS.pinned))).toHaveCount(0);

    expect(errors).toEqual([]);
  });
}

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
