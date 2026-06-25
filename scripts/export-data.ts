/**
 * Export SQLite portfolio data to static JSON for Vercel deployment.
 * Run: npx tsx scripts/export-data.ts
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "src/data");
const DB_PATH = path.join(process.cwd(), "data", "portfolio.db");

if (!fs.existsSync(DB_PATH)) {
  console.warn("⚠️  portfolio.db not found — skipping export (data files already committed)");
  process.exit(0);
}

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function writeJson(filename: string, data: unknown) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  console.log("  ✓", filename);
}

/* ── Projects ── */
for (const lang of ["en", "zh"]) {
  const rows = db.prepare(`
    SELECT p.*, p.time_period,
      COALESCE(NULLIF(pi.title, ''), p.title) as title,
      COALESCE(NULLIF(pi.summary, ''), p.summary) as summary,
      COALESCE(NULLIF(pi.video_hint, ''), p.video_hint) as video_hint
    FROM projects p
    LEFT JOIN project_i18n pi ON pi.project_id = p.id AND pi.lang = ?
    ORDER BY p.id
  `).all(lang) as any[];

  const skillsStmt = db.prepare(`
    SELECT ps.skill_name, ps.project_id, sc.color, sci.title as category
    FROM project_skills ps
    JOIN skills s ON s.name = ps.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY ps.sort_order ASC
  `);
  const skillsRows = skillsStmt.all(lang) as any[];

  const skillsMap = new Map<string, any[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.project_id)) skillsMap.set(row.project_id, []);
    skillsMap.get(row.project_id)!.push({
      name: row.skill_name,
      category: row.category,
      color: row.color,
    });
  }

  const projects = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    summary: r.summary,
    tags: JSON.parse(r.tags || "[]"),
    demoUrl: r.demo_url,
    repoUrl: r.repo_url,
    videoHint: r.video_hint,
    claps: r.claps,
    timePeriod: r.time_period || undefined,
    skills: skillsMap.get(r.id) || [],
  }));

  writeJson(`projects-${lang}.json`, projects);
}

/* ── Experiences ── */
for (const lang of ["en", "zh"]) {
  const rows = db.prepare(`
    SELECT e.id, e.year, e.sort_order,
      COALESCE(ei.title, e.title) as title,
      COALESCE(ei.description, e.description) as description,
      COALESCE(ei.note, e.note) as note
    FROM experiences e
    LEFT JOIN experience_i18n ei ON ei.experience_id = e.id AND ei.lang = ?
    ORDER BY e.sort_order ASC
  `).all(lang) as any[];

  const skillsStmt = db.prepare(`
    SELECT es.skill_name, es.experience_id, sc.color, sci.title as category
    FROM experience_skills es
    JOIN skills s ON s.name = es.skill_name
    JOIN skill_categories sc ON sc.id = s.category_id
    LEFT JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY es.sort_order ASC
  `);
  const skillsRows = skillsStmt.all(lang) as any[];

  const skillsMap = new Map<string, any[]>();
  for (const row of skillsRows) {
    if (!skillsMap.has(row.experience_id)) skillsMap.set(row.experience_id, []);
    skillsMap.get(row.experience_id)!.push({
      name: row.skill_name,
      category: row.category,
      color: row.color,
    });
  }

  const experiences = rows.map((r: any) => ({
    id: r.id,
    year: r.year,
    title: r.title,
    description: r.description,
    note: r.note ?? undefined,
    skills: skillsMap.get(r.id) || [],
  }));

  writeJson(`experiences-${lang}.json`, experiences);
}


/* ── Skills with usage (project & experience refs) ── */
for (const lang of ["en", "zh"]) {
  const categoryRows = db.prepare(`
    SELECT sc.id, sc.color, sci.title, sci.description
    FROM skill_categories sc
    JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY sc.sort_order ASC
  `).all(lang) as any[];

  const getSkillsForCategory = db.prepare(`
    SELECT s.name, COALESCE(si.display_name, s.name) as display_name
    FROM skills s
    LEFT JOIN skill_i18n si ON si.name = s.name AND si.category_id = s.category_id AND si.lang = ?
    WHERE s.category_id = ?
    ORDER BY s.sort_order ASC
  `);

  // Project refs per skill
  const projectRefs = db.prepare(`
    SELECT DISTINCT ps.skill_name, p.id,
      COALESCE(pi.title, p.title) as title,
      COALESCE(pi.summary, p.summary) as summary,
      p.time_period
    FROM project_skills ps
    JOIN projects p ON p.id = ps.project_id
    LEFT JOIN project_i18n pi ON pi.project_id = p.id AND pi.lang = ?
    ORDER BY ps.skill_name, p.id
  `).all(lang) as any[];

  // Experience refs per skill
  const experienceRefs = db.prepare(`
    SELECT DISTINCT es.skill_name, e.id, e.year,
      COALESCE(ei.title, e.title) as title,
      COALESCE(ei.description, e.description) as description
    FROM experience_skills es
    JOIN experiences e ON e.id = es.experience_id
    LEFT JOIN experience_i18n ei ON ei.experience_id = e.id AND ei.lang = ?
    ORDER BY es.skill_name, e.sort_order
  `).all(lang) as any[];

  const projMap = new Map<string, any[]>();
  for (const row of projectRefs) {
    if (!projMap.has(row.skill_name)) projMap.set(row.skill_name, []);
    projMap.get(row.skill_name)!.push({
      id: row.id,
      title: row.title,
      summary: row.summary,
      time_period: row.time_period || undefined,
    });
  }

  const expMap = new Map<string, any[]>();
  for (const row of experienceRefs) {
    if (!expMap.has(row.skill_name)) expMap.set(row.skill_name, []);
    expMap.get(row.skill_name)!.push({
      id: row.id,
      year: row.year,
      title: row.title,
      description: row.description || undefined,
    });
  }

  const langRows = db.prepare("SELECT name FROM languages WHERE lang = ?").all(lang) as any[];
  // Match refs by both raw skill name and i18n display name
  const nameI18nRows = db.prepare(
    "SELECT name, display_name FROM skill_i18n WHERE lang = ?"
  ).all(lang) as any[];
  const nameI18n = new Map<string, string>();
  for (const row of nameI18nRows) {
    nameI18n.set(row.name, row.display_name);
  }

  const categories = categoryRows.map((cat: any) => {
    const skills = (getSkillsForCategory.all(lang, cat.id) as any[]).map((s: any) => {
      const displayName = s.display_name;
      return {
        name: displayName,
        used_in: {
          projects: projMap.get(s.name) || projMap.get(displayName) || [],
          experiences: expMap.get(s.name) || expMap.get(displayName) || [],
        },
      };
    });
    return { id: cat.id, color: cat.color, title: cat.title, description: cat.description, skills };
  });

  const languages = langRows.map((r: any) => r.name);
  writeJson(`skills-${lang}.json`, { categories, languages });
}
/* ── Profile ── */
const profileRows = db.prepare("SELECT key, value FROM profile").all() as any[];
const profile: Record<string, string> = {};
for (const row of profileRows) {
  profile[row.key] = row.value;
}
writeJson("profile.json", profile);

db.close();
console.log("\n✅ Data export complete → src/data/");
