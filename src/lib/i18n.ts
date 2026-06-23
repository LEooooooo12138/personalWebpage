export type Language = "en" | "zh";

type ExperienceItem = {
  year: string;
  title: string;
  description: string;
  note?: string;
};

type SkillCategory = {
  title: string;
  content: string;
};

export const messages = {
  en: {
    nav: {
      brand: "Yuanle Yao / V3",
      home: "Home",
      skills: "Skills",
      experience: "Experience",
      projects: "Projects",
      lab: "Lab",
      switch: "中文",
    },
    home: {
      eyebrow: "V3 / Personal Website",
      typeLines: [
        "Hi, I'm Yuanle Yao.",
        "Full-Stack Developer + Product Builder.",
        "Currently working at AI Negotiate Co., Ltd.",
      ],
      tagline:
        "A clean and friendly portfolio that highlights my work, background, and collaboration style.",
      availability: "Current Status",
      focus: "Current Focus",
      response: "Reply Speed",
      location: "Location",
      updated: "Updated",
      exploreTitle: "Explore by Section",
      links: [
        { href: "/skills", title: "Skills", desc: "Complete skill set and technical strengths." },
        {
          href: "/experience",
          title: "Experience",
          desc: "Full timeline from study abroad to current role.",
        },
        {
          href: "/projects",
          title: "Projects",
          desc: "Project descriptions aligned with my actual work.",
        },
        { href: "/lab", title: "Lab", desc: "AI assistant and visitor interaction space." },
      ],
    },
    skills: {
      title: "Skills",
      uiMode: "UI Mode",
      terminalMode: "Terminal Mode",
      terminalHint: "Type `help` to explore skills.",
      terminalHelp: "Available: ls skills | cat languages.txt | whoami | clear",
      terminalCleared: "Terminal cleared.",
      terminalUnknown: "Command not found.",
      languages: "Languages",
      categoriesTitle: "Detailed Skill Overview",
      categories: [
        { title: "Front-End", content: "HTML, CSS, Vue, React" },
        { title: "Back-End", content: "SQL, C++, Java, Python, Swift, PHP" },
        {
          title: "General",
          content: "Git, Cloud Computing, Enterprise-level Development, Agile Project Management",
        },
        { title: "Basic Familiarity", content: "UE5, Unity, Maya" },
      ] as SkillCategory[],
    },
    experience: {
      title: "Experience & Education Timeline",
      subtitle:
        "This section keeps the full history from the previous version and adds current updates.",
      items: [
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
      ] as ExperienceItem[],
    },
    projects: {
      title: "Project Gallery",
      claps: "Total claps",
      live: "Live",
      repo: "Repo",
      clap: "Clap",
      byId: {
        "personal-web-v3": {
          title: "Personal Webpage",
          summary:
            "This is my personal homepage, based on the VUE architecture. I believe this website can help you better understand me.",
          videoHint: "Link: Not uploaded for the time being",
        },
        "smart-energy": {
          title: "Electrical Manager",
          summary:
            "This project is dedicated to creating a more controllable system for smart homes, helping power control and future AI-assisted electricity revenue/expenditure insight.",
          videoHint: "Link: Not uploaded for the time being",
        },
        "yolov5-detection": {
          title: "Image detection based on YOLOv5",
          summary:
            "This project aims to use the YOLOv5 model for real-time image or video stream detection, with future support for parameter tuning and video stream detection.",
          videoHint: "Link: Incomplete",
        },
      },
    },
    lab: {
      chatTitle: "Chat with Me (AI Assistant)",
      chatHint: 'Try: "What is your stack?" / "Tell me about projects" / "Education?"',
      chatInput: "Ask something...",
      ask: "Ask",
      wallTitle: "Visitor Wall",
      name: "Name (optional)",
      message: "Leave a message...",
      send: "Send",
    },
    apiStatus: {
      availabilityOpen: "AI Negotiate Co., Ltd.",
      availabilityLater: "AI Negotiate Co., Ltd.",
      focusItems: [
        "Building product features at AI Negotiate Co., Ltd.",
        "Maintaining and iterating this personal website",
        "Continuing AI vision related technical exploration",
      ],
      responseTemplate: "Average response in {hours}h",
      locationPool: ["Hangzhou, China"],
    },
  },
  zh: {
    nav: {
      brand: "姚远乐 / V3",
      home: "首页",
      skills: "技能",
      experience: "经历",
      projects: "项目",
      lab: "实验室",
      switch: "EN",
    },
    home: {
      eyebrow: "V3 / 个人主页",
      typeLines: [
        "你好，我是姚远乐。",
        "全栈开发者 + 产品构建者。",
        "目前就职于智慧沟通有限公司。",
      ],
      tagline: "一个更简洁、友好的个人主页，用来清楚展示我的能力、经历与合作方式。",
      availability: "当前状态",
      focus: "正在做什么",
      response: "回复速度",
      location: "所在地",
      updated: "更新于",
      exploreTitle: "按模块浏览",
      links: [
        { href: "/skills", title: "技能", desc: "完整技能内容与技术优势展示。" },
        { href: "/experience", title: "经历", desc: "完整时间线，含最新工作与研究经历。" },
        { href: "/projects", title: "项目", desc: "项目文案与实际项目经历保持一致。" },
        { href: "/lab", title: "实验室", desc: "AI 助手与访客互动区域。" },
      ],
    },
    skills: {
      title: "技能",
      uiMode: "普通模式",
      terminalMode: "终端模式",
      terminalHint: "输入 `help` 查看可用命令。",
      terminalHelp: "可用命令: ls skills | cat languages.txt | whoami | clear",
      terminalCleared: "终端已清空。",
      terminalUnknown: "未识别的命令。",
      languages: "语言能力",
      categoriesTitle: "技能明细",
      categories: [
        { title: "前端", content: "HTML, CSS, Vue, React" },
        { title: "后端", content: "SQL, C++, Java, Python, Swift, PHP" },
        { title: "通用能力", content: "Git、云计算、企业级开发、敏捷项目管理" },
        { title: "基础了解", content: "UE5、Unity、Maya" },
      ] as SkillCategory[],
    },
    experience: {
      title: "经历与教育时间线",
      subtitle: "这里完整保留了旧版本的重要经历，并加入了最新状态更新。",
      items: [
        {
          year: "2018",
          title: "留学起点 - 墨尔本 Trinity College",
          description:
            "2018 年我来到墨尔本，开启留学生活。在陌生环境里逐步适应独立生活、结识新朋友，并完成学习方式的转变。",
          note: "关键词：适应力与自我管理",
        },
        {
          year: "2019",
          title: "莫纳什大学 - 信息技术本科阶段",
          description:
            "进入莫纳什大学后，我开始系统学习软件开发。课程更强调自主学习和时间管理，这一阶段夯实了我的工程基础。",
          note: "关键词：软件基础与自主学习",
        },
        {
          year: "2020-2021",
          title: "疫情阶段线上学习",
          description:
            "疫情期间我主要在中国进行线上课程。虽然沟通不便，但这段经历提升了我的专注度、持续性和自律能力。",
          note: "关键词：韧性与持续性",
        },
        {
          year: "2022",
          title: "回归校园与毕业阶段",
          description:
            "回到校园后，我在毕业项目压力下继续推进团队协作与项目交付，进一步提升了在约束条件下的执行能力。",
          note: "关键词：压力下交付",
        },
        {
          year: "2023",
          title: "UTS 软件开发硕士阶段",
          description:
            "2023 年我从墨尔本搬到悉尼，在悉尼科技大学继续软件开发方向硕士学习，适应新城市并拓展产品视角。",
          note: "关键词：进阶学习与跨城转变",
        },
        {
          year: "2024",
          title: "实习 + 个人主页持续迭代",
          description:
            "在继续学习的同时，我进行实习并持续更新个人网站，把前端、后端与用户体验更完整地串联起来。",
          note: "关键词：全栈实战",
        },
        {
          year: "2025",
          title: "浙江大学研究助理",
          description:
            "在浙江大学担任研究助理，研究方向为 AI 视觉相关项目，参与模型实验、效果评估与工程化支持。",
          note: "关键词：AI 视觉研究",
        },
        {
          year: "2026",
          title: "智慧沟通有限公司 - 软件工程岗位",
          description:
            "目前就职于智慧沟通有限公司，参与产品研发与技术落地，同时持续推进个人主页 V3 的迭代。",
          note: "关键词：在职状态与工程实践",
        },
      ] as ExperienceItem[],
    },
    projects: {
      title: "项目展示",
      claps: "累计点赞",
      live: "预览",
      repo: "仓库",
      clap: "点赞",
      byId: {
        "personal-web-v3": {
          title: "个人主页",
          summary: "这是我的个人主页，基于 VUE 架构构建。我相信这个网站可以帮助你更好地了解我。",
          videoHint: "链接：暂未发布",
        },
        "smart-energy": {
          title: "智能用电管理",
          summary:
            "该项目致力于打造更可控的智能家居用电系统，未来将结合 AI 帮助用户更直观地了解自发电收益与支出。",
          videoHint: "链接：暂未发布",
        },
        "yolov5-detection": {
          title: "基于 YOLOv5 的图像检测",
          summary:
            "该项目用于实时图像或视频流检测，当前可检测上传图像，后续将支持权重参数调节和视频流检测。",
          videoHint: "链接：未完成",
        },
      },
    },
    lab: {
      chatTitle: "和我对话（AI 助手）",
      chatHint: '示例: “你的技术栈是什么？” / “介绍一下项目” / “你的教育背景？”',
      chatInput: "输入问题...",
      ask: "提问",
      wallTitle: "访客留言墙",
      name: "称呼（可选）",
      message: "留下你的留言...",
      send: "发送",
    },
    apiStatus: {
      availabilityOpen: "目前就职于智慧沟通有限公司",
      availabilityLater: "目前就职于智慧沟通有限公司",
      focusItems: [
        "在智慧沟通有限公司参与产品研发",
        "持续维护并迭代个人主页 V3",
        "继续推进 AI 视觉相关技术研究",
      ],
      responseTemplate: "平均 {hours} 小时回复",
      locationPool: ["杭州，中国"],
    },
  },
} as const;

export const fallbackLang: Language = "en";
