import { expect, test, type Page } from '@playwright/test';
import {
  CHANNELS,
  EMPTY_STATE,
  PREVIEW_PANEL,
  THREADS,
  backToChannel,
  channel,
  collectBrowserErrors,
  composer,
  openPreview,
  openThreadTitle,
  replyButton,
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
 * The panel is the one door to the thread in full, in either view — and now it
 * actually leads somewhere. Opening replaces the whole channel region, so the
 * preview goes with it.
 *
 * Coming back is the half worth watching: `ChannelView` unmounts on the way in
 * and remounts on the way out, tearing down two `ResizeObserver`s and the preview
 * row each time. That is precisely the shape of bug this suite exists to catch,
 * and `tsc` cannot see any of it.
 */
for (const threadView of ['canvas', 'grid'] as const) {
  test(`the panel opens the thread and back returns — ${threadView}`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await seedSettings(page, { threadView });
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    await expect(openThreadTitle(page)).toHaveCount(0);

    await page.locator(PREVIEW_PANEL).click();
    await expect(openThreadTitle(page)).toBeVisible();
    // The region is replaced, so the panel and the threads behind it are gone.
    await expect(previewTitle(page)).toHaveCount(0);
    await expect(page.locator(thread(THREADS.pinned))).toHaveCount(0);
    // The right panel follows the main region.
    await expect(page.getByRole('heading', { name: 'Thread info' })).toBeVisible();

    await backToChannel(page, CHANNELS.threads).click();
    await expect(page.locator(thread(THREADS.pinned))).toBeVisible();
    await expect(openThreadTitle(page)).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Channel info' })).toBeVisible();

    expect(errors).toEqual([]);
  });
}

/**
 * The one wiring mistake here that would be completely silent.
 *
 * The dismiss X sits *inside* the panel, and the panel is the open affordance.
 * Without `stopPropagation` the X would open the thread on its way to closing
 * the preview — and since opening also removes the panel, the surface symptom
 * would be "the X works", with an entire screen change nobody asked for.
 */
test('the dismiss X closes the preview without opening the thread', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto('/');

  await openPreview(page, THREADS.pinned);
  await page.getByLabel('Dismiss preview').click();

  await expect(previewTitle(page)).toBeHidden();
  await expect(openThreadTitle(page)).toHaveCount(0);
  await expect(page.locator(thread(THREADS.pinned))).toBeVisible();

  expect(errors).toEqual([]);
});

/**
 * Optimistic append, and the invariants that hang off it. `replyCount` and
 * `participants` are derived from the message list rather than authored, so a
 * reply that lands without moving the count means something pushed onto
 * `messages` directly and the derivation was bypassed.
 */
test('sending a reply appends it and the count moves', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto('/');

  await openPreview(page, THREADS.pinned);
  await page.locator(PREVIEW_PANEL).click();
  await expect(page.getByText('42 replies')).toBeVisible();

  await composer(page).fill('bubble it is then');
  await replyButton(page).click();

  await expect(page.getByText('bubble it is then')).toBeVisible();
  await expect(page.getByText('43 replies')).toBeVisible();
  // The composer empties rather than keeping what was just sent.
  await expect(composer(page)).toHaveValue('');

  expect(errors).toEqual([]);
});

/**
 * The inversion that breaks quietly: unread clears on opening a thread in full
 * and **not** on previewing it. That rule is the only reason the preview kicker
 * can say `unread` honestly, and nothing enforced it before this view existed.
 */
test('opening clears unread; previewing does not', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto('/');

  const kicker = page.locator(PREVIEW_PANEL).getByText('unread');

  await openPreview(page, THREADS.unread);
  await expect(kicker).toBeVisible();

  // Close and peek again — a preview must not have consumed the state.
  await page.keyboard.press('Escape');
  await openPreview(page, THREADS.unread);
  await expect(kicker).toBeVisible();

  await page.locator(PREVIEW_PANEL).click();
  await expect(openThreadTitle(page)).toBeVisible();
  await backToChannel(page, CHANNELS.threads).click();

  await openPreview(page, THREADS.unread);
  await expect(previewTitle(page)).toHaveCount(0);
  await expect(kicker).toHaveCount(0);

  expect(errors).toEqual([]);
});

/**
 * One setting, three surfaces. `Layout` sizes the rail and the info panel and
 * picks the reply row, and switching it with a thread open swaps row components
 * mid-list — the same unmount shape as the canvas↔grid toggle above.
 */
for (const density of ['standard', 'compact'] as const) {
  test(`the reply list renders in ${density}`, async ({ page }) => {
    const errors = collectBrowserErrors(page);
    await seedSettings(page, { density });
    await page.goto('/');

    await openPreview(page, THREADS.pinned);
    await page.locator(PREVIEW_PANEL).click();

    await expect(page.getByText('bolt reads sharper at 16px')).toBeVisible();
    // A reply with attachments, in whichever tile size this layout draws.
    await expect(page.getByRole('img', { name: 'Attached image' }).first()).toBeVisible();

    expect(errors).toEqual([]);
  });
}

test('switching Layout with a thread open keeps the browser quiet', async ({ page }) => {
  const errors = collectBrowserErrors(page);
  await page.goto('/');

  await openPreview(page, THREADS.pinned);
  await page.locator(PREVIEW_PANEL).click();
  await expect(page.getByText('bolt reads sharper at 16px')).toBeVisible();

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Compact', exact: true }).click();

  // Still the same thread, still the same replies — a different row drawing them.
  await expect(openThreadTitle(page)).toBeVisible();
  await expect(page.getByText('bolt reads sharper at 16px')).toBeVisible();

  expect(errors).toEqual([]);
});

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
