"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { HeroScene } from "@/components/hero-scene";
import { Typewriter } from "@/components/typewriter";
import { LiveStatus } from "@/types/portfolio";
import { useLanguage } from "@/components/language-provider";

const initialStatus: LiveStatus = {
  availability: "Loading...",
  currentFocus: "Loading...",
  responseTime: "Loading...",
  location: "Loading...",
  timestamp: new Date().toISOString(),
};

export function HomePage() {
  const { m, lang } = useLanguage();
  const [status, setStatus] = useState<LiveStatus>(initialStatus);

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`/api/status?lang=${lang}`);
    if (!response.ok) return;
    setStatus((await response.json()) as LiveStatus);
  }, [lang]);

  useEffect(() => {
    const bootTimer = setTimeout(() => {
      void fetchStatus();
    }, 0);
    const timer = setInterval(fetchStatus, 20000);
    return () => {
      clearTimeout(bootTimer);
      clearInterval(timer);
    };
  }, [fetchStatus]);

  return (
    <section className="layout-grid">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card hero-card"
      >
        <p className="eyebrow">{m.home.eyebrow}</p>
        <Typewriter lines={m.home.typeLines} />
        <p className="description">{m.home.tagline}</p>
        <div className="status-grid">
          <div className="chip">
            <strong>{m.home.availability}:</strong> {status.availability}
          </div>
          <div className="chip">
            <strong>{m.home.focus}:</strong> {status.currentFocus}
          </div>
          <div className="chip">
            <strong>{m.home.response}:</strong> {status.responseTime}
          </div>
          <div className="chip">
            <strong>{m.home.location}:</strong> {status.location}
          </div>
        </div>
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="card scene-card"
      >
        <HeroScene />
      </motion.article>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="card wide"
      >
        <div className="title-row">
          <h2>{m.home.exploreTitle}</h2>
          <span className="hint">
            {m.home.updated} {new Date(status.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="projects">
          {m.home.links.map((item) => (
            <Link key={item.href} href={item.href} className="project-card">
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </Link>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
