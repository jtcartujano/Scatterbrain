# Scatterbrain

How to work in this repo. What was decided and why is in `DECISIONS.md`; what's next and what's broken is in `ROADMAP.md`.

## Overview
Scatterbrain is a portfolio messaging app that combines server-and-channel organization with forum-style threading: a post in a channel creates a thread, so a channel's conversation is non-linear until a specific thread is opened. The primary channel view is a spatial thread canvas of thread nodes rather than a scrolling list, with an aligned grid as a selectable alternative. Personality: structured but casual, spatial and associative rather than strictly hierarchical — "scattered thoughts finding order."

## Current state
- **Mock data only.** Everything renders from `src/lib/mockData.ts`. No backend, no auth, no network.
- **Navigation is state-driven, not routed.** `activeChannelId` and `openThreadId` are `useState` in `src/App.tsx`; `activeView` and `expandedServerIds` live in `src/features/servers/ServerSidebar.tsx`. Views swap by conditional render. `react-router-dom` is installed with **zero imports**, so browser back/forward does nothing. Both ids are already the shape of a route param, so the conversion is mechanical — the route shape is **planned for Phase 3** (see `ROADMAP.md`).
- **Built:** server rail + channel list, Friends/Servers/Settings switcher, thread canvas (bubble view), grid view, thread preview panel, open thread view with composer and reply list, channel and thread info panels, settings Context, Playwright smoke + screenshot suites.
- **Not built:** Supabase (schema, auth, realtime), the new-thread flow, friends/DM data behind the UI, attachment kinds beyond images, routing.

## Scope
**v1:** servers, channels, thread-based messaging, direct messages, Supabase Realtime, auth, the Friends/Servers/Settings switcher, thread previews, optional thread descriptions.

**Not v1:** voice/video, moderation tooling, notifications, roles/permissions nuance beyond owner/admin/member.

**Later, tentative:** tag-based channel creation/sorting — feasibility and mechanics are all open, so don't design it yet.

Phases and sequencing: `ROADMAP.md`.

## Repository
- Remote: `https://github.com/jtcartujano/Scatterbrain.git` (`origin`)
- Default branch: `master`
- Package manager: npm

## Tech Stack
Versions live in `package.json` — don't duplicate them here.
- React + Vite
- Tailwind CSS
- Lenis — element-scoped smooth scrolling
- Geist — typography, self-hosted (see Fonts)
- React Router — installed, unused until Phase 3
- Supabase (PostgreSQL + Auth + Realtime) — planned backend, free tier
- Vercel — planned hosting

## Project Structure
Feature-based, not type-based — servers/channels/threads/auth each get their own components, hooks and queries.
```
src/
  features/
    servers/
    channels/
    threads/
    auth/           # empty; lands with Phase 3
  components/       # shared/primitive UI only (MainLayout, TopSwitcher)
  hooks/            # useSettings + SettingsProvider, useLenis
  lib/              # mockData today; supabase client later
  styles/tokens/    # colors, elevation, motion, radius, spacing, typography
e2e/                # Playwright specs + helpers
```
Planned but not yet on disk: `features/friends/`, `routes/`.

## Data model
**Server → Channel → Thread → Message**, plus users and memberships.

- **A thread's root post is its title plus optional description, not a message.** There is no body post, so `messages` holds replies only and `replyCount === messages.length`.
- **`description`** — optional, author-written, hard-capped at 140 characters (`THREAD_DESCRIPTION_MAX_LENGTH`). Enforce client-side with a live counter; mirror it in the DB with `CHECK (char_length(description) <= 140)`.
- **`participants` and `replyCount` are derived, never authored.** `toThread` expands a compact `ThreadSeed` and computes them, so the invariants hold by construction. In the DB they become a join and a denormalised counter.
- **`lastReadMessageId`** is derived on seed from `newReplies`, read once in `App.handleOpenThread` into `dividerAfterId`, then cleared alongside `isUnread`. The snapshot-before-clear is what lets `ReplyList` still draw the `new` divider — don't collapse it back into the view.
- **Canvas layout:** `position` and `size` persist (a curated layout with a fixed footprint keeps stored coordinates collision-free). `rotation` and `borderRadius` derive from an FNV-1a hash of the thread id via `getThreadAppearance` in `src/features/threads/threadLayout.ts` and are **never stored** — identical on every client. Coordinates live in a fixed 1000×760 logical plane (`THREAD_CANVAS`). Real UUIDs will reshuffle every blob shape once, at migration; expected, and only once.
- **Realtime scope:** new threads in a channel and new replies in an open thread are live. Presence is undecided.
- Unresolved model questions — server join mechanism, channel types, whether roles matter in v1, message edit history, presence indicators — are in `DECISIONS.md` → Open.

## Conventions

### Colour tokens
| Token | Role | Dark | Light |
|---|---|---|---|
| Void | app background | `#13141F` | `#F7F7FB` |
| Surface | panels, sidebars, bubbles | `#1C1E30` | `#FFFFFF` |
| Ink | primary text | `#ECEDF5` | `#14151F` |
| Mist | secondary text / borders | `#8B8DA8` | `#63657E` |
| Spark | primary accent — active/selected | `#F5B942` | `#D98F1F` |
| Signal | secondary accent — unread/presence | `#4FD1C5` | `#12958A` |

Every overlay, ring and shadow derives from its role colour via `color-mix`, so they flip with the theme from one place (`src/styles/tokens/colors.css`, `elevation.css`).

### Fonts
- **Geist Sans** for all UI text; **Geist Mono** for technical/timestamp text (channel handles, thread ids, timestamps, ages) where it adds texture.
- **Self-hosted via `@font-face`** in `src/index.css`, pointing at `public/fonts/Geist-Variable.woff2` and `GeistMono-Variable.woff2`. Not a Google Fonts request.
- The `geist` npm package is installed and **never imported** — don't add an import; it's a removable dependency (see `ROADMAP.md` known gaps).
- Use `--font-sans` / `--font-mono` from `src/styles/tokens/typography.css`.

### Dark mode
- Dark-mode-first: designed dark, light derived from it, never the reverse.
- Tailwind class-based dark mode. Default to system preference, with a stored value winning over it and an absent one falling back to it.
- Persistence is `localStorage`, read through the settings Context — the single place that changes when it moves to the user profile after auth.

### Settings
- **One `localStorage` key per setting, never a serialised blob.** `scatterbrain-theme`, `scatterbrain-sidebar-mode` (the `density` setting — key and values predate the rename), `scatterbrain-thread-view`. Settings arrive one at a time and a missing key just falls back; a blob needs versioning the first time its shape changes.
- `src/hooks/useSettings.ts` holds types, context and hook; `SettingsProvider.tsx` holds the provider, mounted at the root in `main.tsx`. The split is purely to keep `react/only-export-components` quiet.
- The provider reads storage in a `useState` initialiser — anything seeding it must run before page scripts.
- A real `storage` listener remains and means exactly cross-tab sync.
- **`density` is labelled `Layout` in the UI** and reaches three surfaces: rail chrome, right-panel chrome, and the reply row layout (Standard = grouped blocks, Compact = one row per reply). Stated cost: there is no way to have compact chrome with grouped replies.

### Shape language — by surface, not by content
- **Thread nodes on the canvas:** irregular organic blob radii, derived per thread. The signature shape; never on chrome.
- **Chrome** — rails, rows, panels, settings controls, *and grid thread cards:* conventional rounded rects, 4–12px (`src/styles/tokens/radius.css`), pills at `--radius-full`.
- So a thread is drawn as a blob on the plane and as a card in the grid. That's the rule scoped, not broken.

### Motion
- **Lenis handles scroll only**, vertical only (it takes one orientation), and is **element-scoped** because the app shell is a fixed-height frame that never scrolls. Three callers: `ThreadCanvas`, `ThreadGrid`, `ThreadDetailView`. Horizontal scrolling stays native.
- **Two curves, meaning different things.** `--ease-standard` (`cubic-bezier(0.4,0,0.2,1)`) is the interface curve — rows, hovers, colour. `--ease-soft` (`cubic-bezier(0.22,0.8,0.28,1)`) is for anything with weight that travels — the panel arriving, a canvas node latching, the plane scrolling to seat a node. Nothing accelerates into a stop, so the soft curve's long tail is the whole of its character.
- **Durations** (`src/styles/tokens/motion.css`): `--duration-fast` 150ms colour crossfades and short fades · `--duration-base` 200ms state opacity · `--duration-expand` 240ms the preview row and a canvas node latching · `--duration-panel` 260ms the panel's own arrival · `--duration-plane` 300ms a deliberate plane scroll.
- **The 240ms latch is canvas-scoped.** A grid card latches at **150ms on `--ease-standard`** — the soft curve is for weight travelling across a plane, and a card rising 6px in place has neither.
- No bounces, no spinners, no staggers.
- **The preview row animates between measured pixel heights, not `0fr → 1fr`.** Same property, but `1fr → 1fr` has nothing to interpolate, so swapping content inside an already-open row would snap.

### Images — the size ladder encodes distance
canvas fan 32–48px (a hint) → preview panel 60px 3-up grid (the peek) → grid card 24px tiles + `+N` chip (the index) → open thread header 96px with all of them shown, no chip, because there is nothing further to open. The fan belongs to the canvas node alone; neither other surface reuses it.

### Attachments
`Message.attachments` is a **single-variant discriminated union** (`kind: 'image'` only). Keep the discriminant: new kinds arrive additively and turn every unhandled consumer into a compile error — a checklist rather than a hunt. The slot standardises **position and indent, not tile shape**: a tile for an image or video, a bar for a voice note, a row for a file. Attachments sit under the reply text indented to the text column, 96px tiles in Standard and 64px in Compact, and **wrap rather than collapsing behind a `+N`**.

### Descriptions
Never rendered on a bubble at any size. The bubble face carries the title, the image fan or participant avatars, and the mono metadata row, and nothing else. A description appears only in the preview panel and the open thread view.

## Deliberate, don't change
Choices that look like bugs or omissions. Reasoning in full is in `DECISIONS.md`.

- **No achromatic ring on a previewed plain grid card** — on an aligned surface the fill and the lift are enough.
- **No tether in the grid** — over aligned cards a hairline reads as a stray rule.
- **No status dot on a grid card** — a rect reaches its own corners, so a dot would sit on the ring and read as a notch in it.
- **The canvas status dot sits on the blob, not at its bounding-box corner** — on an organic shape the box corner is empty space.
- **One outset ring per thread, ever** — on a previewed pinned or unread node the Spark/Signal ring survives, and fill/lift/shadow carry selection.
- **Unread is not sorted up in the grid** — it's a state, and its ring finds it wherever it lands.
- **No section header above the pinned cards** — the ring says it; a label would turn the first row into a rail.
- **The grid preview lift is a constant 10×6px whatever the slot** — a percentage made the 2×2 look like it was shoving its row.
- **No same-author collapse in replies, in either layout** — the dense row has no author header to avoid repeating, which is the only thing a collapse buys.
- **Back navigates to the channel explicitly, never `history.back()`** — "up to this thread's channel" is a fixed destination and always right; "wherever you came from" isn't.
- **No loading state in the open thread view** — the panel you clicked already held title, description, participants and count; only the replies are new.
- **The native scrollbar is never hidden without the drawn indicator replacing it** — with the plane usually fitting, the indicator is the only thing that says the content continues. (Vertical only today; the horizontal half is a known gap in `ROADMAP.md`.)
- **Unread clears on opening a thread in full, never on previewing it** — it's what lets the preview kicker say `unread` honestly. There's a smoke test for the inversion specifically.
- **The empty channel has no button** — New Thread is already in the header a few inches above, and a second call to action would compete with the one that's always there.
- **The open thread content column fills the region; the measure lives on the prose** (58ch on a description, 80ch on a reply) — a fixed column read as half-empty and left-pinned on a wide window.
- **`--press-scale` is unused on purpose** — the commit press went with the old click model; the token stays for whatever wants it next.
- **`ThreadInfoPanel` is a separate component, not a branch inside `ChannelInfoPanel`** — the two describe different subjects.

## Commands
```
npm run dev
npm run build      # tsc -b (app, vite config and e2e) then vite build
npm run lint       # oxlint
npm test           # Playwright smoke suite
npm run shots      # regenerate the screenshot set in e2e/shots/
```
Supabase/Vercel CLI commands — TBD once wired up.

## Testing
Playwright, in two halves that are deliberately not the same thing:

- **`e2e/smoke.spec.ts` asserts.** It drives the paths a person takes and requires the browser to stay silent — `pageerror` and `console.error` are collected and must be empty. That's the point of it: `tsc` and `oxlint` structurally cannot see a null context throw, a conditionally-called hook, an effect that loops, or a `ResizeObserver` that throws on unmount, and the build stays green while the app is broken. `console.log` is deliberately *not* collected, because the new-thread stub logs on purpose until the flow is built.
- **`e2e/shots.spec.ts` produces pictures and asserts almost nothing.** Whether the 45% dim sits right against the dot grid is a judgement call; the job is to put it in front of someone. Output lands in `e2e/shots/`, gitignored.

Notes that matter:
- **It drives the Chrome already installed** (`channel: 'chrome'`), so there's no ~100MB Chromium download and no browser binary anywhere near the repo. CI has no system Chrome and falls back to the bundled one, which needs `npx playwright install --with-deps chromium` as a step first.
- **Waiting on `toBeVisible()` for the preview panel is a trap**, and it silently produced a screenshot of a panel that wasn't there. The row's height is React state fed by a `ResizeObserver` and starts at 0; a child of a zero-height `overflow-hidden` row still reports a box of its own, so the panel reads as visible while clipped to nothing. **Use `openPreview()` in `e2e/helpers.ts`** — it waits on the row's real height — rather than clicking a bubble directly.
- **Settings are seeded straight into localStorage** by `seedSettings()` via `addInitScript`, so a light-mode screenshot doesn't need four clicks first. It has to run before the page scripts, because the provider reads storage in a `useState` initialiser.
- **No visual-regression baselines, on purpose.** Screenshot comparison baselines are OS- and browser-specific — one generated on Windows will not match Linux CI — and these surfaces are still moving. Revisit once they settle.
- Specs are typechecked by `tsconfig.e2e.json`, referenced from the root `tsconfig.json` so `npm run build` covers them. It carries both `ES2023` and `DOM` libs, unlike the other two projects: the specs run in Node but `page.evaluate` callbacks compile for the browser.
- Everything runs against mock data. Phase 3 will need this revisited once there's auth and seeded DB state to arrange first.

## Pointers
- **`DECISIONS.md`** — what was decided, the short why, what it beat, what's deferred, and an Open section. Check it before re-litigating anything.
- **`ROADMAP.md`** — phases, what's next, and the verified list of known gaps.
- **`.claude/skills/scatterbrain-design/`** — the design system: tokens, typography, guidelines, components, and a `scatterbrain-app` UI kit. Gitignored and local; design passes run in-repo against the running code and `e2e/shots/`.
