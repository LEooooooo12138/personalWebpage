# Personal Web V3 (Next.js Full-Stack MVP)

This is the V3 branch implementation for your React-based full-stack portfolio.

## Implemented in this version

- Next.js (App Router) project in `v3-react/`
- 2026-style visual baseline:
  - Bento grid layout
  - dark aurora glassmorphism background
  - micro interactions via Framer Motion
  - 3D hero element via React Three Fiber
- Dynamic backend APIs (inside Next.js):
  - `GET /api/status` live status card payload
  - `GET /api/projects` project gallery with clap counts
  - `POST /api/projects/:id/clap` clap interaction (supports hold-to-clap)
  - `GET/POST /api/guestbook` visitor message wall
  - `POST /api/ai` "Chat with Me" agent endpoint (rules-based placeholder)

## Run locally

```bash
cd v3-react
npm install
npm run dev
```

Open: `http://localhost:3000`

## Build and lint

```bash
npm run lint
npm run build
```

## Current architecture note

This MVP currently uses an in-memory runtime store (`src/lib/runtime-store.ts`) so it works out of the box without infrastructure.

## Phase-2 upgrade path (recommended)

1. Replace runtime store with PostgreSQL + Prisma models (`Project`, `ClapEvent`, `GuestNote`, `ProfileSection`).
2. Add Redis for clap throttling and online-presence counters.
3. Replace `/api/ai` rule engine with real LLM provider and retrieval context (resume + projects).
4. Implement Socket transport (Socket.io) for realtime guest wall updates.
5. Add admin CMS route group for content management and moderation.
