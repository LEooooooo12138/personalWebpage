# Admin Panel Design Spec

**Date**: 2026-06-23
**Status**: Approved

## Overview

Redesign the admin panel for the personal website. All content is stored in a unified SQLite database (`portfolio.db`) and managed through a sidebar-based admin UI at `/admin`, protected by password authentication.

## 1. Database Schema — Unified `portfolio.db`

A single SQLite database replaces the current fragmented storage (hardcoded `portfolio-data.ts`, in-memory `runtime-store.ts`, and three separate DBs: `skills.db`, `guestbook.db`, `visits.db`).

### Tables

| Table | Purpose | Key Columns |
|---|---|---|
| `admin_users` | Auth credentials | id, username, password_hash |
| `profile` | Key-value profile fields | key, value |
| `experiences` | Experience timeline | id, year, title, description, note, sort_order |
| `projects` | Project portfolio | id, title, summary, tags(JSON), demo_url, repo_url, video_hint, claps |
| `skill_categories` | Skill category metadata | id, color, sort_order |
| `skill_category_i18n` | Category translations | category_id, lang, title, description |
| `skills` | Individual skills | name, category_id, proficiency, sort_order |
| `languages` | Language proficiencies | lang, name |
| `guestbook_notes` | Guestbook entries | id, author, message, created_at |
| `page_visits` | Visit counter | page, session_id, created_at |

### Migration Strategy

- **Phase 1**: Create `portfolio.db` with full schema in `data/`
- **Phase 2**: Migrate data from `skills.db`, `guestbook.db`, `visits.db` on first boot
- **Phase 3**: Migrate hardcoded data from `portfolio-data.ts` (profile, experiences, projects) as seed
- **Phase 4**: Remove old DB files and in-memory store; all consumers read from new DB

### Color Palette for Skill Categories

Cycles through: `gold`, `terracotta`, `sage` for dynamic categories beyond the base 4.

## 2. API Routes — `/api/admin/*`

All admin routes are protected by session-based authentication middleware.

### Auth

| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/auth/login` | Validate password, set session cookie |
| GET | `/api/admin/auth/check` | Verify session is valid |
| POST | `/api/admin/auth/logout` | Clear session cookie |

**Flow**: Password compared against bcrypt hash stored in `admin_users` table. Initial admin user seeded from `ADMIN_PASSWORD` env var. Session cookie (`admin_token`) valid for 24 hours.

### Profile

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/profile` | Get all profile key-value pairs |
| PUT | `/api/admin/profile` | Update profile fields (batch) |

### Experiences

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/experiences?page=1&pageSize=20` | Paginated list, ordered by sort_order |
| POST | `/api/admin/experiences` | Create new experience |
| PUT | `/api/admin/experiences/[id]` | Update experience |
| DELETE | `/api/admin/experiences/[id]` | Delete experience |

### Projects

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/projects?page=1&pageSize=20` | Paginated list |
| POST | `/api/admin/projects` | Create project |
| PUT | `/api/admin/projects/[id]` | Update project |
| DELETE | `/api/admin/projects/[id]` | Delete project |

### Skills

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/skills/categories` | All categories with i18n |
| POST | `/api/admin/skills/categories` | Create category |
| PUT | `/api/admin/skills/categories/[id]` | Update category + i18n |
| DELETE | `/api/admin/skills/categories/[id]` | Delete category and its skills |
| POST | `/api/admin/skills` | Add skill to category |
| PUT | `/api/admin/skills/[name]` | Update skill (name, proficiency, category) |
| DELETE | `/api/admin/skills/[name]` | Remove skill |
| POST | `/api/admin/skills/reorder` | Batch reorder skills or categories |
| GET | `/api/admin/skills/languages` | Get language proficiencies |
| PUT | `/api/admin/skills/languages` | Update language proficiencies |

### Guestbook

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/guestbook?page=1&pageSize=20` | Paginated list (newest first) |
| DELETE | `/api/admin/guestbook/[id]` | Remove a guestbook entry |

### Visits

| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/visits` | Visit stats per page, total counts |

### Response Format

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## 3. Frontend — `/admin`

### Route Structure

```
app/
  admin/
    layout.tsx          — Auth guard wrapper (redirect to login if no session)
    page.tsx             — Redirect to /admin/experiences (first section)
    login/
      page.tsx           — Login form
    experiences/
      page.tsx           — Experiences CRUD table
    projects/
      page.tsx           — Projects CRUD table
    skills/
      page.tsx           — Skills management (categories, skills, reorder)
    guestbook/
      page.tsx           — Guestbook list with delete
    visits/
      page.tsx           — Visit statistics dashboard
    profile/
      page.tsx           — Profile editor form
```

### Shared Components

| Component | Purpose |
|---|---|
| `AdminSidebar` | Left sidebar with section links, highlights active |
| `AdminTable` | Reusable table with pagination, page size selector (10/20/50), search |
| `AdminModal` | Modal for create/edit forms |
| `AdminConfirmDialog` | Delete confirmation dialog |
| `PaginationBar` | Page navigation: prev/next, page numbers, page size dropdown |

### UI States per Section

Each section page handles: **loading** (skeleton), **empty** (no data CTA), **error** (retry), and **data** (table with actions).

### Pagination

- Default page size: **20**
- Dropdown options: 10 / 20 / 50
- Stored in `pageSize` query param
- API returns `total` and `totalPages` for accurate pagination

## 4. Auth Implementation

### Env Var

```
ADMIN_PASSWORD=your-secure-password
```

### Seeding

On first DB init, hash `ADMIN_PASSWORD` with bcrypt and insert into `admin_users`. If env var is unset, log a warning and skip admin user creation.

### Middleware

`src/lib/admin-auth.ts`:
- `createSession(password)` — validate and set cookie
- `validateSession(request)` — check cookie, return user or null
- `clearSession()` — remove cookie

Each admin API route calls `validateSession()` at the top; returns 401 if invalid.

### Session Token

- Random UUID stored in cookie `admin_token`
- Also stored in `admin_sessions` table with expiry (24h)
- Checked on every admin API request

## 5. Existing Code Changes

### Files to Modify

| File | Change |
|---|---|
| `src/lib/portfolio-data.ts` | Remove hardcoded data; keep only type exports |
| `src/lib/runtime-store.ts` | **Delete** — replaced by DB |
| `src/lib/skills-db.ts` | Rewrite to use `portfolio.db` |
| `src/lib/guestbook-db.ts` | Rewrite to use `portfolio.db` |
| `src/lib/visit-counter-db.ts` | Rewrite to use `portfolio.db` |
| `src/lib/db-factory.ts` | Simplify — single `portfolio.db` connection |
| `src/app/api/skills/route.ts` | Point to new DB layer |
| `src/app/api/projects/route.ts` | Point to new DB layer |
| `src/app/api/guestbook/route.ts` | Point to new DB layer |
| `src/app/api/visits/route.ts` | Point to new DB layer |
| `src/app/api/projects/[id]/clap/route.ts` | Point to new DB layer |

### Files to Create

All files under `src/app/admin/` and `src/components/admin/`.

### Non-Breaking

Public-facing pages (home, skills, projects, experience, guestbook, lab) continue to work — they now read from `portfolio.db` instead of hardcoded/in-memory sources.

## 6. Visual Design

- Matches existing site aesthetic: dark theme, serif headings, golden accents
- Sidebar: dark background, semi-transparent, with active state highlight
- Content area: clean white/dark card with subtle borders
- Tables: zebra striping, hover state, action icon buttons
- Modals: centered overlay with backdrop blur
- Responsive: sidebar collapses to hamburger on mobile

## 7. Implementation Order

1. Create unified `portfolio.db` schema + migration script
2. Rewrite data access layers (skills-db, guestbook-db, visit-counter-db, new profile/projects/experiences)
3. Update public API routes to use new DB
4. Create admin API routes with auth
5. Build admin UI components (sidebar, table, modal, pagination)
6. Build admin section pages (profile, experiences, projects, skills, guestbook, visits)
7. Build login page and auth flow
8. Remove old code (runtime-store, hardcoded data)
9. Test all public pages still work + admin CRUD works

---

## Appendix: Schema Details

### `admin_sessions`
| Column | Type | Description |
|---|---|---|
| token | TEXT PRIMARY KEY | UUID session token |
| user_id | TEXT NOT NULL | FK to admin_users.id |
| expires_at | TEXT NOT NULL | ISO 8601 timestamp, 24h from creation |

### `profile` (key-value)
Keys: `name`, `role`, `tagline`, `location_pool` (JSON array), `songs_pool` (JSON array), `stack` (JSON array)

### Skills Reorder API Format
```json
POST /api/admin/skills/reorder
{
  "type": "skill" | "category",
  "items": [{ "id": "...", "sort_order": 0 }, ...]
}
```

### bcrypt Dependency
Add `bcryptjs` (pure JS, no native build) to `package.json` for password hashing.
