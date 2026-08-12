# Scatterbrain

## Overview
Scatterbrain is a portfolio messaging app combining Discord/Skype-style server-and-channel organization with forum-style threading: posts in a channel create threads, so a channel's conversation is non-linear until a specific thread is opened. Built to demonstrate distinctive product/UX thinking (a non-list thread display, realtime data modeling) rather than a chat-app clone. Personality: structured but casual, spatial and associative rather than strictly hierarchical — "scattered thoughts finding order," not a corporate chat tool.

## Scope
**In for v1:**
- Servers, channels, thread-based messaging, Supabase Realtime updates, auth
- A Friends / Servers / Settings top-level switcher (new — see Layout)

**Explicitly not v1** (revisit later, don't design deeply yet):
- Voice/video
- Moderation tooling
- Notifications
- Roles/permissions nuance beyond owner/admin/member
- Direct messages — **TBD: does the new "Friends" menu imply DMs are now in scope, or does it stay a friend list/discovery surface with DMs deferred?** Affects the domain model below either way.

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
    friends/       # new — pending the Friends/DM scope decision above
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
- Threads — created by a root post in a channel; what makes a thread a thread (title required, or just the first message?): TBD
- Messages/replies — belong to a thread; author, timestamp, edit history: TBD
- Users & memberships — roles (owner/admin/member); whether roles matter for v1 at all: TBD

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
  - *Unified compact list* — no separate icon rail; dense Zulip-style text list, servers as section headers, several can stay expanded at once
  - Both use full server names (not two-letter marks) and distinct treatment for unread / mention / invite states, built on shared interaction logic so they can sit behind one toggle
  - Rejected: blob rail (still read as Discord regardless of icon shape), dot-cluster rail (two-letter marks carried too little information), merged single-panel rail (too cramped), flyout rail (didn't stick)
- **Main content:** thread canvas — bubble/node view is the primary approved treatment (not a scrollable list); a grid alternative is also approved. Planned as a user-facing toggle, same pattern as above.
- **Optional right panel:** thread/channel participants and info, collapsible

## Section Structure
Rough route shape (routes/pages, not component sections):
- `/servers/:serverId/channels/:channelId` — thread canvas
- `/servers/:serverId/channels/:channelId/threads/:threadId` — open thread
- `/friends` — new, pending the Friends/DM scope decision above
- `/settings` — new, top-level per the switcher above
- Auth routes, server-discovery/landing route — TBD

## Design Conventions
- **Shape language is deliberate and split by role:** thread nodes use irregular organic blob radii (a signature shape, not shared with UI chrome); rail/list/panel chrome uses conventional rounded rects, roughly 8–14px radius
- Icon set: TBD — `lucide-react` pairs well with the stack, not yet decided
- Spacing scale, component naming/composition rules: TBD
- Motion: Lenis handles scroll only — microinteractions (accordion/list expand-collapse, hover states, thread-open transitions) are a separate, still-open decision. A CSS `grid-template-rows: 0fr → 1fr` transition was prototyped for expand/collapse and is worth carrying forward as the default pattern.
- Still pending design: a fan-of-three-images preview inside thread bubbles (playing-card style overlap, each card rotated a few degrees; a fourth "more" card uses a blank grey-to-white gradient instead of an image) — with Claude Design as of this round. A click-once-to-preview/click-again-to-open interaction for topic bubbles is still queued for a later round.

## Notes
- Claude Design and this project don't share context automatically — visual decisions get handed over in writing via a brief; HTML exports of approved drafts live in this Claude.ai Project's knowledge base as the source of truth for "current state."
- Decision log (rail): blob → rejected · dot-cluster → rejected · merged single-panel → rejected · flyout → rejected · accordion → approved · unified compact list → approved (toggle planned)
- Decision log (thread view): bubble → approved · grid → approved (toggle planned)

## Commands
```
npm run dev
npm run build
npm run lint
```
Supabase/Vercel CLI commands — TBD once wired up.
