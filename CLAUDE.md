# Scatterbrain

## Overview
Scatterbrain is a portfolio messaging app combining server-and-channel organization with forum-style threading: posts in a channel create threads, so a channel's conversation is non-linear until a specific thread is opened. Built to demonstrate distinctive product/UX thinking (a non-list thread display, realtime data modeling) rather than a chat-app clone. Personality: structured but casual, spatial and associative rather than strictly hierarchical — "scattered thoughts finding order," not a corporate chat tool.

## Scope
**In for v1:**
- Servers, channels, thread-based messaging, Supabase Realtime updates, auth
- A Friends / Servers / Settings top-level switcher (new — see Layout)
- Direct messages (promoted from the later phase) — Friends still ships first as a list/discovery surface, but DM threads follow within v1 rather than after it. If thread messaging is functional, DMs are the same machinery pointed at two people.
- Thread previews and optional thread descriptions (see Layout and Data & Backend)

**Planned, but later phase (not part of the initial build):**
- Tag-based channel creation/sorting (organizing or auto-sorting channels by tags derived from existing conversation content) — tentative idea only. Feasibility, mechanics, and whether people would actually use it are all open questions — revisit and scope properly before designing it.

**Explicitly not v1** (revisit later, don't design deeply yet):
- Voice/video
- Moderation tooling
- Notifications
- Roles/permissions nuance beyond owner/admin/member

## Repository
TBD — add repo URL, default branch, and package manager once set.

## Tech Stack
- React + Vite (19.2.8 + 8.2.0)
- Tailwind CSS (4.3.3)
- React Router (7.18.2)
- Lenis (1.3.25) — smooth scrolling
- Geist (1.7.2) — typography
- Supabase (PostgreSQL + Auth + Realtime) — planned backend, free tier
- Vercel — planned hosting

## Project Structure
Feature-based, not type-based — servers/channels/threads/auth each need their own components, hooks, and queries:
```
src/
  features/
    servers/
    channels/
    threads/
    friends/       # new — Friends list first, DM threads follow within v1
    auth/
  components/       # shared/primitive UI only
  lib/              # supabase client, query client
  hooks/
  routes/
```

## Data & Backend
Domain model: **Server → Channel → Thread → Message**, plus **Users & memberships**.
- Servers — owner, members, join mechanism (invite link vs. public directory: TBD)
- Channels — belong to a server; whether channel "types" exist beyond the default: TBD
- Threads — **decided:** a thread's root post is its *title plus optional description*, not a message. There is no body post, so `messages` holds replies only and `replyCount` is simply their number. `description` (optional, author-written, **140 character hard cap** — enforce client-side with a live counter and mirror it in the DB with a `CHECK` constraint), `authorId` and `createdAt` are all modelled and populated in the mock data.
- Messages/replies — belong to a thread; author, timestamp, edit history: TBD. In mock data `participants` and `replyCount` are derived from the replies rather than authored, so they can't drift; in the DB they become a join and a denormalised counter.
- Thread canvas layout — **decided:** `position` and `size` persist (curated layout; a fixed footprint keeps stored coordinates collision-free), while `rotation` and `borderRadius` are derived deterministically from a hash of the thread id and are *not* stored. Coordinates live in a fixed logical plane — `THREAD_CANVAS` in `src/features/threads/threadLayout.ts`, currently 1000×760 — so every client agrees on the space. The blob-radius generator preserves the authored aesthetic by pairing opposite corners to sum to 100%. Note real UUIDs will reshuffle every blob shape once, at migration.
- Users & memberships — roles (owner/admin/member); whether roles matter for v1 at all: TBD
- Friends/DMs (now v1) — needs a friendship/relationship table and a DM thread type; not modeled yet. The UI surface partly exists already (a `DirectMessage` type and a sidebar DM section), with nothing behind it.

Realtime scope (decide explicitly what's live vs. refetch-on-load):
- New threads appearing in a channel — realtime
- New replies in an open thread — realtime
- Presence/online indicators — TBD; would map to the Signal accent color if built

Auth: Supabase Auth. Email/password is the simplest path for a demo; OAuth adds polish but also review friction. RLS policies per table: TBD, sketch once the domain model above is locked.

**Free-tier constraints worth designing around:**
- Supabase — 500 MB database, 1 GB storage, 5 GB egress, 50,000 MAU, 500,000 edge-function invocations, up to 2 active projects, no backups, **projects pause after 7 days of inactivity** (mitigate with a scheduled keep-alive, e.g. a free GitHub Actions cron hitting the deployed app). Realtime: 200 peak concurrent connections, 2M messages/month — not a real constraint for a demo.
- Vercel Hobby — 100 GB Fast Data Transfer, 1M Edge Requests, 6,000 build-execution minutes, 1M function invocations, up to 200 projects/month — restricted to personal/non-commercial use, which this satisfies.

## Fonts
- Geist Sans — all UI text
- Geist Mono — technical/timestamp text (channel handles, thread IDs, timestamps) where it adds texture
- Load via the `geist` npm package (self-hosted, simplest with Vite) — not a Google Fonts request

## Dark Mode
- Dark-mode-first: designed dark, light mode derived from it, not the reverse
- Tailwind class-based dark mode
- Default to system preference; manual toggle — **persistence is localStorage** (`scatterbrain-theme`), read through the settings Context, with a stored value winning over the system preference and an absent one falling back to it. Moving it to the user profile once auth exists is still the plan, and the Context is the single place that changes

## Colour Tokens (Light / Dark)
| Token | Role | Dark | Light |
|---|---|---|---|
| Void | app background | `#13141F` | `#F7F7FB` |
| Surface | panels, sidebars, bubbles | `#1C1E30` | `#FFFFFF` |
| Ink | primary text | `#ECEDF5` | `#14151F` |
| Mist | secondary text / borders | `#8B8DA8` | `#63657E` |
| Spark | primary accent — active/selected | `#F5B942` | `#D98F1F` |
| Signal | secondary accent — unread/presence | `#4FD1C5` | `#12958A` |

Deliberately avoided: cream-background/terracotta-serif, near-black/single-neon-accent, and broadsheet/hairline-rule layouts — all read as generic-AI-app defaults for this genre.

## Layout
- **Top-left switcher (new):** Friends / Servers / Settings — three buttons in a horizontal row, styled like the row of small server icons across the top of the rejected 2c ("merged panel") draft. Sits above/alongside the server rail regardless of which rail layout is active.
- **Server rail + channel list:** two approved layouts, planned as a user-facing settings toggle (same pattern as the thread-view toggle below) rather than a one-time pick:
  - *Accordion* — single column; one server's channels expand in place at a time; full server names, not icon-only
  - *Unified compact list* — no separate icon rail; dense text list, servers as section headers, several can stay expanded at once
  - Both use full server names (not two-letter marks) and distinct treatment for unread / mention / invite states, built on shared interaction logic so they can sit behind one toggle
  - Rejected: blob rail (still read as Discord regardless of icon shape), dot-cluster rail (two-letter marks carried too little information), merged single-panel rail (too cramped), flyout rail (didn't stick)
- **Main content:** thread canvas — bubble/node view is the primary approved treatment (not a scrollable list); the grid alternative is **built** and selectable. Settings owns the toggle outright — the duplicate channel-header pill is gone, so there is one view toggle, not two. `threadView` is real shared state, persisted, and now renders something either way. **The grid cell is a rounded rect at chrome radii, not a blob** — see Design Conventions for why that scopes the shape rule rather than breaking it.
- **Grid view (decided, built):** four columns at every width — the column floats with the region, rows are a fixed 116px, gutters 16, inset 16, `grid-auto-flow: dense` so a two-wide card doesn't leave holes behind it. The floor is **660px**: under it the region scrolls sideways, as the canvas plane does, rather than dropping to fewer columns. `size` survives as a footprint in slots — `large` spans two columns, the pinned large thread takes 2×2, medium and small are both 1×1 (so in this view `size` is effectively "large or not"), and the title steps 14.5 / 13.5 / 12.5px with the slot. The face carries exactly what a bubble carries and no more — a card has more room and the room is deliberately not spent, because a second lowercase line competes with the title, the author is already the first disc in the stack, and the channel is in the header. What changes is composition: left-aligned, title on top with a **flat 3-up image gallery** beside it where the bubble fans its images, then one fixed 28px footer row with the participant stack left and the mono row right. Pinned and unread are carried by the **ring alone** — a rect reaches its own corners, so the canvas's derived status dot would sit on top of the ring and read as a notch in it. The previewed card takes the canvas's mark — `--fill-subtle`, a lift, a raised shadow, others to 45% — with three differences that are the design's, not oversights: the lift is a **constant 10×6px** whatever the slot (a percentage made the 2×2 look like it was shoving its row), the shadow is `--shadow-bubble-raised` rather than `-lifted` because there is no plane here to float above, and a previewed card with no state ring gets **no achromatic `--ring-held`** — on an aligned surface the fill and the lift are enough. No tether: drawn and dropped, because over aligned cards it read as a stray rule. Sort is pinned first, then most recent activity, with no section header — the ring says it, and a label would turn the first row into a rail; unread is *not* sorted up, it is a state and its ring finds it wherever it lands. Overflow counts (`+4` members, `+3` images) sit on `--fill-chip` (Ink 18%) rather than the `--fill-mist` the bubble and panel use, so the chip reads as a chip against Surface in both themes.
- **Empty channel (decided, built, both views):** "No threads here yet" over "A post in this channel starts one." Centred, Ink then Mist, no glyph and no button — New Thread is already in the header a few inches above, and a second call to action here would compete with the one that's always there. The grid shows plain Void behind it; the canvas keeps its dot grid.
- **Settings are a single Context** (`src/hooks/useSettings.ts` + `SettingsProvider.tsx`), mounted at the root. Theme, density and thread view each persist under their own localStorage key — one key per setting, because settings arrive one at a time and a missing key just falls back, where a serialised blob would need versioning and migration the first time the shape changed. This replaced three pieces of per-component state that only worked while each was read by exactly one component: `density` is read by both the sidebar and the right panel, and `threadView` is set in the Settings tab but read over in the main content region. The synthetic `StorageEvent` that used to bridge those siblings is gone; a real `storage` listener remains and now means what it says — cross-tab sync only.
- **Thread preview panel (decided, built):** clicking a thread once opens a preview occupying the **top half of the main content region**; the view below persists in the lower half, compressed and scrollable. Same peek-then-commit idea as the right panel below, but split horizontally so you never lose your place. Preview contents: a mono kicker (channel, then `pinned` / `unread`), title, full description, participants as avatars **and names**, reply count, last activity, and an image grid if present — and since descriptions never appear on bubbles, this is the first place one is ever seen. Dismissal is **decided**: Esc, an X at the panel's top-right, or clicking the previewed thread again. Still open: whether the split is a fixed 50/50 or content-sized up to a cap — it currently sizes to content, which stands as the provisional answer until the open thread view exists and there's real content to judge against.
- **Which click does what (decided, built, revised):** a **node toggles its own preview** — click it to open the panel, click the same one again to put it away, click a different one to swap the panel over. **The panel itself is the door to the thread in full**: clicking anywhere on it opens the thread (a console log until 2.4 builds the open thread view). This moved off the node, where a second click used to mean "open": with no thread view built, that click produced no visible change whatsoever, and a thread that looks identical after you click it reads as broken. There is still exactly **one** open affordance and it is still not a button — the whole panel is the target, because a button would have to sit somewhere and every place it could go either competes with the title or crowds the dismiss X. The X stops propagation, dismissing being the one thing you can do on the panel that isn't opening. This supersedes the earlier framing that "the panel has no open affordance of its own — the thread below it is the affordance": the count of doors is unchanged, only which surface carries it.
- **The commit press went with it.** A previewed node used to dip to `--press-scale` (0.985) for 130ms on the second click, explicitly "so committing reads as a gesture rather than nothing". The second click now collapses the panel and drops the node out of its lift, which is not nothing, and a dip on the way there fought both. The token stays for whatever wants it next.
- **Canvas compression (decided):** the plane **zooms out** as the panel shortens the canvas — `scale = max(0.72, min(1, canvasHeight / 760))`, so on a tall window nothing happens and the zoom only engages once the canvas is genuinely shorter than the plane. The floor is legibility: the 10px mono row lands at 7.2px there, and whatever the floor cuts off, the canvas scrolls for. Three details are load-bearing, all learned the hard way:
  - **The canvas takes its new height in a single frame and is pushed down by the growing panel.** Left to squeeze across the animation, the frame contracting around the field reads as a mistake rather than a zoom.
  - **A transform is invisible to layout**, so the plane sits inside a sizing box carrying the scaled dimensions. Without it the scroll container still measures 1000×760 and offers scrollbars for content that plainly fits.
  - **The dot grid lives on that sizing box and scales as a real length** (`22 × scale`), not through the transform. It travels with the nodes, it stays crisp at any zoom rather than moiréing, and it is what makes the zoom read as a zoom.

  Thread `position` values stay absolute pixels throughout, and the browser hit-tests through the transform — nothing undoes the scale to know what was clicked. Drag-to-place, when it exists, will need the inverse. The plane is **centred horizontally and scaled about its own top centre**, so the zoom converges on the middle of the canvas; the canvas is usually wider than the 1000px plane, and anchoring left pinned the field to one edge and pulled it further that way on every zoom. Vertically it stays top-aligned, which costs nothing — whenever the plane is zoomed it fills the height exactly.
- **Both views draw their own scrollbar.** The native one is hidden (`.no-scrollbar`) and replaced by a 3px Mist indicator at the right edge, sized and placed from the scroll position and shown only when there is more content than fits — on the canvas, exactly when the scale floor has bound. Lenis does the scrolling either way. The rule is that the native bar is never hidden without something taking its place: with the plane usually fitting, the indicator is the only thing that says the canvas continues. The grid matches it rather than scrolling natively — two views of one region should scroll the same way, and the rule is about takeover, not about dots. **Known gap:** this covers the vertical bar only. Both views can overflow *horizontally* (the plane past a narrow window, the grid under its 660px floor) with the native bar hidden and nothing standing in for it.
- **The previewed node (decided):** subtle fill, the derived rotation with a 1.05 lift, and a heavier lifted shadow; every other node drops to 45%. A previewed node with no state of its own also takes a 1.5px achromatic ring at Ink 24% — but **a bubble never carries more than one outset ring**, so on a pinned or unread node the Spark/Signal ring is the one that survives and the rest of the treatment carries selection. A **tether** runs from the panel's edge down to the node — frame geometry, not node decoration, with no ceiling on its length: with the plane zoomed out a node can be anywhere, and a hairline over a canvas at 45% still reads as a pointer.
- **The status dot sits on the blob, not at its bounding-box corner.** Its offset is derived from the same corner percentages as the border radius — the point 45° along the top-right quarter-ellipse, nudged 3px inward — and expressed as a percentage, so it holds when a two-line title grows the bubble past its `minHeight`. On an organic shape the box corner is empty space, so anchoring there leaves the dot floating; deriving it means the placement varies per thread the way the designs draw it, and survives ids becoming UUIDs.
- **Unread clears on opening a thread in full, not on previewing it.** This is what lets the preview kicker say `unread` honestly. No read-state machinery exists yet; it lands with the open thread view.
- **Optional right panel:** thread/channel participants and info, collapsible

## Section Structure
Rough route shape (routes/pages, not component sections):
- `/servers/:serverId/channels/:channelId` — thread canvas
- `/servers/:serverId/channels/:channelId/threads/:threadId` — open thread
- `/friends` — new; friend list/discovery first, DM threads follow within v1
- `/settings` — new, top-level per the switcher above
- Auth routes, server-discovery/landing route — TBD

## Design Conventions
- **Shape language is deliberate and split by role:** thread nodes *on the canvas* use irregular organic blob radii (a signature shape, not shared with UI chrome); rail/list/panel chrome uses conventional rounded rects, roughly 8–14px radius. **The grid view's thread cards take the chrome radii**, which is a scoping of this rule rather than an exception to it: the blob is the *canvas node's* signature and earns it on a scattered spatial plane, where the grid exists for the opposite reason — scanning a channel in order — and organic radii plus per-node rotation fight the alignment that is the only thing a grid is for. So the rule is by surface, not by content: a thread is drawn as a blob on the plane and as a card in the grid
- Icon set: TBD — `lucide-react` pairs well with the stack, not yet decided
- Spacing scale, component naming/composition rules: TBD
- Motion: Lenis handles scroll only — and now actually does, via `useLenis`, pointed at the thread canvas. The app shell is a fixed-height frame that never scrolls, so Lenis is scoped to an element rather than the window; the canvas is its only caller today. Vertical only (Lenis takes one orientation), so horizontal canvas scrolling stays native. The preview panel set the rest of the house pattern. **Two curves, and they mean different things:** `--ease-standard` (`cubic-bezier(0.4,0,0.2,1)`) is the interface curve for rows, hovers and colour; `--ease-soft` (`cubic-bezier(0.22,0.8,0.28,1)`) is for anything with weight that travels — the panel arriving, a node latching, the plane scrolling to seat a node. Nothing here accelerates into a stop, so the soft curve's long tail is the whole of its character. Durations: **240ms** expand/collapse and a *canvas* node latching, **260ms** the panel's own arrival, **300ms** a deliberate plane scroll, **200ms** state opacity, **150ms** colour crossfades and short fades. No bounces, no spinners, no staggers. The 240ms latch is **canvas-scoped**: a grid card latches at **150ms on `--ease-standard`**, because the soft curve's long tail is for something with weight travelling across a plane and a card that rises 6px in place has neither. Note the row animates between measured *pixel* heights rather than `0fr → 1fr`: same property, but `1fr → 1fr` has nothing to interpolate, so swapping content inside an already-open row would snap. Accordion/list expand-collapse still has no built implementation, but inherits these timings.
- Fan-of-three-images preview inside thread bubbles — **built**: playing-card style overlap, each card rotated a few degrees, with a fourth "more" card using a blank grey-to-white gradient instead of an image. Cards are 32/40/48px by bubble size. The fan is the *canvas node's*, like the blob: neither other surface reuses it. The preview panel lays the images out flat as a 3-up grid of 60px tiles, because the fan is a hint that there's something to look at and the panel is where you actually look; the grid card puts three 24px tiles and a `+N` chip in its title row, because a fan's rotation fights the alignment a grid exists for.
- Click-to-preview/click-the-peek-to-open is **built, and identical in both views** — see "Which click does what" under Layout. It belongs to the channel region rather than to either view: the panel, the row geometry and the previewed thread all live in `ChannelView`, so a preview open on a bubble is still open on the card after a toggle, and `threadView` picks only what goes in the slot.
- Thread descriptions do **not** render on bubbles at any size — the bubble face carries title, image fan or participant avatars, and the mono metadata row, and nothing else. A description appears only in the thread preview panel and the open thread view. The 140-character cap stands (it's in the data model and mirrors to a DB `CHECK`), but note the rationale shifted: it was originally chosen so a bubble never had to truncate, and now serves to keep the preview brief.

## Notes
- Claude Design and this project don't share context automatically. Claude Design is its own product with its own projects — not Claude.ai Projects — and has no custom-instructions or knowledge-base feature. The hand-off splits in two: **tokens, typography and components** live in the org-level Claude Design **design system (UI kit)**, which new projects inherit once it's published; **prose rules** (shape language, rejected directions, standing decisions) have no home there and go in each brief. HTML exports of approved drafts are the source of truth for "current state" and get attached per project.
- Decision log (rail): blob → rejected · dot-cluster → rejected · merged single-panel → rejected · flyout → rejected · accordion → approved · unified compact list → approved (toggle planned)
- Decision log (thread view): bubble → approved · grid → approved (toggle planned) · image fan → built · preview panel → approved, top-half split · descriptions on bubbles → rejected, preview-only · preview dismissal → Esc + top-right X + clicking the previewed thread again · click model → **revised**: the node toggles its own preview, the panel is the door to the thread in full (was: second click on the node opens) · commit press → dropped with it · canvas compression → plane zooms out, scale floored at 0.72, centred horizontally, canvas height snaps and slides rather than squeezing · canvas scrollbar → native hidden, 3px Mist indicator in its place · previewed node → fill + lift + lifted shadow, others to 45%, achromatic ring only when no state ring · tether → frame-level, panel edge to node, no length ceiling · scroll → conditional nudge only when the scale floor binds · status dot → derived from the blob's top-right curve, not the box corner · panel kicker → channel + state, all Mist, no display ID · panel images → 3-up grid, not the fan · participant names in panel → approved · author/creation time in panel → rejected (placement settled if ever ratified: one mono line under the title)
- Decision log (grid view): grid cell → rounded-rect card at chrome radii, **not** a blob · rotation → dropped (a grid is ordered; rotation fights alignment) · click behaviour → identical to the canvas, whatever the canvas's is · canvas machinery in the grid → none (no plane zoom, no scale floor, no tether, no dot grid) · columns → four at every width, dense flow, 116px rows, 16px gutters, 660px floor then sideways scroll (rejected: fluid auto-fill at one card size — even, but flat) · height → uniform per slot, card fills its cell, 28px footer (rejected: content height) · `size` → survives as slots; large spans 2, pinned large 2×2, medium and small both 1×1 (rejected: size ignored) · face → contents held, composition changed; images as a flat gallery top-right, not the fan · pinned/unread → ring alone (rejected: the canvas dot back on the corner, and an inset dot beside the title) · previewed card → fill + constant 10×6px lift + raised shadow + others to 45%, **no** achromatic ring, **no** tether (both drawn and dropped) · sort → pinned first then most recent, no section header, unread not sorted up · scrollbar → matches the canvas · empty state → approved, both views · chip fill → `--fill-chip` (Ink 18%), grid only · card latch → 150ms `--ease-standard`, scoping the 240ms rule to the canvas
- Decision log (grid view, still open): the preview panel does **not** scroll a clicked card back into view the way the canvas nudges a node — a card near the bottom of the region is pushed half out of sight by the panel it just opened. `planeScroll.ts` is plane-coupled and stayed canvas-only; the design pass didn't raise the case. Worth a call once the open thread view exists.
- Decision log (scope): direct messages → promoted into v1 · thread descriptions → approved, optional, 140-char cap
- A detailed phased roadmap and a running list of known gaps live in `ROADMAP.md`, which is **gitignored** — it's the one place allowed to name comparisons to existing apps, so it deliberately stays off the remote. Nothing in it should be copied into this file or the README without stripping those comparisons first.

## Commands
```
npm run dev
npm run build      # tsc -b (app, vite config and e2e) then vite build
npm run lint
npm test           # Playwright smoke suite
npm run shots      # regenerate the screenshot set in e2e/shots/
```
Supabase/Vercel CLI commands — TBD once wired up.

## Testing
Playwright, in two halves that are deliberately not the same thing:

- **`e2e/smoke.spec.ts` asserts.** It drives the paths a person takes and requires the browser to stay silent — `pageerror` and `console.error` are collected and must be empty. That is the point of it: `tsc` and `oxlint` structurally cannot see a null context throw, a conditionally-called hook, an effect that loops, or a `ResizeObserver` that throws on unmount, and the build stays green while the app is broken. `console.log` is deliberately *not* collected, because the open-thread and new-thread stubs both log on purpose until 2.4 and 2.5 replace them.
- **`e2e/shots.spec.ts` produces pictures and asserts almost nothing.** Whether the 45% dim sits right against the dot grid is a judgement call; the job is to put it in front of someone. Output lands in `e2e/shots/`, gitignored.

Notes that matter:
- **It drives the Chrome already installed** (`channel: 'chrome'`), so there is no ~100MB Chromium download and no browser binary anywhere near the repo. CI has no system Chrome and falls back to the bundled one, which needs `npx playwright install --with-deps chromium` as a step first.
- **Waiting on `toBeVisible()` for the preview panel is a trap**, and it silently produced a screenshot of a panel that wasn't there. The row's height is React state fed by a `ResizeObserver` and starts at 0; a child of a zero-height `overflow-hidden` row still reports a box of its own, so the panel reads as visible while clipped to nothing. `openPreview()` in `e2e/helpers.ts` waits on the row's real height instead — use it rather than clicking a bubble directly.
- **Settings are seeded straight into localStorage** by `seedSettings()` via `addInitScript`, so a light-mode screenshot doesn't need four clicks first. It has to run before the page scripts, because the provider reads storage in a `useState` initialiser.
- **No visual-regression baselines, on purpose.** Screenshot comparison baselines are OS- and browser-specific — one generated on Windows will not match Linux CI — and these surfaces are still moving. Revisit once they settle.
- Specs are typechecked by `tsconfig.e2e.json`, which is referenced from the root `tsconfig.json` so `npm run build` covers them. It carries both `ES2023` and `DOM` libs, unlike the other two projects: the specs run in Node but `page.evaluate` callbacks compile for the browser.
- Everything here runs against mock data. Phase 3 will need it revisited once there is auth and seeded DB state to arrange first.
