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
  console.error("❌ portfolio.db not found at", DB_PATH);
  process.exit(1);
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
      COALESCE(pi.title, p.title) as title,
      COALESCE(pi.summary, p.summary) as summary,
      COALESCE(pi.video_hint, p.video_hint) as video_hint
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

/* ── Skills ── */
for (const lang of ["en", "zh"]) {
  const categoryRows = db.prepare(`
    SELECT sc.id, sc.color, sci.title, sci.description
    FROM skill_categories sc
    JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
    ORDER BY sc.sort_order ASC
  `).all(lang) as any[];

  const catRows = categoryRows.length > 0
    ? categoryRows
    : (db.prepare(`
        SELECT sc.id, sc.color, sci.title, sci.description
        FROM skill_categories sc
        JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = 'en'
        ORDER BY sc.sort_order ASC
      `).all() as any[]);

  const getSkillsForCategory = db.prepare(
    "SELECT name FROM skills WHERE category_id = ? ORDER BY sort_order ASC"
  );

  const categories = catRows.map((row: any) => ({
    id: row.id,
    color: row.color,
    title: row.title,
    description: row.description,
    skills: (getSkillsForCategory.all(row.id) as any[]).map((s: any) => s.name),
  }));

  const langRows = db.prepare("SELECT name FROM languages WHERE lang = ?").all(lang) as any[];
  const languages = langRows.length > 0
    ? langRows.map((r: any) => r.name)
    : (db.prepare("SELECT name FROM languages WHERE lang = 'en'").all() as any[]).map((r: any) => r.name);

  writeJson(`skills-${lang}.json`, { categories, languages });
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

/* ── Profile ── */
const profileRows = db.prepare("SELECT key, value FROM profile").all() as any[];
const profile: Record<string, string> = {};
for (const row of profileRows) {
  profile[row.key] = row.value;
}
writeJson("profile.json", profile);

db.close();
console.log("\n✅ Data export complete → src/data/");
