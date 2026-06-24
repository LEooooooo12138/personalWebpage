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

export function getExperiences(): ExperienceNode[] {
  const db = getPortfolioDb();
  const rows = db.prepare("SELECT * FROM experiences ORDER BY sort_order ASC").all() as ExperienceRow[];
  return rows.map(rowToExp);
}

/* ── Joined API ── */

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

/* ── Admin API ── */

export type PaginatedResult<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function listExperiencesAdmin(page: number, pageSize: number): PaginatedResult<ExperienceNode & { id: string; sort_order: number }> {
  const db = getPortfolioDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM experiences").get() as { c: number }).c;
  const rows = db.prepare(
    "SELECT * FROM experiences ORDER BY sort_order ASC LIMIT ? OFFSET ?",
  ).all(pageSize, (page - 1) * pageSize) as ExperienceRow[];

  return {
    data: rows.map((r) => ({
      id: r.id,
      year: r.year,
      title: r.title,
      description: r.description,
      note: r.note ?? undefined,
      sort_order: r.sort_order,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  };
}

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
    const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
    const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
    exp.skills.forEach((skill, idx) => {
      const cat = catStmt.get(skill) as { category_id: string } | undefined;
      if (cat) stmt.run(id, skill, cat.category_id, idx);
    });
  }
  return id;
}

export function updateExperience(id: string, updates: Partial<ExperienceNode & { sort_order?: number; skills?: string[] }>): void {
  const db = getPortfolioDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.year !== undefined) { fields.push("year = ?"); values.push(updates.year); }
  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
  if (updates.note !== undefined) { fields.push("note = ?"); values.push(updates.note); }
  if (updates.sort_order !== undefined) { fields.push("sort_order = ?"); values.push(updates.sort_order); }

  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE experiences SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  if (updates.skills !== undefined) {
    db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);
    const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
    const stmt = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
    updates.skills.forEach((skill, idx) => {
      const cat = catStmt.get(skill) as { category_id: string } | undefined;
      if (cat) stmt.run(id, skill, cat.category_id, idx);
    });
  }
}

export function deleteExperience(id: string): void {
  const db = getPortfolioDb();
  db.prepare("DELETE FROM experiences WHERE id = ?").run(id);
  db.prepare("DELETE FROM experience_skills WHERE experience_id = ?").run(id);
}
