/**
 * Claps counter — Blob Storage backend for Vercel.
 * Falls back to SQLite in local dev.
 */
import { list, put } from "@vercel/blob";
import { getPortfolioDb } from "@/lib/portfolio-db";
import { shouldUseBlob } from "@/lib/db-factory";

const CLAPS_PREFIX = "claps/projects/";

/* ── Blob backend ── */

async function getClapsFromBlob(id: string): Promise<number> {
  try {
    const result = await list({ prefix: `${CLAPS_PREFIX}${id}/`, limit: 1 });
    if (result.blobs.length > 0) {
      const response = await fetch(result.blobs[0].url, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { count: number };
        return data.count ?? 0;
      }
    }
  } catch {
    // Return 0 if blob not found
  }
  return 0;
}

async function incrementClapsInBlob(id: string): Promise<number> {
  const current = await getClapsFromBlob(id);
  const newCount = current + 1;
  await put(`${CLAPS_PREFIX}${id}/count.json`, JSON.stringify({ count: newCount, id }), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
  return newCount;
}

/* ── Public API ── */

export async function getClaps(id: string): Promise<number> {
  if (shouldUseBlob()) return getClapsFromBlob(id);

  const db = getPortfolioDb();
  const row = db.prepare("SELECT claps FROM projects WHERE id = ?").get(id) as { claps: number } | undefined;
  return row?.claps ?? 0;
}

export async function incrementClaps(id: string): Promise<number> {
  if (shouldUseBlob()) return incrementClapsInBlob(id);

  const db = getPortfolioDb();
  const result = db.prepare("UPDATE projects SET claps = claps + 1 WHERE id = ?").run(id);
  if (result.changes === 0) return 0;
  const row = db.prepare("SELECT claps FROM projects WHERE id = ?").get(id) as { claps: number };
  return row.claps;
}
