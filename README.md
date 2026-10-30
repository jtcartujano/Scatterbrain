# Scatterbrain

Scatterbrain is a server-and-channel messaging app with forum-style, non-linear threading. Posts in a channel spawn threads, so a channel's conversation isn't a single scrolling list — it's a space of separate threads you open individually.

## Current status

Actively in development. The UI is complete enough to use end to end, but it runs entirely on mock data (`src/lib/mockData.ts`) — 4 servers, 12 channels, 9 threads and 156 authored replies. There's no backend wired up yet, so nothing persists past a reload.

**Built:**

- Server rail and channel list, with a Friends / Servers / Settings top-level switcher (`ServerSidebar`, `TopSwitcher`)
- **Thread canvas** — threads as spatial nodes on a plane that compresses and scrolls (`ThreadCanvas`, `ThreadBubble`)
- **Grid view** — the same threads as aligned cards, selectable from Settings (`ThreadGrid`, `ThreadCard`)
- **Thread preview panel** — opens across the top of the channel region while the view below stays live (`ThreadPreviewPanel`)
- **Open thread view** — reply list, a working composer, and an unread divider that marks where new replies start (`ThreadDetailView`, `ReplyList`, `ThreadComposer`)
- Channel and thread info panels (`ChannelInfoPanel`, `ThreadInfoPanel`)
- Settings — theme, layout density and thread view, each persisted and shared through one Context
- Playwright suites: a smoke suite that asserts, and a screenshot generator for the states that need a human eye

**Not yet built:**

- Supabase backend — schema, auth, realtime
- The new-thread flow (the button is there; it's a stub)
- Direct messages and the Friends surface — the types and the rail section exist, with nothing behind them
- Attachment kinds beyond images — designed, not built
- Routing — navigation is React state today, so browser back/forward does nothing

## Core concept

The domain model is **Server → Channel → Thread → Message**. A thread is created by a root post in a channel, and replies live inside that thread rather than inline in the channel. This means a channel's conversation is non-linear until a specific thread is opened — closer to a forum than a chat log.

A thread's root post is its **title plus an optional description**, not a message — there's no body post, so a thread's replies are only ever replies.

The primary view for a channel is the **thread canvas**: threads render as nodes in a spatial layout rather than a scrollable list, each with an organic silhouette derived from its own id. An aligned **grid** is the selectable alternative — the same threads, drawn for scanning in order instead of for browsing a space.

Clicking a thread in either view opens a **preview panel** across the top of the region; the view below stays live and scrollable, so you can size a thread up without losing your place. Clicking the panel opens the thread in full.

## Planned features (v1)

**Messaging**
- **Direct messages** — one-to-one threads, alongside Friends as a list/discovery surface
- Supabase Realtime updates — new threads appearing in a channel, new replies in an open thread
- Auth via Supabase Auth (email/password)

**Threads**
- A new-thread flow — title plus optional description, with a live counter that hard-stops at 140 characters
- Attachment kinds beyond images — video, voice notes and downloadable files

**Navigation**
- Real routes, so a thread can be linked to and the browser's back button works
- A second server-rail layout: a unified compact list (dense text, servers as section headers, several expanded at once) alongside the built accordion

## Planned for later

- **Tag-based channel creation/sorting** — a tentative idea (organizing/auto-sorting channels by tags derived from conversation content); feasibility and mechanics are still open questions

Explicitly out of scope for v1 (revisit later): voice/video, moderation tooling, notifications, and roles/permissions nuance beyond owner/admin/member.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lenis](https://lenis.darkroom.engineering/) — smooth scrolling, scoped to the scrolling regions rather than the window
- [Geist](https://vercel.com/font) — typography, self-hosted
- [Playwright](https://playwright.dev/) — smoke tests and screenshot generation
- [React Router](https://reactrouter.com/) — installed, lands with routing
- [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime) — planned backend
- [Vercel](https://vercel.com/) — planned hosting

## Design notes

**Dark-mode-first:** the app is designed dark, with light mode derived from it. Colour tokens (Void, Surface, Ink, Mist, Spark, Signal) are shared across both modes, and every overlay, ring and shadow derives from its role colour, so the whole palette flips from one file.

**Shape language is split by surface, not by content.** A thread node on the canvas uses an irregular organic silhouette — the signature shape, never applied to UI chrome. Rails, rows, panels *and the grid's thread cards* use conventional rounded rects. So the same thread is drawn as a blob on the plane and as a card in the grid: the rule is scoped by the surface it's drawn on.

**Motion is restrained** — two easing curves that mean different things, five named durations, and no bounces, spinners or staggers.

## Getting started

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build      # typecheck, then build
npm run lint
npm test           # Playwright smoke suite
npm run shots      # regenerate the screenshot set
```

The test suite drives the Chrome already installed on the machine, so there's no browser binary to download.

## Project structure

Feature-based, not type-based:

```
src/
  features/
    servers/
    channels/
    threads/
    friends/        # planned
    auth/           # planned
  components/       # shared/primitive UI
  hooks/
  lib/              # mock data today; Supabase client later
  styles/tokens/    # colours, elevation, motion, radius, spacing, type
e2e/                # Playwright specs
```

## Project docs

- **[DECISIONS.md](DECISIONS.md)** — what was decided and why, what each choice beat, and the questions still open
- **[ROADMAP.md](ROADMAP.md)** — what's shipped, what's next, and a verified list of known gaps
- **[CLAUDE.md](CLAUDE.md)** — conventions and working notes for this repo
