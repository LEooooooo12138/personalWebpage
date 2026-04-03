"use client";

import { motion } from "framer-motion";
import { profile } from "@/lib/portfolio-data";
import { useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function SkillsPage() {
  const { m, lang } = useLanguage();
  const [terminalMode, setTerminalMode] = useState(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([m.skills.terminalHint]);
  const [terminalInput, setTerminalInput] = useState("");

  const localizedLanguages =
    lang === "zh" ? ["中文（母语）", "英文（专业工作能力）"] : profile.languages;

  const runTerminalCommand = (input: string) => {
    const command = input.trim();
    if (!command) return;

    const nextHistory = [...terminalHistory, `> ${command}`];
    if (command === "help") {
      nextHistory.push(m.skills.terminalHelp);
    } else if (command === "ls skills") {
      nextHistory.push(profile.stack.join(" | "));
    } else if (command === "cat languages.txt") {
      nextHistory.push(localizedLanguages.join(" | "));
    } else if (command === "whoami") {
      nextHistory.push(`${profile.name} / ${profile.role}`);
    } else if (command === "clear") {
      setTerminalHistory([m.skills.terminalCleared]);
      setTerminalInput("");
      return;
    } else {
      nextHistory.push(m.skills.terminalUnknown);
    }

    setTerminalHistory(nextHistory.slice(-12));
    setTerminalInput("");
  };

  return (
    <section className="layout-grid" key={lang}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card wide"
      >
        <div className="title-row">
          <h2>{m.skills.title}</h2>
          <button className="ghost-btn" onClick={() => setTerminalMode((v) => !v)}>
            {terminalMode ? m.skills.uiMode : m.skills.terminalMode}
          </button>
        </div>
        {!terminalMode ? (
          <div className="skills-cloud">
            {profile.stack.map((skill) => (
              <span key={skill} className="skill-pill">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <div className="terminal">
            {terminalHistory.map((line, index) => (
              <div key={`${line}-${index}`}>{line}</div>
            ))}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                runTerminalCommand(terminalInput);
              }}
            >
              <span>&gt;</span>
              <input
                value={terminalInput}
                onChange={(event) => setTerminalInput(event.target.value)}
                placeholder="ls skills"
              />
            </form>
          </div>
        )}
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card wide"
      >
        <h2>{m.skills.categoriesTitle}</h2>
        <div className="projects">
          {m.skills.categories.map((item) => (
            <div key={item.title} className="project-card">
              <h3>{item.title}</h3>
              <p>{item.content}</p>
            </div>
          ))}
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="card"
      >
        <h2>{m.skills.languages}</h2>
        <div className="skills-cloud">
          {localizedLanguages.map((language) => (
            <span key={language} className="skill-pill">
              {language}
            </span>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
