"use client";

import { Project } from "@/types/portfolio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";

export function ProjectsPage({ serverLang }: { serverLang: Language }) {
  const { m: ctxM } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const m = mounted ? ctxM : messages[serverLang];

  const [projects, setProjects] = useState<Project[]>([]);
  const clapTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects");
    if (!response.ok) return;
    setProjects((await response.json()) as Project[]);
  }, []);

  useEffect(() => {
    const bootTimer = setTimeout(() => { void fetchProjects(); }, 0);
    return () => clearTimeout(bootTimer);
  }, [fetchProjects]);

  const sendClap = useCallback(async (projectId: string, amount = 1) => {
    await fetch(`/api/projects/${projectId}/clap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    fetchProjects();
  }, [fetchProjects]);

  const startClapBurst = (projectId: string) => {
    void sendClap(projectId, 1);
    clapTimer.current = setInterval(() => { void sendClap(projectId, 1); }, 150);
  };
  const stopClapBurst = () => {
    if (clapTimer.current) { clearInterval(clapTimer.current); clapTimer.current = null; }
  };

  const totalClaps = useMemo(() => projects.reduce((sum, p) => sum + p.claps, 0), [projects]);

  return (
    <section className="projects-page" id="projects">
      <div className="proj-header reveal" data-reveal>
        <div className="num-lg">{String(projects.length).padStart(2, "0")}</div>
        <h2>{m.projects.title}</h2>
      </div>

      <div className="reveal-stagger" data-reveal>
        {projects.map((project, i) => {
          const localProject = m.projects.byId[project.id as keyof typeof m.projects.byId];
          const num = String(i + 1).padStart(2, "0");
          return (
            <div key={project.id} className="proj-row">
              <div className="pr-num">{num}</div>
              <div className="pr-info">
                <h3>{localProject?.title ?? project.title}</h3>
                <p>{localProject?.summary ?? project.summary}</p>
                <div className="pr-tags">
                  {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
                </div>
                <div className="proj-claps">
                  {m.projects.clap} {project.claps}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <button
                  className="proj-clap-btn"
                  onPointerDown={() => startClapBurst(project.id)}
                  onPointerUp={stopClapBurst}
                  onPointerLeave={stopClapBurst}
                  onClick={() => void sendClap(project.id, 1)}
                >
                  {m.projects.clap}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="proj-header reveal" data-reveal style={{ marginTop: "4rem" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: "0.82rem", color: "var(--text-muted)" }}>
          {m.projects.claps}: {totalClaps}
        </span>
      </div>
    </section>
  );
}
