"use client";

import { useEffect, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import { SkillsResponse, SkillWithUsage } from "@/types/portfolio";

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
  const [usageData, setUsageData] = useState<SkillsResponse | null>(null);

  useEffect(() => {
    if (!mounted) return;
    fetch(`/api/skills?lang=${lang}&usage=1`)
      .then((r) => r.json())
      .then(setUsageData)
      .catch(() => {});
  }, [mounted, lang]);

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
                  {cat.skills.map((s, i) => {
                    const name = typeof s === "string" ? s : s.name;
                    return (
                      <span key={name}>
                        {i > 0 && <span className="skills-tag-sep">·</span>}
                        <span className="skills-tag">{name}</span>
                      </span>
                    );
                  })}
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
                  {usageData && isOpen && (
                    <div className="skills-usage-list">
                      {(() => {
                        const usageCat = usageData.categories.find((c) => c.id === cat.id);
                        if (!usageCat) return null;
                        return usageCat.skills.map((s) => {
                          if (typeof s === "string") return null;
                          const skillUsage = s as SkillWithUsage;
                          return (
                            <div key={skillUsage.name} className="skills-usage-row">
                              <span className="skills-usage-name">{skillUsage.name}</span>
                              <span className="skills-usage-info">
                                {skillUsage.used_in.projects.length > 0 && (
                                  <span title={skillUsage.used_in.projects.join(", ")}>
                                    📦 {skillUsage.used_in.projects.length} project{skillUsage.used_in.projects.length > 1 ? "s" : ""}
                                  </span>
                                )}
                                {skillUsage.used_in.experiences.length > 0 && (
                                  <span title={skillUsage.used_in.experiences.join(", ")}>
                                    {" · "}📋 {skillUsage.used_in.experiences.length} experience{skillUsage.used_in.experiences.length > 1 ? "s" : ""}
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        });
                      })()}
                    </div>
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
