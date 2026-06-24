"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const COLOR_VARS: Record<string, string> = {
  gold: "var(--gold)",
  terracotta: "var(--terracotta)",
  sage: "var(--sage)",
};

const COLOR_LIGHT: Record<string, string> = {
  gold: "var(--gold-light)",
  terracotta: "var(--terracotta-light)",
  sage: "var(--sage-light)",
};

export function SkillTag({
  name,
  color = "gold",
  size = "md",
  category,
}: {
  name: string;
  color?: string;
  size?: "sm" | "md";
  category?: string;
}) {
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (hovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: Math.max(8, rect.left),
        zIndex: 9999,
      });
      const t = setTimeout(() => setVisible(true), 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [hovered]);

  const accent = COLOR_VARS[color] || COLOR_VARS.gold;
  const lightAccent = COLOR_LIGHT[color] || COLOR_LIGHT.gold;
  const sizeClass =
    size === "sm"
      ? "text-[11px] px-2.5 py-0.5"
      : "text-xs px-2.5 py-1";

  return (
    <>
      <span
        ref={ref}
        className={`skill-tag-inline ${sizeClass}`}
        style={{
          background: lightAccent,
          color: accent,
          border: `1px solid ${accent}66`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className="skill-tag-dot" style={{ background: accent }} />
        {name}
      </span>
      {hovered &&
        createPortal(
          <div
            style={popupStyle}
            className={`skill-tag-popup ${visible ? "skill-tag-popup--visible" : ""}`}
          >
            <div className="skill-tag-popup-name" style={{ color: accent }}>
              {name}
            </div>
            {category && (
              <div className="skill-tag-popup-cat">{category}</div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
