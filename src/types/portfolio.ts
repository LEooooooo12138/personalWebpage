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
  tags: string[];
  demoUrl: string;
  repoUrl: string;
  videoHint: string;
  claps: number;
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
};
