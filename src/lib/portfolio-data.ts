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
    year: "2018",
    title: "Study Abroad Start - Trinity College, Melbourne",
    description:
      "I arrived in Melbourne and began my study abroad life at Trinity College. In a new environment, I learned independent living, made new friends, and adapted to a different learning style.",
    note: "Keyword: adaptation and self-management",
  },
  {
    year: "2019",
    title: "Monash University - Bachelor of Information Technology",
    description:
      "I entered Monash University and started systematic software development learning. Coursework demanded strong self-learning and time management, which strengthened my engineering foundation.",
    note: "Keyword: software fundamentals and autonomy",
  },
  {
    year: "2020-2021",
    title: "Online Study During Pandemic",
    description:
      "During the pandemic, I continued online study from China. Although communication was harder, this period improved my consistency and focus on academic progress.",
    note: "Keyword: resilience and consistency",
  },
  {
    year: "2022",
    title: "Campus Return and Graduation Stage",
    description:
      "After returning to campus, I balanced graduation project pressure and team collaboration, improving my delivery capability under constraints.",
    note: "Keyword: delivery under pressure",
  },
  {
    year: "2023",
    title: "UTS Master Program - Software Development",
    description:
      "I moved from Melbourne to Sydney and began my master studies at UTS. New city context expanded my adaptability and product perspective.",
    note: "Keyword: advanced study and cross-city transition",
  },
  {
    year: "2024",
    title: "Internship + Personal Website Iteration",
    description:
      "While studying, I also worked on internship tasks and continued improving my personal website, integrating frontend, backend, and UX into one workflow.",
    note: "Keyword: full-stack practice",
  },
  {
    year: "2025",
    title: "Research Assistant - Zhejiang University",
    description:
      "Served as a research assistant at Zhejiang University, focusing on AI-vision related projects, model experimentation, and practical implementation support.",
    note: "Keyword: AI vision research",
  },
  {
    year: "2026",
    title: "Software Engineer - AI Negotiate Co., Ltd.",
    description:
      "Currently working at AI Negotiate Co., Ltd., participating in product development and technical implementation while continuing the V3 portfolio build.",
    note: "Keyword: current role and product engineering",
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
