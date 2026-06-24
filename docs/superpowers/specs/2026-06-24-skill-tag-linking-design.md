# Skill Tag Linking — Design Spec

**Date:** 2026-06-24
**Status:** Approved
**Goal:** Connect Skills table as the single source of truth for technology tags, linked to Projects and Experience entries via junction tables, with reverse trackback and hover preview.

---

## 1. Motivation

**Current problem:** Skills, Projects, and Experience each define their own tags independently — no linkage.

| Page | Tag type | Source | Connected? |
|---|---|---|---|
| Skills | Tech names (React, Python...) | DB `skills` table | ❌ |
| Projects | Tech tags (Next.js, Tailwind...) | `projects.tags` JSON field | ❌ |
| Experience | Conceptual keywords (全栈实战...) | Parsed from `note` field | ❌ |

**Cannot currently:** click a skill to see where it's used; validate project tags against the skills vocabulary; see tech stack on experience entries.

---

## 2. Database Schema Changes

### New Tables

```sql
CREATE TABLE IF NOT EXISTS project_skills (
  project_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, skill_name),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (skill_name) REFERENCES skills(name)
);

CREATE TABLE IF NOT EXISTS experience_skills (
  experience_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (experience_id, skill_name),
  FOREIGN KEY (experience_id) REFERENCES experiences(id),
  FOREIGN KEY (skill_name) REFERENCES skills(name)
);
```

### Migration

- `projects.tags` JSON field retained for backward compatibility, deprecated for display
- Existing project tags auto-migrated to `project_skills` on first boot
- Experience entries: no auto-migration (existing keywords are conceptual, not technical)

---

## 3. API Changes

### 3.1 GET /api/projects (MODIFY)
Add `skills: { name, category, color }[]` field from JOIN on `project_skills` + `skills` + `skill_categories`.

### 3.2 GET /api/experiences (NEW public endpoint)
Currently Experience page reads from hardcoded i18n. New endpoint returns experience list with `skills[]` and `narrative` fields.

### 3.3 GET /api/skills (MODIFY)
Each skill in response gains `used_in: { projects: string[], experiences: string[] }`.

### 3.4 Admin API
- `PUT /api/admin/projects/[id]` accepts `skills: string[]`
- `PUT /api/admin/experiences/[id]` accepts `skills: string[]`
- CRUD on junction tables done implicitly via the above endpoints

---

## 4. Frontend Components

### 4.1 New: SkillTag shared component
- Props: `name`, `categoryId?`, `color?`, `size?`
- On hover: popup shows category, color indicator, and "used in N projects / M experiences"
- Reused across Skills, Projects, and Experience pages

### 4.2 Skills Page (trækback)
- When category expanded: each skill row shows "📦 used in N projects / 📋 N experiences" below the skill name

### 4.3 Projects Page
- Project tags rendered as `<SkillTag>` with hover popup
- Tags data comes from `project.skills[]` instead of `project.tags[]`

### 4.4 Experience Page
- Two tag rows: conceptual keywords (existing) + tech skill tags (new)
- Tech tags rendered as `<SkillTag>`
- Page switches from hardcoded i18n data to API fetch

---

## 5. Visual Design

- SkillTags inherit category `color` (gold/terracotta/sage) for consistent visual language
- Hover popup: dark card with border, ~200ms fade-in
- Skills page trackback: subtle muted text, no layout shift

---

## 6. Files to Create / Modify

| File | Action |
|---|---|
| `src/lib/portfolio-db.ts` | Add `project_skills` + `experience_skills` tables, migration logic |
| `src/types/portfolio.ts` | Add `ProjectSkill`, `ExperienceSkill` types; extend `Project`, `SkillsResponse` |
| `src/app/api/projects/route.ts` | JOIN project_skills into response |
| `src/app/api/experiences/route.ts` | **NEW** public endpoint with skills JOIN + narratives |
| `src/app/api/skills/route.ts` | Add `used_in` reverse lookup |
| `src/app/api/admin/projects/route.ts` | Accept `skills[]` in PUT/POST |
| `src/app/api/admin/projects/[id]/route.ts` | Write skills to project_skills |
| `src/app/api/admin/experiences/route.ts` | Accept `skills[]` in PUT/POST |
| `src/app/api/admin/experiences/[id]/route.ts` | Write skills to experience_skills |
| `src/components/SkillTag.tsx` | **NEW** shared skill tag with hover popup |
| `src/components/pages/skills-page.tsx` | Show `used_in` counts per skill |
| `src/components/pages/projects-page.tsx` | Use SkillTag component |
| `src/components/pages/experience-page.tsx` | Add tech skill tags row, fetch from API |
| `src/app/admin/projects/page.tsx` | Add skill picker to project form |
| `src/app/admin/experiences/page.tsx` | Add skill picker to experience form |
| `src/lib/projects-db.ts` | Write/read project_skills |
| `src/lib/experiences-db.ts` | Write/read experience_skills |
| `src/lib/skills-db.ts` | Add `usedIn` reverse query |
| `src/lib/i18n.ts` | No changes needed (experience keeps conceptual keywords from i18n) |

---

## 7. Edge Cases

- **Migration mismatch**: If `projects.tags` contains a name not in `skills` table, skip that tag (no FK violation). Log a warning.
- **Skill rename**: When a skill is renamed in admin, FK `ON UPDATE CASCADE` is not supported by SQLite. Must manually update `project_skills` and `experience_skills` in the same transaction.
- **Deleted skill**: FK constraint prevents deletion if referenced. Admin must remove references first, or cascade-delete via code.
- **i18n + skills coexistence**: Experience page fetches from API but keeps the i18n's `note` (keyword) for the conceptual tag row. Tech skills come from API only.
