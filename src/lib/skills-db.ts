import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SkillCategory, SkillsResponse } from "@/types/portfolio";

// ── Color palette: cycles for new categories beyond the predefined 3 ──
const COLOR_PALETTE = ["gold", "terracotta", "sage"] as const;

declare global {
  var __skillsDb: Database.Database | undefined;
}

const getDbPath = () => {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return path.join(dataDir, "skills.db");
};

const getDb = (): Database.Database => {
  if (!globalThis.__skillsDb) {
    const db = new Database(getDbPath());
    db.pragma("journal_mode = WAL");
    initTables(db);
    seedDefaults(db);
    globalThis.__skillsDb = db;
  }
  return globalThis.__skillsDb;
};

// ── Schema ──

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skill_categories (
      id          TEXT PRIMARY KEY,
      color       TEXT NOT NULL,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_category_i18n (
      category_id TEXT NOT NULL,
      lang        TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (category_id, lang),
      FOREIGN KEY (category_id) REFERENCES skill_categories(id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      name        TEXT NOT NULL,
      category_id TEXT NOT NULL,
      proficiency INTEGER,
      sort_order  INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (name, category_id),
      FOREIGN KEY (category_id) REFERENCES skill_categories(id)
    );

    CREATE TABLE IF NOT EXISTS languages (
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      PRIMARY KEY (lang, name)
    );
  `);
}

// ── Seed ──

function seedDefaults(db: Database.Database) {
  const categoryCount = db.prepare("SELECT COUNT(*) as c FROM skill_categories").get() as { c: number };
  if (categoryCount.c > 0) return;

  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO skill_categories (id, color, sort_order) VALUES (?, ?, ?)"
  );
  const insertI18n = db.prepare(
    "INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, ?, ?, ?)"
  );
  const insertSkill = db.prepare(
    "INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)"
  );
  const insertLanguage = db.prepare(
    "INSERT OR IGNORE INTO languages (lang, name) VALUES (?, ?)"
  );

  const seed = db.transaction(() => {
    // Categories
    insertCategory.run("frontend", "gold", 0);
    insertCategory.run("backend", "terracotta", 1);
    insertCategory.run("tools", "sage", 2);
    insertCategory.run("game", "gold", 3);

    // i18n — en
    insertI18n.run("frontend", "en", "Front-End", "Polished interfaces with thoughtful animation. Pixel‑perfect implementation that feels alive.");
    insertI18n.run("backend", "en", "Back-End", "Robust APIs, database architecture, and server‑side systems. From SQL schema design to cloud deployment.");
    insertI18n.run("tools", "en", "Tools & Workflow", "Git, cloud computing, and agile workflows — the foundational practices that make engineering teams ship.");
    insertI18n.run("game", "en", "Game & 3D", "Real‑time engines and digital creation — where technical skill meets visual storytelling.");

    // i18n — zh
    insertI18n.run("frontend", "zh", "前端", "精致的界面与细腻的动效，像素级还原设计稿。");
    insertI18n.run("backend", "zh", "后端", "稳健的 API、数据库架构与服务端系统。从 SQL 表设计到云端部署。");
    insertI18n.run("tools", "zh", "工具与流程", "Git、云计算与敏捷开发——支撑工程团队交付的基础实践。");
    insertI18n.run("game", "zh", "游戏与 3D", "实时引擎与数字创作——技术与视觉叙事的交汇点。");

    // Skills
    insertSkill.run("HTML", "frontend", 95, 0);
    insertSkill.run("CSS", "frontend", 90, 1);
    insertSkill.run("Vue", "frontend", 80, 2);
    insertSkill.run("React", "frontend", 70, 3);

    insertSkill.run("SQL", "backend", 90, 0);
    insertSkill.run("C++", "backend", 75, 1);
    insertSkill.run("Java", "backend", 80, 2);
    insertSkill.run("Python", "backend", 85, 3);
    insertSkill.run("Swift", "backend", 65, 4);
    insertSkill.run("PHP", "backend", 60, 5);

    insertSkill.run("Git", "tools", 85, 0);
    insertSkill.run("Cloud Computing", "tools", 70, 1);
    insertSkill.run("Agile Project Management", "tools", 80, 2);

    insertSkill.run("UE5", "game", 40, 0);
    insertSkill.run("Unity", "game", 45, 1);
    insertSkill.run("Maya", "game", 35, 2);

    // Languages
    insertLanguage.run("en", "Mandarin (Native)");
    insertLanguage.run("en", "English (Professional)");
    insertLanguage.run("zh", "中文（母语）");
    insertLanguage.run("zh", "英文（专业工作能力）");
  });

  seed();
}

// ── Color assignment for dynamic categories ──

function assignColor(db: Database.Database, categoryId: string): string {
  const count = (db.prepare("SELECT COUNT(*) as c FROM skill_categories").get() as { c: number }).c;
  return COLOR_PALETTE[(count - 1) % COLOR_PALETTE.length];
}

// ── Query ──

export function getSkills(lang: string): SkillsResponse {
  const db = getDb();

  const categoryRows = db
    .prepare(
      `SELECT sc.id, sc.color, sci.title, sci.description
       FROM skill_categories sc
       JOIN skill_category_i18n sci ON sci.category_id = sc.id AND sci.lang = ?
       ORDER BY sc.sort_order ASC`
    )
    .all(lang) as { id: string; color: string; title: string; description: string }[];

  // Fallback to en if requested lang has no rows
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
    return {
      id: row.id,
      color: row.color,
      title: row.title,
      description: row.description,
      skills,
    };
  });

  const langRows = db
    .prepare("SELECT name FROM languages WHERE lang = ?")
    .all(lang) as { name: string }[];

  const languages = langRows.length > 0
    ? langRows.map((r) => r.name)
    : (db.prepare("SELECT name FROM languages WHERE lang = 'en'").all() as { name: string }[]).map((r) => r.name);

  return { categories, languages };
}

// ── Mutations (for future admin use) ──

export function addSkill(categoryId: string, name: string, proficiency?: number) {
  const db = getDb();
  const maxSort = db.prepare("SELECT MAX(sort_order) as m FROM skills WHERE category_id = ?").get(categoryId) as { m: number | null };
  const sortOrder = (maxSort?.m ?? -1) + 1;
  db.prepare("INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)").run(name, categoryId, proficiency ?? null, sortOrder);
}

export function addCategory(id: string, enTitle: string, zhTitle: string, enDesc: string, zhDesc: string) {
  const db = getDb();
  const color = assignColor(db, id);
  const maxSort = db.prepare("SELECT MAX(sort_order) as m FROM skill_categories").get() as { m: number | null };
  const sortOrder = (maxSort?.m ?? -1) + 1;

  const tx = db.transaction(() => {
    db.prepare("INSERT OR IGNORE INTO skill_categories (id, color, sort_order) VALUES (?, ?, ?)").run(id, color, sortOrder);
    db.prepare("INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'en', ?, ?)").run(id, enTitle, enDesc);
    db.prepare("INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, 'zh', ?, ?)").run(id, zhTitle, zhDesc);
  });
  tx();
}
