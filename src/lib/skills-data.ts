/**
 * Static skills data — single source of truth for skills page.
 * Replaces skills-db.ts public reads; DB tables preserved for project/experience relations.
 */
import type { SkillsResponse } from "@/types/portfolio";

const DATA: Record<string, SkillsResponse> = {
  en: {
    categories: [
      {
        id: "frontend",
        color: "gold",
        title: "Front-End",
        description: "Polished interfaces with thoughtful animation. Pixel‑perfect implementation that feels alive.",
        skills: ["HTML", "CSS", "Vue", "React", "TypeScript", "Next.js", "Tailwind"],
      },
      {
        id: "backend",
        color: "terracotta",
        title: "Back-End",
        description: "Robust APIs, database architecture, and server‑side systems. From SQL schema design to cloud deployment.",
        skills: ["SQL", "C++", "Java", "Python", "Swift", "PHP", "Computer Vision"],
      },
      {
        id: "tools",
        color: "sage",
        title: "Tools & Workflow",
        description: "Git, cloud computing, and agile workflows — the foundational practices that make engineering teams ship.",
        skills: ["Git", "Cloud Computing", "Agile Project Management", "Figma"],
      },
      {
        id: "game",
        color: "gold",
        title: "Game & 3D",
        description: "Real‑time engines and digital creation — where technical skill meets visual storytelling.",
        skills: ["UE5", "Unity", "Maya"],
      },
      {
        id: "ai",
        color: "terracotta",
        title: "AI Capabilities",
        description: "Deep learning, speech, and transformer-based models — pushing the boundary of intelligent systems.",
        skills: ["CNN", "Transformer", "ASR", "TTS", "Vibe Coding"],
      },
    ],
    languages: ["Mandarin (Native)", "English (Professional)"],
  },
  zh: {
    categories: [
      {
        id: "frontend",
        color: "gold",
        title: "前端",
        description: "精致的界面与细腻的动效，像素级还原设计稿。",
        skills: ["HTML", "CSS", "Vue", "React", "TypeScript", "Next.js", "Tailwind"],
      },
      {
        id: "backend",
        color: "terracotta",
        title: "后端",
        description: "稳健的 API、数据库架构与服务端系统。从 SQL 表设计到云端部署。",
        skills: ["SQL", "C++", "Java", "Python", "Swift", "PHP", "计算机视觉"],
      },
      {
        id: "tools",
        color: "sage",
        title: "工具与流程",
        description: "Git、云计算与敏捷开发——支撑工程团队交付的基础实践。",
        skills: ["Git", "云计算", "敏捷项目管理", "Figma"],
      },
      {
        id: "game",
        color: "gold",
        title: "游戏与 3D",
        description: "实时引擎与数字创作——技术与视觉叙事的交汇点。",
        skills: ["UE5", "Unity", "Maya"],
      },
      {
        id: "ai",
        color: "terracotta",
        title: "AI 能力",
        description: "深度学习、语音与 Transformer 模型——探索智能系统的边界。",
        skills: ["卷积神经网络", "Transformer 架构", "语音识别", "语音合成", "Vibe Coding"],
      },
    ],
    languages: ["中文（母语）", "英文（专业工作能力）"],
  },
};

export function getSkills(lang: string): SkillsResponse {
  return DATA[lang] || DATA.en;
}
