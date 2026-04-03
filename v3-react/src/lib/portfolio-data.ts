import { ExperienceNode, GuestNote, Project } from "@/types/portfolio";

export const profile = {
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
    "HTML",
    "CSS",
    "Vue",
    "React",
    "SQL",
    "C++",
    "Java",
    "Python",
    "Swift",
    "PHP",
    "Git",
    "Cloud Computing",
    "Agile Project Management",
    "UE5",
    "Unity",
    "Maya",
  ],
  languages: ["Mandarin (Native)", "English (Professional)"],
};

export const experiences: ExperienceNode[] = [
  {
    year: "2026",
    title: "V3 Personal Website (In Progress)",
    description:
      "Building a full-stack portfolio with Bento UI, real-time interactions, and AI-powered resume assistant.",
    repoHint: "github.com/LEooooooo12138/personalWebpage/tree/v3",
  },
  {
    year: "2024-2025",
    title: "Full-Stack Internship Projects",
    description:
      "Worked on APIs, dashboard features, and delivery pipelines with cross-functional team collaboration.",
    repoHint: "Commits and project docs available on request.",
  },
  {
    year: "2023",
    title: "UTS - Master Study in Software Development",
    description:
      "Advanced software engineering focus with practical product and architecture projects.",
    repoHint: "Course and project highlights can be mapped in this site.",
  },
];

export const baseProjects: Omit<Project, "claps">[] = [
  {
    id: "smart-energy",
    title: "Smart Energy Manager",
    summary:
      "An energy-control concept for smart homes focused on visibility and predictive usage insights.",
    tags: ["Java", "SQL", "Cloud"],
    demoUrl: "",
    repoUrl: "",
    videoHint: "Hover to preview: usage dashboard and scenario simulation",
  },
  {
    id: "personal-web-v3",
    title: "Personal Web V3",
    summary:
      "A dynamic portfolio platform with interactive Bento layout, AI assistant, and visitor feedback loop.",
    tags: ["Next.js", "Tailwind", "Framer Motion", "API"],
    demoUrl: "",
    repoUrl: "",
    videoHint: "Hover to preview: Bento UI transitions + realtime counters",
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
  },
];

export const initialGuestNotes: GuestNote[] = [
  {
    id: "seed-1",
    author: "Visitor",
    message: "This Bento layout feels modern and clean.",
    createdAt: new Date().toISOString(),
  },
];
