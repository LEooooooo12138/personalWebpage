import { getPortfolioDb } from "@/lib/portfolio-db";
import { Project, ProjectSkill } from "@/types/portfolio";

type ProjectRow = {
  id: string;
  title: string;
  summary: string;
  tags: string;
  demo_url: string;
  repo_url: string;
  video_hint: string;
  claps: number;
  time_period: string;
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
    timePeriod: r.time_period || undefined,
  };
}

/* ── Public API ── */

export function getProjects(lang: string = "en"): Project[] {
  const db = getPortfolioDb();
  const rows = db.prepare(`
    SELECT p.*, p.time_period,
      COALESCE(pi.title, p.title) as title,
      COALESCE(pi.summary, p.summary) as summary,
      COALESCE(pi.video_hint, p.video_hint) as video_hint
    FROM projects p
    LEFT JOIN project_i18n pi ON pi.project_id = p.id AND pi.lang = ?
    ORDER BY p.id
  `).all(lang) as ProjectRow[];
  return rows.map(rowToProject);
}

export function getProjectsWithSkills(lang: string = "en"): (Project & { skills: ProjectSkill[] })[] {
  const db = getPortfolioDb();
  const projects = getProjects(lang);

  const skillsStmt = db.prepare(`
    SELECT ps.skill_name, ps.project_id, sc.color, sci.title as category
    FROM project_skills ps
    JOIN skills s ON s.name = ps.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY ps.sort_order ASC
  `);
  const skillsRows = skillsStmt.all(lang) as { skill_name: string; project_id: string; color: string; category: string }[];

  const skillsMap = new Map<string, ProjectSkill[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.project_id)) skillsMap.set(row.project_id, []);
    skillsMap.get(row.project_id)!.push({ name: row.skill_name, category: row.category, color: row.color, categoryId: '' });
  }

  return projects.map((p) => ({
    ...p,
    skills: skillsMap.get(p.id) || [],
  }));
}

export function getProject(id: string, lang: string = "en"): (Project & { zh_title?: string; zh_summary?: string; zh_video_hint?: string }) | undefined {
  const db = getPortfolioDb();
  const row = db.prepare(`
    SELECT p.*, p.time_period,
      COALESCE(pi.title, p.title) as title,
      COALESCE(pi.summary, p.summary) as summary,
      COALESCE(pi.video_hint, p.video_hint) as video_hint,
      zh.title as zh_title, zh.summary as zh_summary, zh.video_hint as zh_video_hint
    FROM projects p
    LEFT JOIN project_i18n pi ON pi.project_id = p.id AND pi.lang = ?
    LEFT JOIN project_i18n zh ON zh.project_id = p.id AND zh.lang = 'zh'
    WHERE p.id = ?
  `).get(lang, id) as (ProjectRow & { zh_title: string | null; zh_summary: string | null; zh_video_hint: string | null }) | undefined;
  if (!row) return undefined;
  return {
    ...rowToProject(row),
    zh_title: row.zh_title ?? undefined,
    zh_summary: row.zh_summary ?? undefined,
    zh_video_hint: row.zh_video_hint ?? undefined,
  };
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

export function listProjectsAdmin(page: number, pageSize: number): PaginatedResult<Project & { en_title: string; zh_title: string; en_summary: string; zh_summary: string; en_video_hint: string; zh_video_hint: string; skills?: { name: string; category: string; color: string }[] }> {
  const db = getPortfolioDb();
  const total = (db.prepare("SELECT COUNT(*) as c FROM projects").get() as { c: number }).c;
  const rows = db.prepare(`
    SELECT p.*, p.time_period,
      COALESCE(en.title, p.title) as en_title,
      COALESCE(zh.title, p.title) as zh_title,
      COALESCE(en.summary, p.summary) as en_summary,
      COALESCE(zh.summary, p.summary) as zh_summary,
      COALESCE(en.video_hint, p.video_hint) as en_video_hint,
      COALESCE(zh.video_hint, p.video_hint) as zh_video_hint
    FROM projects p
    LEFT JOIN project_i18n en ON en.project_id = p.id AND en.lang = 'en'
    LEFT JOIN project_i18n zh ON zh.project_id = p.id AND zh.lang = 'zh'
    ORDER BY p.id LIMIT ? OFFSET ?
  `).all(pageSize, (page - 1) * pageSize) as (ProjectRow & { en_title: string; zh_title: string; en_summary: string; zh_summary: string; en_video_hint: string; zh_video_hint: string })[];

  // Batch-fetch skills for all projects on this page
  const projIds = rows.map((r) => r.id);
  let skillsMap = new Map<string, { name: string; category: string; color: string }[]>();
  if (projIds.length > 0) {
    const placeholders = projIds.map(() => "?").join(",");
    const skillsRows = db.prepare(
      `SELECT ps.project_id, ps.skill_name as name, sc.color, sci_en.title as category
       FROM project_skills ps
       JOIN skills s ON s.name = ps.skill_name AND s.category_id = ps.category_id
       JOIN skill_categories sc ON sc.id = s.category_id
       LEFT JOIN skill_category_i18n sci_en ON sci_en.category_id = sc.id AND sci_en.lang = 'en'
       WHERE ps.project_id IN (${placeholders})
       ORDER BY ps.sort_order ASC`
    ).all(...projIds) as { project_id: string; name: string; category: string; color: string }[];
    for (const row of skillsRows) {
      if (!skillsMap.has(row.project_id)) skillsMap.set(row.project_id, []);
      skillsMap.get(row.project_id)!.push({ name: row.name, category: row.category, color: row.color });
    }
  }

  return {
    data: rows.map(r => ({
      ...rowToProject(r),
      en_title: r.en_title,
      zh_title: r.zh_title,
      en_summary: r.en_summary,
      zh_summary: r.zh_summary,
      en_video_hint: r.en_video_hint,
      zh_video_hint: r.zh_video_hint,
      skills: skillsMap.get(r.id) || [],
      timePeriod: r.time_period || undefined,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) || 1 },
  };
}

export function createProject(project: Omit<Project, "claps"> & { claps?: number; skills?: string[]; zh_title?: string; zh_summary?: string; zh_video_hint?: string; timePeriod?: string }): Project {
  const db = getPortfolioDb();
  const tags = JSON.stringify(project.tags);
  const tx = db.transaction(() => {
    db.prepare(
      "INSERT INTO projects (id, title, summary, tags, demo_url, repo_url, video_hint, claps, time_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(project.id, project.title, project.summary, tags, project.demoUrl, project.repoUrl, project.videoHint, project.claps ?? 0, project.timePeriod ?? "");

    // Store zh i18n if provided
    if (project.zh_title || project.zh_summary || project.zh_video_hint) {
      db.prepare("INSERT OR IGNORE INTO project_i18n (project_id, lang, title, summary, video_hint) VALUES (?, 'zh', ?, ?, ?)").run(
        project.id, project.zh_title || project.title, project.zh_summary || project.summary, project.zh_video_hint || project.videoHint
      );
    }
  });
  tx();

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

export function updateProject(id: string, updates: Partial<Omit<Project, "id"> & { skills?: string[]; zh_title?: string; zh_summary?: string; zh_video_hint?: string; timePeriod?: string }>): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title !== undefined) { fields.push("title = ?"); values.push(updates.title); }
    if (updates.summary !== undefined) { fields.push("summary = ?"); values.push(updates.summary); }
    if (updates.tags !== undefined) { fields.push("tags = ?"); values.push(JSON.stringify(updates.tags)); }
    if (updates.demoUrl !== undefined) { fields.push("demo_url = ?"); values.push(updates.demoUrl); }
    if (updates.repoUrl !== undefined) { fields.push("repo_url = ?"); values.push(updates.repoUrl); }
    if (updates.videoHint !== undefined) { fields.push("video_hint = ?"); values.push(updates.videoHint); }
    if (updates.timePeriod !== undefined) { fields.push("time_period = ?"); values.push(updates.timePeriod); }

    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE projects SET ${fields.join(", ")} WHERE id = ?`).run(...values);
    }

    // Upsert zh i18n if any zh field is provided
    if (updates.zh_title !== undefined || updates.zh_summary !== undefined || updates.zh_video_hint !== undefined) {
      db.prepare("INSERT OR REPLACE INTO project_i18n (project_id, lang, title, summary, video_hint) VALUES (?, 'zh', ?, ?, ?)").run(
        id,
        updates.zh_title ?? updates.title ?? "",
        updates.zh_summary ?? updates.summary ?? "",
        updates.zh_video_hint ?? updates.videoHint ?? ""
      );
    }

    if (updates.skills !== undefined) {
      db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
      const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
      const stmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
      updates.skills.forEach((skill, idx) => {
        const cat = catStmt.get(skill) as { category_id: string } | undefined;
        if (cat) stmt.run(id, skill, cat.category_id, idx);
      });
    }
  });
  tx();
}

export function deleteProject(id: string): void {
  const db = getPortfolioDb();
  const tx = db.transaction(() => {
    db.prepare("DELETE FROM project_i18n WHERE project_id = ?").run(id);
    db.prepare("DELETE FROM project_skills WHERE project_id = ?").run(id);
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  });
  tx();
}
