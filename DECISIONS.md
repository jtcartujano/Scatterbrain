# Scatterbrain — Decisions

What was decided, the short reason, and what it beat. Each decision appears once.

`CLAUDE.md` carries the rules this file justifies; `ROADMAP.md` carries what's next and what's broken. Where a decision was later revised, the revision is the entry and the old position is noted as *was:*.

---

## Decided

### Scope

| Decision | Why | Rejected / was |
|---|---|---|
| **Direct messages are in v1**, not a later phase | If thread messaging works, DMs are the same machinery pointed at two people | was: DMs after v1. Friends still ships first as a list/discovery surface |
| **Friends is a top-level surface, not a server** | A people surface in the Servers rail was the wrong home for it | was: a DM section inside Servers |
| **Thread descriptions ship, optional, 140-char hard cap** | A brief that keeps the preview short | — |
| **Three top-level destinations: Friends / Servers / Settings** | Settings needs somewhere to live that isn't a modal, and Friends isn't a server | — |
| **Voice/video, moderation, notifications and role nuance are out of v1** | None of them demonstrate the thing this app exists to demonstrate | — |
| **Tag-based channel creation/sorting stays tentative** | Feasibility, mechanics and whether anyone would use it are all open | not rejected — unscoped |

### Data model

| Decision | Why | Rejected / was |
|---|---|---|
| **A thread's root post is its title plus optional description, not a message** | No body post means `messages` holds replies only and `replyCount === messages.length` — no "is reply 1 the post?" special case anywhere | rejected: a root message row |
| **`participants` and `replyCount` are derived from the replies, not authored** | Invariants hold by construction rather than by discipline. `toThread` expands a compact `ThreadSeed`; in the DB they become a join and a denormalised counter | rejected: authored fields that can drift |
| **The 140-char cap is enforced client-side and mirrored as a DB `CHECK`** | Two places because the client counter is UX and the constraint is truth | — |
| **The cap's rationale shifted, the number didn't** | Originally chosen so a bubble never had to truncate; now it keeps the preview brief, since descriptions never reach a bubble | — |
| **`position` and `size` persist; `rotation` and `borderRadius` derive from a hash of the thread id** | A curated layout needs stored coordinates, and a fixed footprint keeps them collision-free — but rotation and radius are pure decoration, so storing them would be storing a render. Derived means identical on every client with nothing to migrate | rejected: storing all four |
| **Canvas coordinates live in a fixed 1000×760 logical plane** (`THREAD_CANVAS`) | Every client has to agree on the space before a stored coordinate means anything | rejected: viewport-relative positions |
| **The blob generator pairs opposite corners to sum to 100%** | That pairing *is* the organic silhouette — it keeps each edge's total consistent and rules out lopsided blobs | — |
| **Real UUIDs reshuffling every blob shape once, at migration, is accepted** | It happens once and no shape is authored, so nothing is lost | — |
| **`lastReadMessageId` is derived on seed and cleared on open** | It lets the divider say *where* new replies start rather than only that they exist. Authors set `newReplies` instead, so the field can't be authored inconsistently | — |
| **The divider anchor is snapshotted in `App` before the unread flag clears** | Opening sets `openThreadId` and clears `isUnread` in one render batch, so a `useState` initialiser inside the view saw an already-read thread and the divider never drew | rejected: deriving it inside the view |
| **The `T-0042`-style display id was declined** | Thread ids are `t1…t9` and become UUIDs; a real display id needs a sequence, a backfill and a per-channel-vs-per-server call, to buy something nothing uses yet | rejected: a mono display id in the preview kicker |

### Rail and channel list

| Decision | Why | Rejected / was |
|---|---|---|
| **Accordion rail** — single column, one server's channels expanded in place, full server names | Full names carry information that a two-letter mark can't, and expanding in place keeps one column | — |
| **Unified compact list** also approved — no icon rail, dense text list, servers as section headers, several expandable at once | The same information at a different density, for someone who wants the whole tree visible | planned behind a toggle; **only the accordion is built** — see Open |
| **Rejected rail directions** | — | **Blob rail** (server icons in the thread-node shape family) read as a conventional icon rail regardless of icon shape · **dot-cluster rail** (servers as small scattered constellations) — two-letter marks carried too little information · **merged single-panel rail** (rail and channel list as one torn-edge shape) — too cramped · **flyout rail** (slim rows, channel list as a pinnable overlay) — didn't stick |
| **Both layouts use full server names and distinct unread / mention / invite treatment**, on shared interaction logic | So they can sit behind one toggle rather than being two components | — |
| **The top switcher borrows the small-icon row from the rejected merged-panel draft** | The one element of that draft worth keeping | — |

### Thread canvas

| Decision | Why | Rejected / was |
|---|---|---|
| **The bubble/node canvas is the primary channel view** | A spatial plane is the whole product idea; a list is what everything else is | rejected: a scrollable thread list as primary |
| **The fan-of-three-images preview on a bubble** — playing-card overlap, each card rotated a few degrees, a fourth "more" card as a blank grey-to-white gradient, cards 32/40/48px by bubble size | A hint that there's something to look at, not a place to look | the fan is the canvas node's alone; neither other surface reuses it |
| **Descriptions never render on a bubble, at any size** | The face carries title, image fan or participant avatars, and the mono metadata row, and nothing else | rejected outright: descriptions on bubbles — which cancelled the whole rendering question, the coexistence problem with the fan/avatar block, and the `small`-size suppression call |
| **The status dot sits on the blob, derived from the same corner percentages as the radius** — the point 45° along the top-right quarter-ellipse, nudged 3px in, expressed as a percentage | On an organic shape the bounding-box corner is empty space, so anchoring there leaves the dot floating. A percentage also holds when a two-line title grows the bubble past its `minHeight`, and survives ids becoming UUIDs | was: the box corner, since the first commit. Every canvas draft before the last placed it inside the shape |
| **The plane zooms out as the panel shortens the canvas** — `scale = max(0.72, min(1, canvasHeight / 760))` | The zoom was the wanted effect, not a defect; the floor is legibility (the 10px mono row lands at 7.2px) and whatever the floor cuts off, the canvas scrolls for | rejected: clip-and-scroll at 1:1, which was the drawn alternative. Its four objections were answered rather than ignored — the floor holds the mono row, the dot grid scales as a real length so it stays crisp, hit-testing goes through the transform for free, and nodes moving away from the pointer turned out to be wanted |
| **The canvas takes its new height in a single frame and is pushed down by the growing panel** | Left to squeeze across the animation, the frame contracting around the field reads as a mistake rather than a zoom. Only the panel moves | was: a `flex-1` canvas that squeezed |
| **The plane sits inside a sizing box carrying the scaled dimensions** | A transform is invisible to layout, so without it the scroller still measures 1000×760 and offers scrollbars for content that plainly fits | — |
| **The dot grid lives on that sizing box and scales as a real length** (`22 × scale`), not through the transform | It travels with the nodes, stays crisp at any zoom instead of moiréing, and is what makes the zoom read as a zoom | was: painted on the scrolling frame, where a background stays anchored while its contents move — so the grid sat still while bubbles scrolled under it |
| **The plane is centred horizontally and scaled about its own top centre** | The canvas is usually wider than the 1000px plane; anchoring left pinned the field to one edge and pulled it further there on every zoom. Vertically top-aligned costs nothing — whenever the plane is zoomed it fills the height exactly | — |
| **`position` stays absolute pixels throughout** | The browser hit-tests through the transform, so nothing has to undo the scale to know what was clicked. Drag-to-place will need the inverse | — |
| **Seating is a conditional nudge, fired only when the scale floor binds** | The zoom plus an unbounded tether make unconditional seating redundant, and the scroll-to-top on dismiss went with it — that had been discarding a scroll position you may have chosen deliberately | was: unconditional seating 46px below the panel, which existed only to keep the node inside a bounded tether's window |
| **The previewed node:** `--fill-subtle`, the derived rotation with a 1.05 lift, `--shadow-bubble-lifted`; every other node to `--opacity-deselected` (45%) | Fill, lift and shadow are enough to carry selection without a second stroke | — |
| **A bubble never carries more than one outset ring.** The achromatic `--ring-held` (Ink 24%) appears only on a previewed node with no state ring; on a pinned or unread node the Spark/Signal ring survives | Two concentric strokes say one thing twice | was drawn at Ink 50% inset; shipped at 24%, verified understated-but-present in light mode |
| **The tether is frame geometry — panel edge to node — with no length ceiling** | With the plane zoomed out a node can be anywhere, and a hairline over a canvas at 45% still reads as a pointer | was: a 28px stub on the node, drawn only in a 14–150px window, which only worked because seating was unconditional |
| **The native scrollbar is hidden and replaced by a 3px Mist indicator**, shown only when there's more content than fits | The native bar only ever appeared when the 0.72 floor bound, which a detailed preview reaches on a windowed browser. With the plane usually fitting, the indicator is the only thing that says the canvas continues | rejected: hiding the bar outright, which left nothing saying so |
| **Lenis drives the scrolling, element-scoped** | The app shell is a fixed-height frame that never scrolls, so Lenis is pointed at an element rather than the window. `planeScroll` delegates to `lenis.scrollTo` when an instance is live — two frame loops writing `scrollTop` would fight | rejected: reimplementing scroll on a transform-translated plane, which costs trackpad momentum, touch, keyboard and focus-scrolling |

### Thread preview panel

| Decision | Why | Rejected / was |
|---|---|---|
| **Clicking a thread opens a preview across the top of the main content region**; the view below persists in the lower half, compressed and scrollable | Peek-then-commit, split horizontally so you never lose your place in the channel | rejected: a vertical split, which is what the right panel already is |
| **Preview contents:** a mono kicker (channel, then `pinned` / `unread`), title, full description, participants as avatars **and names**, reply count, last activity, and an image grid if present | Since descriptions never appear on bubbles, this is the first place one is ever seen | **participant names: approved.** **Author and creation time: rejected here** — placement pre-settled at one mono line under the title if ever ratified, which the open thread header later took up |
| **Images lay out flat as a 3-up grid of 60px tiles, not the fan** | The fan is a hint that there's something to look at; the panel is where you actually look | rejected: reusing the canvas fan |
| **Dismissal: Esc, an X at the panel's top-right, or clicking the previewed thread again** | Three ways out, all cheap | rejected: clicking empty canvas |
| **The panel casts no shadow** | Chrome doesn't | rejected: a panel shadow from one draft |
| **No panel floor, and the cap is 50% not 46%** | Content-sized under a half stands on its own | rejected: a 168px floor and a 46% cap from one draft |

### Click model

**Revised.** One entry, because it used to be described in six places.

- **A node toggles its own preview.** Click it to open the panel, click the same one again to put it away, click a different one to swap the panel over.
- **The preview panel is the door to the thread in full.** Clicking anywhere on it opens the thread.
- **Identical in both views.** The pattern belongs to the channel region, not to the canvas or the grid — the panel, the row geometry and the previewed-thread state all live in `ChannelView`, so a preview open on a bubble is still open on the card after a view toggle.

*Was:* the node did both jobs — first click previews, second click opens. With no thread view built, that second click produced no visible change whatsoever, and a thread that looks identical after you click it reads as broken. That's what prompted the change.

**Why the panel and not a button.** There is still exactly one open affordance and it is still not a button: every place a button could sit either competes with the title or crowds the dismiss X. The panel is `role="button"` with a keyboard handler, because the X lives inside it and a button inside a button is invalid. The X stops propagation — dismissing is the one thing you can do on the panel that isn't opening — and there is a smoke test for that specifically, since it's the one wiring mistake here that would be silent.

*Supersedes* the earlier framing that "the panel has no open affordance of its own — the thread below it is the affordance." The count of doors is unchanged; only which surface carries it.

**The commit press went with it.** A previewed node used to dip to `--press-scale` (0.985) for 130ms on the second click, explicitly "so committing reads as a gesture rather than nothing." The second click now collapses the panel and drops the node out of its lift, which is not nothing, and a dip on the way there fought both. The token stays, unused.

### Grid view

| Decision | Why | Rejected / was |
|---|---|---|
| **The grid cell is a rounded-rect card at chrome radii, not a blob**, and rotation is dropped | A grid exists for scanning a channel in order, and organic radii plus per-node rotation fight the alignment that is the only thing a grid is for. The shape-language rule was **rescoped by surface rather than quietly broken**: a thread is a blob on the plane and a card in the grid | rejected: carrying the blob and the rotation into the grid |
| **Four columns at every width**, 116px rows, 16px gutters, 16px inset, `grid-auto-flow: dense` so a two-wide card leaves no hole behind it | The column floats with the region, which keeps the composition stable | rejected: fluid auto-fill at one card size — even, but flat |
| **660px floor, then the region scrolls sideways** | The canvas plane already scrolls sideways under a narrow window; dropping columns would change the composition instead | rejected: fewer columns under the floor |
| **`size` survives as a footprint in slots** — `large` spans two columns, the pinned large thread takes 2×2, medium and small are both 1×1 — with the title stepping 14.5 / 13.5 / 12.5px | So `size` means something in both views, even if here it's effectively "large or not" | rejected: ignoring `size` entirely |
| **Uniform height per slot; the card fills its cell, with one fixed 28px footer row** | Alignment is the point | rejected: content height |
| **The face carries exactly what a bubble carries and no more** | A card has more room and the room is deliberately not spent: a second lowercase line competes with the title, the author is already the first disc in the stack, and the channel is in the header | rejected: author and participant names on the card face |
| **What changes is composition:** left-aligned, title on top with a flat 3-up image gallery beside it, then the footer row — participant stack left, mono row right | — | rejected: the fan, whose rotation fights the alignment |
| **Pinned and unread are carried by the ring alone** | A rect reaches its own corners, so the canvas's derived status dot would sit on top of the ring and read as a notch in it — saying the same thing twice. (The design pass noted a bounding-box dot *would* work here, and rejected it anyway for this reason) | rejected: the canvas dot back on the corner; rejected: an inset dot beside the title |
| **The previewed card:** `--fill-subtle`, a **constant 10×6px** lift, `--shadow-bubble-raised`, others to 45% | Three deliberate differences from the canvas: a percentage lift made the 2×2 look like it was shoving its row; `-raised` rather than `-lifted` because there's no plane here to float above; and a previewed card with no state ring gets **no achromatic `--ring-held`**, because on an aligned surface the fill and the lift are enough | rejected: a flat previewed mark with no lift |
| **No tether** | Drawn, and dropped: over aligned cards it read as a stray rule | rejected after being drawn |
| **No canvas machinery at all** — no plane zoom, no scale floor, no dot grid | The derived-appearance and plane helpers (`getThreadAppearance`, `getStatusDotOffset`, `getPlaneScale`, `THREAD_CANVAS`, `planeScroll.ts`) are plane concepts | built from the frame that keeps 1:1 scale when the panel opens, rather than the one that zooms |
| **Sort: pinned first, then most recent activity, with no section header** | The ring already says pinned, and a label would turn the first row into a rail | **unread is not sorted up** — it's a state, and its ring finds it wherever it lands |
| **Overflow counts (`+4` members, `+3` images) sit on `--fill-chip`** (Ink 18%), grid only | So the chip reads as a chip against Surface in both themes, where the `--fill-mist` the bubble and panel use doesn't | — |
| **A grid card latches at 150ms on `--ease-standard`** | Scopes the 240ms soft-curve latch to the canvas: the soft curve's long tail is for weight travelling across a plane, and a card rising 6px in place has neither | — |
| **The lift is derived from one number — the grid element's width** | The columns are equal fractions of it, so there's no per-card `ResizeObserver` and nothing to re-measure when the preview moves | — |
| **The grid insets with padding inside its scroller, where the canvas uses a margin outside** | The previewed card grows 5px past its slot and casts a raised shadow well beyond that; flush against an `overflow: auto` edge both get sheared off along the first column and the top row. The inset from the region is the same 16 either way | — |

### Empty channel

**"No threads here yet" over "A post in this channel starts one."** Centred, Ink then Mist, **no glyph and no button** — New Thread is already in the header a few inches above, and a second call to action here would compete with the one that's always there. The grid shows plain Void behind it; the canvas keeps its dot grid.

### Open thread view

| Decision | Why | Rejected / was |
|---|---|---|
| **It replaces the main content region**; the rail and the right panel persist | It renders into `MainLayout`'s `main` slot in place of `ChannelView`, so the surrounding chrome never blinks | — |
| **A back bar at the channel header's exact 57px** | The region's top edge doesn't move on entry or exit | — |
| **Header, list and composer share one left and one right edge** | A thread reads as a document rather than three stacked panels | — |
| **The column fills the region; the measure lives on the prose** — 58ch on a description, 80ch on a reply | A 660px cap matched the region almost exactly at the width the design was drawn at, so it looked deliberate in every frame and every 1280px screenshot. On a real window it was barely half the space, pinned left, and read as a layout that had failed rather than one that chose — and the canvas, grid and preview panel all fill the region, so this was the only surface that didn't | rejected: the 660px column. The running app caught what no mockup could |
| **The reply row fills too**, which puts the mono age at the region's right edge | A predictable rail rather than something trailing the text | — |
| **The header is the preview panel promoted, plus author and creation time** | Same elements in the same order, so clicking the panel reads as the panel *becoming* the screen. Author and time were rejected for the peek and earn their place here, on the mono line under the title that was pre-settled as their placement | the **kicker drops the channel** (the back bar says it) and carries state alone, so a plain thread has none |
| **Both reply layouts ship, selected by `density`** — Compact is one row per reply (an 18px disc and the author in a fixed 128px column, then the text, then a 10px mono age right); Standard is a 28px avatar beside a block with the author above the text | This is the one surface where `density` changes composition rather than spacing, and the coupling is deliberate | **was: one dense row, with grouped blocks drawn as rejected** — overturned on review. And **rejected: a second `Replies` setting** to decouple them, which was designed and reversed; the stated cost is that there is no way to have compact chrome with grouped replies |
| **The 128px author column is sized off the longest member name, not shrink-to-fit** | The constant left edge it gives the text is the entire reason the dense layout scans | — |
| **Neither layout collapses consecutive replies from one author** | The dense row has no author header to avoid repeating, which is the only thing a collapse buys — and across all nine seeded threads no two consecutive replies share an author, so the rule would never have fired | rejected in both layouts |
| **Reply attachments sit under the text, indented to the text column** — 96px tiles in Standard, 64px in Compact, wrapping | The fan and the grid card use chips because those surfaces *index* a thread and you click through; a reply is the thing itself, so a chip would mean clicking to finish reading a message. Density is carried by tile size; content is never what gets cut | rejected: a `+N` overflow chip |
| **The right panel becomes `Thread info`** — the thread's participants, in the channel panel's own idiom. **Ratified against the running app.** It stays a separate `ThreadInfoPanel` | The two panels describe different subjects, and a branch would thread that difference through a surface that already works | rejected: a branch inside `ChannelInfoPanel` |
| **The back arrow is permanent chrome and navigates to the channel explicitly, never `history.back()`** | Back means "wherever you came from," which might be another thread or a fresh tab. This means *up to the channel this thread is in* — a fixed destination, always right. It stays after routing lands. Esc does the same, matching the preview panel | rejected: `history.back()`; rejected: treating it as a stand-in for the browser's control |
| **No loading state, and that's the answer rather than an omission** | The panel you clicked already held title, description, participants and count; only the replies are new. When Supabase lands, the header renders immediately from data in hand and only the list waits | — |
| **Optimistic reply: text to Mist, timestamp withheld** | The two things that are provisional are the two things that look provisional | rejected: a spinner; rejected: reusing `--opacity-deselected`, which means "not the thing you picked" |
| **Unread divider: a Signal hairline with a mono `new`**, positioned from an anchor captured on entry | So it survives the flag clearing in the same render batch | — |
| **Unread clears on opening a thread in full, never on previewing it** | It's what lets the preview kicker say `unread` honestly. There's a smoke test for the inversion | — |
| **State-driven, not routed — with a hedge** | `openThreadId` sits beside `activeChannelId`, both exactly the shape of a route param, so Phase 3's conversion is mechanical. Shareable links are the strongest argument for routing and are worth nothing without a deployment. Accepted cost: browser back does nothing until then | — |

### Settings

| Decision | Why | Rejected / was |
|---|---|---|
| **One Context owns theme, density and thread view**, mounted at the root | Each replaced per-component state that only worked while exactly one component read it: `density` is read by the rail, the right panel *and* the open thread's reply list; `threadView` is set in the Settings tab and read in the main content region | the synthetic `StorageEvent` that used to bridge those siblings is gone; a real `storage` listener remains and now means exactly cross-tab sync |
| **One `localStorage` key per setting, never a serialised blob** | Settings arrive one at a time and a missing key just falls back, where a blob needs versioning and migration the first time its shape changes. Consolidating would also have silently discarded stored prefs | existing keys kept verbatim, including `scatterbrain-sidebar-mode` after the rename |
| **`sidebarMode` → `density`** | It already sized the right panel, so the old name had stopped describing it. Key and values unchanged | — |
| **The visible label is `Layout`** | Moved twice: `Sidebar` stopped describing it once it sized the right panel, and again once it picked the reply row | was: `Sidebar` |
| **Settings owns the Canvas/Grid toggle outright** | One view toggle, not two | the duplicate channel-header pill was removed |
| **`useSettings.ts` and `SettingsProvider.tsx` are split across two files** | Purely to keep `react/only-export-components` quiet — a co-located provider-plus-hook file is the one thing that rule objects to. `ScrollIndicator` / `scrollGeometry` is split the same way | — |

### Motion

| Decision | Why | Rejected / was |
|---|---|---|
| **Two curves that mean different things** — `--ease-standard` for the interface (rows, hovers, colour), `--ease-soft` for anything with weight that travels | Nothing here accelerates into a stop, so the soft curve's long tail is the whole of its character | — |
| **Durations:** 150 / 200 / 240 / 260 / 300ms, each named for what it's for | — | no bounces, no spinners, no staggers |
| **The preview row animates between measured pixel heights, not `0fr → 1fr`** | Same property, but `1fr → 1fr` has nothing to interpolate, so swapping content inside an already-open row would snap | was: `0fr → 1fr` in 220ms, from one draft |
| **Lenis is scroll-only, vertical-only, and element-scoped** | The app shell never scrolls. Horizontal scrolling stays native, since Lenis takes one orientation | — |

### Design system and process

The design system lives in-repo as a gitignored skill at `.claude/skills/scatterbrain-design/` — tokens, typography, guidelines, components and a `scatterbrain-app` UI kit. Design passes run **in-repo**, reading the running code and `e2e/shots/` while they design. *Was:* a separate product whose published UI kit new projects inherited, with prose rules going in each brief and HTML exports of approved drafts attached per project as the source of truth for "current state."

Older design exports in `tmp/` are local-only drafts, stale against the built app, and not the source of truth for anything.

**`public/icons.svg` is kept, unreferenced, on purpose.** A scaffold sprite that nothing imports and the design system has already dropped — retained against a possible use for its symbols. It costs nothing where it sits, so it is not a cleanup item. The purple favicon beside it *is* one (`ROADMAP.md` → Known gaps).

### Deliberately avoided, visually

Cream-background/terracotta-serif, near-black/single-neon-accent, and broadsheet/hairline-rule layouts — all read as generic-AI-app defaults for this genre.

---

## Deferred

**Attachment kinds beyond images — designed, not built.** Video, audio, voice notes and downloadable files. Sketches exist; the code does not.

`Message.attachments` is already a single-variant discriminated union (`kind: 'image'`), so each kind arrives as an additive variant and the moment one does, TypeScript turns every consumer that doesn't handle it into a compile error — a checklist rather than a hunt. The rendering rule is settled: the slot standardises **position and indent, not tile shape**. Images and video are tiles, a voice note is a bar (duration, no frame), a file is a row (a name and a size, which is text). All three draw with CSS and Unicode, so none of them forces the still-undecided icon set.

Needs real storage before it means anything, so it sits behind Phase 3.

---

## Open

One entry per unresolved choice. Current behaviour is marked **provisional** where something is already built.

### The preview panel's split: fixed 50/50 or content-sized?
- **Current (provisional):** content-sized under a 0.5 cap — `min(measured panel height, 50% of the region)`. A 140-character description bounds the tallest panel at roughly 190px, so in practice the cap only engages on short viewports.
- **Options:** keep content-sized; go to a hard 50/50; keep content-sized but raise the floor so a short panel doesn't look lost.
- **What would settle it:** side-by-side screenshots of a thread with no description and a thread with a full 140-character one, at a tall and a short viewport.
- **Revisit:** now. This was blocked on the open thread view existing, and it does — there is real content on the other side of the click.

### Does the grid seat a previewed card?
- **Current (provisional):** no. Click a card near the bottom of the region and the panel it opens pushes it half out of sight. The canvas solves this with `nudgeIntoView`, which is plane-coupled (it takes `scale`) and stayed canvas-only; the design pass never raised the case.
- **Options:** a view-agnostic nudge shared by both views; a grid-specific `scrollIntoView`; leave it, on the grounds that Esc and the panel's X both dismiss without needing the card back.
- **What would settle it:** a design call, then probably extracting the plane coupling out of the nudge.
- **Revisit:** alongside the panel-split call above — they're the same surface.

### Does the open thread header scroll away, or pin under the back bar?
- **Current (provisional, built):** it scrolls away. A 140-character description runs three lines, so pinning would spend ~120px permanently on something read once.
- **Options:** keep it scrolling; pin it; pin a condensed version (title and state only).
- **What would settle it:** using the app on a real window, with a long-description thread and a long reply list. `thread-scrolled.png` is the evidence to look at. Deliberately not settled from a mockup.
- **Revisit:** next time the open thread view is opened in anger.

### How do you join a server?
- **Options:** invite link; public directory; both.
- **What would settle it:** the RLS sketch — a public directory and an invite-only server want different read policies, so this has to be answered before the schema is written.
- **Revisit:** Phase 3, item 1. The rail already renders an `Invite` state with nothing behind it.

### Do channel "types" exist beyond the default?
- **Options:** one channel type; a type column with a default; types only when something needs one.
- **What would settle it:** whether anything in v1 actually needs a second type. DM threads are a thread type, not a channel type, so they don't force this.
- **Revisit:** Phase 3, item 1.

### Do roles matter in v1 at all?
- **Current:** owner/admin/member is modelled as a shape; nothing reads it.
- **Options:** model and ignore for v1; enforce owner-only destructive actions; drop the column until something needs it.
- **What would settle it:** whether any v1 action is role-gated. Moderation tooling is explicitly out, which removes most of the pressure.
- **Revisit:** Phase 3, item 1, alongside RLS.

### Message edit history
- **Options:** none (edits overwrite); an `edited_at` timestamp only; full revision rows.
- **What would settle it:** whether an edited reply needs to *show* that it was edited. A timestamp is cheap; revision rows are a feature.
- **Revisit:** Phase 3, item 3.

### Presence / online indicators
- **Current:** nothing. The Signal accent is reserved for it, and `--accent-presence` already exists as a token.
- **Options:** build on Supabase Realtime presence; a `last_seen` timestamp with a staleness threshold; skip for v1.
- **What would settle it:** free-tier Realtime connection cost versus how much a demo gains from a green dot.
- **Revisit:** Phase 3, item 3.

### Icon set
- **Current:** no icon library. Everything is drawn with CSS, text and Unicode.
- **Options:** `lucide-react`, which pairs well with the stack; keep drawing them; a hand-built sprite.
- **What would settle it:** the first surface that genuinely needs an icon the current approach can't draw. The deferred attachment kinds were deliberately designed so they don't force this.
- **Revisit:** when something needs it, not before.

### Spacing scale and component naming/composition rules
- **Current:** `src/styles/tokens/spacing.css` exists and the design system ships spacing guidelines, but there's no written rule in this repo for which value goes where, or for how components are named and composed.
- **Options:** document what the code already does; adopt the design system's scale verbatim as the rule; leave it to the code.
- **What would settle it:** a pass over the existing components to see whether the de facto scale is already consistent enough to write down.
- **Revisit:** before the next feature that adds several components at once.

### Tag-based channels — tentative, not scheduled
- **The question:** organizing or auto-sorting channels by tags derived from existing conversation content. Genuinely interesting, entirely unscoped.
- **Open:** feasibility, mechanics, and whether anyone would actually use it.
- **What would settle it:** a proper scoping pass. Don't design it before that.
- **Revisit:** after v1 ships.

### Rail layouts: two layouts or one component?
- **Current (provisional):** one component. `ServerSidebar` renders the accordion, with `density` driving spacing/typography and a single-open-vs-multi-open branch. The unified compact list's distinguishing features — no icon rail, servers as uppercase text section headers, no server marks — are **not built**.
- **Options:** build the second layout properly behind its own toggle; narrow the approved design down to what the density branch already does; drop it to one layout.
- **What would settle it:** whether the compact list is a layout or a density. The approved designs describe more divergence than `density` delivers.
- **Also unbuilt here:** the expand/collapse is an unanimated conditional mount — no height transition, no disclosure glyph — and the single-open behaviour is piggybacked silently on `density`, with nothing in the UI saying so. The motion tokens it would use (`--duration-expand`, `--ease-soft`) already exist. A mention state is drawn in the designs and not built.
- **Revisit:** whenever the rail is next touched.
