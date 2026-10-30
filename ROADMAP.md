# Scatterbrain — Roadmap

What's next and what's broken. Why things are the way they are is in `DECISIONS.md`; how to work in the repo is in `CLAUDE.md`.

Current state: UI scaffolded on mock data (`src/lib/mockData.ts`), no backend. Sequencing is **data model → UI on mock data → backend**, so the app stays demo-able at every step.

---

## Shipped

### Phase 1 — Data model ✅
`Thread` gained `description?` (140-char cap, exported as `THREAD_DESCRIPTION_MAX_LENGTH`), `authorId` and `createdAt`, and lost `rotation` and `borderRadius` — both now derived from the thread id. All 156 replies authored across the 9 threads on `c4`, written as a compact `ThreadSeed` that `toThread` expands, deriving `messages`, `replyCount` and `participants`. Five of nine threads carry descriptions. The app boots to `c4` so the canvas isn't empty on load.

Why, and what it beat: `DECISIONS.md` → Data model.

### 2.1 Thread descriptions on bubbles — ~~cancelled~~ ✅
Rejected outright by a design pass: descriptions do not appear on bubbles at any size. No rendering work, no coexistence problem with the image-fan/avatar block, no `small`-suppression question. The description work moved entirely into 2.2 (the preview panel, the first place a description is ever seen) and 2.4 (the open thread header).

### 2.2 Thread preview panel ✅
`ThreadPreviewPanel` plus the `ChannelView` wrapper that owns preview state. Shipped with it: canvas compression (the plane zooms out, floored at 0.72, centred horizontally), the previewed-node treatment, the frame-level tether, the drawn scroll indicator replacing the hidden native bar, Lenis wired up for the first time, and the status dot moved onto the blob. The motion here set the house pattern for everything after it.

Took three run-throughs against the running app to settle; every conflict between the two design drafts went to an explicit decision. Why, and what it beat: `DECISIONS.md` → Thread canvas, Thread preview panel, Motion.

### 2.3 Grid view ✅
Split in two: the state plumbing wasn't blocked on a design pass, the grid was.

**Part A — settings Context.** `src/hooks/useSettings.ts` + `SettingsProvider.tsx` own theme, density and thread view together, mounted at the root. `useTheme.ts` and `useSidebarMode.ts` deleted, along with the synthetic `StorageEvent` that used to bridge sibling subtrees. `sidebarMode` → `density`. `scatterbrain-thread-view` is new — the setting had never persisted at all.

**Part B — the grid itself.** `ThreadCard` (the cell), `ThreadGrid` (the scrolling frame) and `gridLayout.ts` (the geometry). `ChannelView` reads `threadView` and renders one view or the other into the same slot; the duplicate channel-header pill is gone and Settings owns the toggle outright.

Extractions that came with it: `ParticipantStack` (adopted by the bubble, the panel and the card) and `ScrollIndicator` + `scrollGeometry` (adopted by both views, and later the open thread). `threadGrid.ts` had to become `gridLayout.ts` — `tsc` rejects it outright beside `ThreadGrid.tsx` on a case-insensitive filesystem.

**The click model was revised here**, and it's a real change rather than a tidy-up: a node toggles its own preview, and the panel is the door to the thread in full. The commit press went with it. Why: `DECISIONS.md` → Click model. The rest: `DECISIONS.md` → Grid view, Settings.

### 2.4 Thread detail view + composer ✅
The first genuinely functional messaging: `ThreadDetailView`, `ReplyList`, `ReplyRow`, `AttachmentStrip`, `ThreadComposer` and `ThreadInfoPanel`, with `App` holding `openThreadId` beside `activeChannelId` and `ChannelView` raising the id rather than logging.

Three things worth remembering from it:

- **The design pass ran in-repo for the first time** — the published design system is installed as `.claude/skills/scatterbrain-design/`, so a pass can read the running code and `e2e/shots/` while it designs, which a separate conversation never could.
- **The running app caught what no mockup could.** The content column was capped at 660px, which was very nearly the full region at the width the design was drawn at — so nothing looked wrong in any frame or any 1280px screenshot, and on a real window it was barely half the space, pinned left. `thread-wide-standard.png` and `thread-wide-compact.png` are the shots that would have caught it, and they only exist because someone opened the app.
- **One bug the screenshots caught and types could not.** Opening a thread sets `openThreadId` and clears `isUnread` in the same render batch, so a `useState` initialiser inside the view saw an already-read thread and the divider never rendered. The anchor is captured in `App` before the clear. Invisible to `tsc`, `oxlint`, and a green smoke run.

Two calls were deliberately built-then-judged rather than settled from a mockup. The right panel's `Thread info` is **ratified**; the header scrolling away is still open (`DECISIONS.md` → Open). The reply row reversed on review and **both** layouts ship, selected by `density`. Why: `DECISIONS.md` → Open thread view.

---

## Next

### 2.5 New-thread flow
Title plus optional description, with a live character counter that hard-stops at 140 (`THREAD_DESCRIPTION_MAX_LENGTH`). Replaces the `handleNewThread` stub in `src/features/channels/ChannelView.tsx` — the **last remaining `console.log` in `src/`**, and the reason the smoke suite deliberately doesn't collect `console.log`.

---

## Phase 3 — Backend (Supabase)

1. **Schema + RLS** — Server → Channel → Thread → Message. Mirror the client cap in the database: `CHECK (char_length(description) <= 140)`. Include thread layout storage per the Phase 1 decision. Several model questions have to be answered first — server join mechanism, channel types, whether roles matter in v1 (`DECISIONS.md` → Open).
2. **Auth** — email/password. Simplest path for a demo; OAuth adds polish but also review friction.
3. **Messages + Realtime** — new threads appearing in a channel, new replies in an open thread. Presence indicators and message edit history are both still open.
4. **Direct messages** — needs a friendship/relationship table and a DM thread type. The surface is already half-built: `DirectMessage` exists as a type in `src/lib/mockData.ts` and the rail renders a DM section under Friends. It just has nothing behind it. `src/features/friends/` doesn't exist yet.
5. **Routing** — `react-router-dom` is installed with **zero imports**; all navigation is `useState` in `App.tsx` and `ServerSidebar.tsx`. The route shape has to actually exist by this phase:
   - `/servers/:serverId/channels/:channelId` — the channel region
   - `/servers/:serverId/channels/:channelId/threads/:threadId` — the open thread
   - `/friends`, `/settings`, auth routes, a server-discovery/landing route
   
   `activeChannelId` and `openThreadId` are already exactly the shape of a route param, so the conversion is mechanical.
6. **Keep-alive cron** — free-tier projects pause after 7 days idle. A GitHub Actions cron hitting the deployed app covers it.
7. **Revisit the test suite** — everything currently runs against mock data; there'll be auth and seeded DB state to arrange first.

### Free-tier constraints worth designing around
- **Supabase** — 500 MB database, 1 GB storage, 5 GB egress, 50,000 MAU, 500,000 edge-function invocations, up to 2 active projects, no backups, and **projects pause after 7 days of inactivity** (hence the cron above). Realtime: 200 peak concurrent connections, 2M messages/month — not a real constraint for a demo.
- **Vercel Hobby** — 100 GB Fast Data Transfer, 1M Edge Requests, 6,000 build-execution minutes, 1M function invocations, up to 200 projects/month. Restricted to personal/non-commercial use, which this satisfies.

---

## Behind Phase 3

### 2.6 Attachment kinds beyond images — designed, not built
Video, audio, voice notes and downloadable files. The `Attachment` union is already shaped so each arrives additively and turns every unhandled consumer into a compile error. Needs real storage before it means anything. Full rationale: `DECISIONS.md` → Deferred.

---

## Still tentative / out of v1

- **Tag-based channel creation and sorting** — organizing or auto-sorting channels by tags derived from conversation content. Genuinely interesting, entirely unscoped (`DECISIONS.md` → Open).
- **Out for v1:** voice/video, moderation tooling, notifications, roles/permissions nuance beyond owner/admin/member.

---

## Known gaps & cleanup

Things already true of the codebase that will bite if left alone. Each row verified against the code. Open *design questions* are not here — they're in `DECISIONS.md` → Open.

| Gap | Where |
|---|---|
| **No view draws a horizontal scrollbar.** `.no-scrollbar` hides the native one on **both** axes, and the 3px Mist indicator that replaces it is vertical only — so the canvas past a narrow window and the grid under its 660px floor both scroll sideways with nothing saying they do. The rule the indicator exists for ("never hide the bar without something taking its place") is half-kept. Note `.no-scrollbar` is on **three** containers now, not two | `ThreadCanvas.tsx:128`, `ThreadGrid.tsx:100`, `ThreadDetailView.tsx:129`, `index.css:57-63` |
| **The reply list does not scroll to the divider, or to the bottom.** Opening a thread lands at the top every time, so an unread thread makes you scroll past everything already read to reach the `new` mark that exists to be found. The mark is right; nothing takes you to it. There is no `scrollIntoView` anywhere in `src/` | `ThreadDetailView.tsx` |
| **Only two shots exist above 1280px, and both are the open thread** (1728×900). The canvas plane, the grid's four columns and the preview panel have never been looked at with 400px more region — and 1280 is exactly the width that hid the 660px column being too narrow | `e2e/shots.spec.ts:268-286` |
| **Light mode wants one visual tuning pass.** Every overlay, ring and shadow now derives from its role colour, so they flip with the theme — but the alpha percentages were carried over unchanged from the dark-tuned originals. Light mode is correct in structure and untuned in feel; the point is that the tuning now happens in one place | `src/styles/tokens/colors.css`, `src/styles/tokens/elevation.css` |
| **The favicon is a scaffold leftover and it's live.** `public/favicon.svg` is a purple `#863bff` lightning bolt — a colour that appears nowhere in the palette — wired as the browser-tab icon. (`public/icons.svg` sits beside it unreferenced and is **kept deliberately** — see `DECISIONS.md`) | `index.html:5`, `public/favicon.svg` |
| **`geist` and `react-router-dom` are installed and never imported.** Geist is self-hosted via `@font-face` in `index.css` instead, so that dependency is probably just removable; `react-router-dom` lands in Phase 3. (`lenis` was in this row until 2.2 — it now drives the canvas, the grid *and* the open thread list) | `package.json` |
| **The rail's expand/collapse is unanimated**, and the single-open-vs-multi-open behaviour is piggybacked on `density` with nothing in the UI saying so. Tracked as a design question rather than only a cleanup — see `DECISIONS.md` → Open, "Rail layouts" | `ServerSidebar.tsx:31-43, 108` |
| **Three stale code comments** claiming single callers that are now multiple: `useLenis.ts:9-11` ("the canvas… is the only caller today"), `ScrollIndicator.tsx:8` ("on both thread views" — it's three), and `motion.css:26` (describes `--press-scale` as the second-click commit, a gesture that no longer exists) | `useLenis.ts`, `ScrollIndicator.tsx`, `motion.css` |
| **`ChannelView`'s own docstring still says "preview-once/open-twice"** — the click model it describes was revised in 2.3 | `ChannelView.tsx:50` |
| **`README.md` claims nothing that outlives a change to the code.** It names built components and current behaviour, so it goes stale silently the way it did before 2.5's restructure — the whole "Built / Not yet built" split needs a pass whenever a phase lands | `README.md` |

**Resolved:** the app booting to an empty canvas (default channel is now `c4`) · the stray `theme-tokens.css` at the repo root · `formatTimestamp`'s missing minutes branch, which now renders "12m ago" instead of "0h ago" · the missing settings Context and its synthetic `StorageEvent` workaround, both replaced in 2.3 Part A · `sidebarMode`'s name, now `density` · `threadView` rendering nothing, closed by 2.3 Part B · the open-thread `console.log` stub, replaced in 2.4 · read-state machinery, which arrived with `lastReadMessageId` in 2.4 · the preview panel's "no open affordance" and the claim that the previewed card is the only way to close a preview by clicking — both superseded by the revised click model, where the panel opens and its X and Esc both dismiss.
