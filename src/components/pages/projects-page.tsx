"use client";

import "@/app/projects.css";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Language } from "@/lib/i18n";
import { useHydratedLanguage } from "@/lib/use-hydrated-language";
import { Project, ProjectSkill } from "@/types/portfolio";
import { SkillTag } from "@/components/SkillTag";

const CLAP_STORAGE_KEY = "project_clapped";

/* ── Inline hand SVG ── */
function HandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3m0 0l2.7-6.3A2 2 0 0 1 11.5 3c.6 0 1.1.5 1.1 1.1V9h6.5a2 2 0 0 1 2 2l-1.7 8.5A2 2 0 0 1 17.5 22H7" />
    </svg>
  );
}

/* ── Particle ── */
interface Particle {
  id: number;
  projectId: string;
}

export function ProjectsPage({ serverLang }: { serverLang: Language }) {
  const { m, lang, mounted } = useHydratedLanguage(serverLang);
  const [projects, setProjects] = useState<(Project & { skills?: ProjectSkill[] })[]>([]);
  const [clapped, setClapped] = useState<Record<string, boolean>>({});
  const [particles, setParticles] = useState<Record<string, Particle[]>>({});
  const [animCounts, setAnimCounts] = useState<Record<string, boolean>>({});

  const particleId = useRef(0);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clappingId = useRef<string | null>(null);

  // Load clapped state from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLAP_STORAGE_KEY);
      if (raw) setClapped(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

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

  const spawnParticle = useCallback((projectId: string) => {
    const id = ++particleId.current;
    const p: Particle = { id, projectId };
    setParticles((prev) => ({
      ...prev,
      [projectId]: [...(prev[projectId] || []).slice(-4), p],
    }));
    setTimeout(() => {
      setParticles((prev) => ({
        ...prev,
        [projectId]: (prev[projectId] || []).filter((x) => x.id !== id),
      }));
    }, 650);
  }, []);

  const triggerCountAnim = useCallback((projectId: string) => {
    setAnimCounts((prev) => ({ ...prev, [projectId]: true }));
    setTimeout(() => {
      setAnimCounts((prev) => ({ ...prev, [projectId]: false }));
    }, 250);
  }, []);

  const doClap = useCallback(async (id: string) => {
    spawnParticle(id);
    triggerCountAnim(id);

    // Mark as clapped
    setClapped((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: true };
      try { localStorage.setItem(CLAP_STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });

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
  }, [spawnParticle, triggerCountAnim]);

  const handlePointerDown = useCallback((id: string) => {
    clappingId.current = id;
    doClap(id);
    holdRef.current = setInterval(() => doClap(id), 150);
  }, [doClap]);

  const handlePointerUp = useCallback(() => {
    clappingId.current = null;
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
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
          const localized = byId[project.id as keyof typeof byId];
          const title = project.title || localized?.title || "";
          const summary = project.summary || localized?.summary || "";
          const videoHint = project.videoHint || localized?.videoHint || "";
          const isClapped = clapped[project.id];

          return (
            <div key={project.id} className="proj-row">
              <span className="num">0{index + 1}</span>
              <div className="proj-content">
                <div className="proj-toprow">
                  <h3>{title}</h3>
                  <div className="proj-clap-area">
                    {(particles[project.id] || []).map((p) => (
                      <span key={p.id} className="clap-particle">+1</span>
                    ))}
                    <button
                      className={clsx("clap-btn", isClapped && "clapped")}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        handlePointerDown(project.id);
                      }}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      aria-label="Clap"
                    >
                      <span className={clsx("clap-icon", isClapped && "clapped")}>
                        <HandIcon />
                      </span>
                    </button>
                    <span className={clsx("clap-count", animCounts[project.id] && "bump")}>
                      {project.claps}
                    </span>
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
