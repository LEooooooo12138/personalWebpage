"use client";

import { useState, useRef, useEffect } from "react";

const COLOR_VARS: Record<string, string> = {
  gold: "var(--gold)",
  terracotta: "var(--terracotta)",
  sage: "var(--sage)",
};

export function SkillTag({
  name,
  color = "gold",
  size = "md",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md";
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (hovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPopupStyle({
        position: "fixed",
        top: rect.bottom + 6,
        left: rect.left,
        zIndex: 50,
      });
    }
  }, [hovered]);

  const accent = COLOR_VARS[color] || COLOR_VARS.gold;
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <>
      <span
        ref={ref}
        className={`skill-tag-inline inline-flex items-center gap-1 rounded-md font-medium cursor-default transition-colors ${sizeClass}`}
        style={{
          background: `${accent}18`,
          color: accent,
          border: `1px solid ${accent}33`,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span
          className="skill-dot rounded-full"
          style={{
            width: 6,
            height: 6,
            background: accent,
          }}
        />
        {name}
      </span>
      {hovered && (
        <div
          style={popupStyle}
          className="skill-tag-popup bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 shadow-xl"
        >
          <span style={{ color: accent }} className="font-semibold">{name}</span>
        </div>
      )}
    </>
  );
}
