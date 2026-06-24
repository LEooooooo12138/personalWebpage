# Skill Tag Linking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect Skills table as the single source of truth for technology tags, linking to Projects and Experiences via junction tables, with reverse trackback on Skills page and hover popups everywhere.

**Architecture:** Two new junction tables (`project_skills`, `experience_skills`) establish many-to-many relationships. Public APIs JOIN these tables inline. A shared `SkillTag` component provides hover popups. The Skills page shows `used_in` reverse lookups. Experience page gains a tech-tag row alongside existing conceptual keywords.

**Tech Stack:** Next.js (App Router), TypeScript, better-sqlite3, Tailwind CSS

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/lib/portfolio-db.ts` | Modify | Add `project_skills` + `experience_skills` tables, schema migration |
| `src/types/portfolio.ts` | Modify | Add `ProjectSkill`, extend `Project`, `SkillsResponse`, `ExperienceNode` |
| `src/lib/projects-db.ts` | Modify | JOIN `project_skills`, write/delete project skills |
| `src/lib/experiences-db.ts` | Modify | JOIN `experience_skills`, write/delete experience skills |
| `src/lib/skills-db.ts` | Modify | Add `getSkillsWithUsage()` for reverse lookup |
| `src/app/api/projects/route.ts` | Modify | Include `skills[]` in response |
| `src/app/api/skills/route.ts` | Modify | Include `used_in` in response |
| `src/app/api/experiences/route.ts` | **Create** | New public endpoint returning experiences + skills + narratives |
| `src/app/api/admin/projects/[id]/route.ts` | Modify | Accept `skills[]`, write to `project_skills` |
| `src/app/api/admin/projects/route.ts` | Modify | Accept `skills[]` in POST, return skills in GET |
| `src/app/api/admin/experiences/[id]/route.ts` | Modify | Accept `skills[]`, write to `experience_skills` |
| `src/app/api/admin/experiences/route.ts` | Modify | Accept `skills[]` in POST, return skills in GET |
| `src/components/SkillTag.tsx` | **Create** | Shared skill tag with hover popup |
| `src/components/pages/skills-page.tsx` | Modify | Show `used_in` per skill in expanded category |
| `src/components/pages/projects-page.tsx` | Modify | Use `<SkillTag>` instead of plain `<span>` tags |
| `src/components/pages/experience-page.tsx` | Modify | Add tech skill row, fetch from API |
| `src/app/admin/projects/page.tsx` | Modify | Add skill multi-select picker |
| `src/app/admin/experiences/page.tsx` | Modify | Add skill multi-select picker |

---

### Task 1: DB Schema — Add junction tables

**Files:**
- Modify: `src/lib/portfolio-db.ts`

- [ ] **Step 1: Add `project_skills` and `experience_skills` to `initSchema()`**

In `src/lib/portfolio-db.ts`, inside the `initSchema` function, add these two CREATE TABLE statements after the existing `skills` table definition:

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

- [ ] **Step 2: Add migration to populate `project_skills` from existing `projects.tags`**

In the `runMigrations()` function, after the existing data seeding call (`seedStaticData`), add a new migration step:

```ts
// Migrate existing project tags to project_skills
migrateProjectTags(db);
```

Then add the new function above `runMigrations`:

```ts
function migrateProjectTags(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM project_skills").get() as { c: number }).c;
  if (count > 0) return; // Already migrated

  const projects = db.prepare("SELECT id, tags FROM projects WHERE tags IS NOT NULL AND tags != '' AND tags != '[]'").all() as { id: string; tags: string }[];
  
  const insertStmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, sort_order) VALUES (?, ?, ?)");
  const skillExists = db.prepare("SELECT COUNT(*) as c FROM skills WHERE name = ?");
  
  const tx = db.transaction(() => {
    for (const proj of projects) {
      try {
        const tags: string[] = JSON.parse(proj.tags);
        tags.forEach((tag, idx) => {
          const exists = (skillExists.get(tag) as { c: number }).c;
          if (exists > 0) {
            insertStmt.run(proj.id, tag, idx);
          } else {
            console.warn(`[migration] Project "${proj.id}" tag "${tag}" not found in skills table — skipping`);
          }
        });
      } catch { /* JSON parse failed — skip */ }
    }
  });
  tx();
  console.log(`[migration] Migrated project tags to project_skills for ${projects.length} projects`);
}
```

- [ ] **Step 3: Verify migration runs**

Run: `rm -f data/portfolio.db && npx next dev` (Ctrl+C after boot, then check console for migration log)

Expected: Console shows `[migration] Migrated project tags to project_skills for N projects`

- [ ] **Step 4: Commit**

```bash
git add src/lib/portfolio-db.ts
git commit -m "feat: add project_skills and experience_skills junction tables with migration"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `src/types/portfolio.ts`

- [ ] **Step 1: Add new types and extend existing ones**

In `src/types/portfolio.ts`, add after the existing `Project` type:

```ts
export type ProjectSkill = {
  name: string;
  category: string;
  color: string;
};

export type UsedIn = {
  projects: string[];
  experiences: string[];
};

export type SkillWithUsage = {
  name: string;
  used_in: UsedIn;
};
```

Then modify `Project` to include skills:

```ts
export type Project = {
  id: string;
  title: string;
  summary: string;
  tags: string[];        // deprecated but kept for compatibility
  skills?: ProjectSkill[]; // new
  demoUrl: string;
  repoUrl: string;
  videoHint: string;
  claps: number;
};
```

Modify `ExperienceNode` to include skills:

```ts
export type ExperienceNode = {
  year: string;
  title: string;
  description: string;
  note?: string;
  skills?: ProjectSkill[]; // new
};
```

Modify `SkillCategory` to support skills with usage:

```ts
export type SkillCategory = {
  id: string;
  color: string;
  title: string;
  description: string;
  skills: (string | SkillWithUsage)[]; // was string[], now union for backward compat
};
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new type errors (pre-existing `hero-scene.tsx` errors are fine)

- [ ] **Step 3: Commit**

```bash
git add src/types/portfolio.ts
git commit -m "feat: add ProjectSkill, SkillWithUsage types and extend Project/ExperienceNode"
```

---

### Task 3: DB layer — Skills reverse lookup

**Files:**
- Modify: `src/lib/skills-db.ts`

- [ ] **Step 1: Add `getSkillsWithUsage()` function**

Add this new exported function at the bottom of `src/lib/skills-db.ts` (after the existing `getSkills` function):

```ts
export function getSkillsWithUsage(lang: string): SkillsResponse {
  const base = getSkills(lang);
  
  const db = getPortfolioDb();

  const projectUsage = db.prepare(`
    SELECT ps.skill_name, ps.project_id
    FROM project_skills ps
    ORDER BY ps.skill_name
  `).all() as { skill_name: string; project_id: string }[];

  const experienceUsage = db.prepare(`
    SELECT es.skill_name, es.experience_id
    FROM experience_skills es
    ORDER BY es.skill_name
  `).all() as { skill_name: string; experience_id: string }[];

  const usageMap = new Map<string, { projects: Set<string>; experiences: Set<string> }>();
  
  for (const row of projectUsage) {
    if (!usageMap.has(row.skill_name)) usageMap.set(row.skill_name, { projects: new Set(), experiences: new Set() });
    usageMap.get(row.skill_name)!.projects.add(row.project_id);
  }
  for (const row of experienceUsage) {
    if (!usageMap.has(row.skill_name)) usageMap.set(row.skill_name, { projects: new Set(), experiences: new Set() });
    usageMap.get(row.skill_name)!.experiences.add(row.experience_id);
  }

  return {
    languages: base.languages,
    categories: base.categories.map((cat) => ({
      ...cat,
      skills: cat.skills.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        const usage = usageMap.get(name);
        return {
          name,
          used_in: {
            projects: usage ? [...usage.projects] : [],
            experiences: usage ? [...usage.experiences] : [],
          },
        };
      }),
    })),
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/skills-db.ts
git commit -m "feat: add getSkillsWithUsage() for reverse skill lookup"
```

---

### Task 4: DB layer — Projects with skills JOIN

**Files:**
- Modify: `src/lib/projects-db.ts`

- [ ] **Step 1: Add `getProjectsWithSkills()` function**

Add this new exported function below `getProjects()`:

```ts
export function getProjectsWithSkills(): (Project & { skills: { name: string; category: string; color: string }[] })[] {
  const db = getPortfolioDb();
  const projects = getProjects();

  const skillsStmt = db.prepare(`
    SELECT ps.skill_name, ps.project_id, sc.color, sci.title as category
    FROM project_skills ps
    JOIN skills s ON s.name = ps.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = 'en'
    ORDER BY ps.sort_order ASC
  `);
  const skillsRows = skillsStmt.all() as { skill_name: string; project_id: string; color: string; category: string }[];

  const skillsMap = new Map<string, { name: string; category: string; color: string }[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.project_id)) skillsMap.set(row.project_id, []);
    skillsMap.get(row.project_id)!.push({ name: row.skill_name, category: row.category, color: row.color });
  }

  return projects.map((p) => ({
    ...p,
    skills: skillsMap.get(p.id) || [],
  }));
}
```

- [ ] **Step 2: Modify `createProject()` and `updateProject()` to write junction table**

In `createProject`, after the INSERT into projects, add:

```ts
if (project.skills && project.skills.length > 0) {
  const stmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, sort_order) VALUES (?, ?, ?)");
  for (let i = 0; i < project.skills.length; i++) {
    stmt.run(project.id, project.skills[i], i);
  }
}
```

Change the `createProject` signature to accept skills:

```ts
export function createProject(project: Omit<Project, "claps"> & { claps?: number; skills?: string[] }): Project {
```

In `updateProject`, after the fields loop, add skills handling:

```ts
if (updates.skills !== undefined) {
  db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
  const stmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, sort_order) VALUES (?, ?, ?)");
  updates.skills.forEach((skill, idx) => stmt.run(id, skill, idx));
}
```

Update the `updates` type:

```ts
export function updateProject(id: string, updates: Partial<Omit<Project, "id"> & { skills?: string[] }>): void {
```

- [ ] **Step 3: Modify `deleteProject()` to cascade delete skills**

After the existing DELETE:

```ts
db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/projects-db.ts
git commit -m "feat: add getProjectsWithSkills, write skills to project_skills junction table"
```

---

### Task 5: DB layer — Experiences with skills JOIN

**Files:**
- Modify: `src/lib/experiences-db.ts`

- [ ] **Step 1: Add `getExperiencesWithSkills()` function**

```ts
export function getExperiencesWithSkills(): ExperienceNode[] {
  const db = getPortfolioDb();
  const experiences = getExperiences();

  const skillsStmt = db.prepare(`
    SELECT es.skill_name, es.experience_id, sc.color, sci.title as category
    FROM experience_skills es
    JOIN skills s ON s.name = es.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = 'en'
    ORDER BY es.sort_order ASC
  `);
  const skillsRows = skillsStmt.all() as { skill_name: string; experience_id: string; color: string; category: string }[];

  const skillsMap = new Map<string, { name: string; category: string; color: string }[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.experience_id)) skillsMap.set(row.experience_id, []);
    skillsMap.get(row.experience_id)!.push({ name: row.skill_name, category: row.category, color: row.color });
  }

  return experiences.map((e) => ({
    ...e,
    skills: skillsMap.get(e.year) || [], // Note: experiences are keyed by year, not id, in public API
  }));
}
```

Wait — the public experience data currently comes from i18n hardcoded data, not from DB. For the public API, we need to return DB experiences with narrative data merged. Let me reconsider...

Actually, the best approach for the public API is to have `getExperiences()` already return the DB data, and then the API route merges narratives on top. Let's simplify:

```ts
export function getExperiencesWithNarratives(): (ExperienceNode & { id: string })[] {
  const db = getPortfolioDb();
  const rows = db.prepare("SELECT id, year, title, description, note FROM experiences ORDER BY sort_order ASC").all() as {
    id: string; year: string; title: string; description: string; note: string | null;
  }[];

  const skillsStmt = db.prepare(`
    SELECT es.skill_name, es.experience_id, sc.color, sci.title as category
    FROM experience_skills es
    JOIN skills s ON s.name = es.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = 'en'
    ORDER BY es.sort_order ASC
  `);
  const skillsRows = skillsStmt.all() as { skill_name: string; experience_id: string; color: string; category: string }[];

  const skillsMap = new Map<string, { name: string; category: string; color: string }[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.experience_id)) skillsMap.set(row.experience_id, []);
    skillsMap.get(row.experience_id)!.push({ name: row.skill_name, category: row.category, color: row.color });
  }

  return rows.map((r) => ({
    id: r.id,
    year: r.year,
    title: r.title,
    description: r.description,
    note: r.note ?? undefined,
    skills: skillsMap.get(r.id) || [],
  }));
}
```

- [ ] **Step 2: Modify `createExperience()` and `updateExperience()` for skills**

In `createExperience`, add skills handling (similar pattern to projects):

```ts
export function createExperience(
  exp: Omit<ExperienceNode, "note"> & { note?: string; sort_order?: number; skills?: string[] }
): string {
  const db = getPortfolioDb();
  const maxSort = (db.prepare("SELECT MAX(sort_order) as m FROM experiences").get() as { m: number | null }).m ?? -1;
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO experiences (id, year, title, description, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, exp.year, exp.title, exp.description, exp.note ?? null, exp.sort_order ?? maxSort + 1);

  if (exp.skills && exp.skills.length > 0) {
    const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, sort_order) VALUES (?, ?, ?)");
    exp.skills.forEach((skill, idx) => stmt.run(id, skill, idx));
  }
  return id;
}
```

In `updateExperience`, add skills handling:

```ts
export function updateExperience(id: string, updates: Partial<ExperienceNode & { sort_order?: number; skills?: string[] }>): void {
  const db = getPortfolioDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.year !== undefined) { fields.push("year = ?"); values.push(updates.year); }
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.note !== undefined) { fields.push("note = ?"); values.push(updates.note); }
  if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE experiences SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  }

  if (updates.skills !== undefined) {
    db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);
    const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, sort_order) VALUES (?, ?, ?)");
    updates.skills.forEach((skill, idx) => stmt.run(id, skill, idx));
  }
}
```

- [ ] **Step 3: Modify `deleteExperience()` to cascade**

Add: `db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);`

- [ ] **Step 4: Commit**

```bash
git add src/lib/experiences-db.ts
git commit -m "feat: add getExperiencesWithNarratives, write skills to experience_skills junction table"
```

---

### Task 6: Public API — Update /api/projects

**Files:**
- Modify: `src/app/api/projects/route.ts`

- [ ] **Step 1: Use `getProjectsWithSkills()` instead of `getProjects()`**

```ts
import { getProjectsWithSkills } from "@/lib/projects-db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const projects = getProjectsWithSkills();
    return NextResponse.json(projects);
  } catch (err) {
    console.error("Failed to fetch projects:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects data" },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/projects/route.ts
git commit -m "feat: /api/projects returns skills via project_skills JOIN"
```

---

### Task 7: Public API — Update /api/skills to include used_in

**Files:**
- Modify: `src/app/api/skills/route.ts`

- [ ] **Step 1: Use `getSkillsWithUsage()`**

```ts
import { getSkills, getSkillsWithUsage } from "@/lib/skills-db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = searchParams.get("lang") || "en";
  const withUsage = searchParams.get("usage") === "1";

  try {
    const data = withUsage ? getSkillsWithUsage(lang) : getSkills(lang);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Failed to fetch skills:", err);
    return NextResponse.json(
      { error: "Failed to fetch skills data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/skills/route.ts
git commit -m "feat: /api/skills supports ?usage=1 for reverse lookup"
```

---

### Task 8: Public API — Create /api/experiences

**Files:**
- Create: `src/app/api/experiences/route.ts`

- [ ] **Step 1: Create the endpoint**

```ts
import { getExperiencesWithNarratives } from "@/lib/experiences-db";
import { narrativeEn, narrativeZh } from "@/lib/experience-narrative";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lang = (searchParams.get("lang") || "en") as "en" | "zh";

  try {
    const experiences = getExperiencesWithNarratives();
    const narratives = lang === "zh" ? narrativeZh : narrativeEn;
    const narMap = new Map(narratives.map((n) => [n.year, n]));

    const result = experiences.map((exp) => {
      const nar = narMap.get(exp.year);
      return {
        ...exp,
        narrative: nar || null,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Failed to fetch experiences:", err);
    return NextResponse.json(
      { error: "Failed to fetch experiences data" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify endpoint**

Run: `npx next dev`, then `curl http://localhost:3000/api/experiences | jq '.'`
Expected: Array of experiences with `skills`, `narrative` fields

- [ ] **Step 3: Commit**

```bash
git add src/app/api/experiences/route.ts
git commit -m "feat: create GET /api/experiences with skills + narratives"
```

---

### Task 9: Admin API — Update project endpoints

**Files:**
- Modify: `src/app/api/admin/projects/route.ts`
- Modify: `src/app/api/admin/projects/[id]/route.ts`

- [ ] **Step 1: Update GET to include skills in admin listing**

In `src/app/api/admin/projects/route.ts`, change the import and GET:

```ts
import { getProjectsWithSkills, createProject } from "@/lib/projects-db";
// In GET, use getProjectsWithSkills() for the response but wrap in pagination
// OR: modify listProjectsAdmin to also JOIN skills
```

Better approach: modify `listProjectsAdmin` in `projects-db.ts` to include skills. But let me keep it simple — admin listing can use the existing pagination + get basic skills mapping:

Actually the simplest approach: update `src/app/api/admin/projects/route.ts` POST to accept `skills`:

```ts
export async function POST(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  createProject(body);
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

This already works because `createProject` now accepts `skills`. No code change needed for POST.

For GET, the admin list could stay as-is (no skills in list view for performance). Skills are only shown in the edit form.

- [ ] **Step 2: Update PUT to handle skills**

In `src/app/api/admin/projects/[id]/route.ts`:

```ts
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  updateProject(id, body);
  return NextResponse.json({ ok: true });
}
```

This already works because `updateProject` now handles `skills`. No code change needed — just need to verify.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/projects/route.ts src/app/api/admin/projects/\[id\]/route.ts
git commit -m "feat: admin project endpoints now support skills via updated DB layer"
```

---

### Task 10: Admin API — Update experience endpoints

**Files:**
- Modify: `src/app/api/admin/experiences/route.ts`
- Modify: `src/app/api/admin/experiences/[id]/route.ts`

- [ ] **Step 1: Update POST to return the created id**

In `src/app/api/admin/experiences/route.ts`, change POST:

```ts
export async function POST(request: Request) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = createExperience(body);
  return NextResponse.json({ ok: true, id }, { status: 201 });
}
```

Update import: `import { listExperiencesAdmin, createExperience } from "@/lib/experiences-db";`

- [ ] **Step 2: Update PUT to handle skills**

In `src/app/api/admin/experiences/[id]/route.ts`:

```ts
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const user = await validateSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  updateExperience(id, body);
  return NextResponse.json({ ok: true });
}
```

This already works — `updateExperience` now handles `skills`. No change needed beyond verifying.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/experiences/route.ts src/app/api/admin/experiences/\[id\]/route.ts
git commit -m "feat: admin experience endpoints return id, support skills"
```

---

### Task 11: SkillTag shared component

**Files:**
- Create: `src/components/SkillTag.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";

const COLOR_VARS: Record<string, string> = {
  gold: "var(--gold)",
  terracotta: "var(--terracotta)",
  sage: "var(--sage)",
};

export function SkillTag({
  name,
  color = "gold",
  size = "md",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (hovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        zIndex: 50,
      });
    }
  }, [hovered]);

  const accent = COLOR_VARS[color] || COLOR_VARS.gold;
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <>
      <span
        ref={ref}
        className={`skill-tag-inline inline-flex items-center gap-1 rounded-md font-medium cursor-default transition-colors ${sizeClass}`}
        style={{
          background: `${accent}18`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className="skill-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: accent,
          }}
        />
        {name}
      </span>
      {hovered && (
        <div
          style={popupStyle}
          className="skill-tag-popup bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 shadow-xl"
        >
          <span style={{ color: accent }} className="font-semibold">{name}</span>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SkillTag.tsx
git commit -m "feat: add SkillTag shared component with color-coded hover popup"
```

---

### Task 12: Projects page — Use SkillTag

**Files:**
- Modify: `src/components/pages/projects-page.tsx`

- [ ] **Step 1: Replace plain tags with SkillTag**

Add import:
```tsx
import { SkillTag } from "@/components/SkillTag";
```

Update the `Project` type to include skills:
```tsx
import { Project, ProjectSkill } from "@/types/portfolio";
```

Replace the tag rendering section. Change from:
```tsx
{project.tags.map((tag) => (
  <span key={tag} className="tag">{tag}</span>
))}
```

To:
```tsx
{(project.skills && project.skills.length > 0
  ? project.skills
  : project.tags.map((t) => ({ name: t, category: "", color: "gold" }))
).map((skill) => (
  <SkillTag
    key={typeof skill === "string" ? skill : skill.name}
    name={typeof skill === "string" ? skill : skill.name}
    color={typeof skill === "string" ? "gold" : (skill as ProjectSkill).color}
    size="sm"
  />
))}
```

Update the `setProjects` type:
```tsx
const [projects, setProjects] = useState<(Project & { skills?: ProjectSkill[] })[]>([]);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pages/projects-page.tsx
git commit -m "feat: use SkillTag component in projects page"
```

---

### Task 13: Skills page — Show used_in trackback

**Files:**
- Modify: `src/components/pages/skills-page.tsx`

- [ ] **Step 1: Fetch skills with usage data**

Add `withUsage` state and update the fetch. The skills page is currently a server component that passes `skillsData` as props. We need the client to also fetch usage data.

Add a useEffect to fetch skills with `?usage=1`:

```tsx
const [usageData, setUsageData] = useState<SkillsResponse | null>(null);

useEffect(() => {
  fetch(`/api/skills?lang=${lang}&usage=1`)
    .then((r) => r.json())
    .then(setUsageData)
    .catch(() => {});
}, [lang]);
```

- [ ] **Step 2: In the expanded body, show used_in per skill**

Inside the expanded body (`skills-row-inner`), after the description, add skill rows with usage info. Replace the existing `skills-row-desc` only block with:

```tsx
<div className="skills-row-inner">
  {cat.description && (
    <p className="skills-row-desc">{cat.description}</p>
  )}
  {usageData && isOpen && (
    <div className="skills-usage-list">
      {cat.skills.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        const usedIn = typeof s === "string"
          ? undefined
          : (s as import("@/types/portfolio").SkillWithUsage).used_in;
        return (
          <div key={name} className="skills-usage-row">
            <span className="skills-usage-name">{name}</span>
            {usedIn && (
              <span className="skills-usage-info">
                {usedIn.projects.length > 0 && (
                  <span title={usedIn.projects.join(", ")}>
                    📦 {usedIn.projects.length} project{usedIn.projects.length > 1 ? "s" : ""}
                  </span>
                )}
                {usedIn.experiences.length > 0 && (
                  <span title={usedIn.experiences.join(", ")}>
                    {" · "}📋 {usedIn.experiences.length} experience{usedIn.experiences.length > 1 ? "s" : ""}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/skills-page.tsx
git commit -m "feat: show used_in trackback in expanded skills category"
```

---

### Task 14: Experience page — Add tech skill tags + API fetch

**Files:**
- Modify: `src/components/pages/experience-page.tsx`

- [ ] **Step 1: Add API fetch for experiences with skills**

Add state and useEffect:

```tsx
import { ExperienceNode } from "@/types/portfolio";
import { SkillTag } from "@/components/SkillTag";

// Inside the component:
const [expSkills, setExpSkills] = useState<Map<string, { name: string; category: string; color: string }[]>>(new Map());

useEffect(() => {
  if (!mounted) return;
  fetch(`/api/experiences?lang=${lang}`)
    .then((r) => r.json())
    .then((data: (ExperienceNode & { skills?: { name: string; category: string; color: string }[] })[]) => {
      const map = new Map<string, { name: string; category: string; color: string }[]>();
      for (const exp of data) {
        if (exp.skills && exp.skills.length > 0) {
          map.set(exp.year, exp.skills);
        }
      }
      setExpSkills(map);
    })
    .catch(() => {});
}, [mounted, lang]);
```

- [ ] **Step 2: Add tech skill tags row below keyword tags**

After the existing keyword tags block:

```tsx
{keywords.length > 0 && (
  <div className="exp-tags">
    {keywords.map((kw) => <span key={kw} className="exp-tag">{kw}</span>)}
  </div>
)}
```

Add:
```tsx
{expSkills.has(item.year) && expSkills.get(item.year)!.length > 0 && (
  <div className="exp-tech-tags">
    {expSkills.get(item.year)!.map((s) => (
      <SkillTag key={s.name} name={s.name} color={s.color} size="sm" />
    ))}
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/experience-page.tsx
git commit -m "feat: add tech skill tags to experience items via /api/experiences"
```

---

### Task 15: Admin Projects page — Add skill picker

**Files:**
- Modify: `src/app/admin/projects/page.tsx`

- [ ] **Step 1: Fetch available skills list and add multi-select UI**

Add state and useEffect:

```tsx
const [allSkills, setAllSkills] = useState<{ name: string; category: string; color: string }[]>([]);
const [pickedSkills, setPickedSkills] = useState<string[]>([]);

useEffect(() => {
  fetch("/api/skills")
    .then((r) => r.json())
    .then((data) => {
      const list: { name: string; category: string; color: string }[] = [];
      for (const cat of data.categories) {
        for (const s of cat.skills) {
          list.push({ name: typeof s === "string" ? s : s.name, category: cat.title, color: cat.color });
        }
      }
      setAllSkills(list);
    })
    .catch(() => {});
}, []);
```

Update `openEdit` to set picked skills:
```tsx
const openEdit = (r: P) => {
  setEditing(r);
  setForm({ id: r.id, title: r.title, summary: r.summary, tags: r.tags.join(", "), demoUrl: r.demoUrl, repoUrl: r.repoUrl, videoHint: r.videoHint });
  setPickedSkills((r as any).skills?.map((s: any) => s.name) || []);
  setModalOpen(true);
};
```

Update `openCreate` to reset:
```tsx
const openCreate = () => {
  setEditing(null);
  setForm({ id: "", title: "", summary: "", tags: "", demoUrl: "", repoUrl: "", videoHint: "" });
  setPickedSkills([]);
  setModalOpen(true);
};
```

Update `save` to include skills:
```tsx
const save = async () => {
  const payload = { ...form, tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean), skills: pickedSkills };
  const m = editing ? "PUT" : "POST";
  const u = editing ? `/api/admin/projects/${editing.id}` : "/api/admin/projects";
  await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  setModalOpen(false); fetchData();
};
```

- [ ] **Step 2: Add skill checkbox list in modal**

In the modal form, after the Tags input, add:

```tsx
<div>
  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.06em] mb-2">
    Skills <span className="font-normal text-gray-400">(select from skill library)</span>
  </label>
  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl p-3 space-y-1.5">
    {allSkills.map((skill) => (
      <label key={skill.name} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
        <input
          type="checkbox"
          checked={pickedSkills.includes(skill.name)}
          onChange={(e) => {
            if (e.target.checked) {
              setPickedSkills([...pickedSkills, skill.name]);
            } else {
              setPickedSkills(pickedSkills.filter((s) => s !== skill.name));
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: `var(--${skill.color})`, display: "inline-block" }} />
        <span className="text-sm text-gray-700">{skill.name}</span>
        <span className="text-[11px] text-gray-400 ml-auto">{skill.category}</span>
      </label>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/projects/page.tsx
git commit -m "feat: add skill multi-select picker to admin projects form"
```

---

### Task 16: Admin Experiences page — Add skill picker

**Files:**
- Modify: `src/app/admin/experiences/page.tsx`

- [ ] **Step 1: Add skill picker (same pattern as projects)**

Add the same skill fetching and checkbox UI to the experience edit/create modal.

Add state:
```tsx
const [allSkills, setAllSkills] = useState<{ name: string; category: string; color: string }[]>([]);
const [pickedSkills, setPickedSkills] = useState<string[]>([]);
```

Add the skill fetch useEffect (same as projects page).

Update `save` to include `skills: pickedSkills`.

Add the skill checkbox list in the modal form after the Note input.

- [ ] **Step 2: Commit**

```bash
git add src/app/admin/experiences/page.tsx
git commit -m "feat: add skill multi-select picker to admin experiences form"
```

---

### Task 17: Final integration test + verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit 2>&1 | grep -v hero-scene | head -20`
Expected: No new errors beyond pre-existing ones

- [ ] **Step 2: Build check**

Run: `npx next build 2>&1 | tail -20`
Expected: Successful build (may have warnings)

- [ ] **Step 3: Dev server smoke test**

Run: `rm -f data/portfolio.db && npx next dev`
Expected: Server starts, no crash

Test endpoints:
```bash
curl http://localhost:3000/api/projects | jq '.[0].skills'
curl http://localhost:3000/api/experiences | jq '.[0].skills'
curl 'http://localhost:3000/api/skills?usage=1' | jq '.categories[0].skills[0]'
```

All three should return `skills` / `used_in` data.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: final integration verification"
```
