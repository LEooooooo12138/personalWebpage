# Skills Page Redesign — Design Spec

**Date:** 2026-06-23
**Status:** Approved
**Goal:** Replace hardcoded numbered-cards layout with a data-driven progressive-disclosure accordion, backed by a database and REST API.

---

## 1. Motivation

**Current problems:**

- Each skill category card is hardcoded in JSX (`01`, `02`, `03`, `04`) with `nth-child` color rules in CSS.
- Adding a new category requires touching JSX, CSS, and i18n in three separate places.
- Adding a new skill requires editing the JSX and `skillCategoryMap` object manually.
- Skills data is static and embedded in `portfolio-data.ts` — not queryable, not updatable at runtime.
- The 2×2 grid layout breaks visually with an odd number of categories.

**Goals:**

1. **Data-driven rendering** — categories and skills rendered via `map`, not hardcoded.
2. **Database persistence** — skills stored in SQLite (local) / Vercel DB (prod), fetched via API.
3. **Progressive disclosure** — collapsed state for quick scanning; expanded state with proficiency bars and project links for depth.
4. **i18n-ready** — all display text lives in the database with locale columns.
5. **Scalable architecture** — adding a category or skill is a single DB insert.

---

## 2. Database Schema

Use the existing `better-sqlite3` pattern (same as visit-counter). Data is seeded at startup from a migration file.

### Table: `skill_categories`

| Column      | Type    | Notes                            |
|-------------|---------|----------------------------------|
| id          | TEXT PK | e.g. `"frontend"`, `"backend"`   |
| color       | TEXT    | CSS variable key: `gold`, `terracotta`, `sage` |
| sort_order  | INTEGER | Display order                    |
| created_at  | TEXT    | ISO 8601                         |
| updated_at  | TEXT    | ISO 8601                         |

### Table: `skill_category_i18n`

| Column      | Type    | Notes                              |
|-------------|---------|------------------------------------|
| category_id | TEXT PK | FK → `skill_categories.id`        |
| lang        | TEXT PK | `"en"` or `"zh"`                  |
| title       | TEXT    | e.g. `"Front-End"` / `"前端"`     |
| description | TEXT    | Category description paragraph     |

### Table: `skills`

| Column      | Type    | Notes                            |
|-------------|---------|----------------------------------|
| name        | TEXT PK | e.g. `"React"`, `"Python"`       |
| category_id | TEXT    | FK → `skill_categories.id`       |
| proficiency | INTEGER | 0–100 (nullable; for future B mode) |
| sort_order  | INTEGER | Display order within category    |

### Table: `languages`

| Column      | Type    | Notes                    |
|-------------|---------|--------------------------|
| lang        | TEXT PK | `"en"` or `"zh"`         |
| name        | TEXT    | e.g. `"Mandarin (Native)"` |

---

## 3. API Design

### `GET /api/skills`

Returns all skill categories with their skills, localized to the requested language.

**Query params:** `?lang=en` (default: `en`)

**Response shape:**

```json
{
  "categories": [
    {
      "id": "frontend",
      "color": "gold",
      "title": "Front-End",
      "description": "Polished interfaces with thoughtful animation.",
      "skills": ["HTML", "CSS", "Vue", "React"]
    },
    {
      "id": "backend",
      "color": "terracotta",
      "title": "Back-End",
      "description": "Robust APIs, database architecture...",
      "skills": ["SQL", "C++", "Java", "Python", "Swift", "PHP"]
    }
  ],
  "languages": ["Mandarin (Native)", "English (Professional)"]
}
```

**Implementation notes:**
- Single SQL query with JOINs; no N+1.
- Cached in the runtime store (same pattern as `runtime-store.ts` for project claps) to avoid repeated DB reads within the same server instance.
- Returns `languages` in the same response to reduce round-trips.

---

## 4. Component Architecture

```
SkillsPage (server component — fetches via API or direct DB call)
└── SkillsPageClient ("use client" — interactive expand/collapse)
    ├── SkillsHeader (title + subtitle, i18n)
    ├── SkillCategoryList
    │   └── SkillCategoryItem × N
    │       ├── CollapsedRow: category title + comma-separated skill chips + chevron
    │       └── ExpandedRow: description + proficiency bars + related projects
    ├── LanguagesRow (read from API)
    └── TerminalToggle (inherited from current design)
```

**Data flow:**
- Server component calls `GET /api/skills?lang=...` (or directly reads DB for SSR).
- Passes data as props to the client component.
- Client manages expand/collapse state with `useState`.

---

## 5. Interaction Design

**Collapsed state (default):**
- All categories collapsed on page load.
- Each row shows: `[colored dot] Category Title  —  skill1 · skill2 · skill3  [▶]`
- Hover: row background changes slightly; chevron color shifts.
- Quick-scan goal: read all categories and their tags in < 3 seconds.

**Expanded state:**
- Only one category expanded at a time (accordion behavior).
- Expanded row shows:
  - Category description text (from DB i18n).
  - Proficiency bars for each skill (rendered from `proficiency` field).
  - "Related Projects" links (if any).
- Transition: `max-height` animation with `overflow: hidden` (~300ms ease).

**Terminal mode:**
- Retained from current design as a fun easter egg.
- Interactive terminal: `ls skills`, `cat languages.txt`, `whoami`, `help`.

---

## 6. Visual Design Tokens

Reuse existing design system tokens from `globals.css`:

| Token        | Value     | Usage                        |
|--------------|-----------|------------------------------|
| `--gold`     | `#c49b3f` | Primary accent (Front-End)   |
| `--terracotta` | `#c4785b` | Secondary accent (Back-End)  |
| `--sage`     | `#7d9a7a` | Tertiary accent (Tools)      |
| `--serif`    | Playfair Display | Category titles        |
| `--sans`     | Inter     | Body text, skill tags        |
| `--mono`     | JetBrains Mono | Terminal mode           |

Color assignment: stored in DB `color` column; mapped to CSS variables via a lookup object. Additional categories beyond the 3 predefined colors cycle through the palette.

---

## 7. Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `src/types/portfolio.ts` | Modify | Add `SkillCategory`, `Skill`, `SkillsResponse` types |
| `src/lib/skills-db.ts` | **Create** | DB layer: init, seed, query (same pattern as `visit-counter-db.ts`) |
| `src/app/api/skills/route.ts` | **Create** | `GET /api/skills` endpoint |
| `data/skills-seed.sql` | **Create** | Initial seed data for skill_categories, skills, languages |
| `src/components/pages/skills-page.tsx` | **Rewrite** | Server + client split; data-driven accordion |
| `src/app/globals.css` | Modify | Replace old `.skill-card` / `.skills-grid-col` rules |
| `src/lib/portfolio-data.ts` | Modify | Remove `skillCategoryMap`, `baseProjects` skills references |
| `src/lib/i18n.ts` | Modify | Remove skills-related hardcoded messages |

---

## 8. Edge Cases & Constraints

- **Empty state:** If the DB returns 0 categories, show a graceful placeholder: _"Skills data is being prepared."_
- **Missing i18n:** Fall back to `en` if the requested locale has no entry for a category.
- **DB unavailable:** Fall back to a hardcoded default dataset (seed data) so the page never breaks.
- **Mobile (≤768px):** Single column, full-width rows, proficiency bars stack vertically.
- **No JS (SSR):** All categories rendered expanded (no accordion dependency on JS).

---

## 9. Migration & Rollback

- Seed data is idempotent (`INSERT OR IGNORE`).
- Old CSS classes (`skill-card`, `skills-grid-col`, `.num`) removed; new classes introduced.
- `portfolio-data.ts` retains `experiences`, `baseProjects`, and `profile` — only skills-related code removed.
