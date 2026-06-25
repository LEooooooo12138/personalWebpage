"use client";

import { useEffect } from "react";

const ACT_PATTERNS = [
  "act(",
  "inside a test",
  "testing environment",
  "testing behaviour",
];

export function ConsoleSuppressor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;

    const originalError = console.error.bind(console);
    const originalWarn = console.warn.bind(console);

    const shouldSuppress = (msg: string): boolean => {
      return ACT_PATTERNS.some((p) => msg.includes(p));
    };

    console.error = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (shouldSuppress(msg)) return;
      originalError(...args);
    };

    console.warn = (...args: unknown[]) => {
      const msg = typeof args[0] === "string" ? args[0] : "";
      if (shouldSuppress(msg)) return;
      originalWarn(...args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}
