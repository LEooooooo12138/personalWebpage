"use client";

import { useEffect, useState } from "react";

type TypewriterProps = {
  lines: readonly string[];
};

export function Typewriter({ lines }: TypewriterProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = lines[lineIndex] ?? "";
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          const next = current.slice(0, text.length + 1);
          setText(next);
          if (next === current) {
            setTimeout(() => setDeleting(true), 900);
          }
        } else {
          const next = current.slice(0, Math.max(0, text.length - 1));
          setText(next);
          if (next.length === 0) {
            setDeleting(false);
            setLineIndex((prev) => (prev + 1) % lines.length);
          }
        }
      },
      deleting ? 45 : 65,
    );

    return () => clearTimeout(timeout);
  }, [deleting, lineIndex, lines, text.length]);

  return (
    <p className="typewriter">
      {text}
      <span className="caret">|</span>
    </p>
  );
}
