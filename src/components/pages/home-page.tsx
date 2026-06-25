"use client";

import "@/app/home.css";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { LiveStatus } from "@/types/portfolio";
import { Language } from "@/lib/i18n";
import { useHydratedLanguage } from "@/lib/use-hydrated-language";

const initialStatus: LiveStatus = {
  availability: "Loading...",
  currentFocus: "Loading...",
  responseTime: "Loading...",
  location: "Loading...",
  timestamp: "",
};

export function HomePage({ serverLang }: { serverLang: Language }) {
  const { m, lang, mounted } = useHydratedLanguage(serverLang);

  const [status, setStatus] = useState<LiveStatus>(initialStatus);
  const [visitCount, setVisitCount] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    const response = await fetch(`/api/status?lang=${lang}`);
    if (!response.ok) return;
    setStatus((await response.json()) as LiveStatus);
  }, [lang]);

  useEffect(() => {
    // Defer initial fetch to avoid blocking TBT
    const bootTimer = setTimeout(() => { void fetchStatus(); }, 300);
    const timer = setInterval(fetchStatus, 20000);
    return () => { clearTimeout(bootTimer); clearInterval(timer); };
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
          if (typeof data.count === "number") setVisitCount(data.count);
          sessionStorage.setItem(pageVisitedKey, "1");
          return;
        }
      }
      const countResponse = await fetch(`/api/visits?page=${page}`);
      if (countResponse.ok) {
        const countData = (await countResponse.json()) as { count?: number };
        if (typeof countData.count === "number") setVisitCount(countData.count);
      }
    };
    // Defer visit counter sync to avoid blocking TBT
    const timer = setTimeout(() => { void syncVisitCounter(); }, 300);
    return () => clearTimeout(timer);
  }, []);

  const exploreLinks = [
    { href: "/skills", title: m.home.links[0]?.title ?? "Skills", desc: m.home.links[0]?.desc ?? "" },
    { href: "/experience", title: m.home.links[1]?.title ?? "Experience", desc: m.home.links[1]?.desc ?? "" },
    { href: "/projects", title: m.home.links[2]?.title ?? "Projects", desc: m.home.links[2]?.desc ?? "" },
    { href: "/lab", title: m.home.links[3]?.title ?? "Lab", desc: m.home.links[3]?.desc ?? "" },
  ];

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="hero" id="hero">
                <div className="hero-bg-word" id="hero-bg-word">YAO</div>
        <div className="hero-content">
          <div className="hero-left">
            <h1>Yuanle<br /><span className="line2">Yao</span></h1>
            <p className="role">
              {m.home.tagline}
            </p>
          </div>
          <div className="hero-right">
            <span className="hero-stat"><span className="dot" /> {status.availability}</span>
            <span className="hero-stat">📍 {status.location}</span>
            <span className="hero-stat">⚡ {status.currentFocus}</span>
          </div>
        </div>
        <div className="scroll-indicator" id="scroll-indicator">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* ═══ EXPLORE SECTION ═══ */}
      <section className="explore-section">
        <div className="explore-header reveal" data-reveal>
          <h2>Explore</h2>
          <span className="explore-updated">
            {mounted && status.timestamp ? new Date(status.timestamp).toLocaleTimeString() : "--:--:--"}
          </span>
        </div>
        <div className="explore-links reveal-stagger" data-reveal>
          {exploreLinks.map((link, i) => (
            <Link key={link.href} href={link.href} className="explore-link">
              <div className="el-num">0{i + 1}</div>
              <div>
                <h3>{link.title}</h3>
                <p>{link.desc}</p>
              </div>
              <span className="el-arrow">→</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="visit-counter">
        <span>{lang === "zh" ? "总访问量" : "Total Visits"}</span>
        <strong>{visitCount ?? "--"}</strong>
      </div>
    </>
  );
}
