"use client";

import { useEffect, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import { SkillsResponse } from "@/types/portfolio";

// ── Color mapping: DB color key → CSS variable ──
const COLOR_VARS: Record<string, string> = {
  gold: "var(--gold)",
  terracotta: "var(--terracotta)",
  sage: "var(--sage)",
};

function getColorVar(colorKey: string): string {
  return COLOR_VARS[colorKey] ?? "var(--gold)";
}

export function SkillsPage({
  serverLang,
  skillsData,
}: {
  serverLang: Language;
  skillsData: SkillsResponse;
}) {
  const { m: ctxM, lang: ctxLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const m = mounted ? ctxM : messages[serverLang];
  const lang = mounted ? ctxLang : serverLang;

  // ── Accordion state ──
  const [expandedId, setExpandedId] = useState<string | null>(null);

/*
  // ── Terminal mode ──
  const [terminalMode, setTerminalMode] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([
    m.skills.terminalHint,
  ]);
  const [terminalInput, setTerminalInput] = useState("");

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
      nextHistory.push("Yuanle Yao / Full-Stack Developer");
    } else if (command === "clear") {
      setTerminalHistory([m.skills.terminalCleared]);
      setTerminalInput("");
      return;
    } else if (command === "ls skills") {
      const lines: string[] = ["─── Skills by Category ───"];
      for (const cat of skillsData.categories) {
        lines.push(`[${cat.title}]`);
        lines.push(cat.skills.join("  "));
      }
      nextHistory = pushOutput(nextHistory, lines);
    } else if (command.startsWith("ls ")) {
      const arg = command.slice(3).trim();
      const cat = skillsData.categories.find(
        (c) => c.id === arg || c.title.toLowerCase() === arg.toLowerCase()
      );
      if (cat) {
        nextHistory = pushOutput(nextHistory, [
          `[${cat.title}]`,
          cat.skills.join("  "),
        ]);
      } else if (arg === "projects") {
        const lines = ["─── Projects ───"];
        lines.push(
          "smart-energy: Smart Energy Manager",
          "personal-web-v3: Personal Web V3",
          "yolov5-detection: YOLOv5 Detection Toolkit"
        );
        nextHistory = pushOutput(nextHistory, lines);
      } else {
        nextHistory.push(m.skills.terminalUnknown);
      }
    } else if (command === "cat languages.txt") {
      nextHistory.push(skillsData.languages.join("  |  "));
    } else if (command === "cat experience") {
      const lines = ["─── Experience Timeline ───"];
      const expItems = messages[lang].experience.items;
      for (const item of expItems) {
        lines.push(`${item.year} | ${item.title}`);
      }
      nextHistory = pushOutput(nextHistory, lines);
    } else {
      nextHistory.push(m.skills.terminalUnknown);
    }
    setTerminalHistory(nextHistory.slice(-25));
    setTerminalInput("");
  };
  */

  const { categories, languages } = skillsData;
  const langLabel = lang === "zh" ? "语言" : "Languages";

  return (
    <section className="skills-page" id="skills">
      <div className="skills-bg" id="skills-bg-word">
        skills
      </div>

      {/* ── Header ── */}
      <div className="skills-header reveal" data-reveal>
        <h2>
          <em>{m.skills.title}</em>
        </h2>
        <p className="skills-subtitle">
          {lang === "zh"
            ? "点击类别展开详情"
            : "Click a category to expand details"}
        </p>
      </div>

      {/* ── Category Accordion ── */}
      <div className="skills-accordion reveal-stagger" data-reveal>
        {categories.map((cat) => {
          const isOpen = expandedId === cat.id;
          const accent = getColorVar(cat.color);

          return (
            <div
              key={cat.id}
              className={`skills-row ${isOpen ? "open" : ""}`}
              style={{ "--accent": accent } as React.CSSProperties}
            >
              {/* Collapsed header (always visible) */}
              <button
                className="skills-row-header"
                onClick={() =>
                  setExpandedId(isOpen ? null : cat.id)
                }
                aria-expanded={isOpen}
              >
                <span className="skills-row-dot" />
                <span className="skills-row-title">{cat.title}</span>
                <span className="skills-row-tags">
                  {cat.skills.map((s, i) => (
                    <span key={s}>
                      {i > 0 && <span className="skills-tag-sep">·</span>}
                      <span className="skills-tag">{s}</span>
                    </span>
                  ))}
                </span>
                <span className="skills-row-chevron">
                  {isOpen ? "▲" : "▶"}
                </span>
              </button>

              {/* Expanded body */}
              <div
                className="skills-row-body"
                style={{
                  maxHeight: isOpen ? "600px" : "0px",
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div className="skills-row-inner">
                  {cat.description && (
                    <p className="skills-row-desc">{cat.description}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Languages Row ── */}
      <div className="skills-lang reveal" data-reveal>
        <span className="skills-lang-label">{langLabel}</span>
        <span className="skills-lang-list">
          {languages.map((l, i) => (
            <span key={l}>
              {i > 0 && <span className="skills-tag-sep">·</span>}
              <span className="skills-tag hl">{l}</span>
            </span>
          ))}
        </span>
      </div>

{/* Terminal mode temporarily disabled */}
    </section>
  );
}
