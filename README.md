# Scatterbrain

Scatterbrain is a server-and-channel messaging app with forum-style, non-linear threading. Posts in a channel spawn threads, so a channel's conversation isn't a single scrolling list — it's a space of separate threads you open individually.

## Current status

Actively in development. The UI is scaffolded and running on mock data (`src/lib/mockData.ts`) — there's no backend wired up yet.

Built so far:
- Server rail + channel list (`ServerSidebar`, `ChannelHeader`)
- Top-left Friends/Servers/Settings switcher (`TopSwitcher`)
- Thread canvas with bubble-view rendering (`ThreadCanvas`, `ThreadBubble`)
- Channel info panel (`ChannelInfoPanel`)
- Theme system (dark/light) and sidebar-mode hooks

Not yet built:
- Supabase backend (auth, database, realtime)
- Friends and Settings routes/pages
- Direct messages

## Core concept

The domain model is **Server → Channel → Thread → Message**. A thread is created by a root post in a channel, and replies live inside that thread rather than inline in the channel. This means a channel's conversation is non-linear until a specific thread is opened — closer to a forum than a chat log.

The primary view for a channel is a **thread canvas**: threads render as bubbles/nodes in a spatial layout rather than a scrollable list, with a grid layout available as an alternate view.

## Planned features (v1)

- Servers, channels, and thread-based messaging
- Supabase Realtime updates — new threads appearing in a channel, new replies in an open thread
- Auth via Supabase Auth (email/password)
- Friends / Servers / Settings top-level switcher
- Two selectable server-rail layouts: Accordion (single-column, one server expanded at a time) and Unified compact list (dense, Zulip-style, multiple servers expanded)
- Two selectable thread-canvas views: bubble and grid

## Planned for later

- **Direct messages** — confirmed in scope, but ships after Friends (which starts as a list/discovery surface)
- **Tag-based channel creation/sorting** — a tentative idea (organizing/auto-sorting channels by tags derived from conversation content); feasibility and mechanics are still open questions

Explicitly out of scope for v1 (revisit later): voice/video, moderation tooling, notifications, and roles/permissions nuance beyond owner/admin/member.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Lenis](https://lenis.darkroom.engineering/) — smooth scrolling
- [Geist](https://vercel.com/font) — typography
- [Supabase](https://supabase.com/) (PostgreSQL + Auth + Realtime) — planned backend
- [Vercel](https://vercel.com/) — planned hosting

## Design notes

Dark-mode-first: the app is designed dark, with light mode derived from it. Colour tokens (Void, Surface, Ink, Mist, Spark, Signal) are shared across both modes.

Shape language is deliberately split by role: thread nodes use irregular organic blob radii as a signature shape, while rail/list/panel chrome uses conventional rounded rects.

## Getting started

```bash
npm install
npm run dev
```

Other commands:

```bash
npm run build
npm run lint
```

## Project structure

Feature-based, not type-based:

```
src/
  features/
    servers/
    channels/
    threads/
    friends/   # planned
    auth/      # planned
  components/  # shared/primitive UI
  hooks/
  lib/
```
