"use client";

import { motion } from "framer-motion";
import { Project } from "@/types/portfolio";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/components/language-provider";

export function ProjectsPage() {
  const { m } = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const clapTimer = useRef<NodeJS.Timeout | null>(null);

  const fetchProjects = useCallback(async () => {
    const response = await fetch("/api/projects");
    if (!response.ok) return;
    setProjects((await response.json()) as Project[]);
  }, []);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      void fetchProjects();
    }, 0);
    return () => clearTimeout(bootTimer);
  }, [fetchProjects]);

  const sendClap = useCallback(
    async (projectId: string, amount = 1) => {
      await fetch(`/api/projects/${projectId}/clap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      fetchProjects();
    },
    [fetchProjects],
  );

  const startClapBurst = (projectId: string) => {
    void sendClap(projectId, 1);
    clapTimer.current = setInterval(() => {
      void sendClap(projectId, 1);
    }, 150);
  };

  const stopClapBurst = () => {
    if (clapTimer.current) {
      clearInterval(clapTimer.current);
      clapTimer.current = null;
    }
  };

  const totalClaps = useMemo(
    () => projects.reduce((sum, project) => sum + project.claps, 0),
    [projects],
  );

  return (
    <section className="layout-grid">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card wide"
      >
        <div className="title-row">
          <h2>{m.projects.title}</h2>
          <span className="chip">
            {m.projects.claps}: {totalClaps}
          </span>
        </div>
        <div className="projects">
          {projects.map((project) => {
            const localProject = m.projects.byId[project.id as keyof typeof m.projects.byId];
            return (
              <div key={project.id} className="project-card">
                <p className="video-hint">{localProject?.videoHint ?? project.videoHint}</p>
                <h3>{localProject?.title ?? project.title}</h3>
                <p>{localProject?.summary ?? project.summary}</p>
                <div className="tag-row">
                  {project.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-actions">
                  <button
                    onPointerDown={() => startClapBurst(project.id)}
                    onPointerUp={stopClapBurst}
                    onPointerLeave={stopClapBurst}
                    onClick={() => void sendClap(project.id, 1)}
                  >
                    {m.projects.clap} {project.claps}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.article>
    </section>
  );
}
