/**
 * Unified bilingual static data — single source of truth for portfolio content.
 * Replaces DB/JSON imports for production; all content lives in code.
 */
import type {
  SkillsResponse,
  SkillCategory,
  SkillWithUsage,
  Project,
  ProjectSkill,
  ExperienceNode,
  UsedInRef,
  UsedInExpRef,
} from "@/types/portfolio";

// ═══════════════════════════════════════════════
//  Profile
// ═══════════════════════════════════════════════

export const PROFILE = {
  name: "Yuanle Yao",
  role: "Full-Stack Developer",
  tagline: "Building dynamic products with engineering rigor and design taste.",
  locationPool: ["Hangzhou, CN", "Sydney, AU", "Remote / Hybrid"],
  songsPool: [
    "Tycho - Awake",
    "Nujabes - Feather",
    "Daft Punk - Veridis Quo",
    "ODESZA - A Moment Apart",
  ],
  stack: [
    "HTML", "CSS", "Vue", "React", "SQL", "C++", "Java", "Python",
    "Swift", "PHP", "Git", "Cloud Computing", "Agile Project Management",
    "UE5", "Unity", "Maya",
  ],
} as const;

// ═══════════════════════════════════════════════
//  Languages
// ═══════════════════════════════════════════════

export const LANGUAGES = {
  en: ["English (Professional)", "Mandarin (Native)"],
  zh: ["中文（母语）", "英文（专业工作能力）"],
} as const;

// ═══════════════════════════════════════════════
//  Projects (bilingual)
// ═══════════════════════════════════════════════

export type ProjectEntry = Project & {
  skills: ProjectSkill[];
  zh_title: string;
  zh_summary: string;
  zh_videoHint: string;
};

export const PROJECTS: Record<string, ProjectEntry[]> = {
  en: [
    {
      id: "personal-web-v3",
      title: "Personal Webpage",
      summary:
        "A personal portfolio showcasing projects, skills, and experience — built with Next.js, React, TypeScript, and Tailwind.",
      tags: ["Next.js", "React", "TypeScript", "Tailwind", "Three.js", "Framer Motion"],
      demoUrl: "https://www.yaoyuanle.top",
      repoUrl: "https://github.com/LEooooooo12138/personalWebpage",
      videoHint: "View source code on GitHub",
      claps: 0,
      timePeriod: "2025-Present",
      skills: [
        { name: "React", category: "Front-End", color: "gold" },
        { name: "TypeScript", category: "Front-End", color: "gold" },
        { name: "SQL", category: "Back-End", color: "terracotta" },
      ],
      zh_title: "个人主页",
      zh_summary: "这是我的个人主页，基于 VUE 架构构建。我相信这个网站可以帮助你更好地了解我。",
      zh_videoHint: "链接：暂未发布",
    },
    {
      id: "smart-energy",
      title: "Smart Energy Manager",
      summary:
        "An energy-control concept for smart homes focused on visibility and predictive usage insights.",
      tags: ["Java", "SQL", "Cloud"],
      demoUrl: "",
      repoUrl: "",
      videoHint: "Hover to preview: usage dashboard and scenario simulation",
      claps: 0,
      timePeriod: "2024",
      skills: [
        { name: "Figma", category: "Tools & Workflow", color: "sage" },
      ],
      zh_title: "智能用电管理",
      zh_summary:
        "该项目致力于打造更可控的智能家居用电系统，未来将结合 AI 帮助用户更直观地了解自发电收益与支出。",
      zh_videoHint: "链接：暂未发布",
    },
    {
      id: "yolov5-detection",
      title: "YOLOv5 Detection Toolkit",
      summary:
        "Image and stream detection flow with planned custom-weight tuning and result visualization.",
      tags: ["Python", "YOLOv5", "Computer Vision"],
      demoUrl: "",
      repoUrl: "",
      videoHint: "Hover to preview: frame-by-frame detection overlays",
      claps: 0,
      timePeriod: "2025",
      skills: [
        { name: "Python", category: "Back-End", color: "terracotta" },
        { name: "Vue", category: "Front-End", color: "gold" },
      ],
      zh_title: "基于 YOLOv5 的图像检测",
      zh_summary:
        "该项目用于实时图像或视频流检测，当前可检测上传图像，后续将支持权重参数调节和视频流检测。",
      zh_videoHint: "链接：未完成",
    },
  ],
  zh: [] as ProjectEntry[], // populated below
};

// Derive zh from en (same metadata, different i18n fields)
PROJECTS.zh = PROJECTS.en.map((p) => ({
  ...p,
  title: p.zh_title,
  summary: p.zh_summary,
  videoHint: p.zh_videoHint,
}));

// ═══════════════════════════════════════════════
//  Experiences (bilingual)
// ═══════════════════════════════════════════════

export type ExperienceEntry = ExperienceNode & {
  id: string;
  skills: ProjectSkill[];
  zh_title: string;
  zh_description: string;
  zh_note: string;
};

export const EXPERIENCES: Record<string, ExperienceEntry[]> = {
  en: [
    {
      id: "5360363e-1aa1-4706-b97d-54c0aacb2bdc",
      year: "2018",
      title: "Study Abroad Start - Trinity College, Melbourne",
      description:
        "I arrived in Melbourne and began my study abroad life at Trinity College. In a new environment, I learned independent living, made new friends, and adapted to a different learning style.",
      note: "Keyword: adaptation and self-management",
      skills: [],
      zh_title: "留学起点 - 墨尔本 Trinity College",
      zh_description:
        "2018 年我来到墨尔本，开启留学生活。在陌生环境里逐步适应独立生活、结识新朋友，并完成学习方式的转变。",
      zh_note: "关键词：适应力与自我管理",
    },
    {
      id: "70663fb9-1aae-4d1f-9789-f918e51b40b5",
      year: "2019",
      title: "Monash University - Bachelor of Information Technology",
      description:
        "I entered Monash University and started systematic software development learning. Coursework demanded strong self-learning and time management, which strengthened my engineering foundation.",
      note: "Keyword: software fundamentals and autonomy",
      skills: [],
      zh_title: "莫纳什大学 - 信息技术本科阶段",
      zh_description:
        "进入莫纳什大学后，我开始系统学习软件开发。课程更强调自主学习和时间管理，这一阶段夯实了我的工程基础。",
      zh_note: "关键词：软件基础与自主学习",
    },
    {
      id: "074b8e66-81fa-4d3a-b735-c31f82da1a5f",
      year: "2020-2021",
      title: "Online Study During Pandemic",
      description:
        "During the pandemic, I continued online study from China. Although communication was harder, this period improved my consistency and focus on academic progress.",
      note: "Keyword: resilience and consistency",
      skills: [],
      zh_title: "疫情阶段线上学习",
      zh_description:
        "疫情期间我主要在中国进行线上课程。虽然沟通不便，但这段经历提升了我的专注度、持续性和自律能力。",
      zh_note: "关键词：韧性与持续性",
    },
    {
      id: "16b11c03-c726-4f9a-85f1-d377aa4ca045",
      year: "2022",
      title: "Campus Return and Graduation Stage",
      description:
        "After returning to campus, I balanced graduation project pressure and team collaboration, improving my delivery capability under constraints.",
      note: "Keyword: delivery under pressure",
      skills: [],
      zh_title: "回归校园与毕业阶段",
      zh_description:
        "回到校园后，我在毕业项目压力下继续推进团队协作与项目交付，进一步提升了在约束条件下的执行能力。",
      zh_note: "关键词：压力下交付",
    },
    {
      id: "d7027326-dc31-45d3-9d8a-f4526b23f98d",
      year: "2023",
      title: "UTS Master Program - Software Development",
      description:
        "I moved from Melbourne to Sydney and began my master studies at UTS. New city context expanded my adaptability and product perspective.",
      note: "Keyword: advanced study and cross-city transition",
      skills: [
        { name: "Java", category: "Back-End", color: "terracotta" },
        { name: "Python", category: "Back-End", color: "terracotta" },
        { name: "SQL", category: "Back-End", color: "terracotta" },
      ],
      zh_title: "UTS 软件开发硕士阶段",
      zh_description:
        "2023 年我从墨尔本搬到悉尼，在悉尼科技大学继续软件开发方向硕士学习，适应新城市并拓展产品视角。",
      zh_note: "关键词：进阶学习与跨城转变",
    },
    {
      id: "5f523865-8f8d-4d35-a457-d9f5c8ea14f0",
      year: "2024",
      title: "Internship + Personal Website Iteration",
      description:
        "While studying, I also worked on internship tasks and continued improving my personal website, integrating frontend, backend, and UX into one workflow.",
      note: "Keyword: full-stack practice",
      skills: [
        { name: "React", category: "Front-End", color: "gold" },
        { name: "Vue", category: "Front-End", color: "gold" },
        { name: "Git", category: "Tools & Workflow", color: "sage" },
        { name: "Figma", category: "Tools & Workflow", color: "sage" },
      ],
      zh_title: "实习 + 个人主页持续迭代",
      zh_description:
        "在继续学习的同时，我进行实习并持续更新个人网站，把前端、后端与用户体验更完整地串联起来。",
      zh_note: "关键词：全栈实战",
    },
    {
      id: "7b2511fe-c7c9-4fa2-ad61-7054ae2e383f",
      year: "2025",
      title: "Research Assistant - Zhejiang University",
      description:
        "Served as a research assistant at Zhejiang University, focusing on AI-vision related projects, model experimentation, and practical implementation support.",
      note: "Keyword: AI vision research",
      skills: [
        { name: "Python", category: "Back-End", color: "terracotta" },
        { name: "Computer Vision", category: "Back-End", color: "terracotta" },
        { name: "Vue", category: "Front-End", color: "gold" },
      ],
      zh_title: "浙江大学研究助理",
      zh_description:
        "在浙江大学担任研究助理，研究方向为 AI 视觉相关项目，参与模型实验、效果评估与工程化支持。",
      zh_note: "关键词：AI 视觉研究",
    },
    {
      id: "fd17ffdd-347c-4827-a7d7-ceae44dfb720",
      year: "2026",
      title: "Software Engineer - AI Negotiate Co., Ltd.",
      description:
        "Currently working at AI Negotiate Co., Ltd., participating in product development and technical implementation while continuing the V3 portfolio build.",
      note: "Keyword: current role and product engineering",
      skills: [
        { name: "React", category: "Front-End", color: "gold" },
        { name: "TypeScript", category: "Front-End", color: "gold" },
        { name: "Next.js", category: "Front-End", color: "gold" },
        { name: "SQL", category: "Back-End", color: "terracotta" },
      ],
      zh_title: "智慧沟通有限公司 - 软件工程岗位",
      zh_description:
        "目前就职于智慧沟通有限公司，参与产品研发与技术落地，同时持续推进个人主页 V3 的迭代。",
      zh_note: "关键词：在职状态与工程实践",
    },
  ],
  zh: [] as ExperienceEntry[],
};

EXPERIENCES.zh = EXPERIENCES.en.map((e) => ({
  ...e,
  title: e.zh_title,
  description: e.zh_description,
  note: e.zh_note,
}));

// ═══════════════════════════════════════════════
//  Skill → project/experience refs (for used_in)
// ═══════════════════════════════════════════════

/** Maps skill name → which projects use it */
function buildProjectRefs(): Map<string, UsedInRef[]> {
  const map = new Map<string, UsedInRef[]>();
  for (const proj of PROJECTS.en) {
    for (const skill of proj.skills) {
      if (!map.has(skill.name)) map.set(skill.name, []);
      map.get(skill.name)!.push({
        id: proj.id,
        title: proj.title,
        summary: proj.summary,
        time_period: proj.timePeriod,
      });
    }
  }
  return map;
}

/** Maps skill display name (zh) → which projects use it */
function buildProjectRefsZh(projRefsEn: Map<string, UsedInRef[]>): Map<string, UsedInRef[]> {
  const map = new Map<string, UsedInRef[]>();
  for (const proj of PROJECTS.zh) {
    for (const skill of proj.skills) {
      if (!map.has(skill.name)) map.set(skill.name, []);
      map.get(skill.name)!.push({
        id: proj.id,
        title: proj.title,
        summary: proj.summary,
        time_period: proj.timePeriod,
      });
    }
  }
  // Also copy over from en for skills that have the same name (no i18n change)
  for (const [name, refs] of projRefsEn) {
    if (!map.has(name)) map.set(name, refs);
  }
  return map;
}

/** Maps skill name → which experiences use it */
function buildExperienceRefs(): Map<string, UsedInExpRef[]> {
  const map = new Map<string, UsedInExpRef[]>();
  for (const exp of EXPERIENCES.en) {
    for (const skill of exp.skills) {
      if (!map.has(skill.name)) map.set(skill.name, []);
      map.get(skill.name)!.push({
        id: exp.id,
        year: exp.year,
        title: exp.title,
        description: exp.description,
      });
    }
  }
  return map;
}

function buildExperienceRefsZh(): Map<string, UsedInExpRef[]> {
  const map = new Map<string, UsedInExpRef[]>();
  for (const exp of EXPERIENCES.zh) {
    for (const skill of exp.skills) {
      if (!map.has(skill.name)) map.set(skill.name, []);
      map.get(skill.name)!.push({
        id: exp.id,
        year: exp.year,
        title: exp.title,
        description: exp.description,
      });
    }
  }
  return map;
}

// ═══════════════════════════════════════════════
//  Skills with usage — bilingual
// ═══════════════════════════════════════════════

type SkillDef = {
  name: string;
  zh_name?: string;
};

type CategoryDef = {
  id: string;
  color: string;
  en_title: string;
  zh_title: string;
  en_description: string;
  zh_description: string;
  skills: SkillDef[];
};

const CATEGORY_DEFS: CategoryDef[] = [
  {
    id: "frontend",
    color: "gold",
    en_title: "Front-End",
    zh_title: "前端",
    en_description:
      "Polished interfaces with thoughtful animation. Pixel‑perfect implementation that feels alive.",
    zh_description: "精致的界面与细腻的动效，像素级还原设计稿。",
    skills: [
      { name: "HTML" },
      { name: "CSS" },
      { name: "Vue" },
      { name: "React" },
      { name: "TypeScript" },
      { name: "Next.js" },
      { name: "Tailwind" },
    ],
  },
  {
    id: "backend",
    color: "terracotta",
    en_title: "Back-End",
    zh_title: "后端",
    en_description:
      "Robust APIs, database architecture, and server‑side systems. From SQL schema design to cloud deployment.",
    zh_description: "稳健的 API、数据库架构与服务端系统。从 SQL 表设计到云端部署。",
    skills: [
      { name: "SQL" },
      { name: "C++" },
      { name: "Java" },
      { name: "Python" },
      { name: "Swift" },
      { name: "PHP" },
      { name: "Computer Vision", zh_name: "计算机视觉" },
    ],
  },
  {
    id: "tools",
    color: "sage",
    en_title: "Tools & Workflow",
    zh_title: "工具与流程",
    en_description:
      "Git, cloud computing, and agile workflows — the foundational practices that make engineering teams ship.",
    zh_description: "Git、云计算与敏捷开发——支撑工程团队交付的基础实践。",
    skills: [
      { name: "Git" },
      { name: "Cloud Computing", zh_name: "云计算" },
      { name: "Agile Project Management", zh_name: "敏捷项目管理" },
      { name: "Figma" },
    ],
  },
  {
    id: "game",
    color: "gold",
    en_title: "Game & 3D",
    zh_title: "游戏与 3D",
    en_description:
      "Real‑time engines and digital creation — where technical skill meets visual storytelling.",
    zh_description: "实时引擎与数字创作——技术与视觉叙事的交汇点。",
    skills: [
      { name: "UE5" },
      { name: "Unity" },
      { name: "Maya" },
    ],
  },
  {
    id: "ai",
    color: "terracotta",
    en_title: "AI Capabilities",
    zh_title: "AI 能力",
    en_description:
      "Deep learning, speech, and transformer-based models — pushing the boundary of intelligent systems.",
    zh_description: "深度学习、语音与 Transformer 模型——探索智能系统的边界。",
    skills: [
      { name: "CNN", zh_name: "卷积神经网络" },
      { name: "Transformer", zh_name: "Transformer 架构" },
      { name: "ASR", zh_name: "语音识别" },
      { name: "TTS", zh_name: "语音合成" },
      { name: "Vibe Coding" },
    ],
  },
];

// Build resolved SkillsResponse per language
const _projRefsEn = buildProjectRefs();
const _expRefsEn = buildExperienceRefs();
const _projRefsZh = buildProjectRefsZh(_projRefsEn);
const _expRefsZh = buildExperienceRefsZh();

function buildSkillsResponse(
  lang: "en" | "zh",
  projRefs: Map<string, UsedInRef[]>,
  expRefs: Map<string, UsedInExpRef[]>,
): SkillsResponse {
  const categories: SkillCategory[] = CATEGORY_DEFS.map((cat) => ({
    id: cat.id,
    color: cat.color,
    title: lang === "zh" ? cat.zh_title : cat.en_title,
    description: lang === "zh" ? cat.zh_description : cat.en_description,
    skills: cat.skills.map((skill): SkillWithUsage => {
      const displayName = lang === "zh" ? (skill.zh_name || skill.name) : skill.name;
      return {
        name: displayName,
        used_in: {
          projects: projRefs.get(skill.name) || [],
          experiences: expRefs.get(skill.name) || [],
        },
      };
    }),
  }));

  return {
    categories,
    languages: LANGUAGES[lang] as unknown as string[],
  };
}

const _SKILLS_EN = buildSkillsResponse("en", _projRefsEn, _expRefsEn);
const _SKILLS_ZH = buildSkillsResponse("zh", _projRefsZh, _expRefsZh);

// ═══════════════════════════════════════════════
//  Public API
// ═══════════════════════════════════════════════

export function getSkills(lang: string): SkillsResponse {
  return lang === "zh" ? _SKILLS_ZH : _SKILLS_EN;
}

export function getSkillsWithUsage(lang: string): SkillsResponse {
  // same as getSkills since usage data is built-in
  return getSkills(lang);
}

export function getProjects(lang: string): Project[] {
  return (PROJECTS[lang] || PROJECTS.en) as Project[];
}

export function getProjectsWithSkills(lang: string): (Project & { skills: ProjectSkill[] })[] {
  return (PROJECTS[lang] || PROJECTS.en) as (Project & { skills: ProjectSkill[] })[];
}

export function getProject(
  id: string,
  lang: string = "en",
): (Project & { zh_title?: string; zh_summary?: string; zh_videoHint?: string }) | undefined {
  const source = PROJECTS.en; // always use en as base for ids
  return source.find((p) => p.id === id) as any;
}

export function getExperiences(
  lang: string,
): (ExperienceNode & { id: string; skills?: ProjectSkill[] })[] {
  return (EXPERIENCES[lang] || EXPERIENCES.en) as any;
}

export function getProfile(): Record<string, string> {
  return {
    name: PROFILE.name,
    role: PROFILE.role,
    tagline: PROFILE.tagline,
    location_pool: JSON.stringify(PROFILE.locationPool),
    songs_pool: JSON.stringify(PROFILE.songsPool),
    stack: JSON.stringify(PROFILE.stack),
  };
}
