"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/components/language-provider";

export function ExperiencePage() {
  const { m } = useLanguage();

  return (
    <section className="layout-grid">
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card wide"
      >
        <h2>{m.experience.title}</h2>
        <p className="hint">{m.experience.subtitle}</p>
        <div className="timeline">
          {m.experience.items.map((item) => (
            <div key={item.year} className="timeline-item">
              <p className="year">{item.year}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.note ? <p className="hint">{item.note}</p> : null}
            </div>
          ))}
        </div>
      </motion.article>
    </section>
  );
}
