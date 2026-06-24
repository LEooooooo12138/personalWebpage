# Skills Expanded Section Redesign — Spec

**Date:** 2026-06-24
**Status:** Approved
**Goal:** Redesign the expanded section of skills accordion to show related projects/experiences as a two-column timeline strip, replacing the redundant skill-name list.

---

## 1. Problem

Current expanded body shows a vertical list of skill names with "📦 N projects · 📋 N experiences" counts. Issues:
- Skill names duplicated (already shown as chips in collapsed header)
- No CSS styling for the new usage classes
- Emoji don't match design language
- "N projects" is just a number — user can't see WHICH projects

## 2. Design

### Structure (top to bottom)
1. **Description** paragraph (existing, unchanged)
2. **Thin divider** (`border-top: 1px solid var(--border)`)
3. **Two-column strip**: Projects (left) | Experiences (right), separated by vertical divider

### Projects Column
- Header: small gold dot + uppercase "PROJECTS" label
- Each project: **Title** (13px, bold) + **one-line summary** (11px, muted)
- 8px gap between items

### Experiences Column
- Header: small terracotta dot + uppercase "EXPERIENCE" label
- Each experience: **Year · Title** (13px, bold) + **description snippet** (11px, muted)

### Empty State
- If no projects: "No related projects yet"
- If no experiences: "No related experiences yet"
- Both in italic, muted, 11px

### Mobile (≤768px)
- Stack vertically: Projects column → Experiences column
- Remove vertical divider

## 3. CSS Classes (new)

```css
.skills-related { margin-top: 14px; }
.skills-related-divider { border-top: 1px solid var(--border); margin-bottom: 14px; }
.skills-related-strip { display: flex; gap: 20px; }
.skills-related-col { flex: 1; min-width: 0; }
.skills-related-col-divider { width: 1px; background: var(--border); flex-shrink: 0; }
.skills-related-col-header { 
  font-size: 10px; color: var(--text-muted); 
  text-transform: uppercase; letter-spacing: 0.08em; 
  margin-bottom: 10px; font-weight: 600; 
  display: flex; align-items: center; gap: 6px; 
}
.skills-related-col-dot { width: 6px; height: 6px; border-radius: 50%; }
.skills-related-item { margin-bottom: 10px; }
.skills-related-item:last-child { margin-bottom: 0; }
.skills-related-item-title { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.4; }
.skills-related-item-desc { font-size: 11px; color: var(--text-muted); line-height: 1.5; margin-top: 1px; }
.skills-related-empty { font-size: 11px; color: var(--text-muted); font-style: italic; }

@media (max-width: 768px) {
  .skills-related-strip { flex-direction: column; gap: 14px; }
  .skills-related-col-divider { display: none; }
}
```

## 4. Component Changes

### `skills-page.tsx`
- Remove `skills-usage-list`, `skills-usage-row`, `skills-usage-name`, `skills-usage-info` blocks
- Add new `skills-related` section after description, fetching related projects/experiences
- Logic: for the expanded category, find projects that use any skill in this category (via `getSkillsWithUsage` already provides this data)

### Data flow
The existing `usageData` state already contains per-skill `used_in: { projects: string[], experiences: string[] }`. For the timeline strip:
- Collect ALL unique project IDs across all skills in the expanded category
- Collect ALL unique experience IDs across all skills
- Fetch project titles from current projects state (or from a new API)
- Show project title + summary, experience year + title

Actually simpler: the `usageData` gives us `used_in.projects` (project IDs) and `used_in.experiences` (experience IDs). We need to map IDs → titles/summaries. Two approaches:
1. Fetch additional data from `/api/projects` and `/api/experiences`
2. Include titles in the `used_in` response directly

**Approach 2 is cleaner** — modify `getSkillsWithUsage()` to return `used_in: { projects: { id: string; title: string }[], experiences: { id: string; year: string; title: string }[] }`.

### Type change (`portfolio.ts`)
```ts
export type UsedInRef = { id: string; title: string; summary?: string };
export type UsedInExpRef = { id: string; year: string; title: string; description?: string };

export type UsedIn = {
  projects: UsedInRef[];
  experiences: UsedInExpRef[];
};
```

### DB change (`skills-db.ts`)
Update `getSkillsWithUsage()` to JOIN projects/experiences tables for titles instead of just collecting IDs.

## 5. Files

| File | Action |
|---|---|
| `src/types/portfolio.ts` | Change `UsedIn` to contain objects with title |
| `src/lib/skills-db.ts` | Update `getSkillsWithUsage()` to include titles |
| `src/components/pages/skills-page.tsx` | Replace usage-list with timeline strip |
| `src/app/globals.css` | Add new `.skills-related-*` styles |
