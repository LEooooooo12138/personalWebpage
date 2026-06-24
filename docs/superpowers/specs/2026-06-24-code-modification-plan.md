# Code-Level Modification Plan

**Based on**: `docs/superpowers/specs/2026-06-23-admin-panel-design.md`
**Date**: 2026-06-24
**Summary**: Complete code diff for admin panel implementation — unified DB migration, auth, API routes, UI components, layout restructure, and security.

---

## 0. Dependency Changes

### `package.json`

```diff
+ "bcryptjs": "^3.0.3",        // added to devDependencies
```

*(Note: `bcryptjs` provides its own types, so `@types/bcryptjs` is not needed)*

### `.env.local` (NEW — gitignored)

```bash
ADMIN_PASSWORD=88888888
```

### `.gitignore`

```diff
+ LocalBuild.md
```

### Files Deleted

```
src/lib/runtime-store.ts           ← DELETED (replaced by DB)
```

---

## 1. Database Layer

### `src/lib/portfolio-db.ts` (NEW)

**Purpose**: Unified SQLite database for all portfolio data. Replaces three separate DB files (`skills.db`, `guestbook.db`, `visits.db`) and in-memory `runtime-store.ts`.

**Exports**:
```ts
export function getPortfolioDb(): Database.Database
```

**Tables created** (12 total):

| Table | Key Columns |
|---|---|
| `admin_users` | id, username, password_hash |
| `admin_sessions` | token, user_id, expires_at |
| `profile` | key, value |
| `experiences` | id, year, title, description, note, sort_order |
| `projects` | id, title, summary, tags(JSON), demo_url, repo_url, video_hint, claps |
| `skill_categories` | id, color, sort_order, created_at, updated_at |
| `skill_category_i18n` | category_id, lang, title, description |
| `skills` | name, category_id, proficiency, sort_order |
| `languages` | lang, name |
| `guestbook_notes` | id, author, message, created_at |
| `page_visits` | page, session_id, created_at |

**Migration logic** (`runMigrations`):
1. If `profile` table is empty → migrate from old `skills.db`, `guestbook.db`, `visits.db`
2. Seed static data (profile, experiences, projects, guestbook seed)
3. Always call `seedAdminUser()` — checks for existing admin, creates if missing
4. `seedAdminUser`: reads `process.env.ADMIN_PASSWORD`, bcrypt-hashes it, inserts into `admin_users`

**Key details**:
- DB path: `data/portfolio.db`
- WAL mode + foreign keys enabled
- Global singleton via `globalThis.__portfolioDb`

---

### `src/lib/skills-db.ts` (REWRITTEN)

**Changes**: Removed own schema init + seed (now in `portfolio-db.ts`). Uses `getPortfolioDb()` instead of own `getDb()`. Added admin CRUD functions.

**Public API (unchanged)**:
```ts
export function getSkills(lang: string): SkillsResponse
```

**Admin API (NEW)**:
```ts
export type CategoryRow  // id, color, sort_order, en_title, en_description, zh_title, zh_description
export type SkillRow     // name, category_id, proficiency, sort_order
export type LanguageRow  // lang, name
export type ReorderItem  // id, sort_order

export function getCategories(): CategoryRow[]
export function createCategory(id, enTitle, zhTitle, enDesc, zhDesc): void
export function updateCategory(id, color, sortOrder, enTitle, zhTitle, enDesc, zhDesc): void
export function deleteCategory(id): void

export function getSkillsByCategory(categoryId): SkillRow[]
export function addSkill(categoryId, name, proficiency?): void
export function updateSkill(name, newName, categoryId, proficiency): void
export function deleteSkill(name, categoryId): void

export function reorderSkillsOrCategories(type: "skill" | "category", items: ReorderItem[]): void

export function getLanguages(): LanguageRow[]
export function updateLanguages(languages: LanguageRow[]): void
```

---

### `src/lib/guestbook-db.ts` (REWRITTEN)

**Changes**: Uses `getPortfolioDb()` instead of `getSingletonDb("guestbook", ...)`. Added admin functions.

**Public API (unchanged)**:
```ts
export const listGuestbookNotes: () => Promise<GuestNote[]>
export const insertGuestbookNote: (note: GuestNote) => Promise<GuestNote>
```

**Admin API (NEW)**:
```ts
export type PaginatedResult<T>
export function listGuestbookAdmin(page, pageSize): PaginatedResult<GuestNote>
export function deleteGuestbookNote(id): void
```

---

### `src/lib/visit-counter-db.ts` (REWRITTEN)

**Changes**: Uses `getPortfolioDb()` instead of `getSingletonDb("visits", ...)`. Added admin function.

**Public API (unchanged)**:
```ts
export const getPageVisitCount: (page: string) => Promise<number>
export const recordPageVisit: (page, sessionId) => Promise<VisitResult>
```

**Admin API (NEW)**:
```ts
export function getVisitStats(): { total: number; pages: { page: string; count: number }[] }
```

---

### `src/lib/profile-db.ts` (NEW)

```ts
export type ProfileData = Record<string, string>
export function getProfile(): ProfileData
export function updateProfile(fields: Record<string, string>): void
```

---

### `src/lib/projects-db.ts` (NEW)

**Public API**:
```ts
export function getProjects(): Project[]
export function getProject(id: string): Project | undefined
export function incrementClaps(id: string): number
```

**Admin API**:
```ts
export function listProjectsAdmin(page, pageSize): PaginatedResult<Project>
export function createProject(project): Project
export function updateProject(id, updates): void
export function deleteProject(id): void
```

---

### `src/lib/experiences-db.ts` (NEW)

**Public API**:
```ts
export function getExperiences(): ExperienceNode[]
```

**Admin API**:
```ts
export function listExperiencesAdmin(page, pageSize): PaginatedResult<ExperienceNode & { id, sort_order }>
export function createExperience(exp): void
export function updateExperience(id, updates): void
export function deleteExperience(id): void
```

---

### `src/lib/portfolio-data.ts` (STRIPPED)

**Before**: Exported hardcoded `profile`, `experiences`, `baseProjects`, `initialGuestNotes` objects.
**After**: Only re-exports types from `@/types/portfolio`:

```ts
export type { ExperienceNode, GuestNote, Project, SkillCategory, SkillsResponse, LiveStatus } from "@/types/portfolio";
```

---

### `src/lib/admin-auth.ts` (NEW)

```ts
export type AdminUser = { id: string; username: string }

export async function createSession(password: string): Promise<AdminUser | null>
  // 1. Look up admin user in DB
  // 2. Compare password with bcrypt hash
  // 3. Insert session token into admin_sessions (24h expiry)
  // 4. Set admin_token cookie (httpOnly, secure in prod, sameSite lax)

export async function validateSession(): Promise<AdminUser | null>
  // 1. Read admin_token cookie
  // 2. Look up in admin_sessions, check expiry
  // 3. Clean expired session, return user or null

export async function clearSession(): Promise<void>
  // 1. Delete session from DB
  // 2. Clear admin_token cookie (maxAge: 0)
```

---

## 2. Public API Route Changes

### `src/app/api/projects/route.ts` (REWRITTEN)

**Before**: Read from `baseProjects` (hardcoded) + `runtime-store` (claps).
**After**: Uses `getProjects()` from `projects-db.ts`.

```ts
import { getProjects } from "@/lib/projects-db"
// GET returns projects from portfolio.db
```

### `src/app/api/projects/[id]/clap/route.ts` (REWRITTEN)

**Before**: Used `baseProjects` + `runtime-store` for clap counts.
**After**: Uses `getProject()` + `incrementClaps()` from `projects-db.ts`.

```ts
import { getProject, incrementClaps } from "@/lib/projects-db"
```

### `src/app/api/ai/route.ts` (MODIFIED)

**Before**: Imported `profile` from `portfolio-data.ts`.
**After**: Uses `getProfile()` from `profile-db.ts`. Stack array parsed from JSON.

```ts
import { getProfile } from "@/lib/profile-db"
const profile = getProfile()
const stack = JSON.parse(profile.stack || "[]")
```

### Unchanged Routes

These already called the DB-layer functions that were rewritten — they work transparently:
- `src/app/api/skills/route.ts` → `getSkills()` (skills-db.ts)
- `src/app/api/guestbook/route.ts` → `listGuestbookNotes()`, `insertGuestbookNote()` (guestbook-db.ts)
- `src/app/api/visits/route.ts` → `getPageVisitCount()`, `recordPageVisit()` (visit-counter-db.ts)

---

## 3. Admin API Routes (ALL NEW)

All routes under `src/app/api/admin/` are protected by `validateSession()` — 401 if not authenticated.

### Auth

| File | Methods | Purpose |
|---|---|---|
| `api/admin/auth/login/route.ts` | POST | `createSession(password)` → set cookie |
| `api/admin/auth/check/route.ts` | GET | `validateSession()` → return auth status |
| `api/admin/auth/logout/route.ts` | POST | `clearSession()` → remove cookie |

### Profile

| File | Methods | Purpose |
|---|---|---|
| `api/admin/profile/route.ts` | GET, PUT | `getProfile()` / `updateProfile(body)` |

### Experiences

| File | Methods | Purpose |
|---|---|---|
| `api/admin/experiences/route.ts` | GET, POST | `listExperiencesAdmin(page, pageSize)` / `createExperience(body)` |
| `api/admin/experiences/[id]/route.ts` | PUT, DELETE | `updateExperience(id, body)` / `deleteExperience(id)` |

### Projects

| File | Methods | Purpose |
|---|---|---|
| `api/admin/projects/route.ts` | GET, POST | `listProjectsAdmin(page, pageSize)` / `createProject(body)` |
| `api/admin/projects/[id]/route.ts` | PUT, DELETE | `updateProject(id, body)` / `deleteProject(id)` |

### Skills

| File | Methods | Purpose |
|---|---|---|
| `api/admin/skills/categories/route.ts` | GET, POST | `getCategories()` / `createCategory(...)` |
| `api/admin/skills/categories/[id]/route.ts` | PUT, DELETE | `updateCategory(...)` / `deleteCategory(id)` |
| `api/admin/skills/route.ts` | POST | `addSkill(categoryId, name, proficiency)` |
| `api/admin/skills/[name]/route.ts` | PUT, DELETE | `updateSkill(...)` / `deleteSkill(name, categoryId)` |
| `api/admin/skills/reorder/route.ts` | POST | `reorderSkillsOrCategories(type, items)` |
| `api/admin/skills/languages/route.ts` | GET, PUT | `getLanguages()` / `updateLanguages(body)` |

### Guestbook

| File | Methods | Purpose |
|---|---|---|
| `api/admin/guestbook/route.ts` | GET | `listGuestbookAdmin(page, pageSize)` |
| `api/admin/guestbook/[id]/route.ts` | DELETE | `deleteGuestbookNote(id)` |

### Visits

| File | Methods | Purpose |
|---|---|---|
| `api/admin/visits/route.ts` | GET | `getVisitStats()` |

---

## 4. Admin UI Components (ALL NEW)

All under `src/components/admin/`.

### `AdminSidebar.tsx`
- **Client component**, dark theme (`bg-zinc-900/95`, backdrop blur)
- SVG path icons for each section
- `fixed` positioning, `z-40`, `w-60` width
- Mobile: hamburger toggle, slide-in with overlay backdrop
- Sections: Experiences, Projects, Skills, Guestbook, Visits, Profile
- Footer: "Back to site" link + "Sign out" button (calls `/api/admin/auth/logout`)
- Active state: `bg-gold/10` + `text-gold`
- Collapses via CSS transform on mobile

### `AdminTable.tsx` (generic `<T>`)
- Props: `columns: Column<T>[]`, `data: T[]`, `keyFn`, `emptyMessage?`, `onRowClick?`
- Empty state: centered icon + message, rounded card
- Zebra striping: alternating `bg-transparent` / `bg-zinc-900/20`
- Hover: `hover:bg-gold/5` (only when `onRowClick` provided)
- Rounded container with `border-zinc-800/50`

### `AdminModal.tsx`
- Fixed overlay with `bg-black/70 backdrop-blur-sm`
- Rounded-2xl container, shadow-2xl
- Close via Escape key, overlay click, or X button
- Title in gold, serif heading

### `AdminConfirmDialog.tsx`
- Wraps `AdminModal`
- Delete button in red (`bg-red-600 hover:bg-red-500`)
- Cancel button in neutral

### `PaginationBar.tsx`
- Props: `page`, `pageSize`, `total`, `totalPages`, `onPageChange`, `onPageSizeChange`
- Page size selector: dropdown for 10/20/50
- Shows "Show X of Y" text
- Page number buttons with smart ellipsis (shows first, last, and ±2 around current)
- Prev/Next buttons, disabled at boundaries

---

## 5. Layout Restructure

### Problem
Root layout included `SiteNav` and `SiteFooter` globally, causing them to appear on admin pages. Admin sidebar overlapped with site layout structure.

### Solution: Route Groups

**Before**:
```
app/
  layout.tsx          ← nav + footer + LanguageProvider + cursor
  page.tsx, skills/, projects/, experience/, lab/
  admin/
    layout.tsx         ← sidebar (nested inside site nav)
```

**After**:
```
app/
  layout.tsx                       ← THIN SHELL: html, head, body, globals.css
  (site)/
    layout.tsx                     ← nav + footer + LanguageProvider + cursor
    page.tsx, skills/, projects/, experience/, lab/
  admin/
    (dashboard)/
      layout.tsx                   ← sidebar + top header bar
      page.tsx, experiences/, projects/, skills/, guestbook/, visits/, profile/
    login/
      page.tsx                     ← standalone (no sidebar, full-screen layout)
```

### `app/layout.tsx` (MODIFIED)

**Before**: 40 lines, imported `LanguageProvider`, `SiteNav`, `SiteFooter`, `CursorScript`.
**After**: 20 lines, pure HTML shell:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { ... };

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link href="..." rel="stylesheet" />
      </head>
      <body className="min-h-full">
        {children}
      </body>
    </html>
  );
}
```

### `app/(site)/layout.tsx` (NEW)

Extracted from old root layout — all site-specific UI:

```tsx
import { LanguageProvider } from "@/components/language-provider";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { CursorScript } from "@/components/cursor-script";
// ... cookies for initialLang ...

export default function SiteLayout({ children }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <div id="cursor" suppressHydrationWarning />
      <div id="cursor-dot" suppressHydrationWarning />
      <section className="aurora" />
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
      <CursorScript />
    </LanguageProvider>
  );
}
```

### `app/admin/(dashboard)/layout.tsx` (MOVED + ENHANCED)

Moved from `app/admin/layout.tsx`. Added sticky top bar. Sidebar + content layout:

```tsx
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminDashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <AdminSidebar />
      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50 px-6 py-4">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <h1 className="text-sm font-medium text-zinc-400 tracking-wide">Dashboard</h1>
            <span className="text-xs text-zinc-600">v3 admin</span>
          </div>
        </header>
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### File Moves

| From | To |
|---|---|
| `app/page.tsx` | `app/(site)/page.tsx` |
| `app/skills/` | `app/(site)/skills/` |
| `app/projects/` | `app/(site)/projects/` |
| `app/experience/` | `app/(site)/experience/` |
| `app/lab/` | `app/(site)/lab/` |
| `app/admin/layout.tsx` | `app/admin/(dashboard)/layout.tsx` |
| `app/admin/page.tsx` | `app/admin/(dashboard)/page.tsx` |
| `app/admin/experiences/` | `app/admin/(dashboard)/experiences/` |
| `app/admin/projects/` | `app/admin/(dashboard)/projects/` |
| `app/admin/skills/` | `app/admin/(dashboard)/skills/` |
| `app/admin/guestbook/` | `app/admin/(dashboard)/guestbook/` |
| `app/admin/visits/` | `app/admin/(dashboard)/visits/` |
| `app/admin/profile/` | `app/admin/(dashboard)/profile/` |

**Note**: `app/admin/login/page.tsx` is NOT in a route group — it renders standalone with only the root HTML shell.

---

## 6. Admin Page Components (ALL NEW)

Each section page follows the same pattern:
- Client component with `useState` + `useEffect` + `useCallback`
- Fetches from admin API, handles 401 → redirect to `/admin/login`
- Four states: loading skeleton, error + retry, empty, data table
- CRUD via `AdminModal` and `AdminConfirmDialog`
- Pagination via `PaginationBar`

### `app/admin/login/page.tsx` (NEW)

- Full-screen dark login form (standalone, no sidebar)
- On mount: checks `/api/admin/auth/check` → if already authed, redirect to `/admin/experiences`
- POST to `/api/admin/auth/login` with password
- Error display, loading state on submit button
- "Back to site" link to `/`

### `app/admin/(dashboard)/page.tsx` (NEW)

Simple redirect to `/admin/experiences`:

```tsx
import { redirect } from "next/navigation";
export default function AdminPage() { redirect("/admin/experiences"); }
```

### `app/admin/(dashboard)/experiences/page.tsx` (NEW)

- Table columns: sort_order, year (mono font), title, actions (Edit/Del)
- Modal form: Year, Title, Description, Note
- Sortable by sort_order

### `app/admin/(dashboard)/projects/page.tsx` (NEW)

- Table columns: ID (mono), title, tags (badges), actions
- Modal form: ID (slug, create-only), Title, Summary, Tags (comma-separated), Demo URL, Repo URL, Video Hint

### `app/admin/(dashboard)/skills/page.tsx` (NEW)

Most complex page — three management areas:
1. **Category table**: color dot, ID, EN title, ZH title, Edit/Del
2. **Category tabs**: buttons to switch active category, "New Category" button
3. **Skill table** (filtered by selected category): Name, Proficiency, Edit/Del
4. **Languages modal**: textarea with `lang: name` format (one per line)

Separate modals for Category, Skill, and Languages. Each with its own form state.

### `app/admin/(dashboard)/guestbook/page.tsx` (NEW)

- Table columns: Author, Message, Date, Del
- Paginated, newest first
- Only delete action (no create — guestbook entries come from public site)

### `app/admin/(dashboard)/visits/page.tsx` (NEW)

- Stats card: total visit count in large gold number
- Table: Page path + visit count, sorted by count desc
- No pagination (one-time fetch)

### `app/admin/(dashboard)/profile/page.tsx` (NEW)

- Form-based editor (no table)
- Fields: Name, Role, Tagline, Location Pool (JSON textarea), Songs Pool (JSON textarea), Stack (JSON textarea)
- Save button with success indicator ("✓ Saved" for 2 seconds)
- Validates JSON format on save

---

## 7. Security Design

### Password Flow

```
User sets ADMIN_PASSWORD=88888888 in .env.local (local dev)
  or in Vercel Environment Variables (production)

On first boot:
  seedAdminUser() reads process.env.ADMIN_PASSWORD
  → bcryptjs.hashSync(password, 10)
  → INSERT INTO admin_users (id, username, password_hash)
  → console.log("[migration] Admin user seeded")

On login:
  POST /api/admin/auth/login { password }
  → createSession() reads hash from admin_users
  → bcrypt.compareSync(input, hash)
  → if valid: insert session token, set admin_token cookie (24h)

On admin API calls:
  validateSession() reads admin_token cookie
  → look up token in admin_sessions, check expires_at > now
  → if expired: delete token, return 401
  → if valid: return AdminUser
```

### Why this is secure

- **`.env.local` is in `.gitignore`** → password never committed to Git
- Vercel deployment: set `ADMIN_PASSWORD` in the Environment Variables dashboard (encrypted at rest)
- Database stores bcrypt hash (10 salt rounds), NOT plaintext password
- `admin_token` cookie: `httpOnly` (JS can't read it), `secure` in production, `sameSite: lax`
- Sessions expire after 24 hours, cleaned from DB on each validation

---

## 8. Visual Design Tokens

Admin panel uses a dark theme distinct from the public site's light theme:

| Token | Value | Usage |
|---|---|---|
| Background | `bg-zinc-950` | Page body |
| Card/Surface | `bg-zinc-900` | Modals, profile form |
| Border | `border-zinc-800/50` | Table borders, card edges |
| Text primary | `text-zinc-200` | Content |
| Text secondary | `text-zinc-400` | Labels |
| Text muted | `text-zinc-500/600` | Helpers, meta |
| Accent | `text-gold` / `bg-gold/10` | Active nav, headings |
| Danger | `bg-red-600` / `text-red-400` | Delete buttons |

Typography: `font-heading` for titles (serif), system sans for body.

---

## 9. Verification Checklist

- [ ] `npx tsc --noEmit` passes (only pre-existing `hero-scene.tsx` error)
- [ ] Public pages at `/`, `/skills`, `/projects`, `/experience`, `/lab` render correctly
- [ ] Public API: `/api/skills`, `/api/projects`, `/api/guestbook`, `/api/visits` return data
- [ ] Admin: `/admin` redirects to `/admin/experiences`
- [ ] Admin: `/admin/login` shows login form (no sidebar, no site nav)
- [ ] Admin: login with `ADMIN_PASSWORD` succeeds, redirects to dashboard
- [ ] Admin: all 6 dashboard sections CRUD works
- [ ] Admin: sidebar navigation highlights active section
- [ ] Admin: "Sign out" clears session, redirects to login
- [ ] Admin: API returns 401 if not authenticated
- [ ] Old DB files (`skills.db`, `guestbook.db`, `visits.db`) are migrated on first boot
- [ ] Password not present in any committed file
- [ ] `.env.local` is gitignored
