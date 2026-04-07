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
  const [visitCount, setVisitCount] = useState<number | null>(null);

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

  useEffect(() => {
    const page = "home";
    const sessionKey = "site_visit_session_id";
    const pageVisitedKey = `site_page_visited_${page}`;

    const ensureSessionId = () => {
      const existing = sessionStorage.getItem(sessionKey);
      if (existing) return existing;
      const id = crypto.randomUUID();
      sessionStorage.setItem(sessionKey, id);
      return id;
    };

    const syncVisitCounter = async () => {
      const sessionId = ensureSessionId();
      const visited = sessionStorage.getItem(pageVisitedKey) === "1";

      if (!visited) {
        const response = await fetch("/api/visits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page, sessionId }),
        });

        if (response.ok) {
          const data = (await response.json()) as { count?: number };
          if (typeof data.count === "number") {
            setVisitCount(data.count);
          }
          sessionStorage.setItem(pageVisitedKey, "1");
          return;
        }
      }

      const countResponse = await fetch(`/api/visits?page=${page}`);
      if (!countResponse.ok) return;
      const countData = (await countResponse.json()) as { count?: number };
      if (typeof countData.count === "number") {
        setVisitCount(countData.count);
      }
    };

    void syncVisitCounter();
  }, []);

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

      <div className="visit-counter">
        <span>{lang === "zh" ? "总访问量" : "Total Visits"}</span>
        <strong>{visitCount ?? "--"}</strong>
      </div>
    </section>
  );
}
