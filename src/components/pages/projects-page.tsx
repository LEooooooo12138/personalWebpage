"use client";

import { useCallback, useEffect, useState } from "react";
import { Language } from "@/lib/i18n";
import { useHydratedLanguage } from "@/lib/use-hydrated-language";
import { Project } from "@/types/portfolio";

export function ProjectsPage({ serverLang }: { serverLang: Language }) {
  const { m, lang, mounted } = useHydratedLanguage(serverLang);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects");
    if (!response.ok) return;
    setProjects((await response.json()) as Project[]);
  }, []);

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
        <p>想法在变，手感在变，每个项目都藏着一个思考的岔路口。</p>
      </div>

      <div className="proj-list reveal-stagger" data-reveal>
        {projects.map((project, index) => {
          const localized = byId[project.id as keyof typeof byId];
          const title = localized?.title ?? project.title;
          const summary = localized?.summary ?? project.summary;
          const videoHint = localized?.videoHint ?? project.videoHint;

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
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                  <span className="hint">{videoHint}</span>
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
