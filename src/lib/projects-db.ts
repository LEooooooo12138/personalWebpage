import { getPortfolioDb } from "@/lib/portfolio-db";
import { Project } from "@/types/portfolio";

type ProjectRow = {
  id: string;
  title: string;
  summary: string;
  tags: string;
  demo_url: string;
  repo_url: string;
  video_hint: string;
  claps: number;
};

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    title: r.title,
    summary: r.summary,
    tags: JSON.parse(r.tags),
    demoUrl: r.demo_url,
    repoUrl: r.repo_url,
    videoHint: r.video_hint,
    claps: r.claps,
  };
}

/* ── Public API ── */

export function getProjects(): Project[] {
  const db = getPortfolioDb();
  const rows = db.prepare("SELECT * FROM projects ORDER BY id").all() as ProjectRow[];
  return rows.map(rowToProject);
}

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

export function getProject(id: string): Project | undefined {
  const db = getPortfolioDb();
  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
  return row ? rowToProject(row) : undefined;
}

export function incrementClaps(id: string): number {
  const db = getPortfolioDb();
  const result = db.prepare("UPDATE projects SET claps = claps + 1 WHERE id = ?").run(id);
  if (result.changes === 0) return 0;
  const row = db.prepare("SELECT claps FROM projects WHERE id = ?").get(id) as { claps: number };
  return row.claps;
}

/* ── Admin API ── */

export type PaginatedResult<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export function listProjectsAdmin(page: number, pageSize: number): PaginatedResult<Project> {
  const db = getPortfolioDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM projects").get() as { c: number }).c;
  const rows = db.prepare("SELECT * FROM projects ORDER BY id LIMIT ? OFFSET ?").all(pageSize, (page - 1) * pageSize) as ProjectRow[];

  return {
    data: rows.map(rowToProject),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  };
}

export function createProject(project: Omit<Project, "claps"> & { claps?: number; skills?: string[] }): Project {
  const db = getPortfolioDb();
  const tags = JSON.stringify(project.tags);
  db.prepare(
    "INSERT INTO projects (id, title, summary, tags, demo_url, repo_url, video_hint, claps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(project.id, project.title, project.summary, tags, project.demoUrl, project.repoUrl, project.videoHint, project.claps ?? 0);

  if (project.skills && project.skills.length > 0) {
    const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
    const stmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
    for (let i = 0; i < project.skills.length; i++) {
      const cat = catStmt.get(project.skills[i]) as { category_id: string } | undefined;
      if (cat) {
        stmt.run(project.id, project.skills[i], cat.category_id, i);
      }
    }
  }

  return { ...project, claps: project.claps ?? 0 };
}

export function updateProject(id: string, updates: Partial<Omit<Project, "id"> & { skills?: string[] }>): void {
  const db = getPortfolioDb();
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
  if (updates.summary !== undefined) { fields.push("summary = ?"); values.push(updates.summary); }
  if (updates.tags !== undefined) { fields.push("tags = ?"); values.push(JSON.stringify(updates.tags)); }
  if (updates.demoUrl !== undefined) { fields.push("demo_url = ?"); values.push(updates.demoUrl); }
  if (updates.repoUrl !== undefined) { fields.push("repo_url = ?"); values.push(updates.repoUrl); }
  if (updates.videoHint !== undefined) { fields.push("video_hint = ?"); values.push(updates.videoHint); }

  if (updates.skills !== undefined) {
    db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
    const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
    const stmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
    updates.skills.forEach((skill, idx) => {
      const cat = catStmt.get(skill) as { category_id: string } | undefined;
      if (cat) stmt.run(id, skill, cat.category_id, idx);
    });
  }

  if (fields.length === 0) return;
  values.push(id);
  db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export function deleteProject(id: string): void {
  const db = getPortfolioDb();
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
}
