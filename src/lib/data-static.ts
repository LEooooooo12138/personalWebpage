/**
 * Static data access layer — reads pre-exported JSON via bundler imports.
 * Used in production (Vercel) where SQLite is unavailable.
 */
import type { Project, ProjectSkill, SkillsResponse, ExperienceNode } from "@/types/portfolio";

import projectsEn from "@/data/projects-en.json";
import projectsZh from "@/data/projects-zh.json";
import skillsEn from "@/data/skills-en.json";
import skillsZh from "@/data/skills-zh.json";
import experiencesEn from "@/data/experiences-en.json";
import experiencesZh from "@/data/experiences-zh.json";
import profile from "@/data/profile.json";

const PROJECTS: Record<string, (Project & { skills: ProjectSkill[] })[]> = { en: projectsEn, zh: projectsZh };
const SKILLS: Record<string, SkillsResponse> = { en: skillsEn, zh: skillsZh };
const EXPERIENCES: Record<string, (ExperienceNode & { id: string; skills?: ProjectSkill[] })[]> = { en: experiencesEn, zh: experiencesZh };

/* ── Projects ── */

export function getProjects(lang: string): Project[] {
  return PROJECTS[lang] || PROJECTS.en;
}

export function getProjectsWithSkills(lang: string): (Project & { skills: ProjectSkill[] })[] {
  return PROJECTS[lang] || PROJECTS.en;
}

export function getProject(id: string, lang: string = "en"): (Project & { zh_title?: string; zh_summary?: string; zh_video_hint?: string }) | undefined {
  const data = PROJECTS[lang] || PROJECTS.en;
  return data.find((p) => p.id === id) as any;
}

/* ── Skills ── */

export function getSkills(lang: string): SkillsResponse {
  return SKILLS[lang] || SKILLS.en;
}

/* ── Experiences ── */

export function getExperiences(lang: string): (ExperienceNode & { id: string; skills?: ProjectSkill[] })[] {
  return EXPERIENCES[lang] || EXPERIENCES.en;
}

/* ── Profile ── */

export function getProfile(): Record<string, string> {
  return profile;
}
