"use client";

import { profile, baseProjects } from "@/lib/portfolio-data";
import { useEffect, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

const skillCategoryMap = {
  frontend: ["HTML", "CSS", "Vue", "React"],
  backend: ["SQL", "C++", "Java", "Python", "Swift", "PHP"],
  tools: ["Git", "Cloud Computing", "Agile Project Management"],
  game: ["UE5", "Unity", "Maya"],
} as const;

type SkillCategory = keyof typeof skillCategoryMap;

function getCategoryLabel(cat: SkillCategory, categories: { title: string; content: string }[]) {
  const index: Record<SkillCategory, number> = { frontend: 0, backend: 1, tools: 2, game: 3 };
  return categories[index[cat]]?.title ?? cat;
}

function categoryFromLabel(label: string, categories: { title: string; content: string }[]): SkillCategory | null {
  const map: Record<string, SkillCategory> = {
    "Front-End": "frontend", "前端": "frontend",
    "Back-End": "backend", "后端": "backend",
    General: "tools", "通用能力": "tools",
    "Basic Familiarity": "game", "基础了解": "game",
  };
  return map[label] ?? null;
}

export function SkillsPage({ serverLang }: { serverLang: Language }) {
  const { m: ctxM, lang: ctxLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const m = mounted ? ctxM : messages[serverLang];
  const lang = mounted ? ctxLang : serverLang;

  const [terminalMode, setTerminalMode] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([m.skills.terminalHint]);
  const [terminalInput, setTerminalInput] = useState("");

  const localizedLanguages = lang === "zh" ? ["中文（母语）", "英文（专业工作能力）"] : profile.languages;

  const pushOutput = (history: string[], lines: string[]) => {
    history.push(...lines);
    return history.slice(-25);
  };

  const runTerminalCommand = (input: string) => {
    const command = input.trim();
    if (!command) return;
    let nextHistory = [...terminalHistory, `> ${command}`];

    if (command === "help") {
      nextHistory.push(m.skills.terminalHelp);
    } else if (command === "whoami") {
      nextHistory.push(`${profile.name} / ${profile.role}`);
    } else if (command === "clear") {
      setTerminalHistory([m.skills.terminalCleared]);
      setTerminalInput("");
      return;
    } else if (command === "ls skills") {
      const lines: string[] = ["─── Skills by Category ───"];
      for (const [cat, skills] of Object.entries(skillCategoryMap)) {
        const label = getCategoryLabel(cat as SkillCategory, m.skills.categories);
        lines.push(`[${label}]`);
        lines.push(skills.join("  "));
      }
      nextHistory = pushOutput(nextHistory, lines);
    } else if (command.startsWith("ls ")) {
      const arg = command.slice(3).trim();
      const cat = skillCategoryMap[arg as SkillCategory]
        ? (arg as SkillCategory)
        : categoryFromLabel(arg, m.skills.categories);
      if (cat) {
        const label = getCategoryLabel(cat, m.skills.categories);
        nextHistory = pushOutput(nextHistory, [`[${label}]`, skillCategoryMap[cat].join("  ")]);
      } else if (arg === "projects") {
        const lines = ["─── Projects ───"];
        for (const p of baseProjects) lines.push(`${p.id}: ${p.title}`);
        nextHistory = pushOutput(nextHistory, lines);
      } else {
        nextHistory.push(m.skills.terminalUnknown);
      }
    } else if (command === "cat languages.txt") {
      nextHistory.push(localizedLanguages.join("  |  "));
    } else if (command === "cat experience") {
      const lines = ["─── Experience Timeline ───"];
      for (const item of m.experience.items) lines.push(`${item.year} | ${item.title}`);
      nextHistory = pushOutput(nextHistory, lines);
    } else {
      nextHistory.push(m.skills.terminalUnknown);
    }
    setTerminalHistory(nextHistory.slice(-25));
    setTerminalInput("");
  };

  const categories = m.skills.categories;

  return (
    <section className="skills-page" id="skills">
      <div className="skills-bg" id="skills-bg-word">skills</div>

      <div className="skills-grid-col reveal-stagger" data-reveal>
        <div className="col">
          <div className="skill-card">
            <div className="num">01</div>
            <h3><em>{categories[0]?.title ?? "Front-End"}</em></h3>
            <p>Polished interfaces with thoughtful animation. Pixel‑perfect implementation that feels alive.</p>
            <div className="skill-tags">{skillCategoryMap.frontend.map((s) => <span key={s} className="hl">{s}</span>)}</div>
          </div>
        </div>
        <div className="col">
          <div className="skill-card">
            <div className="num">02</div>
            <h3><em>{categories[1]?.title ?? "Back-End"}</em></h3>
            <p>Robust APIs, database architecture, and server‑side systems. From SQL schema design to cloud deployment.</p>
            <div className="skill-tags">{skillCategoryMap.backend.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        </div>
        <div className="col">
          <div className="skill-card">
            <div className="num">03</div>
            <h3><em>{categories[2]?.title ?? "General"}</em></h3>
            <p>Git, cloud computing, and agile workflows — the foundational practices that make engineering teams ship.</p>
            <div className="skill-tags">{skillCategoryMap.tools.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        </div>
        <div className="col">
          <div className="skill-card">
            <div className="num">04</div>
            <h3><em>{categories[3]?.title ?? "Game &amp; 3D"}</em></h3>
            <p>Real‑time engines and digital creation — where technical skill meets visual storytelling.</p>
            <div className="skill-tags">{skillCategoryMap.game.map((s) => <span key={s}>{s}</span>)}</div>
          </div>
        </div>
      </div>

      {/* Languages row */}
      <div className="skills-grid-col reveal" data-reveal style={{ marginTop: "2rem" }}>
        <div className="col full">
          <div className="skill-card">
            <div className="num" style={{ fontSize: "2rem", color: "var(--text-muted)" }}>{lang === "zh" ? "语言" : "Languages"}</div>
            <div className="skill-tags">
              {localizedLanguages.map((l) => <span key={l} className="hl">{l}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* Terminal toggle */}
      <div className="reveal" data-reveal style={{ marginTop: "2rem" }}>
        <button
          onClick={() => setTerminalMode((v) => !v)}
          style={{
            border: "1px solid var(--border)", background: "none",
            padding: "0.4rem 0.9rem", cursor: "pointer",
            fontFamily: "var(--mono)", fontSize: "0.82rem",
            color: "var(--text-soft)", transition: "color 0.3s, border-color 0.3s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--gold)"; e.currentTarget.style.borderColor = "var(--gold)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-soft)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          {terminalMode ? m.skills.uiMode : m.skills.terminalMode}
        </button>
      </div>

      {terminalMode && (
        <div className="skills-terminal">
          {terminalHistory.map((line, i) => <div key={`${line}-${i}`}>{line}</div>)}
          <form onSubmit={(e) => { e.preventDefault(); runTerminalCommand(terminalInput); }}>
            <span>&gt;</span>
            <input value={terminalInput} onChange={(e) => setTerminalInput(e.target.value)} placeholder="ls skills" />
          </form>
        </div>
      )}
    </section>
  );
}
