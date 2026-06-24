import Database from "better-sqlite3";
import { getPortfolioDb } from "@/lib/portfolio-db";
import { SkillCategory, SkillsResponse, SkillWithUsage, UsedIn } from "@/types/portfolio";

const COLOR_PALETTE = ["gold", "terracotta", "sage"] as const;

function assignColor(db: Database.Database): string {
  const count = (db.prepare("SELECT COUNT(*) as c FROM skill_categories").get() as { c: number }).c;
  return COLOR_PALETTE[(count - 1) % COLOR_PALETTE.length];
}

// ── Public read ──

export function getSkills(lang: string): SkillsResponse {
  const db = getPortfolioDb();

  const categoryRows = db
    .prepare(
      `SELECT sc.id, sc.color, sci.title, sci.description
       FROM skill_categories sc
       JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
       ORDER BY sc.sort_order ASC`
    )
    .all(lang) as { id: string; color: string; title: string; description: string }[];

  const rows = categoryRows.length > 0
    ? categoryRows
    : (db
        .prepare(
          `SELECT sc.id, sc.color, sci.title, sci.description
           FROM skill_categories sc
           JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = 'en'
           ORDER BY sc.sort_order ASC`
        )
        .all() as { id: string; color: string; title: string; description: string }[]);

  const getSkillsForCategory = db.prepare(
    `SELECT name FROM skills WHERE category_id = ? ORDER BY sort_order ASC`
  );

  const categories: SkillCategory[] = rows.map((row) => {
    const skills = (getSkillsForCategory.all(row.id) as { name: string }[]).map((s) => s.name);
    return { id: row.id, color: row.color, title: row.title, description: row.description, skills };
  });

  const langRows = db
    .prepare("SELECT name FROM languages WHERE lang = ?")
    .all(lang) as { name: string }[];

  const languages = langRows.length > 0
    ? langRows.map((r) => r.name)
    : (db.prepare("SELECT name FROM languages WHERE lang = 'en'").all() as { name: string }[]).map((r) => r.name);

  return { categories, languages };
}

// ── Admin: Categories ──

export type CategoryRow = {
  id: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  en_title: string;
  en_description: string;
  zh_title: string;
  zh_description: string;
};

export function getCategories(): CategoryRow[] {
  const db = getPortfolioDb();
  return db.prepare(`
    SELECT sc.*,
      COALESCE(en.title, '') as en_title, COALESCE(en.description, '') as en_description,
      COALESCE(zh.title, '') as zh_title, COALESCE(zh.description, '') as zh_description
    FROM skill_categories sc
    LEFT JOIN skill_category_i18n en ON en.category_id = sc.id AND en.lang = 'en'
    LEFT JOIN skill_category_i18n zh ON zh.category_id = sc.id AND zh.lang = 'zh'
    ORDER BY sc.sort_order ASC
  `).all() as CategoryRow[];
}

export function createCategory(
  id: string, enTitle: string, zhTitle: string, enDesc: string, zhDesc: string,
): void {
  const db = getPortfolioDb();
  const color = assignColor(db);
  const maxSort = (db.prepare("SELECT MAX(sort_order) as m FROM skill_categories").get() as { m: number | null }).m ?? -1;
  const sortOrder = maxSort + 1;

  const tx = db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO skill_categories (id, color, sort_order) VALUES (?, ?, ?)").run(id, color, sortOrder);
    db.prepare("INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'en', ?, ?)").run(id, enTitle, enDesc);
    db.prepare("INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'zh', ?, ?)").run(id, zhTitle, zhDesc);
  });
  tx();
}

export function updateCategory(
  id: string, color: string, sortOrder: number,
  enTitle: string, zhTitle: string, enDesc: string, zhDesc: string,
): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    db.prepare("UPDATE skill_categories SET color = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?").run(color, sortOrder, id);
    db.prepare("INSERT OR REPLACE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'en', ?, ?)").run(id, enTitle, enDesc);
    db.prepare("INSERT OR REPLACE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'zh', ?, ?)").run(id, zhTitle, zhDesc);
  });
  tx();
}

export function deleteCategory(id: string): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM skills WHERE category_id = ?").run(id);
    db.prepare("DELETE FROM skill_category_i18n WHERE category_id = ?").run(id);
    db.prepare("DELETE FROM skill_categories WHERE id = ?").run(id);
  });
  tx();
}

// ── Admin: Skills ──

export type SkillRow = {
  name: string;
  category_id: string;
  proficiency: number | null;
  sort_order: number;
};

export function getSkillsByCategory(categoryId: string): SkillRow[] {
  const db = getPortfolioDb();
  return db.prepare("SELECT * FROM skills WHERE category_id = ? ORDER BY sort_order ASC").all(categoryId) as SkillRow[];
}

export function addSkill(categoryId: string, name: string, proficiency?: number): void {
  const db = getPortfolioDb();
  const maxSort = (db.prepare("SELECT MAX(sort_order) as m FROM skills WHERE category_id = ?").get(categoryId) as { m: number | null }).m ?? -1;
  db.prepare("INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)").run(name, categoryId, proficiency ?? null, maxSort + 1);
}

export function updateSkill(name: string, newName: string, categoryId: string, proficiency: number | null): void {
  const db = getPortfolioDb();
  if (name !== newName) {
    // Need to insert new, delete old since name is part of PK
    const tx = db.transaction(() => {
      const oldSort = (db.prepare("SELECT sort_order FROM skills WHERE name = ? AND category_id = ?").get(name, categoryId) as { sort_order: number } | undefined);
      db.prepare("DELETE FROM skills WHERE name = ? AND category_id = ?").run(name, categoryId);
      db.prepare("INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)").run(
        newName, categoryId, proficiency, oldSort?.sort_order ?? 0,
      );
    });
    tx();
  } else {
    db.prepare("UPDATE skills SET proficiency = ?, category_id = ? WHERE name = ? AND category_id = ?").run(proficiency, categoryId, name, categoryId);
  }
}

export function deleteSkill(name: string, categoryId: string): void {
  const db = getPortfolioDb();
  db.prepare("DELETE FROM skills WHERE name = ? AND category_id = ?").run(name, categoryId);
}

// ── Admin: Reorder ──

export type ReorderItem = { id: string; sort_order: number };

export function reorderSkillsOrCategories(type: "skill" | "category", items: ReorderItem[]): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    if (type === "skill") {
      const stmt = db.prepare("UPDATE skills SET sort_order = ? WHERE name = ?");
      for (const item of items) {
        stmt.run(item.sort_order, item.id);
      }
    } else {
      const stmt = db.prepare("UPDATE skill_categories SET sort_order = ?, updated_at = datetime('now') WHERE id = ?");
      for (const item of items) {
        stmt.run(item.sort_order, item.id);
      }
    }
  });
  tx();
}

// ── Admin: Languages ──

export type LanguageRow = { lang: string; name: string };

export function getLanguages(): LanguageRow[] {
  const db = getPortfolioDb();
  return db.prepare("SELECT * FROM languages ORDER BY lang, name").all() as LanguageRow[];
}

export function updateLanguages(languages: LanguageRow[]): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM languages").run();
    const stmt = db.prepare("INSERT INTO languages (lang, name) VALUES (?, ?)");
    for (const l of languages) {
      stmt.run(l.lang, l.name);
    }
  });
  tx();
}

// ── Public: Skills with reverse lookup ──

export function getSkillsWithUsage(lang: string): SkillsResponse {
  const base = getSkills(lang);
  const db = getPortfolioDb();

  // Collect project refs (id, title, summary) per skill, localized
  const projectRows = db.prepare(`
    SELECT DISTINCT ps.skill_name, p.id,
      COALESCE(pi.title, p.title) as title,
      COALESCE(pi.summary, p.summary) as summary,
      p.time_period
    FROM project_skills ps
    JOIN projects p ON p.id = ps.project_id
    LEFT JOIN project_i18n pi ON pi.project_id = p.id AND pi.lang = ?
    ORDER BY ps.skill_name, p.id
  `).all(lang) as { skill_name: string; id: string; title: string; summary: string; time_period: string }[];

  // Collect experience refs (id, year, title, description) per skill, localized
  const experienceRows = db.prepare(`
    SELECT DISTINCT es.skill_name, e.id, e.year,
      COALESCE(ei.title, e.title) as title,
      COALESCE(ei.description, e.description) as description
    FROM experience_skills es
    JOIN experiences e ON e.id = es.experience_id
    LEFT JOIN experience_i18n ei ON ei.experience_id = e.id AND ei.lang = ?
    ORDER BY es.skill_name, e.sort_order
  `).all(lang) as { skill_name: string; id: string; year: string; title: string; description: string }[];

  const projMap = new Map<string, { id: string; title: string; summary?: string; time_period?: string }[]>();
  for (const row of projectRows) {
    if (!projMap.has(row.skill_name)) projMap.set(row.skill_name, []);
    projMap.get(row.skill_name)!.push({ id: row.id, title: row.title, summary: row.summary, time_period: row.time_period || undefined });
  }

  const expMap = new Map<string, { id: string; year: string; title: string; description?: string }[]>();
  for (const row of experienceRows) {
    if (!expMap.has(row.skill_name)) expMap.set(row.skill_name, []);
    expMap.get(row.skill_name)!.push({ id: row.id, year: row.year, title: row.title, description: row.description });
  }

  return {
    languages: base.languages,
    categories: base.categories.map((cat) => ({
      ...cat,
      skills: cat.skills.map((s) => {
        const name = typeof s === "string" ? s : s.name;
        return {
          name,
          used_in: {
            projects: projMap.get(name) || [],
            experiences: expMap.get(name) || [],
          },
        };
      }),
    })),
  };
}
