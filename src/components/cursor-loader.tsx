"use client";

import dynamic from "next/dynamic";

const CursorScript = dynamic(
  () => import("@/components/cursor-script").then((mod) => ({ default: mod.CursorScript })),
  { ssr: false },
);

export function CursorLoader() {
  return <CursorScript />;
}
