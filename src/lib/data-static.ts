/**
 * Static data access layer — all data is now code-level bilingual constants.
 * Previously used JSON imports + DB; now unified in portfolio-data.ts.
 */
export {
  getSkills,
  getSkillsWithUsage,
  getProjects,
  getProjectsWithSkills,
  getProject,
  getExperiences,
  getProfile,
} from "@/lib/portfolio-data";
