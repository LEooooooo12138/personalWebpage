"use client";

import { useCallback, useEffect, useState } from "react";
import { Language } from "@/lib/i18n";
import { useHydratedLanguage } from "@/lib/use-hydrated-language";
import { Project, ProjectSkill } from "@/types/portfolio";
import { SkillTag } from "@/components/SkillTag";

export function ProjectsPage({ serverLang }: { serverLang: Language }) {
  const { m, lang, mounted } = useHydratedLanguage(serverLang);
  const [projects, setProjects] = useState<(Project & { skills?: ProjectSkill[] })[]>([]);

  const fetchProjects = useCallback(async () => {
    const response = await fetch(`/api/projects?lang=${lang}`);
    if (!response.ok) return;
    setProjects((await response.json()) as (Project & { skills?: ProjectSkill[] })[]);
  }, [lang]);

  useEffect(() => {
    const bootTimer = setTimeout(() => { void fetchProjects(); }, 0);
    const timer = setInterval(fetchProjects, 15000);
    return () => { clearTimeout(bootTimer); clearInterval(timer); };
  }, [fetchProjects]);

  const clap = useCallback(async (id: string) => {
    const response = await fetch(`/api/projects/${id}/clap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 1 }),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { id: string; claps: number };
    setProjects((prev) =>
      prev.map((p) => (p.id === data.id ? { ...p, claps: data.claps } : p)),
    );
  }, []);

  const byId = m.projects?.byId ?? {};

  return (
    <section className="projects-page" id="projects">
      <div className="proj-header reveal" data-reveal>
        <h2>{m.projects.title}</h2>
        <p>{m.projects.subtitle}</p>
      </div>

      <div className="proj-list reveal-stagger" data-reveal>
        {projects.map((project, index) => {
          // API returns localized data from DB, with hardcoded byId as fallback
          const localized = byId[project.id as keyof typeof byId];
          const title = project.title || localized?.title || "";
          const summary = project.summary || localized?.summary || "";
          const videoHint = project.videoHint || localized?.videoHint || "";

          return (
            <div key={project.id} className="proj-row">
              <span className="num">0{index + 1}</span>
              <div className="proj-content">
                <div className="proj-toprow">
                  <h3>{title}</h3>
                  <div className="proj-clap-area">
                    <button className="clap-btn" onClick={() => clap(project.id)}>
                      👏
                    </button>
                    <span>{project.claps}</span>
                  </div>
                </div>
                <p className="summary">{summary}</p>
                <div className="proj-meta">
                  {(project.skills && project.skills.length > 0
                    ? project.skills
                    : project.tags.map((t) => ({ name: t, category: "", color: "gold" as const }))
                  ).map((skill) => (
                    <SkillTag
                      key={skill.name}
                      name={skill.name}
                      color={skill.color}
                      size="sm"
                      category={skill.category || undefined}
                    />
                  ))}
                  {project.repoUrl ? (
                    <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="hint hint-link">
                      {videoHint}
                    </a>
                  ) : (
                    <span className="hint">{videoHint}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {projects.length === 0 && (
          <div className="proj-row">
            <span className="num">—</span>
            <div className="proj-content">
              <h3>{lang === "zh" ? "项目加载中..." : "Loading projects..."}</h3>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
