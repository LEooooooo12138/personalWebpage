export type LiveStatus = {
  availability: string;
  currentFocus: string;
  responseTime: string;
  location: string;
  timestamp: string;
};

export type Project = {
  id: string;
  title: string;
  summary: string;
  tags: string[];        // deprecated but kept for backward compatibility
  skills?: ProjectSkill[];
  demoUrl: string;
  repoUrl: string;
  videoHint: string;
  claps: number;
};

export type ProjectSkill = {
  name: string;
  category: string;
  categoryId?: string;
  color: string;
};

export type UsedInRef = {
  id: string;
  title: string;
  summary?: string;
};

export type UsedInExpRef = {
  id: string;
  year: string;
  title: string;
  description?: string;
};

export type UsedIn = {
  projects: UsedInRef[];
  experiences: UsedInExpRef[];
};

export type SkillWithUsage = {
  name: string;
  used_in: UsedIn;
};

export type GuestNote = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

export type ExperienceNode = {
  year: string;
  title: string;
  description: string;
  note?: string;
  skills?: ProjectSkill[];
};

export type SkillCategory = {
  id: string;
  color: string;
  title: string;
  description: string;
  skills: (string | SkillWithUsage)[];
};

export type SkillsResponse = {
  categories: SkillCategory[];
  languages: string[];
};
