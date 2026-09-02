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
- Default to system preference; manual toggle — persistence mechanism TBD (localStorage pre-auth, user profile once auth exists)

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
- **Main content:** thread canvas — bubble/node view is the primary approved treatment (not a scrollable list); a grid alternative is also approved. Currently exposed as a top-bar toggle for testing; will be deprecated in favor of a Settings toggle once Settings exists (same eventual pattern as the rail toggle above). Note both toggles already exist in the UI and neither is wired to the canvas — the view mode never reaches it.
- **Thread preview panel (decided, built):** clicking a thread bubble once opens a preview occupying the **top half of the main content region**; the thread canvas persists in the lower half, compressed and scrollable. Because the clicked bubble stays visible and clickable there, a second click on it enters the thread proper. Same peek-then-commit idea as the right panel below, but split horizontally so you never lose your place in the canvas. Preview contents: a mono kicker (channel, then `pinned` / `unread`), title, full description, participants as avatars **and names**, reply count, last activity, and an image grid if present — and since descriptions never appear on bubbles, this is the first place one is ever seen. Dismissal is **decided**: Esc, or an X at the panel's top-right. Still open: whether the split is a fixed 50/50 or content-sized up to a cap — it currently sizes to content, which stands as the provisional answer until the open thread view exists and there's real content to judge against.
- **Canvas compression (decided):** the plane **zooms out** as the panel shortens the canvas — `scale = max(0.72, min(1, canvasHeight / 760))`, so on a tall window nothing happens and the zoom only engages once the canvas is genuinely shorter than the plane. The floor is legibility: the 10px mono row lands at 7.2px there, and whatever the floor cuts off, the canvas scrolls for. Three details are load-bearing, all learned the hard way:
  - **The canvas takes its new height in a single frame and is pushed down by the growing panel.** Left to squeeze across the animation, the frame contracting around the field reads as a mistake rather than a zoom.
  - **A transform is invisible to layout**, so the plane sits inside a sizing box carrying the scaled dimensions. Without it the scroll container still measures 1000×760 and offers scrollbars for content that plainly fits.
  - **The dot grid lives on that sizing box and scales as a real length** (`22 × scale`), not through the transform. It travels with the nodes, it stays crisp at any zoom rather than moiréing, and it is what makes the zoom read as a zoom.

  Thread `position` values stay absolute pixels throughout, and the browser hit-tests through the transform — nothing undoes the scale to know what was clicked. Drag-to-place, when it exists, will need the inverse. The plane is **centred horizontally and scaled about its own top centre**, so the zoom converges on the middle of the canvas; the canvas is usually wider than the 1000px plane, and anchoring left pinned the field to one edge and pulled it further that way on every zoom. Vertically it stays top-aligned, which costs nothing — whenever the plane is zoomed it fills the height exactly.
- **The canvas draws its own scrollbar.** The native one is hidden (`.no-scrollbar`) and replaced by a 3px Mist indicator at the right edge, sized and placed from the scroll position and shown only when there is more canvas than fits — which is exactly when the scale floor has bound. Lenis does the scrolling either way. The rule is that the native bar is never hidden without something taking its place: with the plane usually fitting, the indicator is the only thing that says the canvas continues.
- **The previewed node (decided):** subtle fill, the derived rotation with a 1.05 lift, and a heavier lifted shadow; every other node drops to 45%. A previewed node with no state of its own also takes a 1.5px achromatic ring at Ink 24% — but **a bubble never carries more than one outset ring**, so on a pinned or unread node the Spark/Signal ring is the one that survives and the rest of the treatment carries selection. A **tether** runs from the panel's edge down to the node — frame geometry, not node decoration, with no ceiling on its length: with the plane zoomed out a node can be anywhere, and a hairline over a canvas at 45% still reads as a pointer. The second click presses the lift back past rest to 0.985 for 130ms, so committing reads as a gesture rather than nothing.
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
- **Shape language is deliberate and split by role:** thread nodes use irregular organic blob radii (a signature shape, not shared with UI chrome); rail/list/panel chrome uses conventional rounded rects, roughly 8–14px radius
- Icon set: TBD — `lucide-react` pairs well with the stack, not yet decided
- Spacing scale, component naming/composition rules: TBD
- Motion: Lenis handles scroll only — and now actually does, via `useLenis`, pointed at the thread canvas. The app shell is a fixed-height frame that never scrolls, so Lenis is scoped to an element rather than the window; the canvas is its only caller today. Vertical only (Lenis takes one orientation), so horizontal canvas scrolling stays native. The preview panel set the rest of the house pattern. **Two curves, and they mean different things:** `--ease-standard` (`cubic-bezier(0.4,0,0.2,1)`) is the interface curve for rows, hovers and colour; `--ease-soft` (`cubic-bezier(0.22,0.8,0.28,1)`) is for anything with weight that travels — the panel arriving, a node latching, the plane scrolling to seat a node. Nothing here accelerates into a stop, so the soft curve's long tail is the whole of its character. Durations: **240ms** expand/collapse and node latch, **260ms** the panel's own arrival, **300ms** a deliberate plane scroll, **200ms** state opacity, **150ms** colour crossfades and short fades. No bounces, no spinners, no staggers. Note the row animates between measured *pixel* heights rather than `0fr → 1fr`: same property, but `1fr → 1fr` has nothing to interpolate, so swapping content inside an already-open row would snap. Accordion/list expand-collapse still has no built implementation, but inherits these timings.
- Fan-of-three-images preview inside thread bubbles — **built**: playing-card style overlap, each card rotated a few degrees, with a fourth "more" card using a blank grey-to-white gradient instead of an image. Cards are 32/40/48px by bubble size. The preview panel does **not** reuse the fan: it lays the images out flat as a 3-up grid of 60px tiles, because the fan is a hint that there's something to look at and the panel is where you actually look.
- Click-once-to-preview/click-again-to-open for topic bubbles is **decided and near the front of the queue** — see the thread preview panel under Layout.
- Thread descriptions do **not** render on bubbles at any size — the bubble face carries title, image fan or participant avatars, and the mono metadata row, and nothing else. A description appears only in the thread preview panel and the open thread view. The 140-character cap stands (it's in the data model and mirrors to a DB `CHECK`), but note the rationale shifted: it was originally chosen so a bubble never had to truncate, and now serves to keep the preview brief.

## Notes
- Claude Design and this project don't share context automatically. Claude Design is its own product with its own projects — not Claude.ai Projects — and has no custom-instructions or knowledge-base feature. The hand-off splits in two: **tokens, typography and components** live in the org-level Claude Design **design system (UI kit)**, which new projects inherit once it's published; **prose rules** (shape language, rejected directions, standing decisions) have no home there and go in each brief. HTML exports of approved drafts are the source of truth for "current state" and get attached per project.
- Decision log (rail): blob → rejected · dot-cluster → rejected · merged single-panel → rejected · flyout → rejected · accordion → approved · unified compact list → approved (toggle planned)
- Decision log (thread view): bubble → approved · grid → approved (toggle planned) · image fan → built · preview panel → approved, top-half split · descriptions on bubbles → rejected, preview-only · preview dismissal → Esc + top-right X · canvas compression → plane zooms out, scale floored at 0.72, centred horizontally, canvas height snaps and slides rather than squeezing · canvas scrollbar → native hidden, 3px Mist indicator in its place · previewed node → fill + lift + lifted shadow, others to 45%, achromatic ring only when no state ring · tether → frame-level, panel edge to node, no length ceiling · scroll → conditional nudge only when the scale floor binds · status dot → derived from the blob's top-right curve, not the box corner · panel kicker → channel + state, all Mist, no display ID · panel images → 3-up grid, not the fan · participant names in panel → approved · author/creation time in panel → rejected (placement settled if ever ratified: one mono line under the title)
- Decision log (scope): direct messages → promoted into v1 · thread descriptions → approved, optional, 140-char cap
- A detailed phased roadmap and a running list of known gaps live in `ROADMAP.md`, which is **gitignored** — it's the one place allowed to name comparisons to existing apps, so it deliberately stays off the remote. Nothing in it should be copied into this file or the README without stripping those comparisons first.

## Commands
```
npm run dev
npm run build
npm run lint
```
Supabase/Vercel CLI commands — TBD once wired up.
