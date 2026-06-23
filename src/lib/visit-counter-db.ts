import { list, put } from "@vercel/blob";
import { getSingletonDb, shouldUseBlob } from "@/lib/db-factory";

type VisitResult = {
  count: number;
  incremented: boolean;
};

const VISIT_PREFIX = "visits/pages/";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS page_visits (
    page TEXT NOT NULL,
    session_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (page, session_id)
  );
  CREATE INDEX IF NOT EXISTS idx_page_visits_page
  ON page_visits(page);
`;

const normalizePage = (page: string) =>
  page
    .toLowerCase()
    .replace(/[^a-z0-9/_-]/g, "-")
    .replace(/\/+/g, "/")
    .replace(/^-+|-+$/g, "") || "home";

const normalizeSessionId = (sessionId: string) =>
  sessionId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 64);

/* ── Blob 后端 ── */

const countPageFromBlob = async (page: string): Promise<number> => {
  let cursor: string | undefined;
  let count = 0;

  do {
    const result = await list({
      prefix: `${VISIT_PREFIX}${page}/`,
      cursor,
      limit: 1000,
    });
    count += result.blobs.length;
    cursor = result.hasMore ? result.cursor : undefined;
  } while (cursor);

  return count;
};

const recordBlobVisit = async (page: string, sessionId: string): Promise<VisitResult> => {
  const pathname = `${VISIT_PREFIX}${page}/${sessionId}.json`;
  let incremented = false;

  try {
    await put(pathname, JSON.stringify({ page, sessionId, createdAt: new Date().toISOString() }), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    incremented = true;
  } catch {
    incremented = false;
  }

  const count = await countPageFromBlob(page);
  return { count, incremented };
};

/* ── SQLite 后端 ── */

const recordSqliteVisit = (page: string, sessionId: string): VisitResult => {
  const db = getSingletonDb("visits", SCHEMA_SQL);
  const result = db
    .prepare(
      `
      INSERT OR IGNORE INTO page_visits (page, session_id, created_at)
      VALUES (?, ?, ?)
      `,
    )
    .run(page, sessionId, new Date().toISOString());

  const row = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM page_visits
      WHERE page = ?
      `,
    )
    .get(page) as { count: number };

  return {
    count: row?.count ?? 0,
    incremented: result.changes > 0,
  };
};

/* ── 对外接口 ── */

export const getPageVisitCount = async (pageInput: string): Promise<number> => {
  const page = normalizePage(pageInput);

  if (shouldUseBlob()) {
    return countPageFromBlob(page);
  }

  const db = getSingletonDb("visits", SCHEMA_SQL);
  const row = db
    .prepare(
      `
      SELECT COUNT(*) as count
      FROM page_visits
      WHERE page = ?
      `,
    )
    .get(page) as { count: number };

  return row?.count ?? 0;
};

export const recordPageVisit = async (
  pageInput: string,
  sessionIdInput: string,
): Promise<VisitResult> => {
  const page = normalizePage(pageInput);
  const sessionId = normalizeSessionId(sessionIdInput);
  if (!sessionId) {
    throw new Error("Invalid session id.");
  }

  if (shouldUseBlob()) {
    return recordBlobVisit(page, sessionId);
  }

  return recordSqliteVisit(page, sessionId);
};
