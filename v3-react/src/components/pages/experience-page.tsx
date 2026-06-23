"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Language, messages } from "@/lib/i18n";
import { useLanguage } from "@/components/language-provider";
import { narrativeEn, narrativeZh } from "@/lib/experience-narrative";

const NS = { narrativeEn, narrativeZh };

const tickBase: React.CSSProperties = {
  position: "absolute", left: "50%", transform: "translate(-50%, -50%)",
  width: 5, height: 5, borderRadius: "50%",
  background: "var(--text-muted, #999)",
  transition: "background 0.3s, box-shadow 0.3s, width 0.3s, height 0.3s",
  zIndex: 2,
};
const tickActive: React.CSSProperties = {
  ...tickBase, background: "var(--gold, #c49b3f)", width: 7, height: 7,
  boxShadow: "0 0 6px rgba(196,155,63,0.5)",
};

function parseKeywords(note?: string): string[] {
  if (!note) return [];
  const cleaned = note.replace(/^Keyword:\s*/i, "").replace(/^关键词：\s*/, "");
  return cleaned.split(/[,，、&]\s*/).filter(Boolean).map((s) => s.trim());
}

export function ExperiencePage({ serverLang }: { serverLang: Language }) {
  const { m: ctxM, lang: ctxLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ticks, setTicks] = useState<number[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const itemEls = useRef<(HTMLDivElement | null)[]>([]);
  const rafId = useRef(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const container = itemsRef.current;
    if (!container) return;
    const items = itemEls.current.filter(Boolean) as HTMLDivElement[];
    if (items.length === 0) return;

    const update = () => {
      const viewH = window.innerHeight;
      let active = -1;
      for (let i = items.length - 1; i >= 0; i--) {
        if (items[i].getBoundingClientRect().top < viewH * 0.5) { active = i; break; }
      }
      setActiveIndex(active);
      const containerH = container.offsetHeight;
      const newTicks = items.map((el) => (el.offsetTop + el.offsetHeight / 2) / (containerH || 1));
      setTicks((prev) =>
        prev.length === newTicks.length && prev.every((v, idx) => Math.abs(v - newTicks[idx]) < 0.001)
          ? prev : newTicks
      );
      setProgress(active >= 0 ? (newTicks[active] ?? 0) : 0);
    };

    let running = true;
    const loop = () => { if (!running) return; update(); rafId.current = requestAnimationFrame(loop); };
    rafId.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafId.current); };
  }, [mounted]);

  const toggle = useCallback((i: number) => {
    setExpanded((prev) => (prev === i ? null : i));
  }, []);

  const m = mounted ? ctxM : messages[serverLang];
  const lang = mounted ? ctxLang : serverLang;
  const narratives = lang === "zh" ? NS.narrativeZh : NS.narrativeEn;
  const narMap = new Map(narratives.map((n) => [n.year, n]));

  const years = m.experience.items.map((item) => item.year);
  const firstYear = years[0] ?? "2018";
  const lastYear = years[years.length - 1] ?? "2026";

  return (
    <section className="exp-page" id="experience">
      <div className="exp-header reveal" data-reveal>
        <div className="exp-year-lg">{firstYear}→{lastYear}</div>
        <div className="exp-subtitle">{m.experience.subtitle}</div>
      </div>

      <div className="exp-timeline-wrap" ref={itemsRef}>
        {mounted && (
          <div className="exp-progress" aria-hidden="true">
            <div className="exp-progress-track" />
            <div className="exp-progress-fill" style={{ height: `${progress * 100}%` }} />
            {ticks.map((pos, i) => (
              <div key={i} style={{ ...(activeIndex === i ? tickActive : tickBase), top: `${pos * 100}%` }} />
            ))}
            <div className="exp-progress-thumb" style={{ top: `${progress * 100}%` }} />
          </div>
        )}

        <div className="reveal-stagger" data-reveal>
          {m.experience.items.map((item, i) => {
            const keywords = parseKeywords(item.note);
            const nar = narMap.get(item.year);
            const hasDetail = !!(nar?.bullets.length || nar?.reflection);
            const isOpen = expanded === i;

            return (
              <div
                key={item.year}
                className={`exp-item${activeIndex === i ? " active" : ""}${isOpen ? " expanded" : ""}`}
                ref={(el) => { itemEls.current[i] = el; }}
                onClick={() => hasDetail && toggle(i)}
                role={hasDetail ? "button" : undefined}
                tabIndex={hasDetail ? 0 : undefined}
                onKeyDown={(e) => {
                  if (hasDetail && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(i); }
                }}
                aria-expanded={hasDetail ? isOpen : undefined}
              >
                <div className="ey">{item.year}</div>
                <div className="ec">
                  <h3>
                    {item.title}
                    {hasDetail ? <span className={`exp-chevron${isOpen ? " open" : ""}`}>▾</span> : null}
                  </h3>
                  <p>{item.description}</p>

                  {keywords.length > 0 && (
                    <div className="exp-tags">
                      {keywords.map((kw) => <span key={kw} className="exp-tag">{kw}</span>)}
                    </div>
                  )}

                  {hasDetail && nar && (
                    <div className="exp-detail">
                      <ul className="exp-bullets">
                        {nar.bullets.map((b, j) => <li key={j}>{b}</li>)}
                      </ul>

                      <div className="exp-snapshot">
                        <span>{nar.city}</span>
                        <span className="exp-snap-theme">{nar.theme}</span>
                        <span className="exp-snap-change">{nar.change}</span>
                      </div>

                      <blockquote className="exp-reflection">
                        <p>{nar.reflection}</p>
                      </blockquote>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
