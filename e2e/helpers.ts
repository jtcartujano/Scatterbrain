import { expect, type Page } from '@playwright/test';

/**
 * Collects everything the browser complained about while a test ran.
 *
 * This is the whole reason the suite exists. `tsc` and `oxlint` cannot see a null
 * context throw, a hook called conditionally, an effect that loops, or a
 * `ResizeObserver` that throws on unmount — the build stays green and the app is
 * broken. The browser sees all of it.
 *
 * `console.log` is deliberately not collected: the open-thread and new-thread
 * stubs both log on purpose, and will until 2.4 and 2.5 replace them.
 *
 * Call before the first `goto` — listeners attached later miss whatever happened
 * during load, which is exactly when a provider blows up.
 */
export function collectBrowserErrors(page: Page): string[] {
  const errors: string[] = [];

  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });

  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });

  return errors;
}

/**
 * The preview panel is the only `<section>` in the app. Worth scoping to, because
 * the panel's title and the bubble's title are the same string — an unscoped
 * heading lookup matches both and trips strict mode.
 */
export const PREVIEW_PANEL = 'section';

/**
 * A thread node, by the `data-thread-id` both views put on every thread — a blob
 * on the canvas, a card in the grid. Everything here that drives a thread works
 * against either view for free, which is the point: the two are alternative
 * drawings of one thing, not different screens.
 */
export const thread = (id: string) => `[data-thread-id="${id}"]`;

/**
 * Channel buttons read as "# general" to the accessibility tree — the `#` is a
 * span inside the button, so it lands in the accessible name.
 */
export const channel = (name: string) => `# ${name}`;

/** Below this the row has begun opening but has not arrived. */
const OPEN_ROW_HEIGHT = 100;

/**
 * Clicks a thread and waits for the preview to be *genuinely* open.
 *
 * `expect(section).toBeVisible()` is not enough, and the difference is not
 * academic — it silently produced a screenshot of a panel that wasn't there. The
 * row's height is React state fed by a `ResizeObserver` in `ChannelView` and
 * starts at 0; a child of a zero-height `overflow-hidden` row still reports a box
 * of its own, so the panel reads as *visible* while it is clipped to nothing.
 * The row is what has to have grown, so the row is what to wait on.
 */
export async function openPreview(page: Page, threadId: string) {
  await page.locator(thread(threadId)).click();
  await expect
    .poll(() =>
      page.locator('.preview-row').evaluate((el) => el.getBoundingClientRect().height),
    )
    .toBeGreaterThan(OPEN_ROW_HEIGHT);
}

/**
 * `t1` is pinned and has a description; `t5` is plain and has one. Between them
 * they cover the state-ring case and the achromatic held-ring case, which is the
 * pair worth looking at. `t9` is the only thread with images.
 */
export const THREADS = { pinned: 't1', unread: 't2', plain: 't5', images: 't9' } as const;

/**
 * The open thread view, by its title. Nothing else in the app renders an `h1` —
 * the channel header is an `h2` and so is the preview panel — so this is both
 * the cheapest identifier and the one that says what it means.
 */
export const openThreadTitle = (page: Page) => page.getByRole('heading', { level: 1 });

/** Up to the channel. Labelled rather than matched on "← #brainstorm". */
export const backToChannel = (page: Page, name: string) =>
  page.getByLabel(`Back to ${name}`);

/** The composer's field and its send button. */
export const composer = (page: Page) => page.getByLabel('Write a reply');
export const replyButton = (page: Page) =>
  page.getByRole('button', { name: 'Reply', exact: true });

/**
 * `brainstorm` (c4) is the only channel with threads, so anything else is the
 * empty state. Both views draw one, and neither did before the grid landed.
 */
export const CHANNELS = { threads: 'brainstorm', empty: 'general' } as const;

/** Both views draw the same copy when a channel has nothing in it. */
export const EMPTY_STATE = 'No threads here yet';

type Settings = {
  theme?: 'light' | 'dark';
  density?: 'standard' | 'compact';
  threadView?: 'canvas' | 'grid';
};

/**
 * Puts settings straight into localStorage before the app boots, so a screenshot
 * of light mode doesn't need four clicks through the Settings tab first.
 *
 * Writes the same keys the provider reads. `addInitScript` runs before page
 * scripts on every navigation, which matters because the provider reads storage
 * in a `useState` initialiser — set it afterwards and the first paint is wrong.
 */
export async function seedSettings(
  page: Page,
  { theme = 'dark', density = 'standard', threadView = 'canvas' }: Settings = {},
) {
  await page.addInitScript(
    ([themeValue, densityValue, viewValue]) => {
      localStorage.setItem('scatterbrain-theme', themeValue);
      localStorage.setItem('scatterbrain-sidebar-mode', densityValue);
      localStorage.setItem('scatterbrain-thread-view', viewValue);
    },
    [theme, density, threadView],
  );
}
