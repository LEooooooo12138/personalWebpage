import { getPortfolioDb } from "@/lib/portfolio-db";
import { ExperienceNode } from "@/types/portfolio";

type ExperienceRow = {
  id: string;
  year: string;
  title: string;
  description: string;
  note: string | null;
  sort_order: number;
};

function rowToExp(r: ExperienceRow): ExperienceNode {
  return {
    year: r.year,
    title: r.title,
    description: r.description,
    note: r.note ?? undefined,
  };
}

/* ── Public API ── */

export function getExperiences(lang: string = "en"): ExperienceNode[] {
  const db = getPortfolioDb();
  const rows = db.prepare(`
    SELECT e.id, e.year, e.sort_order,
      COALESCE(ei.title, e.title) as title,
      COALESCE(ei.description, e.description) as description,
      COALESCE(ei.note, e.note) as note
    FROM experiences e
    LEFT JOIN experience_i18n ei ON ei.experience_id = e.id AND ei.lang = ?
    ORDER BY e.sort_order ASC
  `).all(lang) as ExperienceRow[];
  return rows.map(rowToExp);
}

/* ── Joined API ── */

export function getExperiencesWithNarratives(lang: string = "en"): (ExperienceNode & { id: string })[] {
  const db = getPortfolioDb();
  const rows = db.prepare(`
    SELECT e.id, e.year, e.sort_order,
      COALESCE(ei.title, e.title) as title,
      COALESCE(ei.description, e.description) as description,
      COALESCE(ei.note, e.note) as note
    FROM experiences e
    LEFT JOIN experience_i18n ei ON ei.experience_id = e.id AND ei.lang = ?
    ORDER BY e.sort_order ASC
  `).all(lang) as {
    id: string; year: string; title: string; description: string; note: string | null;
  }[];

  const skillsStmt = db.prepare(`
    SELECT es.skill_name, es.experience_id, sc.color, sci.title as category
    FROM experience_skills es
    JOIN skills s ON s.name = es.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY es.sort_order ASC
  `);
  const skillsRows = skillsStmt.all(lang) as { skill_name: string; experience_id: string; color: string; category: string }[];

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

/* ── Admin API ── */

export type PaginatedResult<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function listExperiencesAdmin(page: number, pageSize: number): PaginatedResult<ExperienceNode & { id: string; sort_order: number; en_title: string; zh_title: string; en_description: string; zh_description: string; en_note: string; zh_note: string; skills?: { name: string; category: string; color: string }[] }> {
  const db = getPortfolioDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM experiences").get() as { c: number }).c;
  const rows = db.prepare(
    `SELECT e.*,
      COALESCE(en.title, e.title) as en_title,
      COALESCE(zh.title, e.title) as zh_title,
      COALESCE(en.description, e.description) as en_description,
      COALESCE(zh.description, e.description) as zh_description,
      COALESCE(en.note, e.note) as en_note,
      COALESCE(zh.note, e.note) as zh_note
    FROM experiences e
    LEFT JOIN experience_i18n en ON en.experience_id = e.id AND en.lang = 'en'
    LEFT JOIN experience_i18n zh ON zh.experience_id = e.id AND zh.lang = 'zh'
    ORDER BY e.sort_order ASC LIMIT ? OFFSET ?`,
  ).all(pageSize, (page - 1) * pageSize) as (ExperienceRow & { en_title: string; zh_title: string; en_description: string; zh_description: string; en_note: string; zh_note: string })[];

  // Batch-fetch skills for all experiences on this page
  const expIds = rows.map((r) => r.id);
  let skillsMap = new Map<string, { name: string; category: string; color: string }[]>();
  if (expIds.length > 0) {
    const placeholders = expIds.map(() => "?").join(",");
    const skillsRows = db.prepare(
      `SELECT es.experience_id, es.skill_name as name, sc.color, sci_en.title as category
       FROM experience_skills es
       JOIN skills s ON s.name = es.skill_name AND s.category_id = es.category_id
       JOIN skill_categories sc ON sc.id = s.category_id
       LEFT JOIN skill_category_i18n sci_en ON sci_en.category_id = sc.id AND sci_en.lang = 'en'
       WHERE es.experience_id IN (${placeholders})
       ORDER BY es.sort_order ASC`
    ).all(...expIds) as { experience_id: string; name: string; category: string; color: string }[];
    for (const row of skillsRows) {
      if (!skillsMap.has(row.experience_id)) skillsMap.set(row.experience_id, []);
      skillsMap.get(row.experience_id)!.push({ name: row.name, category: row.category, color: row.color });
    }
  }

  return {
    data: rows.map((r) => ({
      id: r.id,
      year: r.year,
      title: r.title,
      description: r.description,
      note: r.note ?? undefined,
      sort_order: r.sort_order,
      en_title: r.en_title,
      zh_title: r.zh_title,
      en_description: r.en_description,
      zh_description: r.zh_description,
      en_note: r.en_note,
      zh_note: r.zh_note,
      skills: skillsMap.get(r.id) || [],
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  };
}

export function createExperience(
  exp: Omit<ExperienceNode, "note"> & { note?: string; sort_order?: number; skills?: string[]; zh_title?: string; zh_description?: string; zh_note?: string }
): string {
  const db = getPortfolioDb();
  const maxSort = (db.prepare("SELECT MAX(sort_order) as m FROM experiences").get() as { m: number | null }).m ?? -1;
  const id = crypto.randomUUID();
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO experiences (id, year, title, description, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(id, exp.year, exp.title, exp.description, exp.note ?? null, exp.sort_order ?? maxSort + 1);

    // Store zh i18n if provided
    if (exp.zh_title || exp.zh_description || exp.zh_note) {
      db.prepare("INSERT OR IGNORE INTO experience_i18n (experience_id, lang, title, description, note) VALUES (?, 'zh', ?, ?, ?)").run(
        id, exp.zh_title || exp.title, exp.zh_description || exp.description, exp.zh_note || (exp.note ?? "")
      );
    }

    if (exp.skills && exp.skills.length > 0) {
      const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
      const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
      exp.skills.forEach((skill, idx) => {
        const cat = catStmt.get(skill) as { category_id: string } | undefined;
        if (cat) stmt.run(id, skill, cat.category_id, idx);
      });
    }
  });
  tx();
  return id;
}

export function updateExperience(id: string, updates: Partial<ExperienceNode & { sort_order?: number; skills?: string[]; zh_title?: string; zh_description?: string; zh_note?: string }>): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
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

    // Upsert zh i18n if any zh field is provided
    if (updates.zh_title !== undefined || updates.zh_description !== undefined || updates.zh_note !== undefined) {
      db.prepare("INSERT OR REPLACE INTO experience_i18n (experience_id, lang, title, description, note) VALUES (?, 'zh', ?, ?, ?)").run(
        id,
        updates.zh_title ?? updates.title ?? "",
        updates.zh_description ?? updates.description ?? "",
        updates.zh_note ?? updates.note ?? ""
      );
    }

    if (updates.skills !== undefined) {
      db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);
      const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
      const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
      updates.skills.forEach((skill, idx) => {
        const cat = catStmt.get(skill) as { category_id: string } | undefined;
        if (cat) stmt.run(id, skill, cat.category_id, idx);
      });
    }
  });
  tx();
}

export function deleteExperience(id: string): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM experience_i18n WHERE experience_id = ?").run(id);
    db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);
    db.prepare("DELETE FROM experiences WHERE id = ?").run(id);
  });
  tx();
}
