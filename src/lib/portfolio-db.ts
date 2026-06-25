import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

declare global {
  var __portfolioDb: Database.Database | undefined;
}

const DB_PATH = (): string => {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "portfolio.db");
};

export function getPortfolioDb(): Database.Database {
  if (!globalThis.__portfolioDb) {
    const dbPath = DB_PATH();
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initSchema(db);
    runMigrations(db);
    globalThis.__portfolioDb = db;
  }
  // Ensure i18n tables exist even for cached connections (idempotent CREATE IF NOT EXISTS)
  migrateI18nTables(globalThis.__portfolioDb);
  return globalThis.__portfolioDb;
}

// ── Schema ──

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES admin_users(id)
    );

    CREATE TABLE IF NOT EXISTS profile (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS experiences (
      id TEXT PRIMARY KEY,
      year TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      note TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      demo_url TEXT NOT NULL DEFAULT '',
      repo_url TEXT NOT NULL DEFAULT '',
      video_hint TEXT NOT NULL DEFAULT '',
      claps INTEGER NOT NULL DEFAULT 0,
      time_period TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS skill_categories (
      id TEXT PRIMARY KEY,
      color TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS skill_category_i18n (
      category_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (category_id, lang),
      FOREIGN KEY (category_id) REFERENCES skill_categories(id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      proficiency INTEGER,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (name, category_id),
      FOREIGN KEY (category_id) REFERENCES skill_categories(id)
    );

    CREATE TABLE IF NOT EXISTS project_skills (
      project_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (project_id, skill_name, category_id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (skill_name, category_id) REFERENCES skills(name, category_id)
    );

    CREATE TABLE IF NOT EXISTS experience_skills (
      experience_id TEXT NOT NULL,
      skill_name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (experience_id, skill_name, category_id),
      FOREIGN KEY (experience_id) REFERENCES experiences(id),
      FOREIGN KEY (skill_name, category_id) REFERENCES skills(name, category_id)
    );

    CREATE TABLE IF NOT EXISTS project_i18n (
      project_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      video_hint TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (project_id, lang),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS experience_i18n (
      experience_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (experience_id, lang),
      FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_i18n (
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      display_name TEXT NOT NULL,
      PRIMARY KEY (name, category_id, lang),
      FOREIGN KEY (name, category_id) REFERENCES skills(name, category_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS languages (
      lang TEXT NOT NULL,
      name TEXT NOT NULL,
      PRIMARY KEY (lang, name)
    );

    CREATE TABLE IF NOT EXISTS guestbook_notes (
      id TEXT PRIMARY KEY,
      author TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_guestbook_created_at
      ON guestbook_notes(created_at DESC);

    CREATE TABLE IF NOT EXISTS page_visits (
      page TEXT NOT NULL,
      session_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (page, session_id)
    );
    CREATE INDEX IF NOT EXISTS idx_page_visits_page
      ON page_visits(page);
  `);
}

// ── Migrations ──

function migrateProjectTags(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM project_skills").get() as { c: number }).c;
  if (count > 0) return; // Already migrated

  const projects = db.prepare("SELECT id, tags FROM projects WHERE tags IS NOT NULL AND tags != '' AND tags != '[]'").all() as { id: string; tags: string }[];
  
  const insertStmt = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
  const catStmt = db.prepare("SELECT category_id FROM skills WHERE name = ? ORDER BY category_id LIMIT 1");
  
  const tx = db.transaction(() => {
    for (const proj of projects) {
      try {
        const tags: string[] = JSON.parse(proj.tags);
        tags.forEach((tag, idx) => {
          const cat = catStmt.get(tag) as { category_id: string } | undefined;
          if (cat) {
            insertStmt.run(proj.id, tag, cat.category_id, idx);
          } else {
            // console.warn(`[migration] Project "${proj.id}" tag "${tag}" not found in skills table — skipping`);
          }
        });
      } catch {
        // console.warn(`[migration] Failed to parse tags JSON for project "${proj.id}" — skipping`);
      }
    }
  });
  tx();
  // console.log(`[migration] Migrated project tags to project_skills for ${projects.length} projects`);
}

function runMigrations(db: Database.Database) {
  const row = db.prepare("SELECT COUNT(*) as c FROM profile").get() as { c: number };
  if (row.c === 0) {
    migrateFromSkillsDb(db);
    migrateFromGuestbookDb(db);
    migrateFromVisitsDb(db);
    seedStaticData(db);
    seedSkillRelations(db);
    migrateProjectTags(db);
  }
  // Always ensure admin user exists (re-seed if deleted)
  seedAdminUser(db);
  // Always run i18n seed (idempotent: INSERT OR IGNORE)
  seedI18nData(db);
}

function migrateFromSkillsDb(db: Database.Database) {
  const oldPath = path.join(process.cwd(), "data", "skills.db");
  if (!fs.existsSync(oldPath)) return;

  try {
    const oldDb = new Database(oldPath);
    oldDb.pragma("journal_mode = WAL");

    const categories = oldDb.prepare("SELECT * FROM skill_categories").all() as any[];
    const i18n = oldDb.prepare("SELECT * FROM skill_category_i18n").all() as any[];
    const skills = oldDb.prepare("SELECT * FROM skills").all() as any[];
    const languages = oldDb.prepare("SELECT * FROM languages").all() as any[];

    const tx = db.transaction(() => {
      for (const c of categories) {
        db.prepare("INSERT OR IGNORE INTO skill_categories (id, color, sort_order) VALUES (?, ?, ?)").run(c.id, c.color, c.sort_order);
      }
      for (const i of i18n) {
        db.prepare("INSERT OR IGNORE INTO skill_category_i18n (category_id, lang, title, description) VALUES (?, ?, ?, ?)").run(i.category_id, i.lang, i.title, i.description);
      }
      for (const s of skills) {
        db.prepare("INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)").run(s.name, s.category_id, s.proficiency, s.sort_order);
      }
      for (const l of languages) {
        db.prepare("INSERT OR IGNORE INTO languages (lang, name) VALUES (?, ?)").run(l.lang, l.name);
      }
    });
    tx();
    oldDb.close();
    // console.log("[migration] Migrated skills.db → portfolio.db");
  } catch (e) {
    // console.warn("[migration] Failed to migrate skills.db:", e);
  }
}

function migrateFromGuestbookDb(db: Database.Database) {
  const oldPath = path.join(process.cwd(), "data", "guestbook.db");
  if (!fs.existsSync(oldPath)) return;

  try {
    const oldDb = new Database(oldPath);
    const rows = oldDb.prepare("SELECT id, author, message, created_at FROM guestbook_notes").all() as any[];

    const tx = db.transaction(() => {
      for (const r of rows) {
        db.prepare("INSERT OR IGNORE INTO guestbook_notes (id, author, message, created_at) VALUES (?, ?, ?, ?)").run(r.id, r.author, r.message, r.created_at);
      }
    });
    tx();
    oldDb.close();
    // console.log("[migration] Migrated guestbook.db → portfolio.db");
  } catch (e) {
    // console.warn("[migration] Failed to migrate guestbook.db:", e);
  }
}

function migrateFromVisitsDb(db: Database.Database) {
  const oldPath = path.join(process.cwd(), "data", "visits.db");
  if (!fs.existsSync(oldPath)) return;

  try {
    const oldDb = new Database(oldPath);
    const rows = oldDb.prepare("SELECT page, session_id, created_at FROM page_visits").all() as any[];

    const tx = db.transaction(() => {
      for (const r of rows) {
        db.prepare("INSERT OR IGNORE INTO page_visits (page, session_id, created_at) VALUES (?, ?, ?)").run(r.page, r.session_id, r.created_at);
      }
    });
    tx();
    oldDb.close();
    // console.log("[migration] Migrated visits.db → portfolio.db");
  } catch (e) {
    // console.warn("[migration] Failed to migrate visits.db:", e);
  }
}

function seedStaticData(db: Database.Database) {
  const profileData: Record<string, string> = {
    name: "Yuanle Yao",
    role: "Full-Stack Developer",
    tagline: "Building dynamic products with engineering rigor and design taste.",
    location_pool: JSON.stringify(["Hangzhou, CN", "Sydney, AU", "Remote / Hybrid"]),
    songs_pool: JSON.stringify([
      "Tycho - Awake",
      "Nujabes - Feather",
      "Daft Punk - Veridis Quo",
      "ODESZA - A Moment Apart",
    ]),
    stack: JSON.stringify([
      "HTML", "CSS", "Vue", "React", "SQL", "C++", "Java",
      "Python", "Swift", "PHP", "Git", "Cloud Computing",
      "Agile Project Management", "UE5", "Unity", "Maya",
    ]),
  };

  const experiencesData = [
    { year: "2018", title: "Study Abroad Start - Trinity College, Melbourne", description: "I arrived in Melbourne and began my study abroad life at Trinity College. In a new environment, I learned independent living, made new friends, and adapted to a different learning style.", note: "Keyword: adaptation and self-management", sort_order: 0 },
    { year: "2019", title: "Monash University - Bachelor of Information Technology", description: "I entered Monash University and started systematic software development learning. Coursework demanded strong self-learning and time management, which strengthened my engineering foundation.", note: "Keyword: software fundamentals and autonomy", sort_order: 1 },
    { year: "2020-2021", title: "Online Study During Pandemic", description: "During the pandemic, I continued online study from China. Although communication was harder, this period improved my consistency and focus on academic progress.", note: "Keyword: resilience and consistency", sort_order: 2 },
    { year: "2022", title: "Campus Return and Graduation Stage", description: "After returning to campus, I balanced graduation project pressure and team collaboration, improving my delivery capability under constraints.", note: "Keyword: delivery under pressure", sort_order: 3 },
    { year: "2023", title: "UTS Master Program - Software Development", description: "I moved from Melbourne to Sydney and began my master studies at UTS. New city context expanded my adaptability and product perspective.", note: "Keyword: advanced study and cross-city transition", sort_order: 4 },
    { year: "2024", title: "Internship + Personal Website Iteration", description: "While studying, I also worked on internship tasks and continued improving my personal website, integrating frontend, backend, and UX into one workflow.", note: "Keyword: full-stack practice", sort_order: 5 },
    { year: "2025", title: "Research Assistant - Zhejiang University", description: "Served as a research assistant at Zhejiang University, focusing on AI-vision related projects, model experimentation, and practical implementation support.", note: "Keyword: AI vision research", sort_order: 6 },
    { year: "2026", title: "Software Engineer - AI Negotiate Co., Ltd.", description: "Currently working at AI Negotiate Co., Ltd., participating in product development and technical implementation while continuing the V3 portfolio build.", note: "Keyword: current role and product engineering", sort_order: 7 },
  ];

  const projectsData = [
    { id: "smart-energy", title: "Smart Energy Manager", summary: "An energy-control concept for smart homes focused on visibility and predictive usage insights.", tags: "[\"Java\", \"SQL\", \"Cloud\"]", demo_url: "", repo_url: "", video_hint: "Hover to preview: usage dashboard and scenario simulation", claps: 0, time_period: "2024" },
    { id: "personal-web-v3", title: "Personal Web V3", summary: "A dynamic portfolio platform with interactive Bento layout, AI assistant, and visitor feedback loop.", tags: "[\"Next.js\", \"Tailwind\", \"Framer Motion\", \"API\"]", demo_url: "", repo_url: "", video_hint: "Hover to preview: Bento UI transitions + realtime counters", claps: 0, time_period: "2025-Present" },
    { id: "yolov5-detection", title: "YOLOv5 Detection Toolkit", summary: "Image and stream detection flow with planned custom-weight tuning and result visualization.", tags: "[\"Python\", \"YOLOv5\", \"Computer Vision\"]", demo_url: "", repo_url: "", video_hint: "Hover to preview: frame-by-frame detection overlays", claps: 0, time_period: "2025" },
  ];

  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(profileData)) {
      db.prepare("INSERT OR IGNORE INTO profile (key, value) VALUES (?, ?)").run(key, val);
    }
    for (const exp of experiencesData) {
      db.prepare("INSERT OR IGNORE INTO experiences (id, year, title, description, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)").run(
        crypto.randomUUID(), exp.year, exp.title, exp.description, exp.note ?? null, exp.sort_order,
      );
    }
    for (const proj of projectsData) {
      db.prepare("INSERT OR IGNORE INTO projects (id, title, summary, tags, demo_url, repo_url, video_hint, claps, time_period) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
        proj.id, proj.title, proj.summary, proj.tags, proj.demo_url, proj.repo_url, proj.video_hint, proj.claps, proj.time_period,
      );
    }
    db.prepare("INSERT OR IGNORE INTO guestbook_notes (id, author, message, created_at) VALUES (?, ?, ?, ?)").run(
      "seed-1", "Visitor", "This Bento layout feels modern and clean.", new Date().toISOString(),
    );
  });
  tx();

  // console.log("[migration] Seeded static data (profile, experiences, projects, guestbook)");
}


function seedSkillRelations(db: Database.Database) {
  // Check if already seeded
  const count = (db.prepare("SELECT COUNT(*) as c FROM project_skills").get() as { c: number }).c;
  if (count > 0) return;

  const tx = db.transaction(() => {
    // ── New skills (not in old skills.db seed) ──
    const addSkill = db.prepare("INSERT OR IGNORE INTO skills (name, category_id, proficiency, sort_order) VALUES (?, ?, ?, ?)");
    addSkill.run("TypeScript", "frontend", 80, 4);
    addSkill.run("Next.js", "frontend", 85, 5);
    addSkill.run("Tailwind", "frontend", 85, 6);
    addSkill.run("Computer Vision", "backend", 75, 6);
    addSkill.run("Figma", "tools", 70, 3);

    // ── Project skills ──
    const addProjSkill = db.prepare("INSERT OR IGNORE INTO project_skills (project_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");

    // personal-web-v3: React, TypeScript, SQL (2025-present)
    addProjSkill.run("personal-web-v3", "React", "frontend", 0);
    addProjSkill.run("personal-web-v3", "TypeScript", "frontend", 1);
    addProjSkill.run("personal-web-v3", "SQL", "backend", 2);

    // smart-energy: Figma (2024)
    addProjSkill.run("smart-energy", "Figma", "tools", 0);

    // yolov5-detection: Python, Vue (2025)
    addProjSkill.run("yolov5-detection", "Python", "backend", 0);
    addProjSkill.run("yolov5-detection", "Vue", "frontend", 1);

    // ── Experience skills ──
    const addExpSkill = db.prepare("INSERT OR IGNORE INTO experience_skills (experience_id, skill_name, category_id, sort_order) VALUES (?, ?, ?, ?)");
    const getExpId = db.prepare("SELECT id FROM experiences WHERE year = ? LIMIT 1");

    // 2026: Software Engineer
    const exp2026 = getExpId.get("2026") as { id: string } | undefined;
    if (exp2026) {
      addExpSkill.run(exp2026.id, "React", "frontend", 0);
      addExpSkill.run(exp2026.id, "TypeScript", "frontend", 1);
      addExpSkill.run(exp2026.id, "Next.js", "frontend", 2);
      addExpSkill.run(exp2026.id, "SQL", "backend", 3);
    }

    // 2025: Research Assistant
    const exp2025 = getExpId.get("2025") as { id: string } | undefined;
    if (exp2025) {
      addExpSkill.run(exp2025.id, "Python", "backend", 0);
      addExpSkill.run(exp2025.id, "Computer Vision", "backend", 1);
      addExpSkill.run(exp2025.id, "Vue", "frontend", 2);
    }

    // 2024: Internship + Website
    const exp2024 = getExpId.get("2024") as { id: string } | undefined;
    if (exp2024) {
      addExpSkill.run(exp2024.id, "React", "frontend", 0);
      addExpSkill.run(exp2024.id, "Vue", "frontend", 1);
      addExpSkill.run(exp2024.id, "Git", "tools", 2);
      addExpSkill.run(exp2024.id, "Figma", "tools", 3);
    }

    // 2023: UTS Master
    const exp2023 = getExpId.get("2023") as { id: string } | undefined;
    if (exp2023) {
      addExpSkill.run(exp2023.id, "Java", "backend", 0);
      addExpSkill.run(exp2023.id, "Python", "backend", 1);
      addExpSkill.run(exp2023.id, "SQL", "backend", 2);
    }
  });
  tx();
  // console.log("[migration] Seeded skill relations (5 new skills, 6 project links, 14 experience links)");
}

function seedAdminUser(db: Database.Database) {
  const existing = db.prepare("SELECT COUNT(*) as c FROM admin_users").get() as { c: number };
  if (existing.c > 0) return;

  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    // console.warn("[migration] ADMIN_PASSWORD not set — admin user not created. Set it in .env.local or Vercel env vars.");
    return;
  }

  const bcrypt = require("bcryptjs");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare("INSERT OR IGNORE INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)").run(
    crypto.randomUUID(), "admin", hash,
  );
  // console.log("[migration] Admin user seeded");
}
function migrateI18nTables(db: Database.Database) {
  // Ensure i18n tables exist for DBs initialized before these were added to initSchema
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_i18n (
      project_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      video_hint TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (project_id, lang),
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS experience_i18n (
      experience_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (experience_id, lang),
      FOREIGN KEY (experience_id) REFERENCES experiences(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS skill_i18n (
      name TEXT NOT NULL,
      category_id TEXT NOT NULL,
      lang TEXT NOT NULL,
      display_name TEXT NOT NULL,
      PRIMARY KEY (name, category_id, lang),
      FOREIGN KEY (name, category_id) REFERENCES skills(name, category_id) ON DELETE CASCADE
    );
  `);
}

function seedI18nData(db: Database.Database) {
  const count = (db.prepare("SELECT COUNT(*) as c FROM project_i18n").get() as { c: number }).c;
  if (count > 0) return;

  const tx = db.transaction(() => {
    const insP = db.prepare("INSERT OR IGNORE INTO project_i18n (project_id, lang, title, summary, video_hint) VALUES (?, ?, ?, ?, ?)");
    const insE = db.prepare("INSERT OR IGNORE INTO experience_i18n (experience_id, lang, title, description, note) VALUES (?, ?, ?, ?, ?)");

    // ── Project i18n ──
    const getPid = db.prepare("SELECT id FROM projects WHERE id = ?");

    // personal-web-v3
    if (getPid.get("personal-web-v3")) {
      insP.run("personal-web-v3", "zh", "个人主页", "这是我的个人主页，基于 VUE 架构构建。我相信这个网站可以帮助你更好地了解我。", "链接：暂未发布");
    }
    // smart-energy
    if (getPid.get("smart-energy")) {
      insP.run("smart-energy", "zh", "智能用电管理", "该项目致力于打造更可控的智能家居用电系统，未来将结合 AI 帮助用户更直观地了解自发电收益与支出。", "链接：暂未发布");
    }
    // yolov5-detection
    if (getPid.get("yolov5-detection")) {
      insP.run("yolov5-detection", "zh", "基于 YOLOv5 的图像检测", "该项目用于实时图像或视频流检测，当前可检测上传图像，后续将支持权重参数调节和视频流检测。", "链接：未完成");
    }

    // ── Experience i18n ──
    const getEid = db.prepare("SELECT id FROM experiences WHERE year = ? LIMIT 1");
    const experienceZh = [
      { year: "2018", title: "留学起点 - 墨尔本 Trinity College", description: "2018 年我来到墨尔本，开启留学生活。在陌生环境里逐步适应独立生活、结识新朋友，并完成学习方式的转变。", note: "关键词：适应力与自我管理" },
      { year: "2019", title: "莫纳什大学 - 信息技术本科阶段", description: "进入莫纳什大学后，我开始系统学习软件开发。课程更强调自主学习和时间管理，这一阶段夯实了我的工程基础。", note: "关键词：软件基础与自主学习" },
      { year: "2020-2021", title: "疫情阶段线上学习", description: "疫情期间我主要在中国进行线上课程。虽然沟通不便，但这段经历提升了我的专注度、持续性和自律能力。", note: "关键词：韧性与持续性" },
      { year: "2022", title: "回归校园与毕业阶段", description: "回到校园后，我在毕业项目压力下继续推进团队协作与项目交付，进一步提升了在约束条件下的执行能力。", note: "关键词：压力下交付" },
      { year: "2023", title: "UTS 软件开发硕士阶段", description: "2023 年我从墨尔本搬到悉尼，在悉尼科技大学继续软件开发方向硕士学习，适应新城市并拓展产品视角。", note: "关键词：进阶学习与跨城转变" },
      { year: "2024", title: "实习 + 个人主页持续迭代", description: "在继续学习的同时，我进行实习并持续更新个人网站，把前端、后端与用户体验更完整地串联起来。", note: "关键词：全栈实战" },
      { year: "2025", title: "浙江大学研究助理", description: "在浙江大学担任研究助理，研究方向为 AI 视觉相关项目，参与模型实验、效果评估与工程化支持。", note: "关键词：AI 视觉研究" },
      { year: "2026", title: "智慧沟通有限公司 - 软件工程岗位", description: "目前就职于智慧沟通有限公司，参与产品研发与技术落地，同时持续推进个人主页 V3 的迭代。", note: "关键词：在职状态与工程实践" },
    ];
    for (const zh of experienceZh) {
      const row = getEid.get(zh.year) as { id: string } | undefined;
      if (row) {
        insE.run(row.id, "zh", zh.title, zh.description, zh.note);
      }
    }
  });
  tx();
  // console.log("[migration] Seeded i18n data (project_i18n, experience_i18n)");
}

